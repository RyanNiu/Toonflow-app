import express from "express";
import u from "@/utils";
import { success } from "@/lib/responseFormat";
import { getAccountId, validateFields } from "@/middleware/middleware";
import { z } from "zod";
import { getProjectForAccount } from "@/utils/projectAccess";
const router = express.Router();

// 获取视频配置列表
export default router.post(
  "/",
  validateFields({
    scriptId: z.number(),
  }),
  async (req, res) => {
    const { scriptId } = req.body;
    const accountId = getAccountId(req);
    if (!accountId) return res.status(401).send({ message: "未登录" });
    const script = await u.db("t_script").where("id", scriptId).first();
    if (!script) return res.status(404).send({ message: "剧本不存在" });
    const projectId = Number(script.projectId);
    if (!projectId) return res.status(400).send({ message: "项目不存在" });
    const project = await getProjectForAccount(accountId, projectId);
    if (!project) return res.status(404).send({ message: "项目不存在" });

    // 查询该脚本下的所有视频配置
    const configs = await u
      .db("t_videoConfig")
      .leftJoin("t_config", "t_config.id", "t_videoConfig.aiConfigId")
      .where({ scriptId })
      .orderBy("createTime", "desc")
      .select("t_videoConfig.*", "t_config.manufacturer as manufacturer", "t_config.model");
    // 解析 JSON 字段
    const result = configs.map((config: any) => ({
      id: config.id,
      scriptId: config.scriptId,
      projectId: config.projectId,
      aiConfigId: config.aiConfigId,
      manufacturer: config.manufacturer,
      model: config.model,
      mode: config.mode,
      startFrame: config.startFrame ? JSON.parse(config.startFrame) : null,
      endFrame: config.endFrame ? JSON.parse(config.endFrame) : null,
      images: config.images ? JSON.parse(config.images) : [],
      resolution: config.resolution,
      duration: config.duration,
      prompt: config.prompt || "",
      selectedResultId: config.selectedResultId,
      createdAt: config.createTime ? new Date(config.createTime).toISOString() : new Date().toISOString(),
      audioEnabled:!!config.audioEnabled
    }));

    res.status(200).send(success(result));
  },
);
