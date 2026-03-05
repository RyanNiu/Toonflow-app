import express from "express";
import u from "@/utils";
import { z } from "zod";
import { success } from "@/lib/responseFormat";
import { getAccountId, validateFields } from "@/middleware/middleware";
import { getProjectForAccount } from "@/utils/projectAccess";
const router = express.Router();

// 更新资产
export default router.post(
  "/",
  validateFields({
    id: z.number(),
    name: z.string(),
    intro: z.string(),
    type: z.string(),
    prompt: z.string(),
    videoPrompt: z.string().optional().nullable(),
    remark: z.string().optional().nullable(),
    duration: z.number().optional().nullable(),
  }),
  async (req, res) => {
    const { id, name, intro, type, prompt, remark, duration, videoPrompt } = req.body;
    const accountId = getAccountId(req);
    if (!accountId) return res.status(401).send({ message: "未登录" });
    const asset = await u.db("t_assets").where("id", id).first();
    if (!asset) return res.status(404).send({ message: "资产不存在" });
    const projectId = Number(asset.projectId);
    if (!projectId) return res.status(400).send({ message: "项目不存在" });
    const project = await getProjectForAccount(accountId, projectId);
    if (!project) return res.status(404).send({ message: "项目不存在" });

    await u
      .db("t_assets")
      .where("id", id)
      .update({
        name,
        intro,
        type,
        prompt,
        remark,
        videoPrompt,
        duration: String(duration),
      });

    res.status(200).send(success({ message: "更新资产成功" }));
  }
);
