# ====================================================
#  Robou / ToonFlow Windows 启动问题诊断脚本
#  使用方式：在 PowerShell 中运行
#    Set-ExecutionPolicy -Scope Process Bypass
#    .\diagnose-win.ps1
# ====================================================

$appName  = "Robou"          # 改成你的 productName
$appPort  = 60000

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host " 正在诊断 $appName 启动问题..." -ForegroundColor Cyan
Write-Host "========================================`n"

# ── 1. 进程检查 ──────────────────────────────────────────────────────────────
Write-Host "[1] 进程检查" -ForegroundColor Yellow
$procs = Get-Process -Name $appName -ErrorAction SilentlyContinue
if ($procs) {
    Write-Host "  ✅ 找到进程:" -ForegroundColor Green
    $procs | ForEach-Object {
        Write-Host "     PID=$($_.Id)  内存=$([math]::Round($_.WorkingSet64/1MB,1))MB  路径=$($_.Path)"
    }
} else {
    Write-Host "  ❌ 未找到 $appName 进程" -ForegroundColor Red
}

# 顺便检查 electron 进程
$electronProcs = Get-Process -Name "electron" -ErrorAction SilentlyContinue
if ($electronProcs) {
    Write-Host "  ℹ  还找到 electron 进程 (开发模式?):"
    $electronProcs | ForEach-Object { Write-Host "     PID=$($_.Id)  路径=$($_.Path)" }
}

# ── 2. 端口检查 ──────────────────────────────────────────────────────────────
Write-Host "`n[2] 端口 $appPort 检查" -ForegroundColor Yellow
$portCheck = netstat -ano | Select-String ":$appPort "
if ($portCheck) {
    Write-Host "  ✅ 端口 $appPort 正在监听：" -ForegroundColor Green
    $portCheck | ForEach-Object { Write-Host "     $_" }
    
    # 找出占用该端口的进程
    $portLines = netstat -ano | Select-String ":$appPort\s" | Select-String "LISTENING"
    if ($portLines) {
        $pid_ = ($portLines[0] -split "\s+")[-1]
        try {
            $portProc = Get-Process -Id $pid_ -ErrorAction Stop
            if ($portProc.ProcessName -match $appName -or $portProc.ProcessName -match "electron") {
                Write-Host "  ✅ 端口由 $appName 进程持有 (PID: $pid_)" -ForegroundColor Green
            } else {
                Write-Host "  ⚠️  端口被其他进程占用: $($portProc.ProcessName) (PID: $pid_)" -ForegroundColor Red
                Write-Host "     这会导致应用内部服务无法启动！" -ForegroundColor Red
            }
        } catch {
            Write-Host "  ⚠️  无法获取占用端口的进程信息 (PID: $pid_)" -ForegroundColor Red
        }
    }
} else {
    Write-Host "  ❌ 端口 $appPort 未被监听" -ForegroundColor Red
    Write-Host "     说明后端服务未能启动，这是出现「有进程无窗口」的典型原因！" -ForegroundColor Red
}

# ── 3. 日志文件检查 ───────────────────────────────────────────────────────────
Write-Host "`n[3] 启动日志检查" -ForegroundColor Yellow
$userDataPath = "$env:APPDATA\$appName"
$logsPath = "$userDataPath\logs"
Write-Host "  userData 路径: $userDataPath"

if (Test-Path $logsPath) {
    $logFiles = Get-ChildItem "$logsPath\startup-*.log" | Sort-Object LastWriteTime -Descending
    if ($logFiles) {
        $latest = $logFiles[0]
        Write-Host "  ✅ 找到最新日志: $($latest.FullName)" -ForegroundColor Green
        Write-Host "`n  --- 日志内容 ---" -ForegroundColor Cyan
        Get-Content $latest.FullName | ForEach-Object {
            if ($_ -match "ERROR|失败|异常|exception|error") {
                Write-Host "  $_" -ForegroundColor Red
            } elseif ($_ -match "成功|ready|finish") {
                Write-Host "  $_" -ForegroundColor Green
            } else {
                Write-Host "  $_"
            }
        }
        Write-Host "  --- 日志结束 ---" -ForegroundColor Cyan
    } else {
        Write-Host "  ❌ logs 目录存在但没有 startup-*.log 文件" -ForegroundColor Red
        Write-Host "     说明 app.whenReady() 未触发，或 initLog() 写入失败" -ForegroundColor Red
    }
} else {
    Write-Host "  ❌ 日志目录不存在: $logsPath" -ForegroundColor Red
    Write-Host "     说明 Electron 主进程很早就崩溃了（连 app.getPath() 都未执行）" -ForegroundColor Red
}

# ── 4. 环境变量文件检查 ───────────────────────────────────────────────────────
Write-Host "`n[4] 环境变量文件检查" -ForegroundColor Yellow
$envFile = "$userDataPath\env\.env.prod"
if (Test-Path $envFile) {
    Write-Host "  ✅ 找到环境变量文件: $envFile" -ForegroundColor Green
    Write-Host "  内容:"
    Get-Content $envFile | ForEach-Object { Write-Host "    $_" }
} else {
    Write-Host "  ⚠️  未找到环境变量文件: $envFile" -ForegroundColor Yellow
    Write-Host "     （首次运行会自动创建，属于正常情况）"
}

# ── 5. 数据库文件检查 ─────────────────────────────────────────────────────────
Write-Host "`n[5] 数据库文件检查" -ForegroundColor Yellow
$dbFiles = @(
    "$userDataPath\db.sqlite",
    "$userDataPath\data\db.sqlite"
)
$found = $false
foreach ($f in $dbFiles) {
    if (Test-Path $f) {
        $size = [math]::Round((Get-Item $f).Length / 1KB, 1)
        Write-Host "  ✅ 找到数据库: $f ($size KB)" -ForegroundColor Green
        $found = $true
    }
}
if (-not $found) {
    Write-Host "  ⚠️  未找到数据库文件（首次使用属正常，运行后会自动创建）" -ForegroundColor Yellow
}

# ── 6. 安装路径检查 ───────────────────────────────────────────────────────────
Write-Host "`n[6] 安装路径检查" -ForegroundColor Yellow
$installPaths = @(
    "$env:ProgramFiles\$appName",
    "$env:LOCALAPPDATA\Programs\$appName",
    "$env:LOCALAPPDATA\$appName"
)
foreach ($p in $installPaths) {
    if (Test-Path $p) {
        Write-Host "  ✅ 安装目录: $p" -ForegroundColor Green
        $exePath = "$p\$appName.exe"
        if (Test-Path $exePath) {
            Write-Host "     可执行文件: $exePath ($([math]::Round((Get-Item $exePath).Length/1MB,1)) MB)"
        }
    }
}

# ── 7. Windows 事件日志检查（应用程序崩溃） ──────────────────────────────────
Write-Host "`n[7] Windows 事件日志（最近 5 条应用崩溃）" -ForegroundColor Yellow
try {
    $events = Get-EventLog -LogName Application -EntryType Error -Newest 20 -ErrorAction Stop |
        Where-Object { $_.Source -match "Application Error" -or $_.Message -match $appName -or $_.Message -match "electron" }
    if ($events) {
        $events | Select-Object -First 5 | ForEach-Object {
            Write-Host "  ❌ [$($_.TimeGenerated)] $($_.Source): $($_.Message.Substring(0, [Math]::Min(200, $_.Message.Length)))" -ForegroundColor Red
        }
    } else {
        Write-Host "  ✅ 未发现相关崩溃记录" -ForegroundColor Green
    }
} catch {
    Write-Host "  ⚠️  无法读取事件日志（可能需要管理员权限）" -ForegroundColor Yellow
}

# ── 汇总 ─────────────────────────────────────────────────────────────────────
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host " 诊断建议：" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

Write-Host @"

  如果 [3] 有日志 → 看日志里的 ERROR 行，定位具体原因
  如果 [3] 无日志 → Electron 主进程极早崩溃，可能是：
      - 缺少 VC++ 运行库：安装 Visual C++ Redistributable
      - 系统安全软件拦截
  如果 [2] 端口被其他程序占用 → 关掉占用程序或修改 PORT 配置
  如果 [6] 未找到安装目录 → 安装包是否以管理员身份运行安装？

  💡 快速验证：使用便携版 Robou-1.0.7-win-x64.exe 直接双击运行，
     如果便携版正常、安装版不正常，则是安装权限问题。

"@ -ForegroundColor White

Write-Host "  完整日志目录: $logsPath" -ForegroundColor Green
Write-Host ""
