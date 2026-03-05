import logger from "@/logger";
import express from "express";
import u from "@/utils";
import { z } from "zod";
import { success, error } from "@/lib/responseFormat";
import { validateFields } from "@/middleware/middleware";
const router = express.Router();

export default router.post("/", async (req, res) => {
  const user = (req as any).user;
  if (!user?.is_admin) return res.status(400).send(error("无权限查看"));

  const logs = logger.exportLogs();

  res.status(200).send(success(logs));
});
