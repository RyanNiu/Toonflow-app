# 分镜提示词生成调用的规则说明

分镜相关流程里，**分镜提示词**的「生成」与「润色」会用到多套配置在数据库 `t_prompts` 中的规则（`code` / 名称）。下面按流程说明各自用途和调用位置。

---

## 一、分镜提示词「生成」（对话里由 AI 写出中文镜头描述）

### 1. 主协调 Agent：分镜导演助手

| 项目 | 说明 |
|------|------|
| **表** | `t_prompts` |
| **code** | `storyboard-main` |
| **名称** | 分镜Agent |
| **用途** | 主 Agent 的 system 提示词：协调片段师(segmentAgent)、分镜师(shotAgent)，决定何时调用谁、如何与用户交互。不直接写分镜提示词。 |
| **调用位置** | `src/agents/storyboard/index.ts` → `call()` 中从 `t_prompts` 取 `code = "storyboard-main"`，与 `buildEnvironmentContext()` 拼成 system。 |
| **模型配置** | `getPromptAi("storyboardAgent", undefined, this.projectId)`（来自 `t_aiModelMap.key = "storyboardAgent"`） |

### 2. 分镜师子 Agent：真正「写」分镜提示词

| 项目 | 说明 |
|------|------|
| **表** | `t_prompts` |
| **code** | `storyboard-shot` |
| **名称** | 分镜Agent-分镜师 |
| **用途** | 根据剧本片段生成**电影感分镜提示词**（中文、多镜头）。规则包括：工作流程、剧本忠实原则、资产名称强制规则、电影分镜提示词生成规则、输出格式等。 |
| **调用位置** | `src/agents/storyboard/index.ts` → `invokeSubAgent("shotAgent", task)` 中从 `t_prompts` 取 `code = "storyboard-shot"` 作为 system，驱动 shotAgent 调用 getAssets/getScript/getSegments 后写 addShots/updateShots。 |
| **模型配置** | 同上，主 Agent 与子 Agent 共用 `getPromptAi("storyboardAgent", ...)`。 |

**分镜师规则要点（在 `storyboard-shot` 的 defaultValue 中）：**

- **工作流程**：getAssets → getScript → getSegments → 识别任务参数 → 生成分镜提示词 → addShots/updateShots。
- **剧本忠实原则**：分镜严格基于剧本，角色/场景/称呼与剧本一致，对话逐字引用。
- **资产名称强制规则**：角色、道具、场景名必须与 getAssets 返回一致，禁止缩写/近义词/修饰前缀。
- **镜头数量**：默认 4 镜头/片段，支持 2/4/6/9/12 宫格等。
- **镜头语言要素**（每个提示词需包含）：
  - 景别：大远景/远景/全景/中景/近景/特写/大特写
  - 机位角度：平视/俯拍/仰拍/斜角/过肩/主观视角
  - 光线设计：光源方向、质感、色温、特殊光效
  - 构图法则：三分法/中心/对角线/框架/引导线/前景遮挡
  - 景深与焦点、色彩基调、氛围情绪词
- **人物要素**：站位与空间关系、肢体语言、表情神态、服装状态。
- **环境要素**：时间氛围、环境细节、空气介质。
- **对话处理规则**：对话镜头设计、格式、镜头分配建议。
- **提示词模板**：标准镜头模板、对话镜头模板。
- **分镜序列设计**：叙事节奏、景别变化、视线连贯（180 度轴线）等。

---

## 二、分镜提示词「润色」（生成宫格图前的优化）

在**分镜图生成**时，会把每个分镜的多个镜头提示词先做一次「润色」，再交给画图接口。这一步用的规则是「分镜Agent生图润色提示词」。

| 项目 | 说明 |
|------|------|
| **表** | `t_prompts` |
| **code** | `generateImagePrompts` |
| **名称** | 分镜Agent生图润色提示词 |
| **用途** | 把用户/分镜师的中文分镜描述转化为「高质量 AI 绘图用」的优化结果（当前实现中为一段优化后的文本，供宫格生图使用）。 |
| **调用位置** | `src/agents/storyboard/generateImagePromptsTool.ts` → `generateGridPrompt()`：从 `t_prompts` 取 `code = "generateImagePrompts"` 作为 system，user 内容为布局/比例/风格/资产/原始内容。 |
| **模型配置** | `getPromptAi("storyboardAgent", accountId, options.projectId)` |

**润色规则要点（在 `generateImagePrompts` 的 defaultValue 中）：**

- **保留原始信息**：人物、服装、场景、构图等。
- **原始语言保留**：人物名/场景名/道具名/服装名等禁止翻译或拼音，必须原文嵌入。
- **补充电影语言**：景别、机位、构图、光影等。
- **连贯性规则**：位置/场景/光照/时间/色调固化。
- **Prompt 核心规则**：极简提炼、标签化语法、字数控制、强制后缀、风格标签、禁止台词等。
- **插黑图规则**：识别「纯黑图/黑屏」等并固定输出格式。
- **超清标识**：末尾追加固定后缀等。

（若你项目里该润色结果会再解析为 JSON 多格 prompt，则按当前 `generateImagePrompts` 中定义的 JSON 格式与 shot_number 规则执行。）

---

## 三、分镜图「生图」用的模型与配置（不写提示词，只画图）

| 项目 | 说明 |
|------|------|
| **配置 key** | `storyboardImage`（在 `t_aiModelMap` 中） |
| **对应提示词** | `t_prompts` 中与「分镜图片生成」相关的配置（如资产-分镜图片生成等），用于生图时的行为约束，不参与「分镜提示词文本」的生成与润色。 |
| **调用位置** | `src/agents/storyboard/generateImageTool.ts` 等处通过 `getPromptAi("storyboardImage", ...)` 取模型配置；画图时的具体 prompt 来自上一步润色或原始镜头提示词。 |

---

## 四、其他相关配置（资产/视频等）

- **资产-分镜提示词润色**（`t_prompts` 中 code 如 `storyboard-polish`）：用于「资产」侧的分镜描述润色，和对话里分镜师生成、以及宫格前的 `generateImagePrompts` 润色是不同链路。
- **视频分镜/导演** 等（如 `videoPrompt`、分镜连续生成导演智能体）：用于视频分镜脚本/时间轴等，不直接参与当前「分镜图」的镜头提示词生成与润色。

---

## 五、小结：分镜提示词生成涉及哪些规则

| 阶段 | 使用的规则（表 + code/名称） | 作用 |
|------|------------------------------|------|
| 用户说「生成分镜」 | `t_prompts`：`storyboard-main`（分镜Agent） | 主 Agent 协调，决定调用 shotAgent。 |
| 分镜师写镜头文案 | `t_prompts`：`storyboard-shot`（分镜Agent-分镜师） | **直接生成分镜提示词**（中文、多镜头），遵守剧本、资产名、景别/机位/光线/构图等规则。 |
| 为分镜生成宫格图前 | `t_prompts`：`generateImagePrompts`（分镜Agent生图润色提示词） | **润色/优化**分镜描述，保留原名、电影语言、连贯性等，供宫格生图使用。 |

修改「分镜提示词」的生成效果时：

- 改**镜头内容与风格**（景别、机位、剧本忠实、资产名等）→ 改 **`storyboard-shot`** 的 `defaultValue` 或该账号下的 `customValue`。
- 改**宫格生图前的优化方式**（原名保留、格式、字数等）→ 改 **`generateImagePrompts`** 的 `defaultValue` 或对应 `customValue`。
- 改**对话流程与何时出分镜**（是否先选片段、宫格数等）→ 改 **`storyboard-main`** 的配置。

以上规则在 `src/lib/initDB.ts` 的 `t_prompts` 初始化里都有对应的 `defaultValue`，可在库里按 `code` 查询或修改；若使用「自定义提示词」功能，则会在界面上对应到各条目的 `customValue`。
