#!/bin/bash
# 宝宝游戏 一键重启脚本
# 部署到: /www/wwwroot/baobao/restart.sh
# 用法:
#   bash /www/wwwroot/baobao/restart.sh           # 重启 账号服 + 大厅服(改服务端代码后最常用)
#   bash /www/wwwroot/baobao/restart.sh account   # 只重启账号服
#   bash /www/wwwroot/baobao/restart.sh hall      # 只重启大厅服
#   bash /www/wwwroot/baobao/restart.sh game      # 只重启游戏服(会踢掉所有在局房间, 慎用)
#
# 说明: 三个服务都是用 "node app.js ../configs" 启动, 进程名里没有服务名,
#       所以必须按 /proc/<pid>/cwd 判断进程属于哪个服务目录, 不能按 pkill -f 名字杀。
BASE=/www/wwwroot/baobao
LOGDIR=$BASE/logs
mkdir -p "$LOGDIR"

restart_one() {
    local name="$1" dir="$2" port="$3" p cwd pid
    for p in $(pgrep -f "node app.js"); do
        cwd=$(readlink /proc/$p/cwd 2>/dev/null)
        if [[ "$cwd" == *"$dir"* ]]; then
            kill "$p" 2>/dev/null
            echo "  killed $name pid=$p"
        fi
    done
    sleep 1
    cd "$BASE/$dir" || return 1
    nohup /usr/bin/node app.js ../configs >> "$LOGDIR/${name}_stdout.log" 2>&1 &
    pid=$!
    sleep 2
    if (exec 3<>"/dev/tcp/127.0.0.1/$port") 2>/dev/null; then
        exec 3>&- 3<&-
        echo "$name OK   port $port   pid $pid"
    else
        echo "$name FAIL port $port   日志: $LOGDIR/${name}_stdout.log"
    fi
}

case "${1:-all}" in
    account) restart_one account_server account_server 9100 ;;
    hall)    restart_one hall_server    hall_server    9101 ;;
    game)    restart_one game_server    game_server    10100 ;;
    *)
        restart_one account_server account_server 9100
        restart_one hall_server    hall_server    9101
        ;;
esac
