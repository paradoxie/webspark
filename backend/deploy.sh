#!/bin/bash

set -e

echo "🚀 WebSpark Backend - 宝塔一键部署脚本"
echo "========================================"
echo ""

BACKEND_DIR=$(pwd)

check_command() {
    if ! command -v $1 &> /dev/null; then
        echo "❌ 错误: 未找到 $1 命令"
        echo "请先安装 $1"
        exit 1
    fi
}

echo "📋 步骤 1: 检查环境"
check_command node
check_command npm
check_command mysql

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js 版本过低 (当前: v$NODE_VERSION)"
    echo "请升级到 Node.js 18 或更高版本"
    exit 1
fi
echo "✅ Node.js 版本: $(node -v)"

if [ ! -f ".env" ]; then
    echo "❌ 错误: 找不到 .env 文件"
    echo "请先创建 .env 文件 (参考 .env.example)"
    exit 1
fi
echo "✅ 环境变量文件存在"

source .env
REQUIRED_VARS=("DATABASE_URL" "NEXTAUTH_SECRET" "R2_ACCOUNT_ID" "R2_ACCESS_KEY_ID" "R2_SECRET_ACCESS_KEY" "R2_BUCKET_NAME" "R2_PUBLIC_URL")
for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var}" ]; then
        echo "❌ 错误: 环境变量 $var 未设置"
        exit 1
    fi
done
echo "✅ 必需环境变量已配置"

echo ""
echo "📦 步骤 2: 安装依赖"
npm install
echo "✅ 依赖安装完成"

echo ""
echo "🗄️  步骤 3: 数据库设置"

echo "生成 Prisma 客户端..."
npm run db:generate

echo "运行数据库迁移..."
npm run db:deploy

if [ "$1" = "--seed" ]; then
    echo "填充种子数据..."
    npm run db:seed
fi
echo "✅ 数据库设置完成"

echo ""
echo "🏗️  步骤 4: 构建项目"
npm run build
echo "✅ 项目构建完成"

echo ""
echo "🔍 步骤 5: 验证构建产物"
if [ ! -f "dist/index.js" ]; then
    echo "❌ 错误: 构建失败，找不到 dist/index.js"
    exit 1
fi
echo "✅ 构建产物验证通过"

echo ""
echo "📂 步骤 6: 创建日志目录"
mkdir -p logs
echo "✅ 日志目录已创建"

echo ""
echo "🚀 步骤 7: 启动服务"
if command -v pm2 &> /dev/null; then
    echo "使用 PM2 管理进程..."

    if pm2 describe webspark-backend > /dev/null 2>&1; then
        echo "重启现有进程..."
        pm2 restart webspark-backend
    else
        echo "启动新进程..."
        pm2 start ecosystem.config.js
    fi

    pm2 save
    echo "✅ PM2 服务已启动"

    echo ""
    echo "📊 进程状态:"
    pm2 status webspark-backend
else
    echo "⚠️  PM2 未安装，请手动启动:"
    echo "   npm start"
fi

echo ""
echo "✅ 部署完成！"
echo ""
echo "📍 服务信息:"
echo "   端口: ${PORT:-3001}"
echo "   环境: ${NODE_ENV:-production}"
echo ""
echo "🔍 健康检查:"
echo "   curl http://localhost:${PORT:-3001}/health"
echo ""
echo "📝 常用命令:"
echo "   查看日志: pm2 logs webspark-backend"
echo "   重启服务: pm2 restart webspark-backend"
echo "   停止服务: pm2 stop webspark-backend"
echo ""
