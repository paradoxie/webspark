#!/bin/bash

# WebSpark Database Index Optimization Script
# 应用性能优化索引到数据库
# 使用方法: ./scripts/apply-indexes.sh

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

echo "🔧 Applying performance optimization indexes..."
echo "📊 Database: $DB_NAME"
echo ""

# 检查是否要应用索引
read -p "Do you want to apply the performance indexes? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
  echo "❌ Index application cancelled"
  exit 0
fi

# 应用索引
echo "⏳ Applying indexes..."

mysql \
  --host="$DB_HOST" \
  --port="$DB_PORT" \
  --user="$DB_USER" \
  --password="$DB_PASS" \
  --database="$DB_NAME" \
  < ./prisma/migrations/20240114000000_add_performance_indexes/migration.sql

echo "✅ Indexes applied successfully!"
echo ""
echo "📊 To verify indexes, you can run:"
echo "  mysql -u$DB_USER -p$DB_PASS -e \"SHOW INDEX FROM $DB_NAME.websites;\""
echo ""
echo "💡 Performance improvements:"
echo "  - Faster homepage loading"
echo "  - Quicker search results"
echo "  - Improved admin panel response"
echo "  - Better analytics query performance"
