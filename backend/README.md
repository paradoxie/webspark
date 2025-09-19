# WebSpark.club Backend

基于 Node.js + Express + MySQL + Prisma 构建的 WebSpark.club 后端API，提供企业级安全性和完整的数据分析功能。

## 🚀 技术栈

- **框架**: Express.js + TypeScript
- **数据库**: MySQL + Prisma ORM
- **认证**: NextAuth.js JWT验证
- **安全**: 企业级安全防护体系
- **分析**: 用户行为和流量分析
- **部署**: 宝塔面板 + PM2

## 📁 项目结构

```
src/
├── routes/             # Express路由处理器
│   ├── websites.ts     # 网站CRUD操作
│   ├── users.ts        # 用户管理
│   ├── analytics.ts    # 数据分析API
│   ├── security.ts     # 安全监控API
│   ├── comments.ts     # 评论系统
│   ├── notifications.ts # 通知管理
│   └── admin.ts        # 管理员功能
├── middleware/         # Express中间件
│   ├── auth.ts         # 认证中间件
│   ├── security.ts     # 安全验证中间件
│   └── errorHandler.ts # 错误处理
├── services/           # 业务逻辑服务
│   ├── emailService.ts # 邮件通知服务
│   └── notificationService.ts # 通知管理
├── utils/              # 工具函数
│   ├── security.ts     # 安全验证工具
│   ├── crypto.ts       # 加密工具
│   └── securityAudit.ts # 安全审计日志
├── lib/                # 核心库
│   └── prisma.ts       # Prisma客户端配置
└── config/             # 配置文件
    └── index.ts        # 环境配置
```

## 🌟 核心功能

### 🔐 认证授权
- JWT Token验证
- GitHub OAuth集成
- 角色权限控制
- 会话管理

### 🛡️ 安全防护
- CSRF攻击防护
- XSS攻击防护
- SQL注入防护
- 输入验证和清理
- 安全审计日志

### 📊 数据分析
- 用户行为追踪
- 网站流量分析
- 实时统计数据
- 排行榜算法
- 趋势分析

### 💌 通知系统
- 邮件通知服务
- 站内通知管理
- 批量通知处理
- 通知模板系统

## 🛠️ 开发命令

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev              # localhost:3001

# 生产构建
npm run build
npm run start

# 数据库操作
npm run db:generate     # 生成Prisma客户端
npm run db:migrate      # 运行数据库迁移
npm run db:deploy       # 部署迁移(生产环境)
npm run db:seed         # 填充测试数据
npm run db:studio       # 打开Prisma Studio

# 代码质量
npm run lint            # ESLint检查
npm run lint:fix        # 修复ESLint问题
npm run type-check      # TypeScript类型检查
```

## 🔧 环境配置

创建 `.env` 文件：

```env
# 数据库配置
DATABASE_URL="mysql://user:password@localhost:3306/webspark"

# JWT配置
JWT_SECRET=your-super-secret-jwt-key
NEXTAUTH_SECRET=your-nextauth-secret

# 服务器配置
NODE_ENV=development
PORT=3001
FRONTEND_URL=http://localhost:3000

# 安全配置
ENCRYPTION_KEY=your-encryption-key
VALID_API_KEYS=your-api-key-1,your-api-key-2

# 邮件服务配置
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your-email@example.com
SMTP_PASS=your-email-password

# 安全告警邮箱
SECURITY_ALERT_EMAIL=security@example.com
```

## 🗄️ 数据库模型

### 核心实体
- **User**: 用户信息和GitHub OAuth数据
- **Website**: 提交的网站项目信息
- **Category**: 网站分类
- **Tag**: 灵活的标签系统
- **Comment**: 嵌套评论系统
- **Notification**: 用户通知

### 分析和安全
- **WebsiteClick**: 网站点击统计
- **SecurityEvent**: 安全事件日志
- **WebsiteLike**: 点赞记录
- **Bookmark**: 收藏记录

## 🔌 API端点

### 核心功能
- `GET/POST/PUT/DELETE /api/websites` - 网站管理
- `GET/POST /api/comments` - 评论系统
- `GET/POST /api/notifications` - 通知管理
- `GET/POST /api/users` - 用户管理

### 分析功能
- `GET /api/analytics/platform/overview` - 平台概览
- `GET /api/analytics/traffic/:websiteId` - 网站流量
- `GET /api/analytics/user-activity` - 用户活动
- `GET /api/analytics/website-rankings` - 网站排行

### 安全监控
- `GET /api/security/stats` - 安全统计
- `GET /api/security/events` - 安全事件
- `GET /api/security/config` - 安全配置

### 管理功能
- `GET /api/admin/stats` - 管理统计
- `POST /api/admin/websites/:id/approve` - 审核通过
- `POST /api/admin/websites/:id/reject` - 审核拒绝

## 🔐 安全特性

### 输入验证
- 所有用户输入都经过严格验证
- XSS攻击检测和防护
- SQL注入检测和防护
- 文件上传安全检查

### 审计日志
- 详细的安全事件记录
- 实时安全威胁监控
- 自动告警和通知
- 日志轮转和归档

### 加密保护
- 敏感数据加密存储
- 安全的token生成
- 密码哈希和验证
- HTTPS强制传输

## 📈 性能优化

- **数据库优化**: 索引优化，查询优化
- **缓存策略**: Redis缓存(可选)
- **连接池**: MySQL连接池管理
- **日志优化**: 结构化日志和轮转

## 🚀 部署指南

### 开发环境
```bash
# 启动MySQL数据库
# 配置环境变量
# 运行数据库迁移
npm run db:migrate
npm run db:seed

# 启动开发服务器
npm run dev
```

### 生产环境
```bash
# 构建项目
npm run build

# 运行生产服务器
npm run start

# 使用PM2管理进程
pm2 start ecosystem.config.js
```

## 🧪 测试

```bash
# 运行测试套件
npm test

# 测试覆盖率
npm run test:coverage

# API端点测试
npm run test:api
```

## 📊 监控

### 应用监控
- PM2进程监控
- 内存和CPU使用率
- API响应时间
- 错误率统计

### 安全监控
- 异常登录尝试
- 恶意请求检测
- API使用频率监控
- 数据异常访问

## 🔗 相关链接

- [项目主README](../README.md)
- [前端README](../frontend/README.md)
- [API文档](./API_DOCUMENTATION.md)
- [部署指南](../DEPLOYMENT.md)
