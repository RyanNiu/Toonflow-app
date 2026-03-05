import express from "express";
import u from "@/utils";
import { z } from "zod";
import { success } from "@/lib/responseFormat";
import { getAccountId, validateFields } from "@/middleware/middleware";

const router = express.Router();

// 保存账号配置
export default router.post(
  "/",
  validateFields({
    imageModel: z.any().optional(),
    languageModel: z.any().optional(),
  }),
  async (req, res) => {
    const accountId = getAccountId(req);
    if (!accountId) return res.status(401).send({ message: "未登录" });

    const { imageModel, languageModel } = req.body;
    const exist = await u.db("t_setting_account").where({ accountId }).first();
    const payload: Record<string, any> = {};
    if (imageModel !== undefined) payload.imageModel = JSON.stringify(imageModel ?? {});
    if (languageModel !== undefined) payload.languageModel = JSON.stringify(languageModel ?? {});

    if (exist) {
      await u.db("t_setting_account").where({ accountId }).update(payload);
    } else {
      const maxIdResult: any = await u.db("t_setting_account").max("id as maxId").first();
      const newId = (maxIdResult?.maxId ?? 0) + 1;
      await u.db("t_setting_account").insert({ id: newId, accountId, imageModel: "{}", languageModel: "{}", ...payload });
    }
    res.status(200).send(success("保存成功"));
  },
);
