# WebSpark Backend

基于 Node.js + Express + MySQL + Prisma 构建的 WebSpark.club 后端API。

## 技术栈

- **框架**: Express.js + TypeScript
- **数据库**: MySQL + Prisma ORM
- **认证**: NextAuth.js JWT验证
- **部署**: 宝塔面板 + PM2

## 快速开始

### 1. 安装依赖
```bash
npm install
```

### 2. 配置环境变量
复制 `.env.example` 到 `.env` 并填入正确的配置：
```bash
cp .env.example .env
```

### 3. 配置数据库
```bash
# 生成Prisma客户端
npm run db:generate

# 运行数据库迁移
npm run db:migrate

# 填充初始数据
npm run db:seed
```

### 4. 启动开发服务器
```bash
npm run dev
```

### 5. 构建生产版本
```bash
npm run build
npm start
```

## API文档

- 健康检查: `GET /health`
- 网站列表: `GET /api/websites/sorted-list`
- 网站详情: `GET /api/websites/:slug`
- 提交网站: `POST /api/websites`
- 点赞操作: `PUT /api/websites/:id/like`
- 收藏操作: `PUT /api/websites/:id/bookmark`
- 标签列表: `GET /api/tags`
- 提交举报: `POST /api/reports`

## 部署

参考 `deploy/DEPLOYMENT_GUIDE.md` 了解宝塔面板部署详情。
