import express from "express";
import u from "@/utils";
import { z } from "zod";
import { success } from "@/lib/responseFormat";
import { getAccountId, validateFields } from "@/middleware/middleware";
import { getProjectForAccount } from "@/utils/projectAccess";

const router = express.Router();

const bodySchema = validateFields({ projectId: z.coerce.number(), scriptId: z.coerce.number() });
const querySchema = validateFields({ projectId: z.coerce.number(), scriptId: z.coerce.number() }, "query");

/**
 * 分镜工作台元数据（独立页面包屑等）
 * GET 或 POST：projectId, scriptId → projectName, scriptName
 */
router.get("/", querySchema, handler);
router.post("/", bodySchema, handler);

async function handler(req: express.Request, res: express.Response) {
  const { projectId, scriptId } = req.method === "GET" ? req.query : req.body;
  const accountId = getAccountId(req);
  if (!accountId) return res.status(401).send({ message: "未登录" });

  const project = await getProjectForAccount(accountId, Number(projectId));
  if (!project) return res.status(404).send({ message: "项目不存在" });

  const script = await u.db("t_script").where({ id: Number(scriptId), projectId: Number(projectId) }).select("id", "name").first();
  if (!script) return res.status(404).send({ message: "剧本不存在" });

  res.status(200).send(
    success({
      projectName: (project as any).name ?? "项目",
      scriptName: script.name ?? "剧本",
    })
  );
}

export default router;
