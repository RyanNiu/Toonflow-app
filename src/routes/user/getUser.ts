import express from "express";
import u from "@/utils";
import { success } from "@/lib/responseFormat";
import { getAccountId } from "@/middleware/middleware";
const router = express.Router();

// 获取用户
export default router.get("/", async (req, res) => {
  const accountId = getAccountId(req);
  if (!accountId) return res.status(401).send({ message: "未登录" });
  const data = await u.db("t_user").where("id", accountId).whereNull("deleted_at").select("id", "name", "is_admin").first();

  if (!data) return res.status(401).send({ message: "账号不存在或已被删除" });
  res.status(200).send(success(data));
});
