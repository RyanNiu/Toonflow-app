import express from "express";
import u from "@/utils";
import { z } from "zod";
import { success } from "@/lib/responseFormat";
import { getAccountId, validateFields } from "@/middleware/middleware";
import { getProjectForAccount } from "@/utils/projectAccess";
const router = express.Router();

// 新增资产
export default router.post(
  "/",
  validateFields({
    projectId: z.number(),
    scriptId: z.number().optional().nullable(),
    name: z.string(),
    intro: z.string(),
    type: z.string(),
    prompt: z.string(),
    remark: z.string().optional().nullable(),
    episode: z.string().optional().nullable(),
  }),
  async (req, res) => {
    const { projectId, name, intro, type, prompt, remark, episode, scriptId } = req.body;
    const accountId = getAccountId(req);
    if (!accountId) return res.status(401).send({ message: "未登录" });
    const project = await getProjectForAccount(accountId, projectId);
    if (!project) return res.status(404).send({ message: "项目不存在" });

    await u.db("t_assets").insert({
      projectId,
      name,
      intro,
      type,
      prompt,
      remark,
      episode,
      scriptId,
    });

    res.status(200).send(success({ message: "新增资产成功" }));
  }
);
