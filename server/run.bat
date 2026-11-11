@echo off
set "NODE=C:\Program Files\nodejs\node.exe"
set "CFG=d:\baobao_game\server\configs_win.js"
start "ACC_9100" "%NODE%" "d:\baobao_game\server\account_server\app.js" "%CFG%"
start "HALL_9101" "%NODE%" "d:\baobao_game\server\hall_server\app.js" "%CFG%"
start "GAME_10100" "%NODE%" "d:\baobao_game\server\game_server\app.js" "%CFG%"
echo started 3 processes
