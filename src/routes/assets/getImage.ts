import express from "express";
import u from "@/utils";
import { success } from "@/lib/responseFormat";
import { z } from "zod";
import { getAccountId, validateFields } from "@/middleware/middleware";
import { getProjectForAccount } from "@/utils/projectAccess";
const router = express.Router();

// 获取生成图片
export default router.post(
  "/",
  validateFields({
    assetsId: z.number(),
  }),
  async (req, res) => {
    const { assetsId } = req.body;
    const accountId = getAccountId(req);
    if (!accountId) return res.status(401).send({ message: "未登录" });

    const assets = await u
      .db("t_assets")
      .where("id", assetsId)
      .select("id", "filePath", "scriptId", "type", "state", "projectId")
      .first();
    if (!assets) return res.status(404).send({ message: "资产不存在" });
    const projectId = Number((assets as any).projectId);
    if (!projectId) return res.status(400).send({ message: "项目不存在" });
    const project = await getProjectForAccount(accountId, projectId);
    if (!project) return res.status(404).send({ message: "项目不存在" });

    const tempAssets = await u.db("t_image").where("assetsId", assetsId).select("id", "filePath", "assetsId", "type", "state");

    for (const item of tempAssets) {
      if (item.filePath) {
        item.filePath = await u.oss.getFileUrl(item.filePath);
      } else {
        item.filePath = "";
      }
    }

    const data = {
      id: assets!.id,
      state: assets!.state,
      filePath: assets!.filePath ? await u.oss.getFileUrl(assets!.filePath) : "",
      scriptId: assets!.scriptId,
      tempAssets,
    };

    res.status(200).send(success(data));
  },
);
