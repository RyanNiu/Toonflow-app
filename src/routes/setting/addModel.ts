import express from "express";
import u from "@/utils";
import { z } from "zod";
import { success } from "@/lib/responseFormat";
import { getAccountId, validateFields } from "@/middleware/middleware";
const router = express.Router();

export default router.post(
  "/",
  validateFields({
    type: z.enum(["text", "video", "image"]),
    model: z.string(),
    baseUrl: z.string(),
    apiKey: z.string(),
    modelType: z.string(),
    manufacturer: z.string(),
  }),
  async (req, res) => {
    const { type, model, baseUrl, apiKey, manufacturer, modelType } = req.body;
    const accountId = getAccountId(req);
    if (!accountId) return res.status(401).send({ message: "未登录" });

    await u.db("t_config").insert({
      type,
      model,
      baseUrl,
      apiKey,
      manufacturer,
      modelType,
      createTime: Date.now(),
      accountId,
    });
    res.status(200).send(success("新增成功"));
  },
);
