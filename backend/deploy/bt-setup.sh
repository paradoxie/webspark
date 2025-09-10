#!/bin/bash

echo "🚀 WebSpark Backend - 宝塔部署配置"

# 项目配置
PROJECT_NAME="webspark-backend"
PROJECT_DIR="/www/wwwroot/$PROJECT_NAME"
DOMAIN="api.webspark.club"

echo "📦 1. 安装依赖..."
cd $PROJECT_DIR
npm install

echo "🗄️  2. 数据库配置..."
# 通过宝塔面板创建数据库
echo "请在宝塔面板中创建:"
echo "- 数据库名: webspark"
echo "- 编码: utf8mb4"

echo "📝 3. 配置环境变量..."
cat > .env <<EOF
DATABASE_URL="mysql://webspark:your_password@localhost:3306/webspark"
NEXTAUTH_SECRET="your-nextauth-secret-from-frontend"
PORT=3001
NODE_ENV="production"
FRONTEND_URL="https://webspark.club"
UPLOAD_DIR="uploads"
MAX_FILE_SIZE=5242880
EOF

echo "🏗️  4. 构建项目..."
npm run build

echo "🗄️  5. 数据库迁移..."
npm run db:generate
npm run db:deploy
npm run db:seed

echo "🔧 6. PM2配置..."
cat > ecosystem.config.js <<EOF
module.exports = {
  apps: [{
    name: '$PROJECT_NAME',
    script: 'dist/index.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    }
  }]
};
EOF

echo "🚀 7. 启动应用..."
pm2 start ecosystem.config.js
pm2 save
pm2 startup

echo "✅ 配置完成!"
echo "下一步:"
echo "1. 在宝塔面板中为 $DOMAIN 配置反向代理到 http://127.0.0.1:3001"
echo "2. 配置SSL证书"
echo "3. 测试API: curl https://$DOMAIN/health" 