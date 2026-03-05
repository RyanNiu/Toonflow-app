import express from "express";
import u from "@/utils";
import { z } from "zod";
import { success } from "@/lib/responseFormat";
import { getAccountId, validateFields } from "@/middleware/middleware";
import { getProjectForAccount } from "@/utils/projectAccess";
const router = express.Router();

// 更新故事线
export default router.post(
  "/",
  validateFields({
    projectId: z.number(),
    content: z.string(),
  }),
  async (req, res) => {
    const { projectId, content } = req.body;
    const accountId = getAccountId(req);
    if (!accountId) return res.status(401).send({ message: "未登录" });
    const project = await getProjectForAccount(accountId, projectId);
    if (!project) return res.status(404).send({ message: "项目不存在" });

    const existing = await u.db("t_storyline").where({ projectId }).first();
    if (existing) {
      await u.db("t_storyline").where({ projectId }).update({ content });
    } else {
      await u.db("t_storyline").insert({ projectId: projectId, content: content });
    }

    res.status(200).send(success({ message: "更新故事线成功" }));
  }
);
