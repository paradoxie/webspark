# WebSpark Backend 宝塔面板部署指南

## 🎯 部署概览

本项目使用 **Node.js + Express + MySQL** 架构，通过宝塔面板进行部署管理。

### 技术栈
- **后端**: Node.js 18+ + Express + TypeScript
- **数据库**: MySQL 8.0 + Prisma ORM  
- **进程管理**: PM2
- **Web服务器**: Nginx (反向代理)
- **SSL**: Let's Encrypt 免费证书

## 🚀 部署步骤

### 1. 服务器准备

#### 1.1 系统要求
- **操作系统**: Ubuntu 20.04+ / CentOS 8+
- **内存**: 最低 2GB，推荐 4GB+
- **存储**: 最低 20GB
- **网络**: 公网IP，域名解析

#### 1.2 安装宝塔面板
```bash
# Ubuntu/Debian
wget -O install.sh https://download.bt.cn/install/install-ubuntu_6.0.sh && sudo bash install.sh

# CentOS/RHEL  
yum install -y wget && wget -O install.sh https://download.bt.cn/install/install_6.0.sh && sh install.sh
```

安装完成后访问: `http://你的服务器IP:8888`

### 2. 环境配置

#### 2.1 通过宝塔面板安装软件
- [x] **Nginx** 1.22+
- [x] **MySQL** 8.0
- [x] **Node.js** 18.x (通过Node项目管理安装)
- [x] **PM2** (Node项目管理自带)

#### 2.2 创建数据库
1. 进入宝塔面板 → 数据库
2. 添加数据库:
   - 数据库名: `webspark`
   - 用户名: `webspark` 
   - 密码: 生成强密码并记录
   - 编码: `utf8mb4`

### 3. 项目部署

#### 3.1 上传代码
```bash
# 方法1: Git克隆 (推荐)
cd /www/wwwroot
git clone https://github.com/your-username/webspark.git
cd webspark/backend

# 方法2: 手动上传
# 通过宝塔面板文件管理上传代码压缩包并解压
```

#### 3.2 安装依赖
```bash
cd /www/wwwroot/webspark/backend
npm install
```

#### 3.3 配置环境变量
创建 `.env` 文件:
```env
# 数据库连接 (替换为实际配置)
DATABASE_URL="mysql://webspark:your_db_password@localhost:3306/webspark"

# NextAuth Secret (与前端保持一致)
NEXTAUTH_SECRET="your-nextauth-secret-key"

# 服务器配置
PORT=3001
NODE_ENV="production"
FRONTEND_URL="https://webspark.club"

# 文件上传
UPLOAD_DIR="uploads"
MAX_FILE_SIZE=5242880
```

#### 3.4 数据库初始化
```bash
# 生成Prisma客户端
npm run db:generate

# 运行数据库迁移
npm run db:deploy

# 填充初始数据 (标签等)
npm run db:seed
```

#### 3.5 构建项目
```bash
npm run build
```

### 4. 配置Web服务

#### 4.1 创建网站
1. 宝塔面板 → 网站 → 添加站点
2. 配置信息:
   - **域名**: `api.webspark.club`
   - **根目录**: `/www/wwwroot/webspark/backend`
   - **PHP版本**: 纯静态

#### 4.2 配置反向代理
1. 进入网站设置 → 反向代理
2. 添加反向代理:
   - **代理名称**: webspark-api
   - **目标URL**: `http://127.0.0.1:3001`
   - **发送域名**: `$host`
   - **其他配置**: 保持默认

#### 4.3 配置SSL证书
1. 网站设置 → SSL
2. 选择 Let's Encrypt 免费证书
3. 勾选"强制HTTPS"

### 5. 启动应用

#### 5.1 通过宝塔面板Node项目管理
1. 宝塔面板 → 软件商店 → Node项目管理
2. 添加Node.js项目:
   - **项目名称**: webspark-backend  
   - **项目路径**: `/www/wwwroot/webspark/backend`
   - **启动文件**: `dist/index.js`
   - **端口**: 3001

#### 5.2 手动PM2管理 (可选)
```bash
cd /www/wwwroot/webspark/backend

# 创建PM2配置
cat > ecosystem.config.js <<EOF
module.exports = {
  apps: [{
    name: 'webspark-backend',
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
    log_file: './logs/combined.log'
  }]
};
EOF

# 启动应用
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### 6. 验证部署

#### 6.1 健康检查
```bash
curl https://api.webspark.club/health
# 期望响应: {"status":"OK","timestamp":"...","uptime":...}
```

#### 6.2 API测试
```bash
# 测试标签接口
curl https://api.webspark.club/api/tags

# 测试网站列表
curl https://api.webspark.club/api/websites/sorted-list
```

## 🔧 运维管理

### 日常管理命令

```bash
# 查看应用状态
pm2 status

# 查看日志
pm2 logs webspark-backend

# 重启应用
pm2 restart webspark-backend

# 停止应用  
pm2 stop webspark-backend

# 查看监控
pm2 monit
```

### 更新部署
```bash
cd /www/wwwroot/webspark/backend

# 拉取最新代码
git pull origin main

# 安装新依赖 (如有)
npm install

# 运行数据库迁移 (如有)
npm run db:deploy

# 重新构建
npm run build

# 重启应用
pm2 restart webspark-backend
```

### 数据库备份
```bash
# 手动备份
mysqldump -u webspark -p webspark > backup_$(date +%Y%m%d_%H%M%S).sql

# 设置定时备份 (crontab -e)
0 2 * * * mysqldump -u webspark -p'your_password' webspark > /www/backup/webspark_$(date +\%Y\%m\%d).sql
```

## 🚨 故障排除

### 常见问题

#### 1. 数据库连接失败
```bash
# 检查数据库状态
systemctl status mysql

# 检查数据库连接
mysql -u webspark -p -e "SELECT 1"

# 查看错误日志
tail -f /www/wwwroot/webspark/backend/logs/err.log
```

#### 2. Nginx配置错误
```bash
# 检查配置语法
nginx -t

# 重新加载配置
nginx -s reload

# 查看错误日志
tail -f /www/server/nginx/logs/error.log
```

#### 3. Node.js应用错误
```bash
# 查看应用日志
pm2 logs webspark-backend --lines 100

# 检查端口占用
netstat -tulpn | grep 3001

# 手动启动检查
cd /www/wwwroot/webspark/backend
node dist/index.js
```

#### 4. SSL证书问题
```bash
# 检查证书状态
openssl x509 -in /path/to/cert.pem -text -noout

# 重新申请证书 (通过宝塔面板SSL设置)
```

### 性能优化

#### 1. 数据库优化
```sql
-- 添加必要的索引
ALTER TABLE websites ADD INDEX idx_status_deleted (status, deletedAt);
ALTER TABLE websites ADD INDEX idx_created_at (createdAt);
ALTER TABLE websites ADD INDEX idx_slug (slug);
```

#### 2. Nginx优化
```nginx
# 在网站配置中添加
location /api/ {
    # 启用gzip压缩
    gzip on;
    gzip_types application/json;
    
    # 设置缓存头
    expires 5m;
    add_header Cache-Control "public, must-revalidate";
    
    # 代理配置
    proxy_pass http://127.0.0.1:3001;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
}

# 静态资源缓存
location /uploads/ {
    expires 7d;
    add_header Cache-Control "public, immutable";
}
```

## 🛡️ 安全建议

### 1. 系统安全
- 定期更新系统和软件包
- 配置防火墙，只开放必要端口
- 修改SSH默认端口
- 禁用root用户SSH登录

### 2. 应用安全  
- 定期更新Node.js依赖
- 设置强密码策略
- 配置IP白名单 (如有需要)
- 启用访问日志监控

### 3. 数据安全
- 配置自动数据库备份
- 异地备份重要数据
- 定期检查备份完整性
- 设置备份文件加密

## 📊 监控告警

### 1. 基础监控 (通过宝塔面板)
- CPU/内存使用率
- 磁盘空间
- 网络流量
- 服务状态

### 2. 应用监控
```bash
# 设置健康检查脚本
cat > /www/server/cron/health_check.sh <<EOF
#!/bin/bash
if ! curl -f https://api.webspark.club/health; then
    pm2 restart webspark-backend
    echo "$(date): API服务重启" >> /www/logs/health_check.log
fi
EOF

chmod +x /www/server/cron/health_check.sh

# 添加定时任务 (每5分钟检查一次)
# */5 * * * * /www/server/cron/health_check.sh
```

## 📞 技术支持

如遇到部署问题，请检查:
1. 服务器硬件配置是否满足要求
2. 网络连接和域名解析是否正常  
3. 数据库连接和权限配置
4. Node.js版本和依赖安装
5. 环境变量配置是否正确

部署完成后，你的API将在 `https://api.webspark.club` 可用。 