#!/bin/bash

echo "📊 WebSpark 性能监控报告"
echo "=========================="
echo "时间: $(date '+%Y-%m-%d %H:%M:%S')"
echo ""

echo "🖥️  系统资源使用情况"
echo "-------------------"

echo "CPU 使用率:"
top -bn1 | grep "Cpu(s)" | sed "s/.*, *\([0-9.]*\)%* id.*/\1/" | awk '{print "  使用: " 100 - $1 "%"}'

echo ""
echo "内存使用:"
free -h | awk 'NR==2{printf "  总计: %s\n  使用: %s (%.2f%%)\n  可用: %s\n", $2, $3, $3*100/$2, $7}'

echo ""
echo "磁盘使用:"
df -h / | awk 'NR==2{printf "  总计: %s\n  使用: %s (%s)\n  可用: %s\n", $2, $3, $5, $4}'

echo ""
echo "🔄 PM2 进程状态"
echo "-------------------"
pm2 jlist | python3 -c "
import json, sys
data = json.load(sys.stdin)
for app in data:
    if app['name'] == 'webspark-backend':
        print(f\"  进程名: {app['name']}\")
        print(f\"  状态: {app['pm2_env']['status']}\")
        print(f\"  运行时间: {app['pm2_env'].get('pm_uptime', 'N/A')}\")
        print(f\"  重启次数: {app['pm2_env']['restart_time']}\")
        print(f\"  内存使用: {app['monit']['memory'] / 1024 / 1024:.2f} MB\")
        print(f\"  CPU 使用: {app['monit']['cpu']}%\")
" 2>/dev/null || pm2 status

echo ""
echo "🗄️  MySQL 数据库状态"
echo "-------------------"

if command -v mysql &> /dev/null; then
    if [ ! -z "$1" ]; then
        DB_PASSWORD="$1"
        mysql -u webspark -p"$DB_PASSWORD" -e "
            SELECT
                CONCAT(ROUND(SUM(data_length + index_length) / 1024 / 1024, 2), ' MB') AS '数据库大小',
                COUNT(*) AS '表数量'
            FROM information_schema.tables
            WHERE table_schema = 'webspark';
        " 2>/dev/null

        echo ""
        echo "连接统计:"
        mysql -u webspark -p"$DB_PASSWORD" -e "
            SHOW STATUS LIKE 'Threads_connected';
            SHOW STATUS LIKE 'Max_used_connections';
        " 2>/dev/null | awk 'NR>1{print "  " $1 ": " $2}'
    else
        echo "  ⚠️  未提供数据库密码，跳过数据库检查"
        echo "  用法: ./monitor.sh <数据库密码>"
    fi
else
    echo "  ⚠️  MySQL 未安装或不在 PATH 中"
fi

echo ""
echo "📡 Redis 缓存状态"
echo "-------------------"

if command -v redis-cli &> /dev/null; then
    if redis-cli ping &> /dev/null; then
        echo "  状态: ✅ 运行中"
        redis-cli info stats | grep -E "total_connections_received|total_commands_processed|keyspace_hits|keyspace_misses" | while read line; do
            echo "  $line"
        done

        echo ""
        echo "  内存使用:"
        redis-cli info memory | grep "used_memory_human" | awk -F: '{print "    " $2}'

        echo ""
        echo "  缓存命中率:"
        redis-cli info stats | awk -F: '
            /keyspace_hits/ {hits=$2}
            /keyspace_misses/ {misses=$2}
            END {
                if (hits + misses > 0) {
                    printf "    %.2f%%\n", hits * 100 / (hits + misses)
                } else {
                    print "    N/A"
                }
            }'
    else
        echo "  状态: ❌ 未运行"
    fi
else
    echo "  ⚠️  Redis 未安装"
fi

echo ""
echo "🌐 网络连接"
echo "-------------------"
echo "端口 3001 连接数:"
netstat -an | grep ":3001" | wc -l | awk '{print "  " $1 " 个连接"}'

echo ""
echo "⚠️  告警检查"
echo "-------------------"

CPU_USAGE=$(top -bn1 | grep "Cpu(s)" | sed "s/.*, *\([0-9.]*\)%* id.*/\1/" | awk '{print 100 - $1}')
MEM_USAGE=$(free | grep Mem | awk '{print $3/$2 * 100.0}')

if (( $(echo "$CPU_USAGE > 80" | bc -l) )); then
    echo "  🚨 CPU 使用率过高: ${CPU_USAGE}%"
fi

if (( $(echo "$MEM_USAGE > 85" | bc -l) )); then
    echo "  🚨 内存使用率过高: ${MEM_USAGE}%"
fi

DISK_USAGE=$(df / | awk 'NR==2{print $5}' | sed 's/%//')
if [ "$DISK_USAGE" -gt 80 ]; then
    echo "  🚨 磁盘使用率过高: ${DISK_USAGE}%"
fi

echo ""
echo "✅ 监控完成"
echo ""
echo "💡 提示:"
echo "   - 设置定时任务: crontab -e"
echo "   - 添加: */10 * * * * /path/to/monitor.sh <db_password> >> /var/log/webspark-monitor.log"
echo "   - 实时监控: watch -n 5 ./monitor.sh <db_password>"
