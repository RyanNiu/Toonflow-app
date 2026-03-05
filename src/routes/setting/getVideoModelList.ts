import express from "express";
import u from "@/utils";
import { success } from "@/lib/responseFormat";
import { getAccountId } from "@/middleware/middleware";
const router = express.Router();

export default router.post("/", async (req, res) => {
  const accountId = getAccountId(req);
  if (!accountId) return res.status(401).send({ message: "未登录" });
  const configData = await u.db("t_config").where("type", "video").where("accountId", accountId).select("*");

  res.status(200).send(success(configData));
});
