import { app, BrowserWindow, dialog } from "electron";
import path from "path";
import { pathToFileURL } from "url";
import fs from "fs";

// ─── 最顶层的全局异常捕获（确保任何致命崩溃都会弹窗） ───────────────────────
process.on("uncaughtException", (err) => {
  const msg = err instanceof Error ? err.stack || err.message : String(err);
  try {
    fs.appendFileSync(path.join(app.getPath("userData"), "crash.log"), `[uncaughtException] ${msg}\n`);
  } catch (_) {}
  dialog.showErrorBox("未捕获的严重异常", msg);
});
process.on("unhandledRejection", (reason) => {
  const msg = reason instanceof Error ? reason.stack || reason.message : String(reason);
  try {
    fs.appendFileSync(path.join(app.getPath("userData"), "crash.log"), `[unhandledRejection] ${msg}\n`);
  } catch (_) {}
  dialog.showErrorBox("未处理的异步异常", msg);
});
// ──────────────────────────────────────────────────────────────────

// 注意：将内部依赖延迟导入，防止模块加载时抛错导致上方异常捕获未能生效
let startServe: any;
let closeServe: any;

// ─── 日志写入 ──────────────────────────────────────────────────────────────
let logFile: string | null = null;

function initLog() {
  try {
    const logDir = path.join(app.getPath("userData"), "logs");
    if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });
    logFile = path.join(logDir, `startup-${Date.now()}.log`);
    fs.writeFileSync(logFile, `=== 启动日志 ${new Date().toISOString()} ===\n`, "utf8");
  } catch (_) {}
}

function log(msg: string) {
  const line = `[${new Date().toISOString()}] ${msg}\n`;
  console.log(line.trim());
  if (logFile) {
    try { fs.appendFileSync(logFile, line, "utf8"); } catch (_) {}
  }
}

function showError(title: string, detail: string) {
  log(`ERROR: ${title} - ${detail}`);
  dialog.showErrorBox(title, `${detail}\n\n详细日志请查看: ${logFile ?? "userData/logs"}`);
}

// ─── 万能报错兜底界面 ───────────────────────────────────────────────────────
function loadFallbackUI(win: BrowserWindow, errorHtml: string) {
  try {
    const htmlData = `data:text/html;charset=utf-8,
      <!DOCTYPE html>
      <html>
      <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #2b2b2b; color: #ff6b6b; padding: 40px; text-align: left;">
        <div style="background: #1e1e1e; padding: 20px; border-radius: 8px; border: 1px solid #ff4757; box-shadow: 0 4px 12px rgba(0,0,0,0.5);">
          <h2 style="margin-top:0;">⛔ 启动失败</h2>
          <p style="color: #ccc;">应用程序未能正常打开可视界面，以下是最新的错误原因：</p>
          <div style="background: #000; padding: 15px; border-radius: 4px; overflow-x: auto;">
            <pre style="margin: 0; font-family: Consolas, monospace; white-space: pre-wrap; word-wrap: break-word;">${errorHtml}</pre>
          </div>
        </div>
      </body>
      </html>
    `;
    win.loadURL(htmlData);
    if (!win.isVisible()) win.show();
  } catch (e) {}
}

// ─── 默认端口配置 ────────────────────────────────────────────────────────────
const defaultPort = 60000;

function createMainWindow(port: any): void {
  try {
    log(`createMainWindow 调用，端口: ${port}`);
    
    // 如果还没加载依赖，现在安全加载
    if (!startServe) {
      log("加载 app 模块依赖...");
      const appModule = require("src/app");
      startServe = appModule.default;
      closeServe = appModule.closeServe;
    }

    const win = new BrowserWindow({
      width: 900,
      height: 600,
      show: false, // 默认隐藏，ready-to-show 或者报错时再强制展示
      autoHideMenuBar: true,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
      },
    });

    const isDev = process.env.NODE_ENV === "dev" || !app.isPackaged;
    const htmlPath = isDev
      ? path.join(process.cwd(), "scripts", "web", "index.html")
      : path.join(app.getAppPath(), "scripts", "web", "index.html");

    log(`htmlPath: ${htmlPath} (Exists: ${fs.existsSync(htmlPath)})`);

    const baseUrl = `http://localhost:${port}`;
    const wsBaseUrl = `ws://localhost:${port}`;
    const url = pathToFileURL(htmlPath);
    url.searchParams.set("baseUrl", baseUrl);
    url.searchParams.set("wsBaseUrl", wsBaseUrl);

    log(`准备加载 URL: ${url.toString()}`);

    win.on("ready-to-show", () => {
      log("窗口 ready-to-show，显示窗口");
      win.show();
    });

    win.webContents.on("did-fail-load", (e, code, desc, loadUrl) => {
      log(`页面加载失败: code=${code} desc=${desc} url=${loadUrl}`);
      loadFallbackUI(win, `Code: ${code}\nDescription: ${desc}\nURL: ${loadUrl}`);
    });

    win.webContents.on("did-finish-load", () => {
      log("页面加载成功");
    });

    void win.loadURL(url.toString()).catch((err: any) => {
      const errMsg = err instanceof Error ? err.stack : String(err);
      log(`loadURL 异常: ${errMsg}`);
      loadFallbackUI(win, `win.loadURL 失败:\n${errMsg}`);
    });
  } catch (fatals) {
    const errObj = fatals instanceof Error ? fatals.stack : String(fatals);
    dialog.showErrorBox("创建窗口失败", errObj || "未知错误");
  }
}

app.whenReady().then(async () => {
  initLog();
  log(`app.whenReady 触发 (Packaged: ${app.isPackaged}, ENV: ${process.env.NODE_ENV})`);

  try {
    // 动态引入后端服务模块
    if (!startServe) {
      log("加载 app 模块依赖...");
      const appModule = require("src/app");
      startServe = appModule.default;
      closeServe = appModule.closeServe;
    }

    log("尝试启动后端服务（端口 60000）...");
    const port = await startServe(false);
    log(`后端服务启动成功，监听端口: ${port}`);
    createMainWindow(port ?? defaultPort);
  } catch (err) {
    const errMsg = err instanceof Error ? err.stack || err.message : String(err);
    log(`端口 60000 启动失败:\n${errMsg}`);
    try {
      log("尝试随机端口重试...");
      const port = await startServe(true);
      log(`随机端口启动成功: ${port}`);
      createMainWindow(port ?? defaultPort);
    } catch (err2) {
      const errMsg2 = err2 instanceof Error ? err2.stack || err2.message : String(err2);
      log(`随机端口重试依然失败:\n${errMsg2}`);
      showError("后端服务完全启动失败", `初次启动与随机端口均失败。\n\n${errMsg}\n...\n${errMsg2}`);
      // 即使服务崩溃，依然强行创建窗口以保证可见性（窗口内可能会显示 did-fail-load）
      createMainWindow(defaultPort);
    }
  }
}).catch(err => {
  const msg = err instanceof Error ? err.stack : String(err);
  dialog.showErrorBox("app.whenReady 内发生绝望崩溃", msg || "未知错误");
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createMainWindow(defaultPort);
  }
});

app.on("before-quit", async (event) => {
  log("app before-quit");
  if (closeServe) {
    try { await closeServe(); } catch(e){}
  }
});
