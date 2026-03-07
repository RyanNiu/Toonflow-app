import express from "express";
import u from "@/utils";
import { z } from "zod";
import { success } from "@/lib/responseFormat";
import { getAccountId, validateFields } from "@/middleware/middleware";
import { getProjectForAccount } from "@/utils/projectAccess";
const router = express.Router();

// 获取资产
export default router.post(
  "/",
  validateFields({
    projectId: z.number(),
    type: z.string(),
    scriptId: z.number().optional(),
  }),
  async (req, res) => {
    const { projectId, type, scriptId } = req.body;
    const accountId = getAccountId(req);
    if (!accountId) return res.status(401).send({ message: "未登录" });
    const project = await getProjectForAccount(accountId, projectId);
    if (!project) return res.status(404).send({ message: "项目不存在" });

    let query = u.db("t_assets").where("projectId", projectId).where("type", type);
    // 传入 scriptId 时：仅返回该剧本关联资产（本集 + 项目级 scriptId 为空）
    if (scriptId != null) {
      query = query.andWhere((builder: any) => builder.where("scriptId", scriptId).orWhereNull("scriptId"));
    }
    const data = await query.select("*");

    for (const item of data) {
      if (item.filePath) {
        item.filePath = await u.oss.getFileUrl(item.filePath);
      } else {
        item.filePath = "";
      }
    }

    res.status(200).send(success(data));
  }
);
