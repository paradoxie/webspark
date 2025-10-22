# 宝塔部署完整指南

> **目标读者**: 使用宝塔面板的用户
> **预计时间**: 20-30 分钟（不含 R2 配置）
> **难度**: ⭐⭐☆☆☆

---

## 📋 准备工作

### 1. 服务器要求

- **系统**: Ubuntu 20.04+ / CentOS 8+
- **内存**: 最低 2GB
- **存储**: 最低 20GB
- **已安装**: 宝塔面板 7.x+

### 2. 必需软件（通过宝塔安装）

- [x] **Nginx** 1.22+
- [x] **MySQL** 8.0
- [x] **Node.js** 18.x
- [x] **PM2**（Node 项目管理器自带）

### 3. 必需账号

- [x] **Cloudflare 账号**（用于 R2 存储）
- [x] **GitHub 账号**（用于 OAuth 登录）

---

## 🚀 第一步: Cloudflare R2 配置

> ⚠️ **重要**: 必须先配置 R2，否则服务无法启动

### 1.1 创建 R2 存储桶

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 左侧菜单选择 **R2**
3. 点击 **创建存储桶**
4. 存储桶名称输入: `webspark`
5. 点击 **创建存储桶**

### 1.2 获取 API 凭证

1. R2 页面点击 **管理 R2 API 令牌**
2. 点击 **创建 API 令牌**
3. 配置令牌：
   - 令牌名称: `webspark-backend`
   - 权限: `对象读写`
4. 点击 **创建 API 令牌**
5. **⚠️ 立即复制保存**（只显示一次）：
   - `Access Key ID`：d1b954b7668d83ca886c48b0125e5710
   - `Secret Access Key`：ddc829cfa528b00b0b485fe8d1868d9927cb97e12c683d118e3a9e650c4aed04

### 1.3 获取 Account ID

在 Cloudflare Dashboard 首页右侧可以看到 **Account ID**，复制保存：fd779a1e2fc944cb50206d4d73ea01a1

### 1.4 启用公共访问

1. 进入刚创建的存储桶
2. **设置** → **公共访问**
3. 点击 **允许访问**
4. 点击 **启用 R2.dev 子域名**
5. 复制生成的 URL（格式: `https://pub-xxxxx.r2.dev`）：https://pub-85464433b88043e6a68790592e923ac1.r2.dev

> 💡 **提示**: 也可以使用自定义域名，更专业。详见文档末尾。

---

## 🗄️ 第二步: 创建数据库

### 2.1 通过宝塔面板创建

1. 登录宝塔面板
2. 左侧菜单 → **数据库**
3. 点击 **添加数据库**
4. 填写信息：
   - 数据库名: `webspark`
   - 用户名: `webspark`
   - 密码: 点击 **生成** 并**复制保存**
   - 访问权限: `本地服务器`
   - 编码: `utf8mb4`
5. 点击 **提交**

---

## 📦 第三步: 上传代码

### 3.1 方式一: Git 克隆（推荐）

```bash
cd /www/wwwroot
git clone https://github.com/your-username/webspark.git
cd webspark/backend
```

### 3.2 方式二: 手动上传

1. 宝塔面板 → **文件**
2. 进入 `/www/wwwroot/`
3. 上传项目压缩包
4. 解压并进入 `webspark/backend`

---

## ⚙️ 第四步: 配置环境变量

### 4.1 创建配置文件

```bash
cd /www/wwwroot/webspark/backend
cp .env.example .env
nano .env
```

### 4.2 填写配置（复制下面模板）

```env
# 服务器配置
PORT=3001
NODE_ENV=production
FRONTEND_URL=https://webspark.club

# 数据库连接（使用第二步创建的数据库信息）
DATABASE_URL="mysql://webspark:你的数据库密码@localhost:3306/webspark"

# 认证密钥（生成随机字符串）
NEXTAUTH_SECRET="替换为随机字符串-至少32位"
SESSION_SECRET="替换为随机字符串-至少32位"

# Cloudflare R2 配置（使用第一步获取的信息）
R2_ACCOUNT_ID="你的 Account ID"
R2_ACCESS_KEY_ID="wz0gpCWXTPmvUFmRswQtU9u5YqXZd3BxIG2bF1rERxY="
R2_SECRET_ACCESS_KEY="eZ3TSmFXkcOwpWoKJKpvecwVGUFOJRvnGa0241YBhSI="
R2_BUCKET_NAME="webspark"
R2_PUBLIC_URL="https://pub-xxxxx.r2.dev"
```

**生成随机密钥**:
```bash
# 生成 NEXTAUTH_SECRET
openssl rand -base64 32

# 生成 SESSION_SECRET
openssl rand -base64 32
```

> 💡 **配置检查清单**:
> - [ ] DATABASE_URL 中的密码正确
> - [ ] R2_ACCOUNT_ID 已填写
> - [ ] R2_ACCESS_KEY_ID 已填写
> - [ ] R2_SECRET_ACCESS_KEY 已填写
> - [ ] R2_PUBLIC_URL 已填写（不要以 `/` 结尾）
> - [ ] NEXTAUTH_SECRET 已生成
> - [ ] SESSION_SECRET 已生成

保存文件: `Ctrl + O` → `Enter` → `Ctrl + X`

---

## 🏗️ 第五步: 一键部署

```bash
cd /www/wwwroot/webspark/backend
chmod +x deploy.sh
./deploy.sh --seed
```

**脚本会自动完成**:
1. ✅ 检查环境（Node.js、MySQL）
2. ✅ 验证环境变量
3. ✅ 安装依赖
4. ✅ 数据库迁移
5. ✅ 填充种子数据
6. ✅ 构建项目
7. ✅ 启动 PM2 服务

**预计时间**: 3-5 分钟

---

## 🌐 第六步: 配置 Nginx

### 6.1 添加网站

1. 宝塔面板 → **网站**
2. 点击 **添加站点**
3. 填写信息：
   - 域名: `api.webspark.club`
   - 根目录: `/www/wwwroot/webspark/backend`
   - PHP 版本: `纯静态`
4. 点击 **提交**

### 6.2 配置反向代理

1. 找到刚创建的网站，点击 **设置**
2. 左侧菜单 → **反向代理**
3. 点击 **添加反向代理**
4. 填写信息：
   - 代理名称: `webspark-api`
   - 目标 URL: `http://127.0.0.1:3001`
   - 发送域名: `$host`
5. 点击 **提交**

### 6.3 配置 SSL 证书

1. 网站设置 → **SSL**
2. 选择 **Let's Encrypt**
3. 勾选域名: `api.webspark.club`
4. 点击 **申请**
5. 申请成功后，开启 **强制 HTTPS**

---

## ✅ 第七步: 验证部署

### 7.1 健康检查

```bash
curl https://api.webspark.club/health
```

**预期返回**:
```json
{
  "status": "ok",
  "timestamp": "2025-10-20T..."
}
```

### 7.2 测试 API

```bash
# 获取标签列表
curl https://api.webspark.club/api/tags

# 获取网站列表
curl https://api.webspark.club/api/websites/sorted-list
```

---

## 🚀 第八步: 性能优化（推荐）

> ⚠️ **重要**: 这一步可以将性能提升 5-10 倍，强烈建议执行！

### 8.1 安装 Redis（5 分钟）

1. 宝塔面板 → **软件商店**
2. 搜索 **Redis** → 点击 **安装**
3. 等待安装完成

### 8.2 优化数据库（3 分钟）

```bash
cd /www/wwwroot/webspark/backend
./optimize-database.sh <你的数据库密码>
```

### 8.3 重启应用

```bash
pm2 restart webspark-backend
```

### 8.4 验证优化

```bash
# 检查 PM2 状态（应该看到 2 个实例）
pm2 status

# 查看性能监控
./monitor.sh <你的数据库密码>
```

**详细优化指南**: 查看 [PERFORMANCE_OPTIMIZATION.md](../PERFORMANCE_OPTIMIZATION.md)

---

## 🔧 常用管理命令

### PM2 进程管理

```bash
# 查看服务状态
pm2 status

# 查看日志（最近50行）
pm2 logs webspark-backend --lines 50

# 实时查看日志
pm2 logs webspark-backend

# 重启服务
pm2 restart webspark-backend

# 停止服务
pm2 stop webspark-backend

# 监控
pm2 monit
```

### 更新部署

```bash
cd /www/wwwroot/webspark/backend
git pull                    # 拉取最新代码
npm install                 # 安装新依赖
npm run db:deploy           # 数据库迁移
npm run build               # 重新构建
pm2 restart webspark-backend  # 重启服务
```

或使用一键脚本:
```bash
./deploy.sh
```

---

## 🚨 故障排查

### 问题 1: 部署脚本报错 "环境变量未设置"

**原因**: `.env` 文件配置不完整

**解决**:
```bash
# 检查 .env 文件
cat .env

# 确保所有必需变量都有值且不为空
# 特别检查:
# - DATABASE_URL
# - R2_ACCOUNT_ID
# - R2_ACCESS_KEY_ID
# - R2_SECRET_ACCESS_KEY
# - R2_PUBLIC_URL
```

### 问题 2: 数据库连接失败

**原因**: DATABASE_URL 配置错误

**解决**:
```bash
# 测试数据库连接
mysql -u webspark -p

# 检查 DATABASE_URL 格式
# 正确: mysql://webspark:密码@localhost:3306/webspark
# 注意: 密码中的特殊字符需要 URL 编码
```

### 问题 3: 图片上传失败

**原因**: R2 配置不正确

**解决步骤**:
1. 检查 R2 API 凭证是否正确
2. 确认 API 令牌权限为 "对象读写"
3. 验证存储桶名称匹配
4. 确认已启用公共访问
5. 检查 R2_PUBLIC_URL 不以 `/` 结尾

**测试 R2 配置**:
```bash
# 查看服务启动日志
pm2 logs webspark-backend --lines 100

# 如果看到 "R2 configuration is incomplete"
# 说明环境变量配置有问题
```

### 问题 4: Nginx 502 Bad Gateway

**原因**: PM2 服务未启动或端口不匹配

**解决**:
```bash
# 检查 PM2 状态
pm2 status

# 如果服务不在运行
pm2 start ecosystem.config.js

# 检查端口
netstat -tulpn | grep 3001
```

### 问题 5: SSL 证书申请失败

**原因**: 域名未解析或 80 端口被占用

**解决**:
1. 确认域名 DNS 解析正确
2. 确认 80 端口未被占用
3. 暂时关闭防火墙再申请
4. 检查宝塔面板网站列表，删除重复站点

---

## 📊 性能优化（可选）

### 数据库索引优化

```sql
-- 连接数据库
mysql -u webspark -p webspark

-- 添加索引（提升查询性能）
ALTER TABLE websites ADD INDEX idx_status_deleted (status, deletedAt);
ALTER TABLE websites ADD INDEX idx_created_at (createdAt);
ALTER TABLE websites ADD INDEX idx_author (authorId);
```

### Nginx 缓存优化

1. 网站设置 → **配置文件**
2. 在 `location /api/` 块中添加:

```nginx
# 启用 gzip 压缩
gzip on;
gzip_types application/json;

# API 缓存（5分钟）
expires 5m;
add_header Cache-Control "public, must-revalidate";
```

---

## 📚 附录

### A. 使用 R2 自定义域名（推荐）

**优势**: 更专业，不依赖 R2.dev 子域名

**步骤**:
1. Cloudflare Dashboard → **R2** → 你的存储桶
2. **设置** → **自定义域名**
3. 点击 **连接域名**
4. 输入: `cdn.webspark.club`
5. Cloudflare 自动配置 DNS
6. 更新 `.env`:
   ```env
   R2_PUBLIC_URL="https://cdn.webspark.club"
   ```
7. 重启服务: `pm2 restart webspark-backend`

### B. 配置 CORS（如需前端直接访问 R2）

1. R2 存储桶 → **设置** → **CORS 策略**
2. 添加:

```json
[
  {
    "AllowedOrigins": [
      "https://webspark.club",
      "http://localhost:3000"
    ],
    "AllowedMethods": ["GET", "HEAD"],
    "AllowedHeaders": ["*"],
    "MaxAgeSeconds": 3600
  }
]
```

### C. 设置自动备份

**数据库备份**:
```bash
# 创建备份脚本
cat > /root/backup-webspark.sh <<'EOF'
#!/bin/bash
mysqldump -u webspark -p'你的密码' webspark > /www/backup/webspark_$(date +\%Y\%m\%d).sql
find /www/backup -name "webspark_*.sql" -mtime +7 -delete
EOF

chmod +x /root/backup-webspark.sh

# 添加定时任务（每天凌晨2点）
crontab -e
# 添加: 0 2 * * * /root/backup-webspark.sh
```

---

## 🎉 部署完成！

你的 API 现在应该可以通过 `https://api.webspark.club` 访问了！

**下一步**:
1. 配置前端项目
2. 配置 GitHub OAuth
3. 测试完整功能流程

**需要帮助?**
- 查看详细文档: [完整部署指南](./DEPLOYMENT_GUIDE.md)
- R2 配置问题: [R2 配置指南](./R2_SETUP.md)
