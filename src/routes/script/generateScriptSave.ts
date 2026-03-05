import express from "express";
import u from "@/utils";
import { z } from "zod";
import { success } from "@/lib/responseFormat";
import { getAccountId, validateFields } from "@/middleware/middleware";
import { generateScript } from "@/utils/generateScript";
import { getProjectForAccount } from "@/utils/projectAccess";
const router = express.Router();

// 生成剧本
export default router.post(
  "/",
  validateFields({
    outlineId: z.number(),
    scriptId: z.number(),
    content: z.string(),
  }),
  async (req, res) => {
    const { outlineId, scriptId, content } = req.body;
    const accountId = getAccountId(req);
    if (!accountId) return res.status(401).send({ message: "未登录" });
    const script = await u.db("t_script").where("id", scriptId).first();
    if (!script) return res.status(404).send({ message: "剧本不存在" });
    const projectId = Number(script.projectId);
    if (!projectId) return res.status(400).send({ message: "项目不存在" });
    const project = await getProjectForAccount(accountId, projectId);
    if (!project) return res.status(404).send({ message: "项目不存在" });

    await u.db("t_script").where("id", scriptId).update({
      content: content,
    });

    res.status(200).send(success({ message: "保存成功" }));
  },
);
