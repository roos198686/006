$cfg = "d:\baobao_game\server\configs_win.js"
$node = "C:\Program Files\nodejs\node.exe"

# kill old
Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Milliseconds 800

# start all 3, capture stdout+err to files
$outDir = "d:\baobao_game\server\logs"
Start-Process -FilePath $node -ArgumentList "d:\baobao_game\server\account_server\app.js",$cfg -RedirectStandardOutput "$outDir\acc.log" -RedirectStandardError "$outDir\acc_err.log" -WindowStyle Hidden
Start-Process -FilePath $node -ArgumentList "d:\baobao_game\server\hall_server\app.js",$cfg -RedirectStandardOutput "$outDir\hall.log" -RedirectStandardError "$outDir\hall_err.log" -WindowStyle Hidden
Start-Process -FilePath $node -ArgumentList "d:\baobao_game\server\game_server\app.js",$cfg -RedirectStandardOutput "$outDir\game.log" -RedirectStandardError "$outDir\game_err.log" -WindowStyle Hidden

Start-Sleep -Seconds 5

Write-Host "=== 1. PORT LISTEN ==="
netstat -ano | findstr "LISTENING" | findstr ":9100 :9101 :9102 :10100"

Write-Host "=== 2. HTTP REAL API TEST ==="
try {
    $r = Invoke-WebRequest -Uri "http://127.0.0.1:9101/club_admin/partners?club_id=552407&account=guest_1793924100468&sign=1" -UseBasicParsing -TimeoutSec 5
    Write-Host "9101 club_admin: OK, len=$($r.Content.Length)"
} catch { Write-Host "9101 club_admin FAIL: $($_.Exception.Message)" }

try {
    $r = Invoke-WebRequest -Uri "http://127.0.0.1:9100/admin/index.html" -UseBasicParsing -TimeoutSec 5
    Write-Host "9100 admin: OK, len=$($r.Content.Length)"
} catch { Write-Host "9100 admin FAIL: $($_.Exception.Message)" }

try {
    $r = Invoke-WebRequest -Uri "http://127.0.0.1:10100/" -UseBasicParsing -TimeoutSec 5
    Write-Host "10100 game: OK, status=$($r.StatusCode)"
} catch { Write-Host "10100 game FAIL: $($_.Exception.Message)" }

Write-Host "=== 3. SERVER LOG TAIL ==="
Write-Host "--- hall.log ---"; Get-Content "$outDir\hall.log" -Tail 5
Write-Host "--- acc.log ---"; Get-Content "$outDir\acc.log" -Tail 5
Write-Host "--- game.log ---"; Get-Content "$outDir\game.log" -Tail 5
Write-Host "--- hall_err.log ---"; Get-Content "$outDir\hall_err.log" -Tail 5
Write-Host "--- acc_err.log ---"; Get-Content "$outDir\acc_err.log" -Tail 5
Write-Host "--- game_err.log ---"; Get-Content "$outDir\game_err.log" -Tail 5
