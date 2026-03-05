import express from "express";
import u from "@/utils";
import { z } from "zod";
import { success } from "@/lib/responseFormat";
import { requireAdmin, validateFields } from "@/middleware/middleware";

const router = express.Router();

// 保存系统配置(管理员)
export default router.post(
  "/",
  requireAdmin,
  validateFields({
    key: z.string(),
    value: z.any(),
  }),
  async (req, res) => {
    const { key, value } = req.body;
    const exist = await u.db("t_setting_system").where({ key }).first();
    const payload = {
      key,
      value: typeof value === "string" ? value : JSON.stringify(value ?? {}),
      createTime: Date.now(),
    };
    if (exist) {
      await u.db("t_setting_system").where({ key }).update(payload);
    } else {
      const maxIdResult: any = await u.db("t_setting_system").max("id as maxId").first();
      const newId = (maxIdResult?.maxId ?? 0) + 1;
      await u.db("t_setting_system").insert({ id: newId, ...payload });
    }
    res.status(200).send(success("保存成功"));
  },
);
