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
    id: z.number(),
    filePath: z.string(),
    prompt: z.string(),
  }),
  async (req, res) => {
    const { filePath, id, prompt } = req.body;
    const accountId = getAccountId(req);
    if (!accountId) return res.status(401).send({ message: "未登录" });
    const asset = await u.db("t_assets").where("id", id).first();
    if (!asset) return res.status(404).send({ message: "分镜不存在" });
    const projectId = Number(asset.projectId);
    if (!projectId) return res.status(400).send({ message: "项目不存在" });
    const project = await getProjectForAccount(accountId, projectId);
    if (!project) return res.status(404).send({ message: "项目不存在" });
    const savePath = new URL(filePath).pathname;

    let imageUrl = "";

    const oldImage = await u.db("t_assets").where("id", id).select("filePath").first();
    const oldFilePath = oldImage?.filePath;

    if (!oldFilePath || oldFilePath !== savePath) {
      imageUrl = savePath;

      if (oldFilePath) {
        await u.db("t_image").insert({
          assetsId: id,
          filePath: oldFilePath,
          type: "分镜",
        });

        await u.db("t_image").where("assetsId", id).andWhere("filePath", savePath).del();
      }
    } else {
      imageUrl = oldFilePath;
    }

    await u.db("t_assets").where("id", id).update({
      filePath: imageUrl,
      prompt,
    });

    res.status(200).send({ message: "保存分镜图成功" });
  }
);
