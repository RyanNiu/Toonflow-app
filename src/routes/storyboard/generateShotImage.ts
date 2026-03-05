import express from "express";
import { success } from "@/lib/responseFormat";
import generateImageTool from "@/agents/storyboard/generateImageTool";
import u from "@/utils";
import { getAccountId, validateFields } from "@/middleware/middleware";
import { z } from "zod";
import fs from "fs";
import { getProjectForAccount } from "@/utils/projectAccess";
const router = express.Router();

// 生成分镜图
export default router.post(
  "/",
  validateFields({
    segmentId: z.number(),
    title: z.string(),
    x: z.number(),
    y: z.number().nullable(),
    cells: z.array(z.object({ src: z.string().optional(), prompt: z.string() })),
    scriptId: z.number(),
    projectId: z.number(),
  }),
  async (req, res) => {
    try {
      const { cells, scriptId, projectId } = req.body;
      const accountId = getAccountId(req);
      if (!accountId) return res.status(401).send({ message: "未登录" });
      const project = await getProjectForAccount(accountId, projectId);
      if (!project) return res.status(404).send({ message: "项目不存在" });
      const script = await u.db("t_script").where({ id: scriptId, projectId }).first();
      if (!script) return res.status(404).send({ message: "剧本不存在" });

      const buffer = await generateImageTool(cells, scriptId, projectId);

      fs.writeFileSync("merged.jpg", buffer);

      return res.json(success(buffer));
    } catch (error) {
      console.error("生成片段图失败:", error);
      return res.status(500).json({
        success: false,
        message: "生成片段图失败",
        error: error instanceof Error ? error.message : "未知错误",
      });
    }
  },
);
