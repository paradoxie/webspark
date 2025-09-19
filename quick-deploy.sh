#!/bin/bash

# WebSpark.club 快速部署脚本
# 使用方法: chmod +x quick-deploy.sh && ./quick-deploy.sh

set -e

echo "🚀 WebSpark.club 生产环境部署开始..."

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 函数定义
print_step() {
    echo -e "${BLUE}==== $1 ====${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
    exit 1
}

# 检查是否为root用户
check_root() {
    if [[ $EUID -eq 0 ]]; then
        print_error "请不要使用root用户运行此脚本，使用sudo权限的普通用户"
    fi
}

# 检查系统要求
check_requirements() {
    print_step "检查系统要求"
    
    # 检查操作系统
    if [[ "$OSTYPE" != "linux-gnu"* ]]; then
        print_error "此脚本仅支持Linux系统"
    fi
    
    # 检查内存
    MEM_GB=$(free -g | awk '/^Mem:/{print $2}')
    if [ $MEM_GB -lt 2 ]; then
        print_warning "建议内存至少2GB，当前：${MEM_GB}GB"
    fi
    
    # 检查磁盘空间
    DISK_GB=$(df -BG . | awk 'NR==2{print $4}' | sed 's/G//')
    if [ $DISK_GB -lt 20 ]; then
        print_warning "建议磁盘空间至少20GB，当前可用：${DISK_GB}GB"
    fi
    
    print_success "系统要求检查完成"
}

# 获取用户配置
get_config() {
    print_step "配置信息收集"
    
    read -p "请输入您的域名 (例如: webspark.club): " DOMAIN
    read -p "请输入API子域名 (例如: api): " API_SUBDOMAIN
    read -p "请输入MySQL root密码: " -s MYSQL_ROOT_PASSWORD
    echo
    read -p "请输入WebSpark数据库密码: " -s DB_PASSWORD
    echo
    read -p "请输入GitHub OAuth Client ID: " GITHUB_CLIENT_ID
    read -p "请输入GitHub OAuth Client Secret: " -s GITHUB_CLIENT_SECRET
    echo
    read -p "请输入NextAuth Secret (32字符以上): " NEXTAUTH_SECRET
    
    # 验证配置
    if [[ -z "$DOMAIN" || -z "$DB_PASSWORD" || -z "$GITHUB_CLIENT_ID" || -z "$GITHUB_CLIENT_SECRET" || -z "$NEXTAUTH_SECRET" ]]; then
        print_error "所有配置项都是必填的"
    fi
    
    if [[ ${#NEXTAUTH_SECRET} -lt 32 ]]; then
        print_error "NextAuth Secret至少需要32个字符"
    fi
    
    API_DOMAIN="${API_SUBDOMAIN}.${DOMAIN}"
    FRONTEND_URL="https://${DOMAIN}"
    API_URL="https://${API_DOMAIN}"
    
    print_success "配置收集完成"
}

# 安装系统依赖
install_dependencies() {
    print_step "安装系统依赖"
    
    # 更新系统包
    sudo apt update
    sudo apt upgrade -y
    
    # 安装基础软件
    sudo apt install -y curl wget git nginx mysql-server ufw
    
    # 安装Node.js 18
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
    
    # 安装PM2
    sudo npm install -g pm2
    
    print_success "系统依赖安装完成"
}

# 配置防火墙
setup_firewall() {
    print_step "配置防火墙"
    
    sudo ufw --force enable
    sudo ufw default deny incoming
    sudo ufw default allow outgoing
    sudo ufw allow ssh
    sudo ufw allow 80
    sudo ufw allow 443
    
    print_success "防火墙配置完成"
}

# 配置MySQL
setup_mysql() {
    print_step "配置MySQL数据库"
    
    # 启动MySQL服务
    sudo systemctl start mysql
    sudo systemctl enable mysql
    
    # 创建数据库和用户
    mysql -u root -p"${MYSQL_ROOT_PASSWORD}" <<EOF
CREATE DATABASE IF NOT EXISTS webspark CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'webspark'@'localhost' IDENTIFIED BY '${DB_PASSWORD}';
GRANT ALL PRIVILEGES ON webspark.* TO 'webspark'@'localhost';
FLUSH PRIVILEGES;
EOF
    
    print_success "MySQL配置完成"
}

# 部署后端应用
deploy_backend() {
    print_step "部署后端应用"
    
    # 创建部署目录
    sudo mkdir -p /var/www/webspark
    sudo chown $USER:$USER /var/www/webspark
    
    cd /var/www/webspark
    
    # 克隆代码 (这里需要替换为实际的仓库地址)
    if [ ! -d ".git" ]; then
        read -p "请输入您的Git仓库地址: " REPO_URL
        git clone $REPO_URL .
    else
        git pull origin main
    fi
    
    # 进入后端目录
    cd backend
    
    # 安装依赖
    npm install
    
    # 创建环境配置文件
    cat > .env <<EOF
DATABASE_URL="mysql://webspark:${DB_PASSWORD}@localhost:3306/webspark"
NEXTAUTH_SECRET="${NEXTAUTH_SECRET}"
JWT_SECRET="${NEXTAUTH_SECRET}"
NODE_ENV="production"
PORT=3001
FRONTEND_URL="${FRONTEND_URL}"
ENCRYPTION_KEY="$(openssl rand -hex 16)"
VALID_API_KEYS="$(openssl rand -hex 16),$(openssl rand -hex 16)"
UPLOAD_DIR="uploads"
MAX_FILE_SIZE=5242880
EOF
    
    # 创建日志目录
    mkdir -p logs
    
    # 生成Prisma客户端
    npm run db:generate
    
    # 运行数据库迁移
    npm run db:deploy
    
    # 构建应用
    npm run build
    
    # 启动应用
    pm2 start ecosystem.config.js --env production
    pm2 startup
    pm2 save
    
    print_success "后端应用部署完成"
}

# 配置Nginx
setup_nginx() {
    print_step "配置Nginx反向代理"
    
    # 创建API配置文件
    sudo tee /etc/nginx/sites-available/webspark-api > /dev/null <<EOF
server {
    listen 80;
    server_name ${API_DOMAIN};
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name ${API_DOMAIN};
    
    # SSL配置(Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/${API_DOMAIN}/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/${API_DOMAIN}/privkey.pem;
    
    # SSL安全配置
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    
    # 安全头部
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload";
    
    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    location /uploads {
        alias /var/www/webspark/backend/uploads;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
    
    access_log /var/log/nginx/webspark-api.access.log;
    error_log /var/log/nginx/webspark-api.error.log;
}
EOF
    
    # 启用站点
    sudo ln -sf /etc/nginx/sites-available/webspark-api /etc/nginx/sites-enabled/
    
    # 测试配置
    sudo nginx -t
    
    # 重启Nginx
    sudo systemctl restart nginx
    sudo systemctl enable nginx
    
    print_success "Nginx配置完成"
}

# 申请SSL证书
setup_ssl() {
    print_step "申请SSL证书"
    
    # 安装Certbot
    sudo apt install -y certbot python3-certbot-nginx
    
    # 申请证书
    sudo certbot --nginx -d ${API_DOMAIN} --non-interactive --agree-tos --email admin@${DOMAIN}
    
    # 设置自动续期
    echo "0 12 * * * /usr/bin/certbot renew --quiet" | sudo crontab -
    
    print_success "SSL证书配置完成"
}

# 设置监控和备份
setup_monitoring() {
    print_step "设置监控和备份"
    
    # 创建备份脚本
    sudo tee /usr/local/bin/webspark-backup.sh > /dev/null <<EOF
#!/bin/bash
DATE=\$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/var/backups/webspark"
mkdir -p \$BACKUP_DIR

# 数据库备份
mysqldump -u webspark -p'${DB_PASSWORD}' webspark > \$BACKUP_DIR/webspark_\$DATE.sql
gzip \$BACKUP_DIR/webspark_\$DATE.sql

# 删除7天前的备份
find \$BACKUP_DIR -name "*.sql.gz" -mtime +7 -delete

echo "Backup completed: webspark_\$DATE.sql.gz"
EOF
    
    sudo chmod +x /usr/local/bin/webspark-backup.sh
    
    # 添加到定时任务
    echo "0 2 * * * /usr/local/bin/webspark-backup.sh" | sudo crontab -
    
    print_success "监控和备份设置完成"
}

# 验证部署
verify_deployment() {
    print_step "验证部署"
    
    # 检查PM2状态
    pm2 status
    
    # 测试API健康检查
    if curl -f -s "http://localhost:3001/health" > /dev/null; then
        print_success "后端API运行正常"
    else
        print_error "后端API健康检查失败"
    fi
    
    # 检查Nginx状态
    if sudo systemctl is-active --quiet nginx; then
        print_success "Nginx运行正常"
    else
        print_error "Nginx未正常运行"
    fi
    
    print_success "部署验证完成"
}

# 显示部署信息
show_deployment_info() {
    print_step "部署完成信息"
    
    echo -e "${GREEN}"
    echo "🎉 WebSpark.club 部署成功！"
    echo
    echo "📍 访问地址："
    echo "   前端: ${FRONTEND_URL}"
    echo "   API:  ${API_URL}"
    echo "   健康检查: ${API_URL}/health"
    echo
    echo "🔧 管理命令："
    echo "   查看后端状态: pm2 status"
    echo "   查看日志: pm2 logs webspark-backend"
    echo "   重启后端: pm2 restart webspark-backend"
    echo "   Nginx状态: sudo systemctl status nginx"
    echo
    echo "📋 下一步："
    echo "   1. 配置前端部署 (Vercel/Cloudflare Pages)"
    echo "   2. 添加以下环境变量到前端："
    echo "      NEXTAUTH_URL=${FRONTEND_URL}"
    echo "      NEXTAUTH_SECRET=${NEXTAUTH_SECRET}"
    echo "      GITHUB_CLIENT_ID=${GITHUB_CLIENT_ID}"
    echo "      GITHUB_CLIENT_SECRET=${GITHUB_CLIENT_SECRET}"
    echo "      NEXT_PUBLIC_API_URL=${API_URL}"
    echo "   3. 配置GitHub OAuth回调地址: ${FRONTEND_URL}/api/auth/callback/github"
    echo
    echo "📞 技术支持："
    echo "   日志位置: /var/www/webspark/backend/logs/"
    echo "   配置文件: /var/www/webspark/backend/.env"
    echo "   Nginx配置: /etc/nginx/sites-available/webspark-api"
    echo -e "${NC}"
}

# 主函数
main() {
    echo -e "${BLUE}"
    echo "╔══════════════════════════════════════╗"
    echo "║      WebSpark.club 部署脚本          ║"
    echo "║                                      ║"
    echo "║  此脚本将自动部署后端API服务          ║"
    echo "║  前端需要单独部署到Vercel或其他平台   ║"
    echo "╚══════════════════════════════════════╝"
    echo -e "${NC}"
    
    read -p "是否继续部署？(y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "部署已取消"
        exit 0
    fi
    
    check_root
    check_requirements
    get_config
    install_dependencies
    setup_firewall
    setup_mysql
    deploy_backend
    setup_nginx
    setup_ssl
    setup_monitoring
    verify_deployment
    show_deployment_info
    
    print_success "所有部署步骤已完成！"
}

# 执行主函数
main "$@"