# 「生成分镜图」独立页面方案

## 目标

把「生成分镜图」从当前多 Tab 里拆出来，变成**独立路由/独立页面**，有自己的一级入口和面包屑，交互入口以你提供的两张交互稿为准。

---

## 本仓库已完成的准备（后端）

- **分镜工作台元数据接口**（用于面包屑展示）  
  - `GET` 或 `POST` `/storyboard/getWorkspaceInfo`  
  - 参数：`projectId`, `scriptId`（GET 用 query，POST 用 body）  
  - 返回：`{ data: { projectName, scriptName } }`，用于面包屑「项目名 / 生成分镜图 / 剧本名」  
- 现有分镜相关接口（WebSocket、获取/保存分镜、生成分镜图等）均支持 `projectId` + `scriptId`，独立页直接沿用即可。  
- **说明**：本仓库仅含后端与构建后的前端静态资源，**无前端源码**（Vue 路由、页面组件在其它仓库）。以下方案中的「路由、入口、面包屑」需在**前端项目**中实现。

---

## 1. 路由与 URL

- **独立路由**（推荐）  
  `/project/:projectId/script/:scriptId/storyboard`

- **含义**  
  - `projectId`：当前项目（如「将门孤女」对应 id）  
  - `scriptId`：当前剧本/大纲 id（`t_script.id`）  
  - 同一项目下可有多个剧本，分镜工作台按「项目 + 剧本」维度打开。

- **可选**  
  若希望「先选剧本再进工作台」，可增加中间页：  
  - `/project/:projectId/storyboard` → 列出该项目的剧本，选择后跳转到上面的 URL；  
  - 或从「剧本管理」等入口直接带 `scriptId` 进入 `/project/:projectId/script/:scriptId/storyboard`。

---

## 2. 一级入口（按交互稿）

两张图里「生成分镜图」都是**顶部导航的一个 Tab**，建议：

- **保留该 Tab 作为一级入口**，不再把分镜内容嵌在与其他 Tab 同一层级下。
- **点击「生成分镜图」时**：  
  - 若当前上下文已有 `projectId`（例如已在某项目内）：  
    - 若有默认或当前剧本，直接跳转：`/project/:projectId/script/:scriptId/storyboard`  
    - 若无剧本或需选择剧本，可先跳到 `/project/:projectId/storyboard` 选剧本再进。  
  - 若当前没有项目上下文：可先进入项目选择/项目概览，再进分镜（或提示「请先选择项目」）。

这样「入口」仍然是你图里的那个 Tab，只是点击后变成**整页跳转到独立路由**，而不是在同一套多 Tab 里切内容。

---

## 3. 面包屑

- **在独立分镜页顶部**增加面包屑，例如：  
  `项目名（将门孤女） / 生成分镜图 / [剧本名]`  
  或：  
  `项目名 / 生成分镜图 / 剧本名称`

- **可点击**：  
  - 第一段 → 回到项目概览或项目首页  
  - 第二段「生成分镜图」→ 可回到 `/project/:projectId/storyboard`（若有选剧本页）或保持当前页  
  - 第三段剧本名 → 可跳转到该剧本的剧本管理/编辑（若有对应路由）

- **返回**：除面包屑外，可保留你图里的「返回箭头」，行为与面包屑第一段一致（回到项目上下文）。

---

## 4. 页面内容与布局（与当前一致）

独立页面**内容区域**与当前交互稿一致即可：

- **左侧**：助手对话区（欢迎语、输入框、「导出全部镜头」等）。
- **右侧**：  
  - Tab：「片段」 / 「分镜图」  
  - 内容：片段内容占位符 / 分镜卡片（分镜 1、2、4…，镜头 1、2、3、4，预览/改写/剧本/镜头/场景/提示词 等）。

仅把这块从「多 Tab 中的一块」改为「独立路由下的整页」即可，无需改交互细节。

---

## 5. 后端与数据（无需改接口）

- 现有 WebSocket：  
  `storyboard/chat?projectId=xx&scriptId=yy`  
  前端在独立页里用 URL 上的 `projectId`、`scriptId` 连接即可。
- 现有接口：  
  获取/保存分镜、生成分镜图、导出等，都已是 `projectId` + `scriptId` 维度；  
  独立页只需从路由取 `projectId`、`scriptId` 调用，**无需新增或改后端路由**。
- 已实现的「保存与恢复」：  
  `t_script.storyboardState` 的读写已按 `scriptId` 维度做好，独立页沿用即可。

---

## 6. 前端实现检查清单（给前端同学）

- [ ] 新增路由：`/project/:projectId/script/:scriptId/storyboard`（及可选 `/project/:projectId/storyboard`）。
- [ ] 顶部「生成分镜图」Tab 点击 → 跳转到上述独立路由（带当前项目 id，剧本 id 由默认或选择得到）。
- [ ] 独立页顶部：面包屑「项目名 / 生成分镜图 / 剧本名」+ 返回箭头。项目名/剧本名可调用 **`GET /storyboard/getWorkspaceInfo?projectId=xx&scriptId=yy`** 获取。
- [ ] 页面主体：左侧助手 + 右侧「片段 / 分镜图」与现有交互稿一致。
- [ ] 连接 WS 与请求 API 时，统一从路由取 `projectId`、`scriptId`。
- [ ] 若项目下无剧本或需选剧本：在进入工作台前增加选剧本步或中间页。

---

## 7. 小结

| 项     | 说明 |
|--------|------|
| 路由   | `/project/:projectId/script/:scriptId/storyboard` |
| 入口   | 顶部 Tab「生成分镜图」点击 → 跳转至该独立页（按交互稿） |
| 面包屑 | 项目名 / 生成分镜图 / 剧本名（项目名/剧本名调 `GET /storyboard/getWorkspaceInfo`） |
| 内容   | 与现有两张交互稿一致，仅从 Tab 内容改为整页 |
| 后端   | 已提供 `getWorkspaceInfo` 及现有 WS/API，无需再改 |

前端源码不在本仓库，需在**前端项目**中按此文档实现路由、入口与面包屑；本仓库已完成后端与文档准备。
