import express from "express";
import u from "@/utils";
import { success } from "@/lib/responseFormat";
import { requireAdmin } from "@/middleware/middleware";

const router = express.Router();

// 获取系统配置(管理员)
export default router.post("/", requireAdmin, async (req, res) => {
  const rows = await u.db("t_setting_system").select("key", "value");
  const data: Record<string, any> = {};
  for (const row of rows) {
    if (!row.key) continue;
    try {
      data[row.key] = row.value ? JSON.parse(row.value) : null;
    } catch {
      data[row.key] = row.value;
    }
  }
  res.status(200).send(success(data));
});
