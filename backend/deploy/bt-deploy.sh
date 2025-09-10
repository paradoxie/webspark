#!/bin/bash

# WebSpark Backend 宝塔面板部署脚本
# 使用方法: bash bt-deploy.sh

set -e

echo "🚀 开始部署 WebSpark Backend..."

# 配置变量
PROJECT_NAME="webspark-backend"
PROJECT_DIR="/www/wwwroot/$PROJECT_NAME"
DB_NAME="webspark"
DB_USER="webspark"
NODE_VERSION="18"

# 检查是否为 root 用户
if [[ $EUID -ne 0 ]]; then
   echo "❌ 请使用 root 用户运行此脚本" 
   exit 1
fi

echo "📦 1. 安装必要的软件..."

# 检查宝塔面板是否已安装
if ! command -v bt &> /dev/null; then
    echo "❌ 未检测到宝塔面板，请先安装宝塔面板"
    echo "安装命令: curl -sSO http://download.bt.cn/install/install_panel.sh && bash install_panel.sh"
    exit 1
fi

# 安装 Node.js
echo "📦 安装 Node.js $NODE_VERSION..."
if ! bt --list | grep -q "Node.js"; then
    bt install nodejs
fi

# 安装 MySQL
echo "📦 安装 MySQL..."
if ! bt --list | grep -q "MySQL"; then
    bt install mysql
fi

# 安装 Nginx
echo "📦 安装 Nginx..."
if ! bt --list | grep -q "Nginx"; then
    bt install nginx
fi

# 安装 PM2
echo "📦 安装 PM2..."
npm install -g pm2

echo "🗂️  2. 创建项目目录..."
mkdir -p $PROJECT_DIR
cd $PROJECT_DIR

echo "📥 3. 克隆/复制项目代码..."
# 这里假设你已经将代码上传到服务器
# 如果使用 Git，取消下面的注释
# git clone https://github.com/your-username/webspark.git .
# git checkout main

echo "📦 4. 安装项目依赖..."
npm install

echo "🗄️  5. 配置数据库..."

# 生成随机密码
DB_PASSWORD=$(openssl rand -base64 32)

# 创建数据库和用户
mysql -u root -p <<EOF
CREATE DATABASE IF NOT EXISTS $DB_NAME CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS '$DB_USER'@'localhost' IDENTIFIED BY '$DB_PASSWORD';
GRANT ALL PRIVILEGES ON $DB_NAME.* TO '$DB_USER'@'localhost';
FLUSH PRIVILEGES;
EXIT;
EOF

echo "📝 6. 创建环境变量文件..."
cat > .env <<EOF
# Database
DATABASE_URL="mysql://$DB_USER:$DB_PASSWORD@localhost:3306/$DB_NAME"

# JWT
JWT_SECRET="$(openssl rand -base64 64)"
JWT_EXPIRES_IN="7d"

# GitHub OAuth (需要你手动填入)
GITHUB_CLIENT_ID="your-github-client-id"
GITHUB_CLIENT_SECRET="your-github-client-secret"

# Server
PORT=3001
NODE_ENV="production"

# CORS
FRONTEND_URL="https://webspark.club"

# File Upload
UPLOAD_DIR="uploads"
MAX_FILE_SIZE=5242880
EOF

echo "🏗️  7. 构建项目..."
npm run build

echo "🗄️  8. 运行数据库迁移..."
npm run db:generate
npm run db:deploy
npm run db:seed

echo "🌐 9. 配置 Nginx..."
cat > /etc/nginx/sites-available/$PROJECT_NAME <<EOF
server {
    listen 80;
    server_name api.webspark.club;  # 替换为你的域名
    
    # 重定向到 HTTPS
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.webspark.club;  # 替换为你的域名
    
    # SSL 证书配置 (需要通过宝塔面板配置)
    ssl_certificate /path/to/your/certificate.crt;
    ssl_certificate_key /path/to/your/private.key;
    
    # 基础安全配置
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;
    ssl_prefer_server_ciphers off;
    
    # 文件上传大小限制
    client_max_body_size 10M;
    
    # API 代理
    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        
        # 超时设置
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # 静态文件
    location /uploads {
        alias $PROJECT_DIR/uploads;
        expires 7d;
        add_header Cache-Control "public, immutable";
    }
    
    # 健康检查
    location /health {
        access_log off;
        proxy_pass http://127.0.0.1:3001;
    }
}
EOF

# 创建软链接
ln -sf /etc/nginx/sites-available/$PROJECT_NAME /etc/nginx/sites-enabled/

# 测试 Nginx 配置
nginx -t

echo "🔧 10. 配置 PM2..."
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
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
};
EOF

# 创建日志目录
mkdir -p logs

echo "🚀 11. 启动应用..."
pm2 start ecosystem.config.js
pm2 save
pm2 startup

echo "🔄 12. 重启服务..."
systemctl reload nginx

echo "✅ 部署完成！"
echo ""
echo "📋 部署信息:"
echo "   项目目录: $PROJECT_DIR"
echo "   数据库名: $DB_NAME"
echo "   数据库用户: $DB_USER"
echo "   数据库密码: $DB_PASSWORD"
echo "   API地址: https://api.webspark.club"
echo ""
echo "🔧 后续配置:"
echo "   1. 通过宝塔面板为域名配置 SSL 证书"
echo "   2. 在 .env 文件中配置 GitHub OAuth 信息"
echo "   3. 重启应用: pm2 restart $PROJECT_NAME"
echo ""
echo "📊 管理命令:"
echo "   查看日志: pm2 logs $PROJECT_NAME"
echo "   重启应用: pm2 restart $PROJECT_NAME"
echo "   停止应用: pm2 stop $PROJECT_NAME"
echo "   查看状态: pm2 status"
EOF 