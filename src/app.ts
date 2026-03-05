import "./logger";
import "./err";
import "./env";
import express, { Request, Response, NextFunction } from "express";
import expressWs from "express-ws";
import logger from "morgan";
import cors from "cors";
import buildRoute from "@/core";
import fs from "fs";
import path from "path";
import u from "@/utils";
import jwt from "jsonwebtoken";

const app = express();
let server: ReturnType<typeof app.listen> | null = null;

export default async function startServe(randomPort: Boolean = false) {
  if (process.env.NODE_ENV == "dev") await buildRoute();

  expressWs(app);

  app.use(logger("dev"));
  app.use(cors({ origin: "*" }));
  app.use(express.json({ limit: "100mb" }));
  app.use(express.urlencoded({ extended: true, limit: "100mb" }));

  let rootDir: string;
  if (typeof process.versions?.electron !== "undefined") {
    const { app } = require("electron");
    const userDataDir: string = app.getPath("userData");
    rootDir = path.join(userDataDir, "uploads");
  } else {
    // 生产环境下同理，必须放入挂载的数据卷内
    if (process.env.NODE_ENV === "prod") {
      rootDir = path.join(process.cwd(), "data", "uploads");
    } else {
      rootDir = path.join(process.cwd(), "uploads");
    }
  }

  // 确保 uploads 目录存在
  if (!fs.existsSync(rootDir)) {
    fs.mkdirSync(rootDir, { recursive: true });
  }
  console.log("文件目录:", rootDir);

  app.use(async (req, res, next) => {
    const tokenSecret = process.env.JWT_SECRET;
    if (!tokenSecret) return res.status(500).send({ message: "服务器未配置，请联系管理员" });
    // 从 header 或 query 参数获取 token
    const rawToken = req.headers.authorization || (req.query.token as string) || "";
    const token = rawToken.replace("Bearer ", "");
    // 白名单路径
    if (req.path === "/other/login") return next();
    // 静态图片等资源不需要 token，避免 <img> 直接访问被 401 拦截
    if (req.method === "GET" && /\.(png|jpe?g|jpg|gif|webp|svg)$/i.test(req.path)) {
      return next();
    }

    if (!token) return res.status(401).send({ message: "未提供token" });
    try {
      const decoded: any = jwt.verify(token, tokenSecret);
      const accountId = Number(decoded?.account_id ?? decoded?.id);
      if (!accountId) return res.status(401).send({ message: "无效的token" });
      const user = await u.db("t_user").where({ id: accountId }).whereNull("deleted_at").first();
      if (!user) return res.status(401).send({ message: "账号不存在或已被删除" });
      (req as any).user = decoded;
      if (req.method === "GET") {
        const match = req.path.match(/^\/(\d+)\//);
        if (match) {
          const pathAccountId = Number(match[1]);
          if (!decoded?.is_admin && accountId !== pathAccountId) {
            return res.status(403).send({ message: "无权限" });
          }
        }
      }
      next();
    } catch (err) {
      return res.status(401).send({ message: "无效的token" });
    }
  });

  app.use(express.static(rootDir));

  const router = await import("@/router");
  await router.default(app);

  // 404 处理
  app.use((_, res, next: NextFunction) => {
    return res.status(404).send({ message: "Not Found" });
  });

  // 错误处理
  app.use((err: any, _: Request, res: Response, __: NextFunction) => {
    res.locals.message = err.message;
    res.locals.error = err;
    console.error(err);
    res.status(err.status || 500).send(err);
  });

  const port = randomPort ? 0 : parseInt(process.env.PORT || "60000");
  return await new Promise((resolve, reject) => {
    server = app.listen(port, async (v) => {
      const address = server?.address();
      const realPort = typeof address === "string" ? address : address?.port;
      console.log(`[服务启动成功]: http://localhost:${realPort}`);
      resolve(realPort);
    });
    server.on("error", (err: NodeJS.ErrnoException) => {
      console.error(`[服务监听失败] 端口 ${port} 可能被占用:`, err.message);
      reject(err);
    });
  });
}

// 支持await关闭
export function closeServe(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (server) {
      server.close((err?: Error) => {
        if (err) return reject(err);
        console.log("[服务已关闭]");
        resolve();
      });
    } else {
      resolve();
    }
  });
}

const isElectron = typeof process.versions?.electron !== "undefined";
if (!isElectron) startServe();
