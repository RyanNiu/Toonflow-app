import express from "express";
import u from "@/utils";
import { z } from "zod";
import { success, error } from "@/lib/responseFormat";
import { getAccountId, validateFields } from "@/middleware/middleware";
import bcrypt from "bcryptjs";

const router = express.Router();

// 用户修改自身密码
export default router.post(
  "/",
  validateFields({
    oldPassword: z.string(),
    newPassword: z.string(),
  }),
  async (req, res) => {
    const accountId = getAccountId(req);
    if (!accountId) return res.status(401).send({ message: "未登录" });

    const { oldPassword, newPassword } = req.body;
    const user = await u.db("t_user").where({ id: accountId }).whereNull("deleted_at").first();
    if (!user) return res.status(401).send({ message: "账号不存在或已被删除" });

    const storedPassword = user.password ?? "";
    const isHashed = storedPassword.startsWith("$2a$") || storedPassword.startsWith("$2b$") || storedPassword.startsWith("$2y$");
    const matched = isHashed ? await bcrypt.compare(oldPassword, storedPassword) : storedPassword === oldPassword;
    if (!matched) return res.status(400).send(error("原密码错误"));

    const hashed = await bcrypt.hash(newPassword, 10);
    await u.db("t_user").where({ id: accountId }).update({ password: hashed });
    res.status(200).send(success("修改密码成功"));
  },
);
