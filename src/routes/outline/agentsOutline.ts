import express from "express";
import expressWs, { Application } from "express-ws";
import u from "@/utils";
import OutlineScript from "@/agents/outlineScript";
import { getAccountId } from "@/middleware/middleware";
import { getProjectForAccount } from "@/utils/projectAccess";
import jwt from "jsonwebtoken";
const router = express.Router();
expressWs(router as unknown as Application);

async function ensureWsAccountId(req: express.Request): Promise<number | null> {
  const accountId = getAccountId(req as any);
  if (accountId) return accountId;
  const tokenSecret = process.env.JWT_SECRET;
  if (!tokenSecret) return null;
  const rawToken = req.headers.authorization || (req.query.token as string) || "";
  const token = rawToken.replace("Bearer ", "");
  if (!token) return null;
  try {
    const decoded: any = jwt.verify(token, tokenSecret);
    const decodedAccountId = Number(decoded?.account_id ?? decoded?.id);
    if (!decodedAccountId) return null;
    const user = await u.db("t_user").where({ id: decodedAccountId }).whereNull("deleted_at").first();
    if (!user) return null;
    (req as any).user = decoded;
    return decodedAccountId;
  } catch {
    return null;
  }
}

router.ws("/", async (ws, req) => {
  let agent: OutlineScript;
  const rawAuth = req.headers.authorization;
  const queryToken = req.query.token;
  console.log(
    "[agentsOutline][ws] token header:",
    Boolean(rawAuth),
    "query token:",
    Boolean(queryToken),
    "projectId:",
    req.query.projectId,
  );

  const accountId = await ensureWsAccountId(req as any);
  if (!accountId) {
    ws.send(JSON.stringify({ type: "error", data: "未登录" }));
    ws.close(1008, "未登录");
    return;
  }

  const projectId = req.query.projectId;
  if (!projectId || typeof projectId !== "string") {
    ws.send(JSON.stringify({ type: "error", data: "项目ID缺失" }));
    ws.close(1008, "项目ID缺失");
    return;
  }

  const project = await getProjectForAccount(accountId, Number(projectId));
  if (!project) {
    ws.send(JSON.stringify({ type: "error", data: "项目不存在" }));
    ws.close(1008, "项目不存在");
    return;
  }

  agent = new OutlineScript(Number(projectId));

  // const existing = await u
  //   .db("t_chatHistory")
  //   .where({ projectId: Number(projectId) })
  //   .first();
  // if (existing) {
  //   try {
  // const historyData = JSON.parse(existing.data!);
  // agent.history = [];
  // agent.novelChapters = existing.novel ? JSON.parse(existing.novel) : [];
  //   } catch (error) {
  //     ws.send(JSON.stringify({ type: "error", data: "历史记录解析异常,将清空历史记录" }));
  //     agent.history = [];
  //   }
  // }
  // 监听各类事件
  // 流式传输：每个token
  agent.emitter.on("data", (text) => {
    ws.send(JSON.stringify({ type: "stream", data: text }));
  });

  // 完整响应结束
  agent.emitter.on("response", async (text) => {
    ws.send(JSON.stringify({ type: "response_end", data: text }));
    await saveHistory();
  });

  // Sub-Agent 流式数据
  agent.emitter.on("subAgentStream", (data) => {
    ws.send(JSON.stringify({ type: "subAgentStream", data }));
  });

  // Sub-Agent 结束
  agent.emitter.on("subAgentEnd", (data) => {
    ws.send(JSON.stringify({ type: "subAgentEnd", data }));
  });

  // Tool 调用
  agent.emitter.on("toolCall", (data) => {
    ws.send(JSON.stringify({ type: "toolCall", data }));
  });

  agent.emitter.on("transfer", (data) => {
    ws.send(JSON.stringify({ type: "transfer", data }));
  });

  agent.emitter.on("refresh", (data) => {
    ws.send(JSON.stringify({ type: "refresh", data }));
  });

  agent.emitter.on("error", (err) => {
    ws.send(JSON.stringify({ type: "error", data: err.toString() }));
  });

  // 发送初始化完成消息，通知前端可以开始发送消息
  ws.send(JSON.stringify({ type: "init", data: { projectId } }));

  type DataTyype = "msg" | "setNovel" | "cleanHistory";
  ws.on("message", async function (rawData: string) {
    let data: { type: DataTyype; data: any } | null = null;
    try {
      data = JSON.parse(rawData);
    } catch (error) {
      ws.send(JSON.stringify({ type: "error", data: "数据解析异常" }));
      ws.close(1007, "数据解析异常");
      return;
    }
    if (!data) {
      ws.send(JSON.stringify({ type: "error", data: "数据格式错误" }));
      ws.close(1003, "数据格式错误");
      return;
    }
    const novelData = await u
      .db("t_novel")
      .where({ projectId: Number(projectId) })
      .orderBy("chapterIndex", "asc");
    agent.setNovel(novelData);
    const msg = data.data;
    try {
      switch (data?.type) {
        case "msg":
          let prompt = msg.data;
          if (msg.type == "user") await agent.call(prompt);
          break;
        case "cleanHistory":
          agent.history = [];
          await u
            .db("t_chatHistory")
            .where({ projectId: Number(projectId) })
            .del();
          ws.send(JSON.stringify({ type: "notice", data: "历史记录已清空" }));
          break;
        default:
          break;
      }
    } catch (e) {
      ws.send(JSON.stringify({ type: "error", data: "数据解析/脚本生成异常" }));
      console.error(e);
    }
  });

  ws.on("close", async () => {
    agent?.emitter?.removeAllListeners();
    await saveHistory();
  });

  async function saveHistory() {
    const history = agent?.history || [];
    //保存对话记录
    const existing = await u
      .db("t_chatHistory")
      .where({ projectId: Number(projectId), type: "outlineAgent" })
      .first();
    if (existing) {
      await u
        .db("t_chatHistory")
        .where({ projectId: Number(projectId), type: "outlineAgent" })
        .update({ data: JSON.stringify(history), novel: agent?.novelChapters ? JSON.stringify(agent.novelChapters) : "" });
    } else {
      await u.db("t_chatHistory").insert({
        projectId: Number(projectId),
        data: JSON.stringify(history),
        novel: agent?.novelChapters ? JSON.stringify(agent.novelChapters) : "",
        type: "outlineAgent",
      });
    }
  }
});

export default router;
