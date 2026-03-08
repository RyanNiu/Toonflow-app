# 生成分镜图流程说明

本文档描述「生成分镜图」从用户操作到后端生图、保存、前端更新的完整流程。

---

## 一、两种入口

### 1. 对话入口（主流程，会更新状态并推送到前端）

- **触发**：用户在分镜对话里说「为分镜 1 生成图」「生成分镜图」等，由主 Agent 理解后调用分镜师的 `generateShotImage` 工具。
- **通道**：WebSocket（`/storyboard/chatStoryboard`），消息在 `chatStoryboard.ts` 里处理，交给 storyboard Agent 的 `run()`。
- **结果**：会更新 Agent 内 `shots` 的 `cells[].src`、写 OSS、通过 WebSocket 推送 `shotsUpdated`，前端画布自动更新。

### 2. HTTP 直接生成（仅生成宫格图，不更新 Agent 状态）

- **触发**：前端某个分镜卡片的「生成」按钮，调用 `handleGenerateImage(grid)`，发 `POST /storyboard/generateShotImage`，请求体为 `{ ...grid, scriptId, projectId }`（含 `cells`、`segmentId` 等）。
- **后端**：`routes/storyboard/generateShotImage.ts` 只做：
  - 校验 `cells`、`scriptId`、`projectId`，鉴权；
  - 调用 `generateImageTool(cells, scriptId, projectId)` 生成**一张宫格图**；
  - 将结果写入本地 `merged.jpg` 并返回 buffer。
- **注意**：此路径**不会**更新 Agent 的 `shots`、不会分割成单格、不会写 OSS 或推送 `shotsUpdated`，前端当前也未用返回的 buffer 更新画布，相当于「仅后台生成一张合并图」。

下面以**对话入口**为主，说明完整流程。

---

## 二、主流程（对话 + Agent 工具）

### 2.1 用户发消息到 Agent 调用工具

1. 前端通过 WebSocket 发送用户消息（如「为分镜 1 和 2 生成图」）。
2. `chatStoryboard.ts` 收到后调用 `agent.run(userMessage)`。
3. 主 Agent（storyboard-main）根据 system 里对 `generateShotImage` 的说明，决定调用分镜师（shotAgent）的 `generateShotImage` 工具，传入 `{ shotIds: [1, 2] }`。

### 2.2 generateShotImage 工具（agents/storyboard/index.ts）

- **入口**：`generateShotImage.execute({ shotIds })`。
- **逻辑**：
  - 根据 `shotIds` 校验分镜是否存在、是否已在生成中（`generatingShots`），得到 `toGenerate`。
  - 若 `toGenerate` 为空则直接返回提示文案；否则：
  - 将 `toGenerate` 中 id 加入 `generatingShots`；
  - `emit("shotImageGenerateStart", { shotIds: toGenerate })` → 经由 `chatStoryboard` 转发给前端；
  - **异步**执行 `this.executeShotImageGeneration(toGenerate)`（不阻塞 Agent 回复）；
  - 立即返回一句「已开始为分镜 x, y 生成分镜图，生成过程在后台进行」。

### 2.3 executeShotImageGeneration / generateSingleShotImage

- `executeShotImageGeneration(shotIds)`：对每个 `shotId` 调用 `generateSingleShotImage(shotId)`（并发）。
- **generateSingleShotImage(shotId)** 单分镜流程：
  1. 从 `this.shots` 找到对应 `shot`，取 `shot.cells` 的 `prompt` 组成 `prompts[]`；若无有效提示词则跳过并从 `generatingShots` 移除。
  2. `emit("shotImageGenerateProgress", { shotId, status: "generating", message: "正在调用 AI 生成宫格图片" })`。
  3. **生成宫格图**：`gridImage = await generateImageTool(prompts.map(p => ({ prompt: p })), this.scriptId, this.projectId)`（见下一节）。
  4. `emit("shotImageGenerateProgress", { shotId, status: "splitting", ... })`。
  5. **分割**：`imageBuffers = await imageSplitting(gridImage, prompts.length)`（按宫格布局切成多张单格图）。
  6. `emit("shotImageGenerateProgress", { shotId, status: "saving", ... })`。
  7. **保存到 OSS**：对每张 `imageBuffers[i]` 写 OSS，路径形如 `{projectId}/chat/{scriptId}/storyboard/shot_{shotId}_take_{i}_{timestamp}.png`，得到 `imagePaths[]`；每保存一张可再发一次 progress。
  8. **更新内存状态**：`shot.cells = shot.cells.map((cell, i) => ({ ...cell, src: imagePaths[i] ?? cell.src }))`。
  9. `generatingShots.delete(shotId)`；`emit("shotImageGenerateComplete", { shotId, shot, imagePaths })`；`emit("shotsUpdated", this.shots)`。
  10. `chatStoryboard` 中监听 `shotImageGenerateComplete` 会再调用 `agent.saveState()` 持久化。

### 2.4 generateImageTool（agents/storyboard/generateImageTool.ts）

- **输入**：`cells: { prompt: string }[]`，`scriptId`，`projectId`。
- **步骤**：
  1. 查剧本、项目、大纲（episode 数据），得到角色/场景/道具等 `resources`。
  2. 从 `t_assets` 按资源名取项目资产图片列表 `allImages`；若无资产则抛错。
  3. **过滤相关资产**：`filterRelevantAssets(prompts, resources, allImages, projectId)` 用 AI 从分镜描述中筛选与分镜相关的资产，得到 `filteredImages`。
  4. **润色提示词**：`generateImagePromptsTool({ prompts, style, aspectRatio, assetsName, projectId })` 得到宫格图的统一 `prompt`（含格数、布局等）。
  5. **处理参考图**：`processImages(filteredImages)` 压缩、合并（若超过 10 张则部分合并），保证总大小等限制，得到 `processedImages`（Buffer 列表）。
  6. **调用生图**：`u.ai.image({ systemPrompt: resourcesMapPrompts, prompt, size: "4K", aspectRatio, imageBase64: processedImages.map(buf => buf.toString("base64")) }, apiConfig)`，从返回中解析 base64 得到宫格图 Buffer。
- **输出**：一张宫格图的 `Buffer`。

### 2.5 imageSplitting（agents/storyboard/imageSplitting.ts）

- **输入**：宫格图 `Buffer`，以及实际需要的图片数量 `length`（即镜头数）。
- **逻辑**：根据 `length` 计算宫格布局（如 1→1×1，2→2×1，4→2×2，5–9→3×3 等），用 `sharp` 按格裁剪，返回 `Buffer[]`。

---

## 三、前端如何响应

- **shotImageGenerateStart**：把对应 `shotIds` 加入 `generatingIds`，显示「开始为 xxx 生成分镜图」等提示。
- **shotImageGenerateProgress**：更新对应分镜卡片的 `generatingStatus`（status、message、progress），并可选推送进度通知（生成中 / 分割中 / 保存中）。
- **shotImageGenerateComplete**：从 `generatingIds` 移除该 `shotId`，提示「xxx 分镜图生成完成」。
- **shotsUpdated**：收到后端推送的完整 `shots`，调用 `updateGridDataFromShots(data)`，用新 `shots` 覆盖/更新 `gridData`，画布上该分镜的各格 `src` 更新为 OSS 地址，新生成的图即显示出来。

---

## 四、流程简图（对话入口）

```
用户说「为分镜1生成图」
  → WebSocket 消息
  → chatStoryboard → agent.run()
  → 主 Agent 调用 shotAgent.generateShotImage({ shotIds: [1] })
  → generateShotImage.execute()
      → emit shotImageGenerateStart
      → 异步 executeShotImageGeneration([1])
  → generateSingleShotImage(1)
      → prompts = shot.cells 的 prompt
      → emit progress "generating"
      → generateImageTool(prompts) → 资产过滤、润色、u.ai.image → 宫格图 Buffer
      → emit progress "splitting"
      → imageSplitting(宫格图, prompts.length) → Buffer[]
      → emit progress "saving"
      → 每张写 OSS，得到 imagePaths[]
      → 更新 shot.cells[].src = imagePaths[]
      → emit shotImageGenerateComplete + shotsUpdated
  → chatStoryboard: saveState()
  → 前端收到 shotsUpdated → updateGridDataFromShots → 画布显示新图
```

---

## 五、相关文件索引

| 环节           | 文件 |
|----------------|------|
| WebSocket 路由 | `src/routes/storyboard/chatStoryboard.ts` |
| Agent + 工具   | `src/agents/storyboard/index.ts`（generateShotImage、generateSingleShotImage） |
| 宫格生图       | `src/agents/storyboard/generateImageTool.ts` |
| 提示词润色     | `src/agents/storyboard/generateImagePromptsTool.ts` |
| 宫格分割       | `src/agents/storyboard/imageSplitting.ts` |
| HTTP 生成接口  | `src/routes/storyboard/generateShotImage.ts` |
| 前端事件处理   | `robou-web` 中 `storyboardChat.vue`（shotsUpdated、shotImageGenerate*） |
