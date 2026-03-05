import express from "express";
import u from "@/utils";
import { success } from "@/lib/responseFormat";
import { getAccountId, validateFields } from "@/middleware/middleware";
import { z } from "zod";
import { getProjectForAccount } from "@/utils/projectAccess";
const router = express.Router();

// 生成分镜图
export default router.post(
  "/",
  validateFields({
    filePath: z.object(),
    prompt: z.string(),
    projectId: z.number(),
    assetsId: z.any(),
  }),
  async (req, res) => {
    const { filePath, prompt, projectId, assetsId } = req.body;
    const accountId = getAccountId(req);
    if (!accountId) return res.status(401).send({ message: "未登录" });
    const project = await getProjectForAccount(accountId, projectId);
    if (!project) return res.status(404).send({ message: "项目不存在" });
    if (assetsId) {
      const asset = await u.db("t_assets").where({ id: assetsId, projectId }).first();
      if (!asset) return res.status(404).send({ message: "分镜不存在" });
    }
    //拿到图片尺寸
    const projectInfo = await u.db("t_project").where({ id: projectId }).first();

    let data = await u.editImage(filePath, prompt, projectId, projectInfo?.videoRatio!, accountId);
    const returnData: {
      id: number | null;
      url: string | null;
    } = {
      id: null,
      url: null,
    };
    if (assetsId) {
      const [id] = await u.db("t_image").insert({
        filePath: data,
        assetsId: assetsId,
      });
      returnData.id = id!;
    }
    returnData.url = await u.oss.getFileUrl(data);

    res.status(200).send(success(returnData));
  }
);
