import express from "express";
import u from "@/utils";
import { z } from "zod";
import { success } from "@/lib/responseFormat";
import { getAccountId, validateFields } from "@/middleware/middleware";
import { getProjectForAccount } from "@/utils/projectAccess";
const router = express.Router();

// 获取故事线数据
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
    const data = await u.db("t_storyline").where("projectId", projectId).first();
    res.status(200).send(success(data));
  }
);
