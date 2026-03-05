import express from "express";
import u from "@/utils";
import { z } from "zod";
import { success } from "@/lib/responseFormat";
import { getAccountId, validateFields } from "@/middleware/middleware";
const router = express.Router();

// 获取厂商
export default router.post(
  "/",
  validateFields({
    userId: z.number().optional(),
  }),
  async (req, res) => {
    const accountId = getAccountId(req);
    if (!accountId) return res.status(401).send({ message: "未登录" });
    const data = await u
      .db("t_config")
      .where("type", "video")
      .where("accountId", accountId)
      .select("manufacturer", "model", "id");

    res.status(200).send(success(data));
  },
);
