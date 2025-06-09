# WebSpark.club 详细部署指南

本文档提供了将 WebSpark.club 项目部署到生产环境的详细步骤，采用前端部署到 Cloudflare Pages、后端部署到宝塔面板的混合部署方案。

## 目录

- [准备工作](#准备工作)
- [前端部署 (Cloudflare Pages)](#前端部署-cloudflare-pages)
- [后端部署 (宝塔面板)](#后端部署-宝塔面板)
- [域名配置与SSL](#域名配置与ssl)
- [数据库备份与维护](#数据库备份与维护)
- [故障排除](#故障排除)

## 准备工作

### 1. 域名准备

1. 注册一个域名（如 `webspark.club`）
2. 将域名添加到 Cloudflare，设置 DNS 记录：
   - 主域名 `webspark.club` → 指向 Cloudflare Pages
   - 子域名 `api.webspark.club` → 指向你的服务器 IP

### 2. 服务器准备

1. 租用一台服务器（推荐配置：2核4G，50GB SSD）
2. 操作系统：Ubuntu 20.04 LTS 或 CentOS 8
3. 开放端口：22(SSH)、80(HTTP)、443(HTTPS)

### 3. GitHub 准备

1. 创建 GitHub 仓库存放项目代码
2. 创建 GitHub OAuth 应用：
   - 访问 GitHub → Settings → Developer settings → OAuth Apps → New OAuth App
   - 填写应用信息：
     - Application name: `WebSpark.club`
     - Homepage URL: `https://webspark.club`
     - Authorization callback URL: `https://webspark.club/api/auth/callback/github`
   - 记录 `Client ID` 和 `Client Secret`

## 前端部署 (Cloudflare Pages)

### 1. 准备前端代码

1. 确保前端代码中的 API 地址已配置为生产环境：

```typescript
// frontend/src/lib/api.ts
const API_URL = process.env.NEXT_PUBLIC_STRAPI_API_URL || 'https://api.webspark.club/api';
```

2. 确保 `.env.production` 文件包含正确的环境变量：

```
NEXT_PUBLIC_STRAPI_API_URL=https://api.webspark.club/api
NEXTAUTH_URL=https://webspark.club
```

3. 将代码推送到 GitHub 仓库

### 2. Cloudflare Pages 配置

1. 登录 Cloudflare 控制台
2. 进入 `Pages` 页面，点击 `Create a project`
3. 选择 `Connect to Git`，授权并选择你的 GitHub 仓库
4. 配置构建设置：
   - **Project name**: `webspark`
   - **Production branch**: `main`
   - **Framework preset**: `Next.js`
   - **Build command**: `cd frontend && npm install && npm run build`
   - **Build output directory**: `frontend/.next`
   - **Root directory**: `/` (如果前端代码在根目录，则填 `/frontend`)
   - **Node.js version**: `18.x`

5. 添加环境变量：
   - `NEXT_PUBLIC_STRAPI_API_URL`: `https://api.webspark.club/api`
   - `NEXTAUTH_URL`: `https://webspark.club`
   - `NEXTAUTH_SECRET`: `<生成一个随机字符串>`
   - `GITHUB_CLIENT_ID`: `<GitHub OAuth App 的 Client ID>`
   - `GITHUB_CLIENT_SECRET`: `<GitHub OAuth App 的 Client Secret>`

6. 点击 `Save and Deploy`，等待部署完成

### 3. 自定义域名设置

1. 在 Cloudflare Pages 项目中，点击 `Custom domains`
2. 点击 `Set up a custom domain`
3. 输入你的域名 `webspark.club`，点击 `Continue`
4. 选择 `Activate domain`
5. 等待 DNS 验证和 SSL 证书颁发完成

## 后端部署 (宝塔面板)

### 1. 安装宝塔面板

```bash
# CentOS
yum install -y wget && wget -O install.sh http://download.bt.cn/install/install_6.0.sh && sh install.sh

# Ubuntu
wget -O install.sh http://download.bt.cn/install/install-ubuntu_6.0.sh && sudo bash install.sh
```

安装完成后，记录下显示的面板地址、用户名和密码。

### 2. 宝塔面板初始配置

1. 使用浏览器访问宝塔面板地址（如 `http://服务器IP:8888/xxxxx`）
2. 登录宝塔面板
3. 在软件商店中安装以下软件：
   - Nginx 1.20+
   - PostgreSQL 14+
   - PM2管理器
   - Node.js 18+
   - Redis (可选)
4. 在安全页面，放行端口 1337 (Strapi 默认端口)

### 3. 创建 PostgreSQL 数据库

1. 在宝塔面板中，点击 `PostgreSQL` → `添加数据库`
2. 填写数据库信息：
   - 数据库名：`webspark`
   - 用户名：`strapi`
   - 密码：`<设置一个安全密码>`
3. 点击 `提交`

### 4. 上传后端代码

1. 在宝塔面板中，点击 `文件` → 进入 `/www/wwwroot/` 目录
2. 点击 `上传` → 上传 backend 目录的压缩包
3. 解压文件：右键压缩包 → `解压` → `解压到当前目录`
4. 重命名解压后的目录为 `api.webspark.club`

### 5. 配置环境变量

1. 在宝塔面板中，进入 `/www/wwwroot/api.webspark.club` 目录
2. 创建或编辑 `.env` 文件，添加以下内容：

```
# 服务器配置
HOST=0.0.0.0
PORT=1337
URL=https://api.webspark.club

# 密钥 (使用随机生成的值)
APP_KEYS=<随机密钥1>,<随机密钥2>,<随机密钥3>,<随机密钥4>
API_TOKEN_SALT=<随机密钥>
ADMIN_JWT_SECRET=<随机密钥>
TRANSFER_TOKEN_SALT=<随机密钥>
JWT_SECRET=<随机密钥>

# 数据库配置
DATABASE_CLIENT=postgres
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=webspark
DATABASE_USERNAME=strapi
DATABASE_PASSWORD=<数据库密码>
DATABASE_SSL=false

# GitHub OAuth 配置
GITHUB_CLIENT_ID=<GitHub OAuth App 的 Client ID>
GITHUB_CLIENT_SECRET=<GitHub OAuth App 的 Client Secret>
```

### 6. 安装依赖并构建

1. 在宝塔面板中，点击 `终端` → 新建终端会话
2. 执行以下命令：

```bash
cd /www/wwwroot/api.webspark.club
npm install
npm run build
```

### 7. 配置 PM2 进程管理

1. 在宝塔面板中，点击 `PM2管理器` → `添加项目`
2. 填写项目信息：
   - 项目名称：`strapi`
   - 启动目录：`/www/wwwroot/api.webspark.club`
   - 启动文件：`npm`
   - 启动参数：`run start`
   - 运行用户：`www`
   - 项目描述：`WebSpark.club Strapi 后端`
3. 点击 `提交`

### 8. 配置 Nginx 站点

1. 在宝塔面板中，点击 `网站` → `添加站点`
2. 填写站点信息：
   - 域名：`api.webspark.club`
   - 备注：`WebSpark API`
   - 根目录：`/www/wwwroot/api.webspark.club/public`
   - PHP版本：`纯静态`
   - 启用SSL：勾选 `Let's Encrypt` 并选择 `强制HTTPS`
3. 点击 `提交`
4. 站点创建后，点击站点名称 → `配置文件`，修改为以下内容：

```nginx
server {
    listen 80;
    listen 443 ssl http2;
    server_name api.webspark.club;
    
    # SSL配置（由宝塔自动生成）
    
    # 禁止访问敏感文件
    location ~ ^/(\.user.ini|\.htaccess|\.git|\.env|\.svn|\.project|LICENSE|README.md) {
        return 404;
    }
    
    # 静态文件缓存
    location ~ .*\.(gif|jpg|jpeg|png|bmp|swf|ico|svg|webp)$ {
        expires 30d;
        access_log off;
    }
    
    location ~ .*\.(js|css)?$ {
        expires 12h;
        access_log off;
    }
    
    # 主要代理配置
    location / {
        proxy_pass http://127.0.0.1:1337;
        proxy_http_version 1.1;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Server $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Host $http_host;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_pass_request_headers on;
    }
}
```

5. 保存配置并重启 Nginx

## 域名配置与SSL

### 1. Cloudflare DNS 设置

1. 登录 Cloudflare 控制台
2. 选择你的域名
3. 进入 `DNS` 页面
4. 添加以下记录：
   - 类型: `A`，名称: `api`，内容: `<服务器IP>`，代理状态: `已代理`
   - 类型: `CNAME`，名称: `www`，内容: `webspark.club`，代理状态: `已代理`

### 2. Cloudflare SSL 设置

1. 在 Cloudflare 控制台中，进入 `SSL/TLS` 页面
2. 将加密模式设置为 `完全` 或 `完全（严格）`
3. 在 `边缘证书` 标签中，确保 `始终使用 HTTPS` 已启用

### 3. 宝塔面板 SSL 设置

1. 在宝塔面板中，点击 `网站` → 点击 `api.webspark.club` → `SSL`
2. 选择 `Let's Encrypt` 选项
3. 填写邮箱，选择域名 `api.webspark.club`
4. 点击 `申请` 等待证书颁发
5. 证书颁发后，勾选 `强制HTTPS`，点击 `保存`

## 数据库备份与维护

### 1. 配置自动备份

1. 在宝塔面板中，点击 `计划任务` → `添加计划任务`
2. 填写任务信息：
   - 任务名称：`PostgreSQL备份`
   - 执行周期：`每天`，时间设置为凌晨（如 `03:00`）
   - 脚本内容：

```bash
#!/bin/bash
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="/www/backup/postgresql"
mkdir -p $BACKUP_DIR

# 备份数据库
/www/server/pgsql/bin/pg_dump -U strapi webspark | gzip > "$BACKUP_DIR/webspark_$TIMESTAMP.sql.gz"

# 保留最近30天的备份，删除更早的
find $BACKUP_DIR -type f -name "webspark_*.sql.gz" -mtime +30 -delete

# 可选：上传到远程存储（如对象存储）
# rclone copy "$BACKUP_DIR/webspark_$TIMESTAMP.sql.gz" remote:webspark-backups/
```

3. 点击 `提交`

### 2. 配置日志轮转

1. 在宝塔面板中，点击 `计划任务` → `添加计划任务`
2. 填写任务信息：
   - 任务名称：`日志轮转`
   - 执行周期：`每周`，时间设置为周日凌晨（如 `04:00`）
   - 脚本内容：

```bash
#!/bin/bash
LOG_DIR="/www/wwwroot/api.webspark.club/.pm2/logs"
find $LOG_DIR -type f -name "*.log*" -mtime +7 -delete
```

3. 点击 `提交`

## 故障排除

### 1. 前端部署问题

#### 构建失败

**问题**: Cloudflare Pages 构建失败
**解决方案**:
1. 检查构建日志，查找错误信息
2. 常见原因：
   - Node.js 版本不匹配：在 Cloudflare Pages 设置中调整 Node.js 版本
   - 依赖问题：确保 `package.json` 中的依赖版本正确
   - 环境变量缺失：检查是否添加了所有必要的环境变量

#### 登录问题

**问题**: GitHub OAuth 登录失败
**解决方案**:
1. 确认 GitHub OAuth App 的回调 URL 设置正确
2. 检查环境变量 `GITHUB_CLIENT_ID` 和 `GITHUB_CLIENT_SECRET` 是否配置正确
3. 确认 `NEXTAUTH_URL` 设置为生产环境的 URL
4. 检查浏览器控制台是否有错误信息

### 2. 后端部署问题

#### Strapi 启动失败

**问题**: PM2 显示 Strapi 进程启动失败
**解决方案**:
1. 检查日志：`cat /www/wwwroot/api.webspark.club/.pm2/logs/strapi-error.log`
2. 常见原因：
   - 数据库连接问题：确认 PostgreSQL 服务运行正常，检查数据库凭据
   - 端口冲突：确认端口 1337 未被其他进程占用
   - 权限问题：执行 `chown -R www:www /www/wwwroot/api.webspark.club`

#### API 请求失败

**问题**: 前端无法连接到后端 API
**解决方案**:
1. 检查 Nginx 配置是否正确
2. 确认 Strapi 服务正在运行：`pm2 status`
3. 测试 API 可用性：`curl -I https://api.webspark.club/api/websites`
4. 检查 CORS 配置：
   - 在 Strapi 后台 → Settings → CORS
   - 确保已添加前端域名 `https://webspark.club`

### 3. 数据库问题

#### 连接失败

**问题**: Strapi 无法连接到 PostgreSQL
**解决方案**:
1. 确认 PostgreSQL 服务运行状态：`systemctl status postgresql`
2. 检查数据库凭据是否正确
3. 确认 PostgreSQL 配置允许本地连接：
   - 编辑 `/www/server/pgsql/data/pg_hba.conf`
   - 确保包含 `host all all 127.0.0.1/32 md5`

#### 数据库性能

**问题**: 数据库查询缓慢
**解决方案**:
1. 在宝塔面板中，点击 `PostgreSQL` → `性能调优`
2. 根据服务器配置调整参数：
   - `shared_buffers`: 设置为服务器内存的 25%
   - `work_mem`: 根据并发连接数调整
3. 重启 PostgreSQL 服务

---

如果遇到本文档未涵盖的问题，请参考 [Strapi 官方文档](https://docs.strapi.io/) 和 [Next.js 官方文档](https://nextjs.org/docs)，或联系项目维护者获取支持。 