import express from "express";
import u from "@/utils";
import { z } from "zod";
import { success, error } from "@/lib/responseFormat";
import { requireAdmin, validateFields } from "@/middleware/middleware";

const router = express.Router();

// 管理员修改账号角色
export default router.post(
  "/",
  requireAdmin,
  validateFields({
    id: z.number(),
    is_admin: z.number(),
  }),
  async (req, res) => {
    const { id, is_admin } = req.body;
    const user = await u.db("t_user").where({ id }).first();
    if (!user) return res.status(404).send(error("账号不存在"));
    if (user.deleted_at) return res.status(400).send(error("账号已被删除"));
    if (id === 1) {
      await u.db("t_user").where({ id }).update({ is_admin: 1 });
      return res.status(200).send(success("管理员账号不可降级"));
    }

    await u.db("t_user").where({ id }).update({ is_admin: is_admin ? 1 : 0 });
    res.status(200).send(success("角色更新成功"));
  },
);
