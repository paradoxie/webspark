# 🚀 WebSpark.club 生产环境部署指南

## 📋 项目概述

WebSpark.club是一个现代化的Web开发者作品展示平台，采用前后端分离架构。

### 🏗️ 技术栈
- **前端**: Next.js 14 + TypeScript + Tailwind CSS
- **后端**: Express.js + TypeScript + Prisma ORM  
- **数据库**: MySQL 8.0
- **认证**: NextAuth.js + GitHub OAuth
- **部署**: 前端(Vercel/Cloudflare Pages) + 后端(VPS/宝塔面板)

### 🌐 部署架构
```
用户 → CDN → 前端(Next.js) → API → 后端(Express) → MySQL
```

## 🎯 快速部署清单

### ✅ 准备工作
- [ ] VPS服务器(2GB+ RAM, 20GB+ 存储)
- [ ] 域名解析配置
- [ ] GitHub OAuth应用创建
- [ ] 环境变量准备

### ✅ 部署步骤
- [ ] 数据库部署
- [ ] 后端API部署  
- [ ] 前端应用部署
- [ ] 域名和SSL配置
- [ ] 功能测试验证

---

## 🗄️ 第一步：数据库部署

### 1.1 MySQL安装配置
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install mysql-server

# CentOS/RHEL
sudo yum install mysql-server

# 启动MySQL服务
sudo systemctl start mysql
sudo systemctl enable mysql

# 安全配置
sudo mysql_secure_installation
```

### 1.2 创建数据库和用户
```sql
-- 登录MySQL
mysql -u root -p

-- 创建数据库
CREATE DATABASE webspark CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 创建用户
CREATE USER 'webspark'@'localhost' IDENTIFIED BY 'your_strong_password';

-- 授权
GRANT ALL PRIVILEGES ON webspark.* TO 'webspark'@'localhost';
FLUSH PRIVILEGES;

-- 退出
EXIT;
```

### 1.3 数据库配置优化
```bash
# 编辑MySQL配置
sudo nano /etc/mysql/mysql.conf.d/mysqld.cnf

# 添加优化配置
[mysqld]
max_connections = 200
innodb_buffer_pool_size = 512M
innodb_log_file_size = 128M
query_cache_size = 64M
```

---

## 🔧 第二步：后端API部署

### 2.1 服务器环境准备
```bash
# 安装Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 安装PM2
sudo npm install -g pm2

# 安装Git
sudo apt install git

# 创建部署目录
sudo mkdir -p /var/www/webspark
sudo chown $USER:$USER /var/www/webspark
```

### 2.2 下载和配置代码
```bash
# 进入部署目录
cd /var/www/webspark

# 克隆代码(替换为您的仓库地址)
git clone https://github.com/your-username/webspark.git .

# 进入后端目录
cd backend

# 安装依赖
npm install

# 创建日志目录
mkdir -p logs
```

### 2.3 环境变量配置
```bash
# 创建生产环境配置
nano .env
```

```env
# 数据库配置
DATABASE_URL="mysql://webspark:your_strong_password@localhost:3306/webspark"

# JWT配置
NEXTAUTH_SECRET="your-super-secret-nextauth-key-32-chars-min"
JWT_SECRET="your-jwt-secret-key"

# 服务器配置
NODE_ENV="production"
PORT=3001
FRONTEND_URL="https://your-domain.com"

# 安全配置
ENCRYPTION_KEY="your-32-char-encryption-key-here"
VALID_API_KEYS="your-api-key-1,your-api-key-2"

# 邮件服务配置(可选)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
SMTP_FROM="noreply@your-domain.com"

# 安全告警邮箱
SECURITY_ALERT_EMAIL="admin@your-domain.com"

# 文件上传配置
UPLOAD_DIR="uploads"
MAX_FILE_SIZE=5242880
```

### 2.4 数据库初始化
```bash
# 生成Prisma客户端
npm run db:generate

# 运行数据库迁移
npm run db:deploy

# 填充初始数据(可选)
npm run db:seed
```

### 2.5 构建和启动
```bash
# 构建应用
npm run build

# 使用PM2启动
pm2 start ecosystem.config.js --env production

# 设置PM2开机自启
pm2 startup
pm2 save
```

### 2.6 验证后端服务
```bash
# 检查服务状态
pm2 status

# 测试API健康检查
curl http://localhost:3001/health

# 查看日志
pm2 logs webspark-backend
```

---

## 🌐 第三步：Nginx反向代理配置

### 3.1 安装Nginx
```bash
# Ubuntu/Debian
sudo apt install nginx

# 启动并设置开机自启
sudo systemctl start nginx
sudo systemctl enable nginx
```

### 3.2 配置API反向代理
```bash
# 创建站点配置
sudo nano /etc/nginx/sites-available/webspark-api
```

```nginx
server {
    listen 80;
    server_name api.your-domain.com;
    
    # 重定向到HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.your-domain.com;
    
    # SSL证书配置(使用Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/api.your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.your-domain.com/privkey.pem;
    
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
    
    # 代理到后端API
    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # 超时配置
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # 静态文件代理
    location /uploads {
        alias /var/www/webspark/backend/uploads;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
    
    # 日志配置
    access_log /var/log/nginx/webspark-api.access.log;
    error_log /var/log/nginx/webspark-api.error.log;
}
```

### 3.3 启用站点配置
```bash
# 启用站点
sudo ln -s /etc/nginx/sites-available/webspark-api /etc/nginx/sites-enabled/

# 测试配置
sudo nginx -t

# 重载配置
sudo systemctl reload nginx
```

### 3.4 SSL证书申请
```bash
# 安装Certbot
sudo apt install certbot python3-certbot-nginx

# 申请SSL证书
sudo certbot --nginx -d api.your-domain.com

# 设置自动续期
sudo crontab -e
# 添加: 0 12 * * * /usr/bin/certbot renew --quiet
```

---

## 🎨 第四步：前端应用部署

### 方案A：Vercel部署(推荐)

### 4.1 准备环境变量
在Vercel项目设置中添加：
```env
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=your-super-secret-nextauth-key-32-chars-min
GITHUB_CLIENT_ID=your-github-oauth-client-id
GITHUB_CLIENT_SECRET=your-github-oauth-client-secret
NEXT_PUBLIC_API_URL=https://api.your-domain.com
```

### 4.2 部署配置
```bash
# 安装Vercel CLI
npm i -g vercel

# 登录Vercel
vercel login

# 进入前端目录
cd frontend

# 部署
vercel --prod
```

### 方案B：Cloudflare Pages部署

### 4.3 Cloudflare Pages配置
1. 连接GitHub仓库
2. 构建设置：
   - 构建命令：`npm run build`
   - 输出目录：`.next`
   - Node.js版本：18
3. 环境变量：同Vercel配置

---

## 🔐 第五步：GitHub OAuth配置

### 5.1 创建GitHub OAuth应用
1. 访问GitHub Settings > Developer settings > OAuth Apps
2. 点击"New OAuth App"
3. 填写应用信息：
   - Application name: WebSpark.club
   - Homepage URL: https://your-domain.com
   - Authorization callback URL: https://your-domain.com/api/auth/callback/github

### 5.2 获取OAuth凭据
- 复制Client ID和Client Secret
- 添加到前端环境变量中

---

## 🔍 第六步：部署验证

### 6.1 后端API测试
```bash
# 健康检查
curl https://api.your-domain.com/health

# 网站列表API
curl https://api.your-domain.com/api/websites

# 分类API
curl https://api.your-domain.com/api/categories
```

### 6.2 前端功能测试
访问 https://your-domain.com 验证：
- [ ] 页面正常加载
- [ ] GitHub登录功能
- [ ] 网站列表显示
- [ ] 搜索功能
- [ ] 作品提交功能

### 6.3 完整流程测试
1. 用户注册/登录
2. 浏览网站列表
3. 搜索和筛选
4. 提交新作品
5. 点赞和收藏
6. 评论功能

---

## 📊 第七步：监控和维护

### 7.1 服务监控
```bash
# PM2监控
pm2 monit

# 系统资源监控
htop
df -h
free -h

# 日志查看
pm2 logs webspark-backend
tail -f /var/log/nginx/webspark-api.error.log
```

### 7.2 数据库备份
```bash
# 创建备份脚本
nano /home/backup.sh
```

```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/var/backups/webspark"
mkdir -p $BACKUP_DIR

# 数据库备份
mysqldump -u webspark -p'your_password' webspark > $BACKUP_DIR/webspark_$DATE.sql

# 压缩备份
gzip $BACKUP_DIR/webspark_$DATE.sql

# 删除7天前的备份
find $BACKUP_DIR -name "*.sql.gz" -mtime +7 -delete

echo "Backup completed: webspark_$DATE.sql.gz"
```

```bash
# 设置执行权限
chmod +x /home/backup.sh

# 添加到定时任务
crontab -e
# 添加: 0 2 * * * /home/backup.sh
```

### 7.3 自动更新脚本
```bash
# 创建更新脚本
nano /home/deploy.sh
```

```bash
#!/bin/bash
cd /var/www/webspark

# 拉取最新代码
git pull origin main

# 更新后端
cd backend
npm install
npm run build
pm2 restart webspark-backend

# 前端会自动重新部署(Vercel/Cloudflare)

echo "Deployment completed successfully"
```

---

## 🚨 故障排除

### 常见问题解决

#### 1. 后端API无法访问
```bash
# 检查PM2状态
pm2 status

# 检查端口占用
netstat -tlnp | grep :3001

# 查看应用日志
pm2 logs webspark-backend --lines 50

# 重启应用
pm2 restart webspark-backend
```

#### 2. 数据库连接失败
```bash
# 检查MySQL服务
sudo systemctl status mysql

# 测试数据库连接
mysql -u webspark -p webspark

# 检查数据库配置
cat backend/.env | grep DATABASE_URL
```

#### 3. Nginx配置问题
```bash
# 测试Nginx配置
sudo nginx -t

# 查看错误日志
sudo tail -f /var/log/nginx/error.log

# 重启Nginx
sudo systemctl restart nginx
```

#### 4. SSL证书问题
```bash
# 检查证书状态
sudo certbot certificates

# 手动续期
sudo certbot renew

# 测试续期
sudo certbot renew --dry-run
```

---

## 📋 部署完成检查清单

### ✅ 基础设施
- [ ] 服务器正常运行
- [ ] 域名解析正确
- [ ] SSL证书有效
- [ ] 防火墙配置正确

### ✅ 数据库
- [ ] MySQL服务运行正常
- [ ] 数据库连接测试成功
- [ ] 数据迁移完成
- [ ] 备份脚本设置

### ✅ 后端API
- [ ] 应用构建成功
- [ ] PM2进程运行正常
- [ ] 健康检查通过
- [ ] 环境变量配置正确

### ✅ 前端应用  
- [ ] 部署成功
- [ ] 页面正常访问
- [ ] API连接正常
- [ ] GitHub OAuth工作正常

### ✅ 安全配置
- [ ] HTTPS强制跳转
- [ ] 安全头部配置
- [ ] 防火墙规则设置
- [ ] 敏感信息保护

### ✅ 监控维护
- [ ] 日志系统正常
- [ ] 备份脚本运行
- [ ] 监控告警设置
- [ ] 更新机制建立

---

## 🎉 部署完成

恭喜！WebSpark.club已成功部署到生产环境。

### 🔗 访问地址
- **前端**: https://your-domain.com
- **API**: https://api.your-domain.com
- **健康检查**: https://api.your-domain.com/health

### 📞 技术支持
如果在部署过程中遇到问题：
1. 检查相关日志文件
2. 验证配置文件语法
3. 确认网络连接状态
4. 检查权限设置

### 🚀 下一步
- 配置监控告警
- 设置性能分析
- 优化SEO配置
- 添加更多功能

**WebSpark.club现在已准备好为全球Web开发者提供优质服务！** 🌟