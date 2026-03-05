import express from "express";
import u from "@/utils";
import { z } from "zod";
import { success } from "@/lib/responseFormat";
import { getAccountId, validateFields } from "@/middleware/middleware";
const router = express.Router();

// 获取视频模型
export default router.post(
  "/",
  validateFields({
    userId: z.number().optional(),
  }),
  async (req, res) => {
    const accountId = getAccountId(req);
    if (!accountId) return res.status(401).send({ message: "未登录" });
    const data = await u.db("t_config").where("accountId", accountId).select("model");
    const modelData = [];

    for (const item of data) {
      if (item.model?.includes("sora")) {
        modelData.push("sora");
      }
      if (item.model?.includes("doubao")) {
        modelData.push("doubao");
      }
    }

    res.status(200).send(success(modelData));
  }
);
