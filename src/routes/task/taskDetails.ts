import express from "express";
import u from "@/utils";
import { success } from "@/lib/responseFormat";
import { getAccountId, requireAdmin, validateFields } from "@/middleware/middleware";
import { z } from "zod";
const router = express.Router();

export default router.post(
  "/",
  requireAdmin,
  validateFields({
    taskId: z.number(),
  }),
  async (req, res) => {
    const { taskId } = req.body;
    const accountId = getAccountId(req);
    if (!accountId) return res.status(401).send({ message: "未登录" });
    const data = await u.db("t_taskList").where({ id: taskId, accountId }).select("*").first();
    res.status(200).send(success(data));
  }
);
