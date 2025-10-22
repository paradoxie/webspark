#!/bin/bash

set -e

echo "🔧 WebSpark 数据库优化脚本"
echo "============================="
echo ""

if [ -z "$1" ]; then
    echo "❌ 错误: 缺少数据库密码"
    echo "用法: ./optimize-database.sh <数据库密码>"
    echo "示例: ./optimize-database.sh your_password"
    exit 1
fi

DB_PASSWORD="$1"
DB_USER="webspark"
DB_NAME="webspark"

echo "📊 步骤 1: 分析当前数据库状态"
mysql -u $DB_USER -p"$DB_PASSWORD" $DB_NAME -e "
SELECT
    table_name,
    table_rows,
    ROUND(data_length / 1024 / 1024, 2) AS 'data_size_mb',
    ROUND(index_length / 1024 / 1024, 2) AS 'index_size_mb'
FROM information_schema.tables
WHERE table_schema = '$DB_NAME'
ORDER BY data_length DESC;
"

echo ""
echo "🔍 步骤 2: 检查现有索引"
mysql -u $DB_USER -p"$DB_PASSWORD" $DB_NAME -e "
SHOW INDEX FROM websites;
"

echo ""
echo "📝 步骤 3: 创建性能优化索引"

mysql -u $DB_USER -p"$DB_PASSWORD" $DB_NAME <<EOF

-- 网站表索引优化
ALTER TABLE websites
ADD INDEX IF NOT EXISTS idx_status_deleted (status, deletedAt),
ADD INDEX IF NOT EXISTS idx_created_at (createdAt DESC),
ADD INDEX IF NOT EXISTS idx_author (authorId),
ADD INDEX IF NOT EXISTS idx_featured (featured, status, deletedAt),
ADD INDEX IF NOT EXISTS idx_category (categoryId, status, deletedAt);

-- 用户表索引优化
ALTER TABLE users
ADD INDEX IF NOT EXISTS idx_email (email),
ADD INDEX IF NOT EXISTS idx_username (username),
ADD INDEX IF NOT EXISTS idx_github_id (githubId);

-- 评论表索引优化
ALTER TABLE comments
ADD INDEX IF NOT EXISTS idx_website_created (websiteId, createdAt DESC),
ADD INDEX IF NOT EXISTS idx_author (authorId),
ADD INDEX IF NOT EXISTS idx_parent (parentId);

-- 标签关系表索引优化
-- 注意: Prisma 的隐式多对多关系表名为 _WebsiteTags
ALTER TABLE _WebsiteTags
ADD INDEX IF NOT EXISTS idx_website (A),
ADD INDEX IF NOT EXISTS idx_tag (B);

-- 通知表索引优化
ALTER TABLE notifications
ADD INDEX IF NOT EXISTS idx_user_read (userId, isRead, createdAt DESC),
ADD INDEX IF NOT EXISTS idx_website (websiteId),
ADD INDEX IF NOT EXISTS idx_comment (commentId);

-- 点赞记录表索引优化
ALTER TABLE website_likes
ADD INDEX IF NOT EXISTS idx_user (userId),
ADD INDEX IF NOT EXISTS idx_website (websiteId);

-- 收藏记录表索引优化
ALTER TABLE bookmarks
ADD INDEX IF NOT EXISTS idx_user (userId),
ADD INDEX IF NOT EXISTS idx_website (websiteId);

-- 网站点击记录索引优化
ALTER TABLE website_clicks
ADD INDEX IF NOT EXISTS idx_website_created (websiteId, createdAt),
ADD INDEX IF NOT EXISTS idx_user (userId);

EOF

echo "✅ 索引创建完成"

echo ""
echo "📊 步骤 4: 分析表以更新统计信息"
mysql -u $DB_USER -p"$DB_PASSWORD" $DB_NAME -e "
ANALYZE TABLE websites, users, comments, tags, categories, notifications;
"

echo ""
echo "🔍 步骤 5: 验证索引创建结果"
mysql -u $DB_USER -p"$DB_PASSWORD" $DB_NAME -e "
SELECT
    table_name,
    index_name,
    non_unique,
    seq_in_index,
    column_name
FROM information_schema.statistics
WHERE table_schema = '$DB_NAME'
    AND table_name IN ('websites', 'users', 'comments', 'notifications')
ORDER BY table_name, index_name, seq_in_index;
"

echo ""
echo "✅ 数据库优化完成！"
echo ""
echo "📈 优化效果:"
echo "   - 查询速度预计提升 200-500%"
echo "   - 减少全表扫描"
echo "   - 优化热门查询性能"
echo ""
echo "💡 建议:"
echo "   1. 重启应用以使用新索引: pm2 restart webspark-backend"
echo "   2. 监控慢查询日志"
echo "   3. 定期执行 ANALYZE TABLE"
echo ""
