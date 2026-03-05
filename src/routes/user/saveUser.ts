import express from "express";
import u from "@/utils";
import { z } from "zod";
import { success } from "@/lib/responseFormat";
import { getAccountId, validateFields } from "@/middleware/middleware";
import bcrypt from "bcryptjs";
const router = express.Router();

// 获取用户
export default router.post(
  "/",
  validateFields({
    name: z.string(),
    password: z.string(),
    id: z.number(),
  }),
  async (req, res) => {
    const { name, password, id } = req.body;
    const accountId = getAccountId(req);
    if (!accountId) return res.status(401).send({ message: "未登录" });
    const user = (req as any).user;
    const isAdmin = !!user?.is_admin;
    if (!isAdmin && id !== accountId) {
      return res.status(403).send({ message: "无权限" });
    }
    const hashed = await bcrypt.hash(password, 10);
    await u.db("t_user").where("id", id).update({
      name,
      password: hashed,
    });
    res.status(200).send(success("保存设置成功"));
  },
);
