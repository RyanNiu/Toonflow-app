import express from "express";
import u from "@/utils";
import { success } from "@/lib/responseFormat";
import { getAccountId } from "@/middleware/middleware";

const router = express.Router();

// 获取账号配置
export default router.post("/", async (req, res) => {
  const accountId = getAccountId(req);
  if (!accountId) return res.status(401).send({ message: "未登录" });

  const row = await u.db("t_setting_account").where({ accountId }).first();
  const data = {
    imageModel: row?.imageModel ? JSON.parse(row.imageModel) : {},
    languageModel: row?.languageModel ? JSON.parse(row.languageModel) : {},
  };
  res.status(200).send(success(data));
});
