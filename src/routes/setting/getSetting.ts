import express from "express";
import u from "@/utils";
import { success } from "@/lib/responseFormat";
import { getAccountId } from "@/middleware/middleware";
const router = express.Router();

export default router.post("/", async (req, res) => {
  const accountId = getAccountId(req);
  if (!accountId) return res.status(401).send({ message: "未登录" });
  let configData = await u
    .db("t_config")
    .where("type", "<>", "video")
    .where("accountId", accountId)
    .select("*");
  // 当前账号无配置时，回退展示 accountId=1 的配置
  if (!configData?.length) {
    configData = await u.db("t_config").where("type", "<>", "video").where("accountId", 1).select("*");
  }
  res.status(200).send(success(configData ?? []));
});
