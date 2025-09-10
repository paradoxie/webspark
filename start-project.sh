#!/bin/bash

echo "🚀 启动 WebSpark 项目 (Node.js + MySQL)"

# 检查MySQL是否运行
if ! command -v mysql &> /dev/null; then
    echo "⚠️  MySQL未安装或未在PATH中"
    echo "💡 请确保MySQL已安装并运行"
fi

# 进入后端目录
echo "📦 准备后端..."
cd backend

# 检查环境变量文件
if [ ! -f .env ]; then
    echo "❌ backend/.env 文件不存在"
    echo "📝 请创建 .env 文件，参考 .env.example"
    exit 1
fi

# 安装后端依赖
echo "📦 安装后端依赖..."
npm install

# 生成Prisma客户端
echo "🗄️  生成 Prisma 客户端..."
if ! npm run db:generate; then
    echo "❌ Prisma客户端生成失败"
    exit 1
fi

# 运行数据库迁移
echo "🗄️  运行数据库迁移..."
if ! npm run db:deploy; then
    echo "❌ 数据库迁移失败，请检查数据库连接"
    exit 1
fi

# 种子数据
echo "🌱 填充种子数据..."
npm run db:seed

# 构建后端
echo "🏗️  构建后端..."
npm run build

# 启动后端 (后台运行)
echo "🚀 启动后端服务..."
npm run dev &
BACKEND_PID=$!

# 等待后端启动
sleep 5

# 检查后端健康
echo "🏥 检查后端健康状态..."
if curl -f http://localhost:3001/health > /dev/null 2>&1; then
    echo "✅ 后端服务启动成功"
else
    echo "❌ 后端服务启动失败"
    kill $BACKEND_PID 2>/dev/null
    exit 1
fi

# 启动前端
echo "🎨 启动前端服务..."
cd ../frontend

# 检查前端环境变量
if [ ! -f .env.local ]; then
    echo "⚠️  frontend/.env.local 文件不存在"
    echo "📝 请创建 .env.local 文件配置 NextAuth"
fi

# 安装前端依赖
echo "📦 安装前端依赖..."
npm install

# 启动前端
npm run dev &
FRONTEND_PID=$!

echo ""
echo "🎉 项目启动完成！"
echo ""
echo "📊 服务状态:"
echo "   🔧 后端API: http://localhost:3001"
echo "   🎨 前端应用: http://localhost:3000"
echo "   🏥 健康检查: http://localhost:3001/health"
echo ""
echo "🔍 测试链接:"
echo "   📋 标签列表: http://localhost:3001/api/tags"
echo "   🌐 网站列表: http://localhost:3001/api/websites/sorted-list"
echo ""
echo "⚠️  注意事项:"
echo "   1. 确保MySQL服务正在运行"
echo "   2. 检查.env文件配置是否正确"
echo "   3. 如需停止服务，运行: ./stop-project.sh"
echo ""

# 保存PID到文件以便停止
echo $BACKEND_PID > .backend_pid
echo $FRONTEND_PID > .frontend_pid

echo "按 Ctrl+C 停止监控，或运行 ./stop-project.sh 停止所有服务"

# 监控进程
while true; do
    if ! kill -0 $BACKEND_PID 2>/dev/null; then
        echo "❌ 后端进程意外退出"
        break
    fi
    if ! kill -0 $FRONTEND_PID 2>/dev/null; then
        echo "❌ 前端进程意外退出"
        break
    fi
    sleep 5
done 