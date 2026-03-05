import express from "express";
import u from "@/utils";
import { success } from "@/lib/responseFormat";
import { requireAdmin } from "@/middleware/middleware";
const router = express.Router();

// 删除数据库表数据
export default router.post("/", requireAdmin, async (req, res) => {
  const projects = await u.db("t_project").select("id", "accountId");

  await Promise.all(
    projects.map(async (project) => {
      try {
        if (!project.accountId || !project.id) return;
        await u.oss.deleteDirectory(`${project.accountId}/${project.id}`);
      } catch (error) {
        console.error(`删除OSS文件失败，项目ID: ${project.id}`, error);
      }
    }),
  );

  // await initDB(db, true);

  res.status(200).send(success("清空数据库成功"));
});
