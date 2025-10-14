#!/bin/bash

# WebSpark Database Backup Script
# 用于单人维护的轻量级数据库备份方案
# 使用方法: ./scripts/backup-database.sh
# 建议通过 crontab 设置每日自动执行

set -e

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

# 备份配置
BACKUP_DIR="${BACKUP_DIR:-./backups}"
BACKUP_RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-7}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="webspark_backup_${TIMESTAMP}.sql"
COMPRESSED_FILE="${BACKUP_FILE}.gz"

# 创建备份目录
mkdir -p "$BACKUP_DIR"

# 显示备份开始信息
echo "🔄 Starting database backup..."
echo "📊 Database: $DB_NAME"
echo "📁 Backup directory: $BACKUP_DIR"

# 执行备份
echo "⏳ Creating backup..."
mysqldump \
  --host="$DB_HOST" \
  --port="$DB_PORT" \
  --user="$DB_USER" \
  --password="$DB_PASS" \
  --single-transaction \
  --routines \
  --triggers \
  --add-drop-database \
  --databases "$DB_NAME" \
  > "$BACKUP_DIR/$BACKUP_FILE"

# 压缩备份文件
echo "🗜️ Compressing backup..."
gzip "$BACKUP_DIR/$BACKUP_FILE"

# 计算文件大小
FILESIZE=$(ls -lh "$BACKUP_DIR/$COMPRESSED_FILE" | awk '{print $5}')
echo "✅ Backup completed: $COMPRESSED_FILE (Size: $FILESIZE)"

# 清理旧备份
echo "🧹 Cleaning old backups (keeping last $BACKUP_RETENTION_DAYS days)..."
find "$BACKUP_DIR" -name "webspark_backup_*.sql.gz" -mtime +$BACKUP_RETENTION_DAYS -delete

# 列出当前所有备份
echo "📋 Current backups:"
ls -lh "$BACKUP_DIR"/webspark_backup_*.sql.gz 2>/dev/null || echo "  No backups found"

# 可选：上传到对象存储（需要配置）
if [ ! -z "$S3_BUCKET" ]; then
  echo "☁️ Uploading to S3..."
  aws s3 cp "$BACKUP_DIR/$COMPRESSED_FILE" "s3://$S3_BUCKET/database-backups/$COMPRESSED_FILE"
  echo "✅ Uploaded to S3"
fi

# 可选：发送成功通知（需要配置邮件服务）
if [ ! -z "$NOTIFICATION_EMAIL" ]; then
  echo "📧 Sending notification..."
  echo "Database backup completed successfully at $(date)" | mail -s "WebSpark Backup Success" "$NOTIFICATION_EMAIL"
fi

echo "🎉 Backup process completed successfully!"
