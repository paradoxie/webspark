#!/bin/bash

# WebSpark.club 项目启动脚本
# 用于同时启动前端和后端服务

echo "🚀 启动 WebSpark.club 项目..."

# 检查 Docker 是否运行
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker 未运行，请先启动 Docker"
    exit 1
fi

# 检查 Node.js 是否安装
if ! command -v node &> /dev/null; then
    echo "❌ Node.js 未安装，请先安装 Node.js"
    exit 1
fi

# 检查 npm 是否安装
if ! command -v npm &> /dev/null; then
    echo "❌ npm 未安装，请先安装 npm"
    exit 1
fi

echo "✅ 环境检查通过"

# 启动后端 (Strapi + PostgreSQL)
echo "📦 启动后端服务..."
cd backend
if [ ! -f ".env" ]; then
    echo "⚠️  未找到后端环境配置文件，从模板复制..."
    cp .env.example .env
    echo "📝 请编辑 backend/.env 文件配置数据库和其他环境变量"
fi

# 使用 Docker Compose 启动后端
docker-compose up -d
echo "✅ 后端服务启动完成"

cd ..

# 安装前端依赖（如果需要）
echo "📦 检查前端依赖..."
cd frontend
if [ ! -d "node_modules" ]; then
    echo "📥 安装前端依赖..."
    npm install
fi

# 检查前端环境配置
if [ ! -f ".env.local" ]; then
    echo "⚠️  未找到前端环境配置文件，从模板复制..."
    cp .env.example .env.local
    echo "📝 请编辑 frontend/.env.local 文件配置API地址和认证密钥"
fi

# 启动前端开发服务器
echo "🌐 启动前端服务..."
npm run dev &
FRONTEND_PID=$!

cd ..

echo ""
echo "🎉 项目启动完成！"
echo ""
echo "📍 服务地址："
echo "   前端: http://localhost:3000"
echo "   后端API: http://localhost:1337"
echo "   后端管理: http://localhost:1337/admin"
echo ""
echo "📋 管理命令："
echo "   停止所有服务: ./stop-project.sh"
echo "   查看日志: ./logs.sh"
echo "   重启服务: ./restart-project.sh"
echo ""
echo "💡 首次使用请："
echo "   1. 访问 http://localhost:1337/admin 创建管理员账户"
echo "   2. 配置 GitHub OAuth 应用"
echo "   3. 导入示例数据（可选）"
echo ""

# 等待用户中断
echo "按 Ctrl+C 停止前端服务..."
wait $FRONTEND_PID 