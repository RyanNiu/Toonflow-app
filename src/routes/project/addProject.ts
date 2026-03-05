import express from "express";
import u from "@/utils";
import { z } from "zod";
import { success } from "@/lib/responseFormat";
import { getAccountId, validateFields } from "@/middleware/middleware";
const router = express.Router();

// 新增项目
export default router.post(
  "/",
  validateFields({
    name: z.string(),
    intro: z.string(),
    type: z.string(),
    artStyle: z.string(),
    videoRatio: z.string(),
  }),
  async (req, res) => {
    const { name, intro, type, artStyle, videoRatio } = req.body;
    const accountId = getAccountId(req);
    if (!accountId) return res.status(401).send({ message: "未登录" });

    await u.db("t_project").insert({
      name,
      intro,
      type,
      artStyle,
      videoRatio,
      accountId,
      createTime: Date.now(),
    });

    res.status(200).send(success({ message: "新增项目成功" }));
  }
);
