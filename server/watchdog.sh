#!/bin/bash
# 宝宝游戏看门狗: cron 每分钟调用一次
# 探测 账号服9100 / 大厅服9101 / 游戏服10100, 端口不通则杀掉残留进程并重启
# 重启用 >> 追加日志, 保留崩溃现场; 看门狗自身动作记 logs/watchdog.log
BASE=/www/wwwroot/baobao
LOGDIR=$BASE/logs
mkdir -p "$LOGDIR"

check_and_restart() {
    local name="$1" dir="$2" port="$3"
    # bash /dev/tcp 探测端口
    if (exec 3<>"/dev/tcp/127.0.0.1/$port") 2>/dev/null; then
        exec 3>&- 3<&-
        return 0
    fi
    echo "[$(date '+%F %T')] $name port $port DOWN, restarting..." >> "$LOGDIR/watchdog.log"
    # 杀掉 cwd 属于该服务目录的残留 node 进程
    local p cwd
    for p in $(pgrep -f "node app.js"); do
        cwd=$(ls -l /proc/$p/cwd 2>/dev/null | awk '{print $NF}')
        if [[ "$cwd" == *"$dir"* ]]; then
            kill "$p" 2>/dev/null
            echo "[$(date '+%F %T')] killed stale pid=$p ($cwd)" >> "$LOGDIR/watchdog.log"
        fi
    done
    sleep 1
    cd "$BASE/$dir" || return 1
    nohup /usr/bin/node app.js ../configs >> "$LOGDIR/${name}_stdout.log" 2>&1 &
    echo "[$(date '+%F %T')] $name restarted, new pid=$!" >> "$LOGDIR/watchdog.log"
}

check_and_restart account_server account_server 9100
check_and_restart hall_server    hall_server    9101
check_and_restart game_server    game_server    10100
