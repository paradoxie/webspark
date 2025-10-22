# Cloudflare R2 配置指南

本项目使用 Cloudflare R2 作为图片存储方案，替代本地文件系统。

## 🎯 为什么使用 R2

- ✅ **零出口费用** - 不收取数据传输费用
- ✅ **全球 CDN** - Cloudflare 全球网络加速
- ✅ **高可用性** - 无需担心服务器磁盘空间
- ✅ **S3 兼容** - 使用标准 AWS S3 SDK
- ✅ **低成本** - 存储成本仅 $0.015/GB/月

## 📋 前置要求

- Cloudflare 账户
- 已添加域名到 Cloudflare（可选，用于自定义域名）

## 🚀 配置步骤

### 1. 创建 R2 存储桶

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 在左侧菜单选择 **R2**
3. 点击 **创建存储桶**
4. 输入存储桶名称，例如：`webspark`
5. 选择区域（自动）
6. 点击 **创建存储桶**

### 2. 获取 API 凭证

#### 2.1 创建 API 令牌
1. 在 R2 页面，点击 **管理 R2 API 令牌**
2. 点击 **创建 API 令牌**
3. 填写信息：
   - **令牌名称**：`webspark-backend`
   - **权限**：选择 `对象读写`
   - **TTL**：永久（或根据需要设置）
4. 点击 **创建 API 令牌**
5. **重要**：立即复制以下信息（只显示一次）：
   - Access Key ID
   - Secret Access Key

#### 2.2 获取 Account ID
1. 在 Cloudflare Dashboard 主页
2. 右侧可以看到 **Account ID**
3. 复制保存

### 3. 配置公共访问（可选但推荐）

有两种方式让图片公开访问：

#### 方式 1：使用 R2.dev 子域名（最简单）

1. 进入你创建的存储桶
2. 点击 **设置** 标签
3. 找到 **公共访问**
4. 点击 **允许访问**
5. 点击 **启用 R2.dev 子域名**
6. 复制生成的 URL，格式类似：`https://pub-xxxxx.r2.dev`

#### 方式 2：使用自定义域名（推荐）

1. 在存储桶设置中，找到 **自定义域名**
2. 点击 **连接域名**
3. 输入你的域名，例如：`cdn.webspark.club`
4. 点击 **继续**
5. Cloudflare 会自动配置 DNS
6. 使用这个自定义域名作为 `R2_PUBLIC_URL`

### 4. 配置后端环境变量

编辑 `backend/.env` 文件，添加以下配置：

```env
# Cloudflare R2 存储配置
R2_ACCOUNT_ID="your-account-id"
R2_ACCESS_KEY_ID="your-access-key-id"
R2_SECRET_ACCESS_KEY="your-secret-access-key"
R2_BUCKET_NAME="webspark"
R2_PUBLIC_URL="https://pub-xxxxx.r2.dev"  # 或自定义域名
```

**参数说明**：

- `R2_ACCOUNT_ID` - Cloudflare Account ID
- `R2_ACCESS_KEY_ID` - API 令牌的 Access Key ID
- `R2_SECRET_ACCESS_KEY` - API 令牌的 Secret Access Key
- `R2_BUCKET_NAME` - 存储桶名称
- `R2_PUBLIC_URL` - 公共访问 URL（不要以 `/` 结尾）

### 5. 配置 CORS（跨域访问）

如果前端需要直接访问图片，需要配置 CORS：

1. 在存储桶设置中，找到 **CORS 策略**
2. 点击 **添加 CORS 策略**
3. 添加以下配置：

```json
[
  {
    "AllowedOrigins": [
      "https://webspark.club",
      "http://localhost:3000"
    ],
    "AllowedMethods": ["GET", "HEAD"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": [],
    "MaxAgeSeconds": 3600
  }
]
```

## 🧪 测试配置

### 1. 测试上传功能

```bash
cd backend

# 启动开发服务器
npm run dev
```

### 2. 使用 curl 测试上传

```bash
# 获取认证 token（需要先登录）
TOKEN="your-jwt-token"

# 上传测试图片
curl -X POST http://localhost:3001/api/upload/screenshot \
  -H "Authorization: Bearer $TOKEN" \
  -F "screenshot=@test-image.jpg"
```

### 3. 检查返回结果

成功返回示例：
```json
{
  "message": "Screenshot uploaded successfully",
  "data": {
    "url": "https://pub-xxxxx.r2.dev/screenshots/test-1234567890-abc123.jpg",
    "filename": "test-1234567890-abc123.jpg"
  }
}
```

### 4. 验证图片访问

在浏览器中打开返回的 URL，应该能看到上传的图片。

## 🔒 安全建议

### 1. API 令牌管理
- ✅ 使用最小权限原则（仅对象读写）
- ✅ 定期轮换 API 令牌
- ✅ 不要提交 `.env` 文件到 Git
- ✅ 使用环境变量管理敏感信息

### 2. 存储桶访问控制
- ✅ 不要启用"允许所有人上传"
- ✅ 所有上传都通过后端 API
- ✅ 实施文件大小限制（当前 5MB）
- ✅ 验证文件类型（仅允许图片）

### 3. 访问控制
```typescript
// 后端已实现的安全措施
- 文件类型验证（仅图片）
- 文件大小限制（5MB）
- 用户认证（JWT）
- 图片处理和优化（sharp）
```

## 💰 成本估算

基于 Cloudflare R2 定价（2024）：

**存储成本**：
- $0.015/GB/月
- 1000 张图片（平均 500KB）≈ 0.5GB ≈ $0.0075/月

**操作成本**：
- Class A 操作（写入）：$4.50/百万次
- Class B 操作（读取）：$0.36/百万次
- 10万次上传 ≈ $0.45
- 100万次访问 ≈ $0.36

**出口流量**：
- 完全免费（这是最大优势！）

**预估月成本**：
- 小型项目（< 10GB，< 10万访问）：**$1-5/月**
- 中型项目（100GB，100万访问）：**$5-20/月**

## 🛠️ 故障排除

### 问题 1：上传失败 - "Access Denied"

**原因**：API 令牌权限不足或配置错误

**解决**：
1. 检查 API 令牌是否有 "对象读写" 权限
2. 验证 Account ID 是否正确
3. 确认存储桶名称拼写正确

### 问题 2：图片无法访问 - 404

**原因**：未启用公共访问

**解决**：
1. 在存储桶设置中启用 R2.dev 子域名
2. 或配置自定义域名
3. 确认 `R2_PUBLIC_URL` 配置正确

### 问题 3：CORS 错误

**原因**：跨域策略未配置

**解决**：
1. 在存储桶设置中添加 CORS 策略
2. 确保前端域名在 AllowedOrigins 中
3. 检查是否包含开发环境域名

### 问题 4：连接超时

**原因**：网络问题或 Endpoint 配置错误

**解决**：
```typescript
// 检查 R2 服务配置
endpoint: `https://${accountId}.r2.cloudflarestorage.com`
region: 'auto'
```

## 📊 监控和日志

### 查看使用情况

1. 在 Cloudflare Dashboard 中进入 R2
2. 选择你的存储桶
3. 查看 **指标** 标签：
   - 存储使用量
   - 请求次数
   - 带宽使用

### 后端日志

```bash
# 查看上传日志
pm2 logs webspark-backend --lines 100 | grep upload

# 查看错误日志
tail -f backend/logs/err.log
```

## 🔄 迁移现有图片

如果你有现有的本地图片需要迁移到 R2：

### 创建迁移脚本

```bash
# 创建迁移脚本
cat > backend/src/scripts/migrate-to-r2.ts <<'EOF'
import { r2Storage } from '../services/r2Storage';
import { prisma } from '../db';
import fs from 'fs/promises';
import path from 'path';

async function migrateImages() {
  // 获取所有用户头像
  const users = await prisma.user.findMany({
    where: { avatar: { startsWith: '/uploads' } }
  });

  for (const user of users) {
    const localPath = path.join(process.cwd(), user.avatar);
    const buffer = await fs.readFile(localPath);
    const filename = path.basename(user.avatar);

    const newUrl = await r2Storage.uploadImage(buffer, filename, 'avatar');

    await prisma.user.update({
      where: { id: user.id },
      data: { avatar: newUrl }
    });

    console.log(`Migrated: ${user.email}`);
  }
}

migrateImages().then(() => console.log('Done!'));
EOF

# 运行迁移
npx tsx backend/src/scripts/migrate-to-r2.ts
```

## 📞 技术支持

- [Cloudflare R2 文档](https://developers.cloudflare.com/r2/)
- [AWS S3 SDK 文档](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-s3/)
- [项目 GitHub Issues](https://github.com/your-username/webspark/issues)

---

配置完成后，你的项目将使用 Cloudflare R2 作为图片存储，享受高性能、低成本的全球 CDN 服务！
