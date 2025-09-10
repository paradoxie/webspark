# WebSpark.club 项目部署指南

## 📋 项目概览

**WebSpark.club** 是一个现代化的Web开发作品展示平台，采用前后端分离架构。

### 🏗️ 技术架构
- **前端**: Next.js 14 + TypeScript + Tailwind CSS + NextAuth.js
- **后端**: Node.js + Express + TypeScript + Prisma ORM
- **数据库**: MySQL 8.0
- **认证**: GitHub OAuth (NextAuth.js)
- **部署**: 宝塔面板 + PM2 + Nginx

### 🌐 部署结构
- **前端**: `https://webspark.club` (Cloudflare Pages)
- **后端API**: `https://api.webspark.club` (宝塔面板)

## 🚀 快速部署指南

### 前提条件
1. **服务器**: 2GB+ RAM, 20GB+ 存储
2. **域名**: 已解析到服务器IP
3. **宝塔面板**: 已安装并配置

### 第一步：环境准备

#### 1.1 安装宝塔面板
```bash
# Ubuntu/Debian
wget -O install.sh https://download.bt.cn/install/install-ubuntu_6.0.sh && sudo bash install.sh

# CentOS
yum install -y wget && wget -O install.sh https://download.bt.cn/install/install_6.0.sh && sh install.sh
```

#### 1.2 安装必要软件
通过宝塔面板安装：
- [x] Nginx 1.22+
- [x] MySQL 8.0
- [x] Node.js 18+
- [x] PM2

### 第二步：部署后端

#### 2.1 上传代码
```bash
cd /www/wwwroot
git clone https://github.com/your-username/webspark.git
cd webspark/backend
```

#### 2.2 安装依赖
```bash
npm install
```

#### 2.3 配置数据库
1. 宝塔面板创建数据库 `webspark`
2. 记录数据库用户名和密码

#### 2.4 配置环境变量
创建 `backend/.env` 文件：
```env
DATABASE_URL="mysql://webspark:your_password@localhost:3306/webspark"
NEXTAUTH_SECRET="your-nextauth-secret-key"
PORT=3001
NODE_ENV="production"
FRONTEND_URL="https://webspark.club"
UPLOAD_DIR="uploads"
MAX_FILE_SIZE=5242880
```

#### 2.5 初始化数据库
```bash
npm run db:generate
npm run db:deploy
npm run db:seed
```

#### 2.6 构建并启动
```bash
npm run build
pm2 start ecosystem.config.js
```

#### 2.7 配置Nginx反向代理
- 域名: `api.webspark.club`
- 目标: `http://127.0.0.1:3001`
- 配置SSL证书

### 第三步：部署前端

#### 3.1 配置环境变量
创建 `frontend/.env.local` 文件：
```env
NEXTAUTH_URL="https://webspark.club"
NEXTAUTH_SECRET="your-nextauth-secret-key"
GITHUB_CLIENT_ID="your-github-client-id"
GITHUB_CLIENT_SECRET="your-github-client-secret"
NEXT_PUBLIC_API_URL="https://api.webspark.club"
```

#### 3.2 GitHub OAuth配置
1. 创建GitHub OAuth App
2. 设置回调URL: `https://webspark.club/api/auth/callback/github`

#### 3.3 Cloudflare Pages部署
1. 连接GitHub仓库
2. 构建配置:
   - 构建命令: `npm run build`
   - 输出目录: `.next`
   - Node.js版本: 18
3. 添加环境变量

### 第四步：验证部署

#### 4.1 后端健康检查
```bash
curl https://api.webspark.club/health
```

#### 4.2 前端访问测试
访问 `https://webspark.club` 确认：
- [x] 页面正常加载
- [x] GitHub登录功能
- [x] API数据获取正常

## 🔧 运维管理

### 监控命令
```bash
# 查看PM2状态
pm2 status

# 查看应用日志
pm2 logs webspark-backend

# 重启应用
pm2 restart webspark-backend
```

### 更新部署
```bash
# 后端更新
cd /www/wwwroot/webspark/backend
git pull
npm install
npm run build
pm2 restart webspark-backend

# 前端更新
# Cloudflare Pages自动部署
```

### 数据库备份
```bash
# 每日自动备份
mysqldump -u webspark -p webspark > /www/backup/webspark_$(date +%Y%m%d).sql
```

## 🛡️ 安全配置

### 1. 防火墙设置
- 开放端口: 22 (SSH), 80 (HTTP), 443 (HTTPS), 8888 (宝塔)
- 关闭其他不必要端口

### 2. SSL证书
- 使用Let's Encrypt免费证书
- 开启HTTPS强制跳转

### 3. 数据库安全
- 使用强密码
- 限制数据库访问权限
- 定期备份数据

## 🚨 故障排除

### 常见问题

#### 1. 后端API无法访问
- 检查PM2进程状态
- 检查端口3001是否被占用
- 查看Nginx反向代理配置

#### 2. 数据库连接失败
- 检查MySQL服务状态
- 验证DATABASE_URL配置
- 检查数据库用户权限

#### 3. 前端登录失败
- 检查GitHub OAuth配置
- 验证NEXTAUTH_SECRET一致性
- 检查API接口连通性

#### 4. SSL证书问题
- 重新申请Let's Encrypt证书
- 检查域名解析状态

### 日志查看
```bash
# 应用日志
tail -f /www/wwwroot/webspark/backend/logs/combined.log

# Nginx日志
tail -f /www/server/nginx/logs/error.log

# MySQL日志
tail -f /var/log/mysql/error.log
```

## 📊 性能优化

### 1. 数据库优化
```sql
-- 添加索引
ALTER TABLE websites ADD INDEX idx_status_deleted (status, deletedAt);
ALTER TABLE websites ADD INDEX idx_created_at (createdAt);
```

### 2. CDN加速
- Cloudflare自动提供CDN
- 静态资源缓存优化

### 3. 应用优化
- 启用Gzip压缩
- 合理设置缓存策略
- 监控内存使用

## 📞 支持联系

部署过程中遇到问题，请：
1. 查看相关日志文件
2. 检查配置文件语法
3. 验证网络连接状态
4. 确认权限设置正确

---

**部署完成后，WebSpark.club将为全球Web开发者提供优质的作品展示平台！** 🎉 