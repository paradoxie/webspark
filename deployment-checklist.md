# 🚀 WebSpark.club 部署检查清单

## 📋 部署前准备

### ✅ 服务器要求
- [ ] VPS服务器 (推荐: 2GB RAM, 20GB 存储, Ubuntu 20.04+)
- [ ] 域名已购买 (例如: webspark.club)
- [ ] 域名DNS已解析到服务器IP
- [ ] 服务器SSH访问正常

### ✅ GitHub配置
- [ ] 代码仓库已准备
- [ ] GitHub OAuth应用已创建
- [ ] Client ID 和 Client Secret 已获取
- [ ] 回调URL设置: `https://your-domain.com/api/auth/callback/github`

### ✅ 必要信息收集
- [ ] 域名: `your-domain.com`
- [ ] API子域名: `api.your-domain.com`  
- [ ] MySQL密码 (强密码)
- [ ] GitHub OAuth凭据
- [ ] NextAuth Secret (32+字符)

---

## 🔧 后端部署步骤

### 1. 服务器环境配置
```bash
# 运行快速部署脚本
chmod +x quick-deploy.sh
./quick-deploy.sh
```

#### 手动部署步骤 (如果脚本失败)
- [ ] 系统更新: `sudo apt update && sudo apt upgrade -y`
- [ ] 安装Node.js 18: [官方指南](https://nodejs.org/)
- [ ] 安装MySQL 8.0: `sudo apt install mysql-server`
- [ ] 安装Nginx: `sudo apt install nginx`
- [ ] 安装PM2: `sudo npm install -g pm2`

### 2. 数据库配置
- [ ] MySQL服务启动: `sudo systemctl start mysql`
- [ ] 创建数据库: `CREATE DATABASE webspark;`
- [ ] 创建用户和授权
- [ ] 测试连接: `mysql -u webspark -p`

### 3. 应用部署
- [ ] 克隆代码: `git clone <your-repo>`
- [ ] 安装依赖: `npm install`
- [ ] 配置环境变量: 编辑 `.env`
- [ ] 数据库迁移: `npm run db:deploy`
- [ ] 构建应用: `npm run build`
- [ ] 启动服务: `pm2 start ecosystem.config.js`

### 4. Nginx配置
- [ ] 创建站点配置文件
- [ ] 启用站点: `sudo ln -s ...`
- [ ] 测试配置: `sudo nginx -t`
- [ ] 重启Nginx: `sudo systemctl restart nginx`

### 5. SSL证书
- [ ] 安装Certbot: `sudo apt install certbot python3-certbot-nginx`
- [ ] 申请证书: `sudo certbot --nginx -d api.your-domain.com`
- [ ] 设置自动续期

### 6. 验证后端
- [ ] PM2状态检查: `pm2 status`
- [ ] 健康检查: `curl https://api.your-domain.com/health`
- [ ] API测试: `curl https://api.your-domain.com/api/websites`
- [ ] 日志检查: `pm2 logs webspark-backend`

---

## 🎨 前端部署步骤

### 方案A: Vercel部署 (推荐)

#### 1. 准备工作
- [ ] 安装Vercel CLI: `npm i -g vercel`
- [ ] 登录Vercel: `vercel login`

#### 2. 部署配置
- [ ] 进入前端目录: `cd frontend`
- [ ] 初始化部署: `vercel`
- [ ] 配置环境变量 (见下表)
- [ ] 生产部署: `vercel --prod`

#### 3. 环境变量配置
| 变量名 | 值 | 说明 |
|--------|-----|------|
| `NEXTAUTH_URL` | `https://your-domain.com` | 前端URL |
| `NEXTAUTH_SECRET` | `your-secret-32-chars+` | NextAuth密钥 |
| `GITHUB_CLIENT_ID` | `your-github-client-id` | GitHub OAuth ID |
| `GITHUB_CLIENT_SECRET` | `your-github-secret` | GitHub OAuth Secret |
| `NEXT_PUBLIC_API_URL` | `https://api.your-domain.com` | 后端API URL |

### 方案B: Cloudflare Pages部署

#### 1. 连接仓库
- [ ] 登录Cloudflare Pages
- [ ] 连接GitHub仓库
- [ ] 选择 `frontend` 分支或目录

#### 2. 构建设置
- [ ] 构建命令: `npm run build`
- [ ] 输出目录: `.next`
- [ ] Node.js版本: `18`

#### 3. 环境变量
- [ ] 添加所有必要的环境变量 (同Vercel)

---

## 🔍 部署验证

### ✅ 后端API验证
```bash
# 健康检查
curl https://api.your-domain.com/health

# 网站列表API
curl https://api.your-domain.com/api/websites

# 分类API  
curl https://api.your-domain.com/api/categories

# 统计API
curl https://api.your-domain.com/api/websites/stats
```

### ✅ 前端功能验证
访问 `https://your-domain.com` 验证：
- [ ] 页面正常加载，无报错
- [ ] 网站列表正常显示
- [ ] 搜索功能工作正常
- [ ] GitHub登录功能正常
- [ ] 用户可以登录/注册
- [ ] 作品提交功能正常
- [ ] 点赞收藏功能正常
- [ ] 评论功能正常

### ✅ 完整用户流程测试
1. **游客访问**
   - [ ] 浏览首页
   - [ ] 查看作品列表
   - [ ] 搜索功能
   - [ ] 查看作品详情

2. **用户注册/登录**
   - [ ] GitHub OAuth登录
   - [ ] 个人信息完善
   - [ ] 退出登录

3. **用户互动**
   - [ ] 点赞作品
   - [ ] 收藏作品
   - [ ] 评论作品
   - [ ] 回复评论

4. **内容创建**
   - [ ] 提交新作品
   - [ ] 上传截图
   - [ ] 填写项目信息
   - [ ] 等待审核

---

## 🔧 监控和维护

### ✅ 监控设置
- [ ] PM2监控: `pm2 monit`
- [ ] 系统监控: `htop`, `df -h`, `free -h`
- [ ] 日志监控: `pm2 logs`, `nginx logs`
- [ ] 数据库备份脚本设置

### ✅ 安全检查
- [ ] 防火墙配置: `sudo ufw status`
- [ ] SSL证书有效性检查
- [ ] 敏感信息保护 (环境变量)
- [ ] 定期安全更新

### ✅ 性能优化
- [ ] 数据库索引优化
- [ ] Nginx缓存配置
- [ ] CDN设置 (Cloudflare)
- [ ] 图片优化

---

## 🚨 故障排除

### 常见问题和解决方案

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

#### 2. 前端无法连接API
- [ ] 检查 `NEXT_PUBLIC_API_URL` 环境变量
- [ ] 验证CORS配置
- [ ] 检查网络连接
- [ ] 查看浏览器控制台错误

#### 3. 数据库连接问题
```bash
# 检查MySQL服务
sudo systemctl status mysql

# 测试数据库连接
mysql -u webspark -p webspark

# 检查数据库配置
cat backend/.env | grep DATABASE_URL
```

#### 4. GitHub OAuth问题
- [ ] 验证Client ID和Secret
- [ ] 检查回调URL设置
- [ ] 确认OAuth应用状态

---

## 📞 技术支持

### 📍 重要文件位置
- **后端代码**: `/var/www/webspark/backend/`
- **环境配置**: `/var/www/webspark/backend/.env`
- **应用日志**: `/var/www/webspark/backend/logs/`
- **Nginx配置**: `/etc/nginx/sites-available/webspark-api`
- **SSL证书**: `/etc/letsencrypt/live/api.your-domain.com/`

### 📊 管理命令
```bash
# PM2管理
pm2 status                    # 查看进程状态
pm2 restart webspark-backend  # 重启应用
pm2 logs webspark-backend    # 查看日志
pm2 monit                     # 实时监控

# Nginx管理
sudo systemctl status nginx   # 检查状态
sudo nginx -t                 # 测试配置
sudo systemctl reload nginx   # 重载配置

# 数据库管理
mysql -u webspark -p          # 连接数据库
mysqldump -u webspark -p webspark > backup.sql  # 备份

# 系统监控
htop                          # 查看系统资源
df -h                         # 查看磁盘使用
free -h                       # 查看内存使用
```

---

## 🎉 部署完成

恭喜！如果所有检查项都已完成，您的WebSpark.club应用现在已经成功部署并运行在生产环境中。

### 🔗 访问地址
- **前端应用**: https://your-domain.com
- **后端API**: https://api.your-domain.com  
- **健康检查**: https://api.your-domain.com/health

### 🚀 下一步建议
1. **监控设置**: 配置Sentry等错误监控
2. **性能优化**: 设置Redis缓存
3. **SEO优化**: 配置sitemap和robots.txt
4. **内容管理**: 添加更多分类和标签
5. **社区建设**: 邀请开发者提交作品

**WebSpark.club现在已准备好为全球Web开发者服务！** 🌟