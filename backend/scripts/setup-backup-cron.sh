#!/bin/bash

# WebSpark Backup Cron Setup Script
# 设置每日自动备份的 crontab 任务
# 使用方法: ./scripts/setup-backup-cron.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKUP_SCRIPT="$SCRIPT_DIR/backup-database.sh"

# 检查备份脚本是否存在
if [ ! -f "$BACKUP_SCRIPT" ]; then
  echo "❌ Error: Backup script not found at $BACKUP_SCRIPT"
  exit 1
fi

# 使备份脚本可执行
chmod +x "$BACKUP_SCRIPT"

echo "🔧 Setting up automatic database backup..."
echo ""
echo "Choose backup schedule:"
echo "1) Daily at 2:00 AM"
echo "2) Daily at 11:00 PM"
echo "3) Every 6 hours"
echo "4) Custom schedule"
echo ""
read -p "Enter your choice (1-4): " CHOICE

case $CHOICE in
  1)
    CRON_SCHEDULE="0 2 * * *"
    SCHEDULE_DESC="Daily at 2:00 AM"
    ;;
  2)
    CRON_SCHEDULE="0 23 * * *"
    SCHEDULE_DESC="Daily at 11:00 PM"
    ;;
  3)
    CRON_SCHEDULE="0 */6 * * *"
    SCHEDULE_DESC="Every 6 hours"
    ;;
  4)
    echo "Enter custom cron schedule (e.g., '0 3 * * *' for 3:00 AM daily):"
    read CRON_SCHEDULE
    SCHEDULE_DESC="Custom: $CRON_SCHEDULE"
    ;;
  *)
    echo "❌ Invalid choice"
    exit 1
    ;;
esac

# 创建 cron 任务
CRON_JOB="$CRON_SCHEDULE cd $(dirname $BACKUP_SCRIPT) && $BACKUP_SCRIPT >> $SCRIPT_DIR/../backups/backup.log 2>&1"

# 检查是否已存在相同的 cron 任务
if crontab -l 2>/dev/null | grep -q "$BACKUP_SCRIPT"; then
  echo "⚠️  Warning: A backup cron job already exists:"
  crontab -l | grep "$BACKUP_SCRIPT"
  echo ""
  read -p "Do you want to replace it? (yes/no): " REPLACE
  if [ "$REPLACE" != "yes" ]; then
    echo "❌ Setup cancelled"
    exit 0
  fi
  # 删除旧的 cron 任务
  (crontab -l 2>/dev/null | grep -v "$BACKUP_SCRIPT") | crontab -
fi

# 添加新的 cron 任务
(crontab -l 2>/dev/null; echo "$CRON_JOB") | crontab -

echo "✅ Backup cron job set up successfully!"
echo "📅 Schedule: $SCHEDULE_DESC"
echo ""
echo "📝 To verify the cron job, run: crontab -l"
echo "📊 Backup logs will be saved to: $SCRIPT_DIR/../backups/backup.log"
echo ""
echo "💡 Tips:"
echo "  - Make sure the database credentials are configured in .env file"
echo "  - Test the backup script manually first: $BACKUP_SCRIPT"
echo "  - Monitor the backup.log file for any issues"
