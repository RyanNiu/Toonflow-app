import express from "express";
import u from "@/utils";
import { z } from "zod";
import { success } from "@/lib/responseFormat";
import { getAccountId, validateFields } from "@/middleware/middleware";
import { getProjectForAccount } from "@/utils/projectAccess";
const router = express.Router();

// 保存分镜图
export default router.post(
  "/",
  validateFields({
    results: z.array(
      z.object({
        videoPrompt: z.string(),
        prompt: z.string(),
        duration: z.string(),
        projectId: z.number(),
        filePath: z.string(),
        type: z.string(),
        name: z.string(),
        scriptId: z.number(),
        segmentId: z.number(),
        shotIndex: z.number(),
      })
    ),
  }),
  async (req, res) => {
    const { results } = req.body;
    const accountId = getAccountId(req);
    if (!accountId) return res.status(401).send({ message: "未登录" });
    const projectId = results?.[0]?.projectId;
    if (!projectId) return res.status(400).send({ message: "项目不存在" });
    if (results.some((item: any) => Number(item.projectId) !== Number(projectId))) {
      return res.status(400).send({ message: "项目不一致" });
    }
    const project = await getProjectForAccount(accountId, projectId);
    if (!project) return res.status(404).send({ message: "项目不存在" });
    const scriptId = results[0].scriptId;
    // 保存前删除该剧本下所有旧分镜资产及其图片记录，避免「删除片段后重新生成」仍带出上次的图片记录
    const oldRows = await u.db("t_assets").where("scriptId", scriptId).where("type", "分镜").select("id");
    const oldIds = Array.isArray(oldRows) ? oldRows.map((r: { id?: number }) => r?.id).filter((id): id is number => id != null) : [];
    if (oldIds.length > 0) {
      await u.db("t_image").where("type", "分镜").whereIn("assetsId", oldIds).del();
      await u.db("t_assets").whereIn("id", oldIds).del();
    }
    const list = results.map((item: any) => {
      return {
        ...item,
        filePath: new URL(item.filePath).pathname,
      };
    });
    await u.db("t_assets").insert(list);
    res.status(200).send({ message: "保存分镜图成功" });
  },
);
