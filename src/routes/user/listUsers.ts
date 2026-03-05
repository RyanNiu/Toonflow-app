import express from "express";
import u from "@/utils";
import { success } from "@/lib/responseFormat";
import { requireAdmin } from "@/middleware/middleware";

const router = express.Router();

// 账号列表(管理员)
export default router.post("/", requireAdmin, async (req, res) => {
  const users = await u.db("t_user").whereNull("deleted_at").select("id", "name", "is_admin", "deleted_at");
  res.status(200).send(success(users));
});
