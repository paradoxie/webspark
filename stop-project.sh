#!/bin/bash

# WebSpark.club 项目停止脚本
# 用于停止前端和后端服务

echo "🛑 停止 WebSpark.club 项目..."

# 停止前端进程
echo "🌐 停止前端服务..."
pkill -f "next"
pkill -f "npm run dev"

# 停止后端 Docker 容器
echo "📦 停止后端服务..."
cd backend
docker-compose down
cd ..

echo "✅ 所有服务已停止" 