import express from "express";
import u from "@/utils";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { success, error } from "@/lib/responseFormat";
import { validateFields } from "@/middleware/middleware";
import { z } from "zod";
const router = express.Router();

export function setToken(payload: string | object, expiresIn: string | number, secret: string): string {
  if (!payload || typeof secret !== "string" || !secret) {
    throw new Error("参数不合法");
  }
  return (jwt.sign as any)(payload, secret, { expiresIn });
}

// 登录
export default router.post(
  "/",
  validateFields({
    username: z.string(),
    password: z.string(),
  }),
  async (req, res) => {
    const { username, password } = req.body;

    const data = await u.db("t_user").where("name", "=", username).whereNull("deleted_at").first();
    if (!data) return res.status(400).send(error("登录失败"));

    const tokenSecret = process.env.JWT_SECRET;
    if (!tokenSecret) return res.status(500).send(error("服务器未配置"));

    const storedPassword = data?.password ?? "";
    const isHashed = storedPassword.startsWith("$2a$") || storedPassword.startsWith("$2b$") || storedPassword.startsWith("$2y$");
    const passwordMatched = isHashed ? await bcrypt.compare(password, storedPassword) : storedPassword === password;

    if (passwordMatched && data!.name == username) {
      const isAdmin = Number((data as any).is_admin) === 1 || data!.id === 1;
      if (!isHashed) {
        const hashed = await bcrypt.hash(password, 10);
        await u.db("t_user").where("id", data!.id).update({ password: hashed });
      }

      const token = setToken(
        {
          account_id: data!.id,
          is_admin: isAdmin,
          id: data!.id,
          name: data!.name,
        },
        "180Days",
        tokenSecret,
      );

      return res.status(200).send(
        success({ token: "Bearer " + token, name: data!.name, id: data!.id, is_admin: isAdmin }, "登录成功"),
      );
    } else {
      return res.status(400).send(error("用户名或密码错误"));
    }
  },
);
