@echo off
REM 启动全部 3 个服务 - 用绝对路径, 让它们持久活着
REM 双击即可运行

set NODE=C:\Program Files\nodejs\node.exe
set CFG=d:\baobao_game\server\configs_win.js

echo Starting account_server on 9100...
start "account_server" "%NODE%" "d:\baobao_game\server\account_server\app.js" "%CFG%"

echo Starting hall_server on 9101...
start "hall_server" "%NODE%" "d:\baobao_game\server\hall_server\app.js" "%CFG%"

echo Starting game_server on 10100...
start "game_server" "%NODE%" "d:\baobao_game\server\game_server\app.js" "%CFG%"

echo All started. Waiting 6s for verify...
timeout /t 6 /nobreak >nul

echo.
echo === VERIFY ===
netstat -ano | findstr "LISTENING" | findstr ":9100 :9101 :9102 :10100 :13581 :13582"
echo.
echo Done.
pause
