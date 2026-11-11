$cfg = "d:\baobao_game\server\configs_win.js"
$node = "C:\Program Files\nodejs\node.exe"
$out = "d:\baobao_game\server\logs\"

Start-Process -FilePath $node -ArgumentList "d:\baobao_game\server\hall_server\app.js",$cfg -RedirectStandardOutput ($out+"hall_out.log") -RedirectStandardError ($out+"hall_err.log")
Start-Process -FilePath $node -ArgumentList "d:\baobao_game\server\account_server\app.js",$cfg -RedirectStandardOutput ($out+"acc_out.log") -RedirectStandardError ($out+"acc_err.log")
Start-Process -FilePath $node -ArgumentList "d:\baobao_game\server\game_server\app.js",$cfg -RedirectStandardOutput ($out+"game_out.log") -RedirectStandardError ($out+"game_err.log")

Start-Sleep -Seconds 4
netstat -ano | findstr "LISTENING" | findstr ":9100 :9101 :9102 :10100"
