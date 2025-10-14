# 🚀 WebSpark.club 部署指南

## 📋 项目概览

WebSpark.club 是一个现代化的 Web 开发者作品展示平台，采用前后端分离架构。

### 技术架构
- **前端**: Next.js 14 + TypeScript + Tailwind CSS
- **后端**: Express.js + TypeScript + Prisma ORM  
- **数据库**: MySQL 8.0
- **认证**: NextAuth.js + GitHub OAuth
- **部署**: 前端(Vercel/Cloudflare Pages) + 后端(VPS/宝塔面板)

## 🎯 快速部署

### 前提条件
- VPS 服务器 (2GB+ RAM, 20GB+ 存储)
- 域名已解析
- GitHub OAuth 应用已创建
- Node.js 18+ 和 MySQL 8.0+

### 一键部署脚本
```bash
# 使用快速部署脚本
chmod +x quick-deploy.sh
./quick-deploy.sh
```

## 🗄️ 后端部署

### 1. 环境准备
```bash
# 安装必要软件
sudo apt update && sudo apt upgrade -y
sudo apt install nginx mysql-server nodejs npm git

# 安装 PM2
sudo npm install -g pm2
```

### 2. 数据库配置
```sql
CREATE DATABASE webspark CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'webspark'@'localhost' IDENTIFIED BY 'your_strong_password';
GRANT ALL PRIVILEGES ON webspark.* TO 'webspark'@'localhost';
FLUSH PRIVILEGES;
```

### 3. 项目部署
```bash
# 克隆代码
cd /var/www
git clone https://github.com/your-username/webspark.git
cd webspark/backend

# 安装依赖
npm install

# 配置环境变量
cp .env.example .env
nano .env

# 数据库迁移
npm run db:generate
npm run db:deploy
npm run db:seed

# 构建并启动
npm run build
pm2 start ecosystem.config.js --env production
```

### 4. Nginx 配置
```nginx
server {
    listen 443 ssl http2;
    server_name api.webspark.club;
    
    ssl_certificate /etc/letsencrypt/live/api.webspark.club/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.webspark.club/privkey.pem;
    
    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 🎨 前端部署

### 方案 A: Vercel 部署 (推荐)
1. 安装 Vercel CLI: `npm i -g vercel`
2. 登录: `vercel login`
3. 部署: `vercel --prod`
4. 配置环境变量

### 方案 B: Cloudflare Pages
1. 连接 GitHub 仓库
2. 配置构建设置
3. 添加环境变量
4. 自动部署

## 🔧 环境变量配置

### 后端 (.env)
```env
DATABASE_URL="mysql://webspark:password@localhost:3306/webspark"
NEXTAUTH_SECRET="your-32-char-secret"
PORT=3001
NODE_ENV="production"
FRONTEND_URL="https://webspark.club"
```

### 前端 (.env.local)
```env
NEXTAUTH_URL="https://webspark.club"
NEXTAUTH_SECRET="your-32-char-secret"
GITHUB_CLIENT_ID="your-github-client-id"
GITHUB_CLIENT_SECRET="your-github-client-secret"
NEXT_PUBLIC_API_URL="https://api.webspark.club"
```

## ✅ 部署验证

### 后端健康检查
```bash
curl https://api.webspark.club/health
```

### 前端功能测试
- 访问 https://webspark.club
- 测试 GitHub 登录
- 验证作品展示功能

## 📊 监控与维护

### PM2 管理
```bash
pm2 status            # 查看状态
pm2 logs              # 查看日志
pm2 restart all       # 重启服务
```

### 数据库备份
```bash
# 每日自动备份
mysqldump -u webspark -p webspark > backup_$(date +%Y%m%d).sql
```

### 更新部署
```bash
git pull origin main
npm install
npm run build
pm2 restart webspark-backend
```

## 🚨 故障排除

### 常见问题
1. **数据库连接失败**: 检查 DATABASE_URL 配置
2. **API 无法访问**: 验证 Nginx 配置和端口
3. **GitHub OAuth 失败**: 检查回调 URL 和密钥配置
4. **SSL 证书问题**: 使用 certbot renew 更新证书

## 📞 技术支持

详细部署文档请参考：
- [宝塔面板部署指南](./backend/deploy/DEPLOYMENT_GUIDE.md)
- [GitHub OAuth 配置](./GITHUB_OAUTH_SETUP.md)
- [环境变量说明](./backend/deploy/ENV_SETUP.md)