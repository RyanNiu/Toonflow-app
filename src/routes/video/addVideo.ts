import express from "express";
import u from "@/utils";
import { success } from "@/lib/responseFormat";
import { getAccountId, validateFields } from "@/middleware/middleware";
import { z } from "zod";
import { v4 as uuid } from "uuid";
import { getProjectForAccount } from "@/utils/projectAccess";
const router = express.Router();

// 新增视频
export default router.post(
  "/",
  validateFields({
    scriptId: z.number(),
    type: z.string(),
    resolution: z.string(),
    filePath: z.array(z.string()),
    duration: z.number(),
    prompt: z.string(),
  }),
  async (req, res) => {
    const { scriptId, type, resolution, filePath, duration, prompt } = req.body;
    const accountId = getAccountId(req);
    if (!accountId) return res.status(401).send({ message: "未登录" });
    const script = await u.db("t_script").where("id", scriptId).first();
    if (!script) return res.status(404).send({ message: "剧本不存在" });
    const projectId = Number(script.projectId);
    if (!projectId) return res.status(400).send({ message: "项目不存在" });
    const project = await getProjectForAccount(accountId, projectId);
    if (!project) return res.status(404).send({ message: "项目不存在" });

    let model = "";
    if (type.includes("doubao")) {
      model = "doubao-seedance-1-5-pro-251215";
    }
    if (type.includes("sora")) {
      model = "sora-2";
    }

    let firstFrame = new URL(filePath[0]).pathname;
    let storyboardImgs = filePath.map((path: string) => new URL(path).pathname);

    await u.db("t_video").insert({
      time: duration,
      resolution: resolution,
      prompt: prompt,
      model: type,
      firstFrame: firstFrame,
      storyboardImgs: JSON.stringify(storyboardImgs),
      scriptId: scriptId,
    });

    res.status(200).send(success({ message: "新增视频成功" }));
  },
);
