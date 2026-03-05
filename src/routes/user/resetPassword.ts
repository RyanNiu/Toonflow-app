import express from "express";
import u from "@/utils";
import { z } from "zod";
import { success, error } from "@/lib/responseFormat";
import { requireAdmin, validateFields } from "@/middleware/middleware";
import bcrypt from "bcryptjs";

const router = express.Router();

// 管理员重置密码
export default router.post(
  "/",
  requireAdmin,
  validateFields({
    id: z.number(),
    password: z.string(),
  }),
  async (req, res) => {
    const { id, password } = req.body;
    const user = await u.db("t_user").where({ id }).first();
    if (!user) return res.status(404).send(error("账号不存在"));
    if (user.deleted_at) return res.status(400).send(error("账号已被删除"));

    const hashed = await bcrypt.hash(password, 10);
    await u.db("t_user").where({ id }).update({ password: hashed });
    res.status(200).send(success("重置密码成功"));
  },
);
