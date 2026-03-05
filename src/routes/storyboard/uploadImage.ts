import express from "express";
import u from "@/utils";
import { success } from "@/lib/responseFormat";
import { getAccountId, validateFields } from "@/middleware/middleware";
import { z } from "zod";
import { v4 as uuid } from "uuid";
import { buildAccountPath, getProjectForAccount } from "@/utils/projectAccess";
const router = express.Router();

// 上传对话图片
export default router.post(
  "/",
  validateFields({
    projectId: z.number(),
    base64Data: z.string(),
  }),
  async (req, res) => {
    const { base64Data, projectId } = req.body;
    const accountId = getAccountId(req);
    if (!accountId) return res.status(401).send({ message: "未登录" });
    const project = await getProjectForAccount(accountId, projectId);
    if (!project) return res.status(404).send({ message: "项目不存在" });
    const savePath = buildAccountPath(accountId, `/${projectId}/chat/${uuid()}.jpg`);
    await u.oss.writeFile(savePath, Buffer.from(base64Data.match(/base64,([A-Za-z0-9+/=]+)/)[1] ?? "", "base64"));
    const url = await u.oss.getFileUrl(savePath);
    res.status(200).send(success(url));
  }
);
