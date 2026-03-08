import express from "express";
import u from "@/utils";
import { success } from "@/lib/responseFormat";
import { getAccountId } from "@/middleware/middleware";
const router = express.Router();

// 获取项目
export default router.post("/", async (req, res) => {
  try {
    const accountId = getAccountId(req);
    if (!accountId) return res.status(401).send({ message: "未登录" });
    const data = await u.db("t_project").where("accountId", accountId).select("*");
    res.status(200).send(success(data));
  } catch (err: any) {
    console.error("[getProject]", err?.message || err);
    res.status(500).send({ message: "获取项目列表失败", code: 500 });
  }
});
