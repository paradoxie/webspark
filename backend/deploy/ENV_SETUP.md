# 环境变量配置说明

## 必需配置

### 1. 数据库配置
```bash
DATABASE_URL="mysql://用户名:密码@localhost:3306/数据库名"
```

### 2. JWT 配置
```bash
JWT_SECRET="你的超级安全的JWT密钥"
JWT_EXPIRES_IN="7d"
```

### 3. GitHub OAuth 配置

#### 3.1 创建 GitHub OAuth App
1. 访问 GitHub Settings → Developer settings → OAuth Apps
2. 点击 "New OAuth App"
3. 填写信息：
   - Application name: WebSpark.club
   - Homepage URL: https://webspark.club
   - Authorization callback URL: https://webspark.club/api/auth/callback/github

#### 3.2 配置环境变量
```bash
GITHUB_CLIENT_ID="你的GitHub Client ID"
GITHUB_CLIENT_SECRET="你的GitHub Client Secret"
```

### 4. 服务器配置
```bash
PORT=3001
NODE_ENV="production"
FRONTEND_URL="https://webspark.club"
```

### 5. 文件上传配置
```bash
UPLOAD_DIR="uploads"
MAX_FILE_SIZE=5242880  # 5MB
```

## 部署后检查清单

- [ ] 数据库连接正常
- [ ] JWT 密钥已设置
- [ ] GitHub OAuth 配置正确
- [ ] SSL 证书已安装
- [ ] 反向代理配置正确
- [ ] PM2 进程运行正常
- [ ] Nginx 配置无误
- [ ] 防火墙已开放必要端口
- [ ] 域名解析正确指向服务器IP

## 测试接口

部署完成后，测试以下接口：

```bash
# 健康检查
curl https://api.webspark.club/health

# 获取标签列表
curl https://api.webspark.club/api/tags

# 获取网站列表
curl https://api.webspark.club/api/websites/sorted-list
```