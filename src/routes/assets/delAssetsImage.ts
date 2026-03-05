import express from "express";
import u from "@/utils";
import { z } from "zod";
import { success } from "@/lib/responseFormat";
import { getAccountId, validateFields } from "@/middleware/middleware";
import { getProjectForAccount } from "@/utils/projectAccess";
const router = express.Router();

// 删除资产图片
export default router.post(
  "/",
  validateFields({
    imageId: z.number().optional(),
    assetsId: z.number().optional(),
  }),
  async (req, res) => {
    const { imageId, assetsId } = req.body;
    const accountId = getAccountId(req);
    if (!accountId) return res.status(401).send({ message: "未登录" });
    if (assetsId) {
      const asset = await u.db("t_assets").where("id", assetsId).first();
      if (!asset) return res.status(404).send({ message: "资产不存在" });
      const projectId = Number(asset.projectId);
      if (!projectId) return res.status(400).send({ message: "项目不存在" });
      const project = await getProjectForAccount(accountId, projectId);
      if (!project) return res.status(404).send({ message: "项目不存在" });
    } else if (imageId) {
      const image = await u.db("t_image").where("id", imageId).first();
      if (!image) return res.status(404).send({ message: "图片不存在" });
      const asset = await u.db("t_assets").where("id", image.assetsId).first();
      if (!asset) return res.status(404).send({ message: "资产不存在" });
      const projectId = Number(asset.projectId);
      if (!projectId) return res.status(400).send({ message: "项目不存在" });
      const project = await getProjectForAccount(accountId, projectId);
      if (!project) return res.status(404).send({ message: "项目不存在" });
    }
    if (assetsId) {
      await u.db("t_assets").where("id", assetsId).update({
        filePath: null,
      });
    }
    if (imageId) {
      await u.db("t_image").where("id", imageId).delete();
    }
    res.status(200).send(success({ message: "删除资产图片成功" }));
  },
);
