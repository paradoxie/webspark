# GitHub OAuth 配置指南

本文档将指导您完成WebSpark.club项目的GitHub OAuth认证配置。

## 📋 前置要求

- GitHub账户
- 已部署的前端应用（用于获取回调URL）

## 🚀 第一步：创建GitHub OAuth应用

### 1.1 访问GitHub开发者设置

1. 登录GitHub账户
2. 访问 **Settings** > **Developer settings** > **OAuth Apps**
3. 或直接访问：https://github.com/settings/developers

### 1.2 创建新的OAuth应用

1. 点击 **"New OAuth App"** 按钮
2. 填写应用信息：

```
Application name: WebSpark.club
Homepage URL: https://webspark.club  
Application description: Web开发者作品展示社区
Authorization callback URL: https://webspark.club/api/auth/callback/github
```

> **⚠️ 重要提醒：**
> - `Homepage URL` 应该是您前端应用的域名
> - `Authorization callback URL` 必须精确匹配，格式为：`https://你的域名/api/auth/callback/github`
> - 开发环境请使用：`http://localhost:3000/api/auth/callback/github`

### 1.3 获取客户端凭据

创建成功后，您将获得：
- **Client ID**（客户端ID）
- **Client Secret**（客户端密钥）

## 🔐 第二步：配置环境变量

### 2.1 前端环境变量

在 `frontend/.env.local` 文件中添加：

```bash
# NextAuth配置
NEXTAUTH_URL=https://webspark.club
NEXTAUTH_SECRET=your-super-secret-key-here

# GitHub OAuth
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret

# 后端API配置（如果需要）
NEXT_PUBLIC_API_URL=https://api.webspark.club
```

### 2.2 后端环境变量

在 `backend/.env` 文件中添加：

```bash
# JWT密钥（与前端的NEXTAUTH_SECRET保持一致）
NEXTAUTH_SECRET=your-super-secret-key-here

# 其他后端配置...
DATABASE_URL=postgresql://username:password@localhost:5432/webspark_db
PORT=3001
```

## ⚙️ 第三步：环境变量说明

### 必需变量

| 变量名 | 描述 | 示例值 |
|--------|------|---------|
| `NEXTAUTH_URL` | 前端应用的完整URL | `https://webspark.club` |
| `NEXTAUTH_SECRET` | JWT签名密钥，32位随机字符串 | `abcd1234...` |
| `GITHUB_CLIENT_ID` | GitHub OAuth应用的客户端ID | `Iv1.abc123def456` |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth应用的客户端密钥 | `ghp_abc123...` |

### 生成NEXTAUTH_SECRET

您可以使用以下命令生成安全的密钥：

```bash
# 使用openssl
openssl rand -base64 32

# 或使用node
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

## 🌍 第四步：不同环境的配置

### 开发环境

```bash
NEXTAUTH_URL=http://localhost:3000
GITHUB_CLIENT_ID=dev_client_id
GITHUB_CLIENT_SECRET=dev_client_secret
```

> **注意：** 开发环境需要单独创建一个OAuth应用，回调URL为 `http://localhost:3000/api/auth/callback/github`

### 生产环境

```bash
NEXTAUTH_URL=https://webspark.club
GITHUB_CLIENT_ID=prod_client_id
GITHUB_CLIENT_SECRET=prod_client_secret
```

## 🔍 第五步：验证配置

### 5.1 检查回调URL

确保GitHub OAuth应用中的回调URL与您的域名匹配：

- 生产环境：`https://webspark.club/api/auth/callback/github`
- 开发环境：`http://localhost:3000/api/auth/callback/github`

### 5.2 测试OAuth流程

1. 访问前端应用的登录页面
2. 点击"使用GitHub登录"
3. 验证是否能正确跳转到GitHub授权页面
4. 确认授权后能否正确跳转回应用并登录成功

## 🐛 常见问题排查

### 问题1：回调URL不匹配

**错误信息：** `redirect_uri_mismatch`

**解决方案：**
1. 检查GitHub OAuth应用中的Authorization callback URL
2. 确保与 `NEXTAUTH_URL` + `/api/auth/callback/github` 完全匹配
3. 注意http/https、端口号、域名的一致性

### 问题2：Client Secret无效

**错误信息：** `invalid_client`

**解决方案：**
1. 重新生成GitHub OAuth应用的Client Secret
2. 更新环境变量中的 `GITHUB_CLIENT_SECRET`
3. 重启应用

### 问题3：NEXTAUTH_SECRET缺失

**错误信息：** `Please define a NEXTAUTH_SECRET environment variable`

**解决方案：**
1. 生成一个32位的随机字符串
2. 设置 `NEXTAUTH_SECRET` 环境变量
3. 前后端使用相同的密钥值

## 📚 相关文档

- [NextAuth.js GitHub Provider](https://next-auth.js.org/providers/github)
- [GitHub OAuth Apps Documentation](https://docs.github.com/en/developers/apps/building-oauth-apps)
- [NextAuth.js Configuration](https://next-auth.js.org/configuration)

## 🔒 安全注意事项

1. **永远不要提交敏感信息到版本控制**
   - 将 `.env.local` 和 `.env` 添加到 `.gitignore`
   - 使用环境变量管理系统（如GitHub Secrets、Vercel环境变量等）

2. **定期轮换密钥**
   - 建议每季度更新 `NEXTAUTH_SECRET`
   - 如有安全疑虑，及时重新生成OAuth凭据

3. **限制OAuth应用权限**
   - GitHub OAuth应用默认只请求基础的用户信息
   - 按需添加额外的权限范围

## ✅ 配置检查清单

在部署前，请确认以下事项：

- [ ] GitHub OAuth应用已创建
- [ ] Client ID和Client Secret已获取
- [ ] 回调URL配置正确
- [ ] 前端环境变量已设置
- [ ] 后端环境变量已设置（如需要）
- [ ] NEXTAUTH_SECRET已生成并设置
- [ ] 开发和生产环境分别配置
- [ ] OAuth登录流程测试通过
- [ ] 敏感信息未提交到版本控制

---

如果您在配置过程中遇到问题，请提交GitHub Issue或联系项目维护者。 