import express from "express";
import u from "@/utils";
import { z } from "zod";
import { success } from "@/lib/responseFormat";
import { getAccountId, validateFields } from "@/middleware/middleware";
import { getProjectForAccount } from "@/utils/projectAccess";
const router = express.Router();

// 修改视频分镜参数
export default router.post(
  "/",
  validateFields({
    storyboardId: z.number(),
    prompt: z.string(),
    duration: z.string(),
  }),
  async (req, res) => {
    const { storyboardId, prompt, duration } = req.body;
    const accountId = getAccountId(req);
    if (!accountId) return res.status(401).send({ message: "未登录" });
    const asset = await u.db("t_assets").where("id", storyboardId).first();
    if (!asset) return res.status(404).send({ message: "分镜不存在" });
    const projectId = Number(asset.projectId);
    if (!projectId) return res.status(400).send({ message: "项目不存在" });
    const project = await getProjectForAccount(accountId, projectId);
    if (!project) return res.status(404).send({ message: "项目不存在" });

    await u.db("t_assets").where("id", storyboardId).update({
      prompt,
      duration,
    });
    res.status(200).send({ message: "修改成功" });
  }
);
