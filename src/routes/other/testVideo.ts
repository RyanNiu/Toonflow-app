import express from "express";
import { success, error } from "@/lib/responseFormat";
import u from "@/utils";
import { getAccountId, requireAdmin, validateFields } from "@/middleware/middleware";
import { z } from "zod";
const router = express.Router();

// 检查语言模型
export default router.post(
  "/",
  requireAdmin,
  validateFields({
    modelName: z.string().optional(),
    apiKey: z.string(),
    baseURL: z.string().optional(),
    manufacturer: z.string(),
  }),
  async (req, res) => {
    const { modelName, apiKey, baseURL, manufacturer } = req.body;
    const accountId = getAccountId(req);
    try {
      const duration = manufacturer == "gemini" ? 4 : 5;
      const videoPath = await u.generateVideo(
        {
          imageBase64: [],
          savePath: "test.mp4",
          prompt: "stickman Dances",
          duration: duration as any,
          resolution: "720p" as any,
          aspectRatio: "16:9",
          audio: false,
          mode: "single",
        } as any,
        manufacturer,
        accountId ?? 1,
      );
      const url = await u.oss.getFileUrl(videoPath);
      res.status(200).send(success(url));
    } catch (err: any) {
      const msg = u.error(err).message;
      console.error(msg);
      res.status(500).send(error(msg));
    }
  },
);
