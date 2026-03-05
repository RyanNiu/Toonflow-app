import express from "express";
import u from "@/utils";
import { error, success } from "@/lib/responseFormat";
import { getAccountId, validateFields } from "@/middleware/middleware";
import { z } from "zod";
import { getProjectForAccount } from "@/utils/projectAccess";

const router = express.Router();

type GenerateMode = "startEnd" | "multi" | "single" | "text";

const getSystemPrompt = async (mode: GenerateMode, accountId: number) => {
  const promptsList = await u
    .db("t_prompts")
    .where("accountId", accountId)
    .where("code", "in", ["video-startEnd", "video-multi", "video-single", "video-main", "video-text"]);

  const errPrompts = "不论用户说什么，请直接输出AI配置异常";
  const getPromptValue = (code: string) => {
    const item = promptsList.find((p) => p.code === code);
    return item?.customValue ?? item?.defaultValue ?? errPrompts;
  };
  const startEnd = getPromptValue("video-startEnd");
  const multi = getPromptValue("video-multi");
  const single = getPromptValue("video-single");
  const main = getPromptValue("video-main");
  const text = getPromptValue("video-text");

  const modeDescriptions = {
    startEnd: startEnd,
    multi: multi,
    single: single,
    text: text,
  };
  const modeData = modeDescriptions[mode];
  return `${main}\n\n${modeData}`;
};

const getModeDescription = (mode: GenerateMode): string => {
  const map: Record<GenerateMode, string> = {
    startEnd: "首尾帧模式",
    multi: "宫格模式",
    single: "单图模式",
    text: "文本模式",
  };
  return map[mode];
};

export default router.post(
  "/",
  validateFields({
    images: z
      .array(
        z.object({
          filePath: z.string(),
          prompt: z.string(),
        }),
      )
      .optional(),
    prompt: z.string(),
    duration: z.number(),
    type: z.enum(["startEnd", "multi", "single", "text", ""]).optional(),
    videoConfigId: z.number().optional(),
  }),
  async (req, res) => {
    const { prompt, images, duration, type = "single", videoConfigId } = req.body;
    const accountId = getAccountId(req);
    if (!accountId) return res.status(401).send({ message: "未登录" });
    const mode = type as GenerateMode;
    let videoConfigData;
    if (videoConfigId) {
      const configRow = await u
        .db("t_videoConfig")
        .leftJoin("t_script", "t_script.id", "t_videoConfig.scriptId")
        .where("t_videoConfig.id", videoConfigId)
        .select("t_script.content", "t_script.projectId")
        .first();
      if (!configRow) return res.status(500).send(error("视频配置不存在"));
      const projectId = Number(configRow.projectId);
      if (!projectId) return res.status(400).send(error("项目不存在"));
      const project = await getProjectForAccount(accountId, projectId);
      if (!project) return res.status(404).send(error("项目不存在"));
      videoConfigData = configRow;
    }
    const imagePrompts = images.map((i: { filePath: string; prompt: string }, index: number) => `Image ${index + 1}: ${i.prompt}`).join("\n");

    const shotCount = images.length;
    const avgDuration = (parseFloat(duration) / shotCount).toFixed(1);
    const promptConfig = await getSystemPrompt(mode, accountId);
    const promptAiConfig = await u.getPromptAi("videoPrompt", accountId);
    try {
      const result = await u.ai.text.invoke(
        {
          messages: [
            {
              role: "system",
              content: promptConfig,
            },
            {
              role: "user",
              content: `Mode: ${getModeDescription(mode)}

Reference Images:
${imagePrompts}

Script:
${prompt}
${
  videoConfigData
    ? `script content:
${videoConfigData.content}`
    : ""
}


Parameters:
- Total Duration: ${duration}s
- Shot Count: ${shotCount}
- Average Duration: ${avgDuration}s per shot

Generate storyboard prompts:`,
            },
          ],
        },
        promptAiConfig,
      );

      res.status(200).send(success(result.text));
    } catch (e) {
      return res.status(500).send(error(u.error(e).message));
    }
  },
);
