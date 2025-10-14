#!/bin/bash

# WebSpark Database Restore Script
# 数据库恢复脚本 - 用于紧急情况下的数据恢复
# 使用方法: ./scripts/restore-database.sh backup_file.sql.gz

set -e

# 检查参数
if [ $# -eq 0 ]; then
  echo "❌ Error: Please provide backup file path"
  echo "Usage: $0 <backup_file.sql.gz>"
  echo "Example: $0 ./backups/webspark_backup_20240114_120000.sql.gz"
  exit 1
fi

BACKUP_FILE="$1"

# 检查文件是否存在
if [ ! -f "$BACKUP_FILE" ]; then
  echo "❌ Error: Backup file not found: $BACKUP_FILE"
  exit 1
fi

# 从环境变量或 .env 文件读取配置
if [ -f .env ]; then
  export $(cat .env | grep -v '^#' | xargs)
fi

# 配置变量
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-3306}"
DB_NAME="${DB_NAME:-webspark}"
DB_USER="${DB_USER:-root}"
DB_PASS="${DB_PASSWORD}"

echo "⚠️  WARNING: This will restore the database from backup!"
echo "📊 Database: $DB_NAME"
echo "📁 Backup file: $BACKUP_FILE"
echo ""
read -p "Are you sure you want to continue? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
  echo "❌ Restore cancelled"
  exit 0
fi

# 创建临时目录
TEMP_DIR=$(mktemp -d)
TEMP_SQL="$TEMP_DIR/restore.sql"

echo "🔄 Starting database restore..."

# 解压备份文件
echo "📦 Extracting backup..."
gunzip -c "$BACKUP_FILE" > "$TEMP_SQL"

# 执行恢复
echo "⏳ Restoring database..."
mysql \
  --host="$DB_HOST" \
  --port="$DB_PORT" \
  --user="$DB_USER" \
  --password="$DB_PASS" \
  < "$TEMP_SQL"

# 清理临时文件
rm -rf "$TEMP_DIR"

echo "✅ Database restored successfully!"
echo ""
echo "📝 Post-restore checklist:"
echo "  1. Clear Redis cache: redis-cli FLUSHDB"
echo "  2. Restart the application: pm2 restart webspark"
echo "  3. Test critical functions"
echo "  4. Check for any data inconsistencies"
