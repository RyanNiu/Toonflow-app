import express from "express";
import u from "@/utils";
import { z } from "zod";
import { success } from "@/lib/responseFormat";
import { getAccountId, validateFields } from "@/middleware/middleware";
import { getProjectForAccount } from "@/utils/projectAccess";
const router = express.Router();

// 更新大纲
export default router.post(
  "/",
  validateFields({
    id: z.number(),
    data: z.string(),
  }),
  async (req, res) => {
    const { id, data } = req.body;
    const accountId = getAccountId(req);
    if (!accountId) return res.status(401).send({ message: "未登录" });

    const outline = await u.db("t_outline").where("id", id).first();
    if (!outline) return res.status(404).send({ message: "大纲不存在" });
    const projectId = Number(outline.projectId);
    if (!projectId) return res.status(400).send({ message: "项目不存在" });
    const project = await getProjectForAccount(accountId, projectId);
    if (!project) return res.status(404).send({ message: "项目不存在" });

    await u.db("t_outline").where("id", id).update({
      data,
    });

    res.status(200).send(success({ message: "更新大纲成功" }));
  }
);
