import express from "express";
import u from "@/utils";
import { z } from "zod";
import { success, error } from "@/lib/responseFormat";
import { requireAdmin, validateFields } from "@/middleware/middleware";

const router = express.Router();

// 删除账号(管理员)
export default router.post(
  "/",
  requireAdmin,
  validateFields({
    id: z.number(),
  }),
  async (req, res) => {
    const { id } = req.body;
    if (id === 1) return res.status(400).send(error("管理员账号不可删除"));

    await u.db("t_user").where({ id }).update({ deleted_at: Date.now() });
    res.status(200).send(success("删除成功"));
  },
);
