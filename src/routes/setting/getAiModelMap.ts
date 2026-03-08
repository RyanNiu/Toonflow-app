import express from "express";
import u from "@/utils";
import { success } from "@/lib/responseFormat";
import { getAccountId } from "@/middleware/middleware";

const router = express.Router();

export default router.post("/", async (req, res) => {
  const accountId = getAccountId(req);
  if (!accountId) return res.status(401).send({ message: "未登录" });
  let configData = await u
    .db("t_aiModelMap")
    .leftJoin("t_config", "t_aiModelMap.configId", "t_config.id")
    .where("t_aiModelMap.accountId", accountId)
    .select("t_aiModelMap.name", "t_config.model", "t_aiModelMap.id", "t_aiModelMap.key", "t_config.manufacturer");
  // 当前账号无映射时，回退展示 accountId=1 的映射，避免语言/图片模型“不见了”
  if (!configData?.length) {
    configData = await u
      .db("t_aiModelMap")
      .leftJoin("t_config", "t_aiModelMap.configId", "t_config.id")
      .where("t_aiModelMap.accountId", 1)
      .select("t_aiModelMap.name", "t_config.model", "t_aiModelMap.id", "t_aiModelMap.key", "t_config.manufacturer");
  }
  res.status(200).send(success(configData ?? []));
});
