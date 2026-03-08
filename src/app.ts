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
  // 预检请求由 CORS 直接 204 响应，避免进入鉴权与路由，减少约 2s 延迟
  app.use(cors({ origin: "*", optionsSuccessStatus: 204, preflightContinue: false }));
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
    // CORS 预检不鉴权，由 cors 中间件直接响应
    if (req.method === "OPTIONS") return next();
    // 白名单路径
    if (req.path === "/other/login") return next();
    // 静态文件资源不需要 token（包含视频/音频/压缩包等）
    if (req.method === "GET" && /\.[^/]+$/i.test(req.path)) {
      return next();
    }
    // Electron 下所有 GET 放行，便于前端 SPA 通过 http://localhost 加载（避免 file:// 白屏）
    if (typeof process.versions?.electron !== "undefined" && req.method === "GET") {
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

  // Electron：由后端提供前端静态资源，窗口加载 http://localhost:port/ 避免 file:// 下 Vue Router 白屏
  if (typeof process.versions?.electron !== "undefined") {
    const { app: electronApp } = require("electron");
    const isDev = process.env.NODE_ENV === "dev" || !electronApp.isPackaged;
    const webDir = isDev
      ? path.join(process.cwd(), "scripts", "web")
      : path.join(electronApp.getAppPath(), "scripts", "web");
    if (fs.existsSync(webDir)) {
      // 前端资源不缓存，便于更新 Robou-web 构建后立即生效
      app.use((_req, res, next) => {
        res.set("Cache-Control", "no-store, no-cache, must-revalidate");
        next();
      });
      app.use(express.static(webDir, { index: false }));
      app.get(/.*/, (req, res) => {
        res.set("Cache-Control", "no-store, no-cache, must-revalidate");
        res.set(
          "Content-Security-Policy",
          [
            "default-src 'self'",
            "connect-src 'self' http://localhost:* ws://localhost:* wss://localhost:*",
            "script-src 'self'",
            "style-src 'self' 'unsafe-inline'",
            "img-src 'self' data: blob:",
            "font-src 'self'",
            "frame-ancestors 'self'",
          ].join("; ")
        );
        res.sendFile(path.join(webDir, "index.html"));
      });
    }
  }

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

  const preferredPort = randomPort ? 0 : parseInt(process.env.PORT || "60000", 10);
  const portList = randomPort ? [0] : [
    preferredPort,
    ...Array.from({ length: 100 }, (_, i) => preferredPort + 1 + i),
    0,
  ];

  // 明确绑定 127.0.0.1，避免本机 IPv6(::) 与前端 IPv4(localhost) 不一致导致 Network Error
  const listenHost = process.env.LISTEN_HOST ?? "127.0.0.1";
  const tryListenOne = (port: number): Promise<number> =>
    new Promise((resolve, reject) => {
      server = app.listen(port, listenHost, () => {
        const address = server?.address();
        const realPort = typeof address === "string" ? address : (address as any)?.port;
        console.log(`[服务启动成功]: http://${listenHost}:${realPort}`);
        resolve(realPort);
      });
      server.once("error", (err: NodeJS.ErrnoException) => {
        if (err.code === "EADDRINUSE") {
          reject(Object.assign(err, { code: "EADDRINUSE" as const }));
        } else {
          console.error(`[服务监听失败] 端口 ${port}:`, err.message);
          reject(err);
        }
      });
    });

  const closeCurrentServer = (): Promise<void> =>
    new Promise((resolve) => {
      if (!server) return resolve();
      server.removeAllListeners();
      server.close(() => resolve());
      server = undefined;
    });

  for (let i = 0; i < portList.length; i++) {
    const port = portList[i];
    try {
      const realPort = await tryListenOne(port);
      // Electron 下需立即返回端口让 main 创建窗口；仅 yarn dev 直跑时挂起以保持进程
      if (typeof process.versions?.electron !== "undefined") return realPort;
      await new Promise<never>(() => {});
      return realPort;
    } catch (e: any) {
      if (e?.code === "EADDRINUSE") {
        console.warn(`[端口 ${port} 已被占用] 尝试下一个端口...`);
        await closeCurrentServer();
        if (i < portList.length - 1) {
          await new Promise((r) => setTimeout(r, 200));
        }
      } else {
        throw e;
      }
    }
  }
  throw new Error("无法绑定任何端口");
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
if (!isElectron) {
  (async () => {
    try {
      await startServe();
      // 服务运行中，进程由 server 保持
    } catch (err) {
      console.error("[启动失败]", err);
      process.exit(1);
    }
  })();
}
