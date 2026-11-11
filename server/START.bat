@echo off
REM ===== 宝宝游戏 后端一键启动 =====
REM 双击即可, 3 个服务会各自开一个 cmd 窗口, 关闭窗口=停止服务
REM ====================================

set "NODE=C:\Program Files\nodejs\node.exe"
set "CFG=d:\baobao_game\server\configs_win.js"

echo ========================================
echo  宝宝游戏后端启动中...
echo ========================================

start "account_server_9100" "%NODE%" "d:\baobao_game\server\account_server\app.js" "%CFG%"
timeout /t 1 /nobreak >nul

start "hall_server_9101" "%NODE%" "d:\baobao_game\server\hall_server\app.js" "%CFG%"
timeout /t 1 /nobreak >nul

start "game_server_10100" "%NODE%" "d:\baobao_game\server\game_server\app.js" "%CFG%"

echo.
echo 等待 5 秒验证端口...
timeout /t 5 /nobreak >nul

echo.
echo ========== 端口监听检查 ==========
netstat -ano | findstr "LISTENING" | findstr ":9100 :9101 :9102 :10100 :13581 :13582"

echo.
echo ========== 启动完成 ==========
echo  account_server: 9100 (admin 13582)
echo  hall_server:    9101 / 9102
echo  game_server:    10100
echo.
echo  不要关闭这 3 个黑色 cmd 窗口, 关闭即停止服务
echo.
pause
