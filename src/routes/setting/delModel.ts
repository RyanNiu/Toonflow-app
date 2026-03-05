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
  }),
  async (req, res) => {
    const { id } = req.body;
    const accountId = getAccountId(req);
    if (!accountId) return res.status(401).send({ message: "未登录" });
    await u.db("t_config").where({ id, accountId }).delete();
    await u.db("t_aiModelMap").where({ configId: id, accountId }).update("configId", null);
    res.status(200).send(success("删除成功"));
  },
);
