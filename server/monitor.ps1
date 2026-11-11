$NODE = "C:\Program Files\nodejs\node.exe"
$CFG = "d:\baobao_game\server\configs_win.js"

# 1. 先清场
Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 2

# 2. 启动三个, 记录 PID
$p1 = Start-Process -FilePath $NODE -ArgumentList "d:\baobao_game\server\account_server\app.js",$CFG -PassThru -WindowStyle Minimized
Start-Sleep -Milliseconds 500
$p2 = Start-Process -FilePath $NODE -ArgumentList "d:\baobao_game\server\hall_server\app.js",$CFG -PassThru -WindowStyle Minimized
Start-Sleep -Milliseconds 500
$p3 = Start-Process -FilePath $NODE -ArgumentList "d:\baobao_game\server\game_server\app.js",$CFG -PassThru -WindowStyle Minimized

Write-Host "Started PIDs: acc=$($p1.Id) hall=$($p2.Id) game=$($p3.Id)"

# 3. 持续监控 60 秒
Write-Host "=== Monitoring 60s ==="
for ($i = 0; $i -lt 60; $i++) {
    $alive1 = Get-Process -Id $p1.Id -ErrorAction SilentlyContinue
    $alive2 = Get-Process -Id $p2.Id -ErrorAction SilentlyContinue
    $alive3 = Get-Process -Id $p3.Id -ErrorAction SilentlyContinue
    $ports = netstat -ano | findstr "LISTENING" | findstr ":9100 :9101 :10100"
    
    $line = "t=$($i)s  acc=$(if($alive1){'LIVE'}else{'DEAD!'}) hall=$(if($alive2){'LIVE'}else{'DEAD!'}) game=$(if($alive3){'LIVE'}else{'DEAD!'})"
    if ($ports) { $line += "  [ports OK]" } else { $line += "  [ports MISSING]" }
    Write-Host $line

    if (-not $alive1 -or -not $alive2 -or -not $alive3) {
        Write-Host ""
        Write-Host "!!! PROCESS DIED at t=$($i)s !!!"
        Write-Host "crash.log tail:"
        Get-Content "d:\baobao_game\server\logs\crash.log" -Tail 20
        Write-Host ""
        Write-Host "event log (last 10 Application errors):"
        Get-WinEvent -FilterHashtable @{LogName='Application'; StartTime=(Get-Date).AddMinutes(-5)} -ErrorAction SilentlyContinue | Where-Object {$_.LevelDisplayName -eq 'Error'} | Select-Object -First 5 TimeCreated, Message
        break
    }
    Start-Sleep -Seconds 1
}

Write-Host "=== Done ==="
