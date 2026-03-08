# Vidu-参考生视频-q2 自定义模型配置说明

在「设置 → 视频模型」里添加 **Vidu-参考生视频-q2**（RunningHub）时，按下面方式填写即可。

---

## 方式一：从预设列表选择（推荐）

1. 打开 **设置 → 视频模型**，点击「添加视频模型」或「选择视频模型」。
2. 在视频模型列表中找到 **RunningHub** 下的 **vidu/reference-to-video-q2** 卡片，点击。
3. 在弹窗中只需填写：
   - **模型名称**：已自动填为 `vidu/reference-to-video-q2`，无需修改。
   - **API Key**：填写你在 [RunningHub 控制台](https://www.runninghub.cn/enterprise-api/consumerApi) 获取的 **API Key**（32 位）。
4. 点击「保存」。

> 选择 RunningHub 时，界面会隐藏 Base URL 输入框，后端会使用默认地址 `https://www.runninghub.cn`，无需填写。

---

## 方式二：使用「自定义模型」

1. 打开 **设置 → 视频模型**，点击「添加视频模型」。
2. 在弹窗中切换到 **视频** 标签，点击 **「自定义模型」** 卡片。
3. 在配置弹窗中填写：

| 表单项   | 填写内容 |
|----------|----------|
| **模型名称** | `vidu/reference-to-video-q2`（必须与后台模型标识一致） |
| **Base URL** | `https://www.runninghub.cn`（若界面有该输入框则必填） |
| **API Key**  | 你的 RunningHub API Key |

4. 若界面有「厂商」或「类型」：
   - **类型** 选「视频」。
   - **厂商** 若有 **RunningHub** 选项，请选它（这样 Base URL 会按默认处理）；若没有，则保持「自定义」并手动填 Base URL。

5. 点击「保存」。

---

## 获取 API Key

1. 登录 [RunningHub](https://www.runninghub.cn)。
2. 进入 [API 控制台 / 消费级 API](https://www.runninghub.cn/enterprise-api/consumerApi)。
3. 复制你的 **API Key**（32 位），粘贴到上面的 **API Key** 输入框。

---

## 使用说明

- 该模型支持 **1～7 张参考图** 生成视频；多图时不会合并成一张，会按最多 7 张分别上传。
- 当前支持：**时长 5 秒**、**分辨率 1080p**、**比例** 16:9 / 9:16 / 1:1 / 3:4 / 4:3。
- 在项目里创建或编辑「视频配置」时，将「AI 模型」选为你刚添加的这条 **vidu/reference-to-video-q2** 配置即可使用。
