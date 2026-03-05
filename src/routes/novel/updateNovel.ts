import express from "express";
import u from "@/utils";
import { z } from "zod";
import { success } from "@/lib/responseFormat";
import { getAccountId, validateFields } from "@/middleware/middleware";
import { getProjectForAccount } from "@/utils/projectAccess";
const router = express.Router();

// 更新原文数据
export default router.post(
  "/",
  validateFields({
    id: z.number(),
    index: z.union([z.number(), z.string()]),
    reel: z.string(),
    chapter: z.string(),
    chapterData: z.string(),
  }),
  async (req, res) => {
    const { id, index, reel, chapter, chapterData } = req.body;
    const accountId = getAccountId(req);
    if (!accountId) return res.status(401).send({ message: "未登录" });
    const novel = await u.db("t_novel").where("id", id).first();
    if (!novel) return res.status(404).send({ message: "原文不存在" });
    const projectId = Number(novel.projectId);
    if (!projectId) return res.status(400).send({ message: "项目不存在" });
    const project = await getProjectForAccount(accountId, projectId);
    if (!project) return res.status(404).send({ message: "项目不存在" });

    await u.db("t_novel").where("id", id).update({
      chapterIndex: index,
      reel,
      chapter,
      chapterData,
    });

    res.status(200).send(success({ message: "更新原文成功" }));
  },
);
