#!/bin/bash

echo "🧪 WebSpark 项目启动测试"

# 检查环境
echo "📋 1. 检查环境..."

# 检查 Node.js 版本
if ! command -v node &> /dev/null; then
    echo "❌ Node.js 未安装"
    exit 1
fi
echo "✅ Node.js version: $(node --version)"

# 检查 MySQL
if ! command -v mysql &> /dev/null; then
    echo "❌ MySQL 未安装或未在PATH中"
    echo "💡 请确保MySQL已安装并运行"
fi

# 后端设置
echo "📦 2. 设置后端..."
cd backend

# 检查环境变量
if [ ! -f .env ]; then
    echo "❌ backend/.env 文件不存在"
    echo "📝 请创建 .env 文件，参考 .env.example"
    exit 1
fi
echo "✅ .env 文件存在"

# 安装依赖
echo "📦 安装后端依赖..."
npm install

# 生成 Prisma 客户端
echo "🗄️  生成 Prisma 客户端..."
npm run db:generate

# 尝试连接数据库
echo "🔗 测试数据库连接..."
if npm run db:deploy; then
    echo "✅ 数据库连接成功"
else
    echo "❌ 数据库连接失败"
    echo "💡 请检查："
    echo "   - MySQL服务是否运行"
    echo "   - DATABASE_URL 配置是否正确" 
    echo "   - 数据库是否已创建"
    exit 1
fi

# 填充初始数据
echo "🌱 填充初始数据..."
npm run db:seed

# 构建项目
echo "🏗️  构建后端项目..."
npm run build

# 前端设置
echo "🎨 3. 设置前端..."
cd ../frontend

# 检查环境变量
if [ ! -f .env.local ]; then
    echo "⚠️  frontend/.env.local 文件不存在"
    echo "📝 请创建 .env.local 文件配置 NextAuth"
fi

# 安装依赖
echo "📦 安装前端依赖..."
npm install

# 启动服务
echo "🚀 4. 启动服务..."

# 启动后端 (后台)
echo "🔧 启动后端服务..."
cd ../backend
npm run dev &
BACKEND_PID=$!

# 等待后端启动
sleep 5

# 测试后端健康检查
echo "🏥 测试后端健康检查..."
if curl -f http://localhost:3001/health; then
    echo "✅ 后端服务启动成功"
else
    echo "❌ 后端服务启动失败"
    kill $BACKEND_PID
    exit 1
fi

# 测试API接口
echo "🧪 测试API接口..."
echo "📌 测试标签接口..."
curl -s http://localhost:3001/api/tags | jq . || echo "JSON格式错误"

echo "📌 测试网站列表接口..."
curl -s "http://localhost:3001/api/websites/sorted-list?page=1&pageSize=5" | jq . || echo "JSON格式错误"

# 启动前端
echo "🎨 启动前端服务..."
cd ../frontend
npm run dev &
FRONTEND_PID=$!

echo ""
echo "🎉 启动完成!"
echo ""
echo "📊 服务状态:"
echo "   后端API: http://localhost:3001"
echo "   前端应用: http://localhost:3000"
echo "   健康检查: http://localhost:3001/health"
echo ""
echo "🔍 测试链接:"
echo "   标签列表: http://localhost:3001/api/tags"
echo "   网站列表: http://localhost:3001/api/websites/sorted-list"
echo ""
echo "⚠️  注意事项:"
echo "   1. 确保MySQL服务正在运行"
echo "   2. 检查.env文件配置是否正确"
echo "   3. 如需停止服务，运行: kill $BACKEND_PID $FRONTEND_PID"
echo ""
echo "📝 如果遇到问题："
echo "   - 检查端口3000和3001是否被占用"
echo "   - 查看终端错误信息"
echo "   - 检查数据库连接配置"

# 等待用户输入退出
echo "按 Ctrl+C 停止所有服务"
wait 