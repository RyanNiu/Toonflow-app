import express from "express";
import u from "@/utils";
import { z } from "zod";
import { success } from "@/lib/responseFormat";
import { getAccountId, validateFields } from "@/middleware/middleware";
const router = express.Router();

export default router.post(
  "/",
  validateFields({
    id: z.number(),
    configId: z.number(),
  }),
  async (req, res) => {
    const { id, configId } = req.body;
    const accountId = getAccountId(req);
    if (!accountId) return res.status(401).send({ message: "未登录" });
    const config = await u.db("t_config").where({ id: configId, accountId }).first();
    if (!config) return res.status(404).send({ message: "模型配置不存在" });
    if (id) {
      await u.db("t_aiModelMap").where({ id, accountId }).update({
        configId,
      });
    }
    res.status(200).send(success("配置成功"));
  },
);
