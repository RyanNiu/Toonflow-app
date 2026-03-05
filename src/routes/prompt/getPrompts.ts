import express from "express";
import u from "@/utils";
import { success } from "@/lib/responseFormat";
import { getAccountId } from "@/middleware/middleware";
const router = express.Router();

// 获取提示词
export default router.get("/", async (req, res) => {
  const accountId = getAccountId(req);
  if (!accountId) return res.status(401).send({ message: "未登录" });
  const data = await u.db("t_prompts").where("accountId", accountId);
  res.status(200).send(success(data));
});
