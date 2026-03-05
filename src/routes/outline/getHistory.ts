import express from "express";
import u from "@/utils";
import { z } from "zod";
import { error, success } from "@/lib/responseFormat";
import { getAccountId, validateFields } from "@/middleware/middleware";
import { getProjectForAccount } from "@/utils/projectAccess";
const router = express.Router();

// 删除大纲
export default router.post(
  "/",
  validateFields({
    projectId: z.number(),
  }),
  async (req, res) => {
    const { projectId } = req.body;
    const accountId = getAccountId(req);
    if (!accountId) return res.status(401).send({ message: "未登录" });
    const project = await getProjectForAccount(accountId, projectId);
    if (!project) return res.status(404).send({ message: "项目不存在" });

    const history = await u
      .db("t_chatHistory")
      .where({ projectId: Number(projectId), type: "outlineWebChat" })
      .first();
    if (!history) {
      await u.db("t_chatHistory").insert({
        projectId: Number(projectId),
        type: "outlineWebChat",
        data: "[]",
      });
    }

    res.status(200).send(success({ data: JSON.parse(history?.data || "[]") }));
  },
);
