# WebSpark.club 技术架构文档

## 1. 总体架构概览

WebSpark.club 采用前后端分离的架构，前端使用Next.js，后端使用Strapi。

```
┌─────────────────────────────────────────────────────────────┐
│                    用户访问层                                │
├─────────────────────────────────────────────────────────────┤
│                Cloudflare (CDN + 安全)                      │
├─────────────────────────────────────────────────────────────┤
│                   前端应用层                                │
│              Next.js (App Router)                          │
│           部署于 Cloudflare Pages                          │
├─────────────────────────────────────────────────────────────┤
│                    API网关                                  │
│               api.webspark.club                            │
│            (经过Cloudflare代理)                            │
├─────────────────────────────────────────────────────────────┤
│                   后端应用层                                │
│              Strapi (TypeScript)                           │
│             部署于自有服务器                                │
├─────────────────────────────────────────────────────────────┤
│                   数据存储层                                │
│              PostgreSQL 数据库                             │
│                 文件存储                                    │
└─────────────────────────────────────────────────────────────┘
```

## 2. 前端架构

### 2.1 技术栈
- **框架**: Next.js 14+ (App Router)
- **语言**: TypeScript
- **样式**: Tailwind CSS
- **状态管理**: React Context + Zustand (需要时)
- **数据获取**: SWR 或 React Query
- **表单处理**: React Hook Form + Zod
- **认证**: NextAuth.js

### 2.2 目录结构
```
app/
├── (auth)/              # 认证相关页面组
│   ├── login/
│   └── signup/
├── (dashboard)/         # 用户中心页面组
│   ├── dashboard/
│   ├── profile/
│   └── my-sites/
├── sites/               # 作品相关页面
│   ├── [slug]/         # 作品详情页
│   └── submit/         # 作品提交页
├── tags/                # 标签页面
│   └── [tagSlug]/
├── search/              # 搜索页面
├── layout.tsx           # 根布局
├── page.tsx             # 首页
├── globals.css          # 全局样式
└── not-found.tsx        # 404页面

components/              # 公共组件
├── ui/                  # 基础UI组件
│   ├── Button.tsx
│   ├── Input.tsx
│   ├── Card.tsx
│   └── ...
├── layout/              # 布局组件
│   ├── Header.tsx
│   ├── Footer.tsx
│   └── Sidebar.tsx
├── forms/               # 表单组件
│   ├── SubmitForm.tsx
│   └── ProfileForm.tsx
└── features/            # 功能组件
    ├── SiteCard.tsx
    ├── SiteList.tsx
    └── TagSelector.tsx

lib/                     # 工具库
├── api.ts              # API请求封装
├── auth.ts             # NextAuth配置
├── validation.ts       # Zod校验schemas
└── utils.ts            # 工具函数

types/                   # TypeScript类型定义
├── api.ts              # API类型
├── user.ts             # 用户类型
└── site.ts             # 作品类型
```

### 2.3 路由策略
- **静态路由**: 首页、标签页等使用SSG
- **动态路由**: 作品详情页使用ISR
- **保护路由**: 用户中心、提交页面需要认证
- **API路由**: 仅用于NextAuth和webhook处理

## 3. 后端架构

### 3.1 技术栈
- **框架**: Strapi 4+ (TypeScript)
- **数据库**: PostgreSQL
- **认证**: Strapi Users & Permissions Plugin
- **文件存储**: 本地存储 或 云存储 (AWS S3/阿里云OSS)
- **缓存**: Redis (可选)

### 3.2 数据模型

#### 核心内容类型

**Website (作品)**
```typescript
interface Website {
  id: number
  title: string
  slug: string
  url: string
  shortDescription: string
  description: string // Markdown
  screenshot?: string
  sourceUrl?: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  featured: boolean
  likeCount: number
  viewCount: number
  createdAt: string
  updatedAt: string
  deletedAt?: string
  
  // 关联关系
  author: User
  tags: Tag[]
  likes: Like[]
  bookmarks: Bookmark[]
  reports: Report[]
}
```

**Tag (标签)**
```typescript
interface Tag {
  id: number
  name: string
  slug: string
  description?: string
  color?: string
  createdAt: string
  updatedAt: string
  
  // 关联关系
  websites: Website[]
}
```

**Report (举报)**
```typescript
interface Report {
  id: number
  reason: 'SPAM' | 'INAPPROPRIATE_CONTENT' | 'COPYRIGHT_INFRINGEMENT' | 'BROKEN_LINK' | 'OTHER'
  details?: string
  status: 'OPEN' | 'CLOSED'
  createdAt: string
  updatedAt: string
  
  // 关联关系
  website: Website
  reporter?: User
}
```

### 3.3 自定义API端点

- `GET /api/websites/sorted` - 获取排序后的作品列表
- `PUT /api/websites/:id/like` - 点赞/取消点赞
- `PUT /api/websites/:id/bookmark` - 收藏/取消收藏
- `POST /api/reports` - 提交举报
- `GET /api/tags/popular` - 获取热门标签

### 3.4 权限设计

#### 角色定义
- **Public**: 游客（未登录用户）
- **Authenticated**: 登录用户
- **Moderator**: 内容审核员
- **Admin**: 管理员

#### 权限矩阵
| 操作 | Public | Authenticated | Moderator | Admin |
|------|--------|---------------|-----------|-------|
| 浏览作品 | ✅ | ✅ | ✅ | ✅ |
| 提交作品 | ❌ | ✅ | ✅ | ✅ |
| 点赞/收藏 | ❌ | ✅ | ✅ | ✅ |
| 审核作品 | ❌ | ❌ | ✅ | ✅ |
| 用户管理 | ❌ | ❌ | ❌ | ✅ |

## 4. 部署架构

### 4.1 前端部署 (Cloudflare Pages)
- **自动部署**: GitHub连接，main分支自动部署
- **环境变量**: 通过Cloudflare Pages控制台配置
- **域名**: webspark.club
- **CDN**: 全球分发，就近访问

### 4.2 后端部署 (自有服务器)

#### Docker化部署
```yaml
# docker-compose.yml
version: '3.8'
services:
  strapi:
    build: .
    restart: unless-stopped
    environment:
      DATABASE_URL: ${DATABASE_URL}
      JWT_SECRET: ${JWT_SECRET}
    ports:
      - "1337:1337"
    depends_on:
      - postgres
      
  postgres:
    image: postgres:15
    restart: unless-stopped
    environment:
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: ${POSTGRES_DB}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      
  nginx:
    image: nginx:alpine
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - strapi

volumes:
  postgres_data:
```

### 4.3 CI/CD流程

#### 前端
1. 开发者push到GitHub
2. Cloudflare Pages自动检测变更
3. 自动构建和部署
4. 通过Cloudflare CDN分发

#### 后端
1. 开发者push到GitHub
2. GitHub Actions触发
3. 构建Docker镜像
4. 推送到镜像仓库
5. SSH到服务器执行部署脚本
6. 滚动更新服务

## 5. 安全设计

### 5.1 认证安全
- GitHub OAuth仅授权基本信息
- JWT Token安全存储和传输
- Session管理通过NextAuth.js

### 5.2 API安全
- CORS严格配置
- Rate Limiting防护
- 输入验证和消毒
- SQL注入防护

### 5.3 数据安全
- 数据库连接加密
- 敏感数据环境变量存储
- 定期安全备份
- HTTPS强制使用

## 6. 性能优化

### 6.1 前端优化
- 静态生成(SSG)和增量静态再生(ISR)
- 图片优化和懒加载
- 代码分割和动态导入
- 缓存策略优化

### 6.2 后端优化
- 数据库查询优化
- API响应缓存
- 图片压缩和CDN
- 数据库索引优化

### 6.3 监控和分析
- 性能监控(Web Vitals)
- 错误追踪(Sentry)
- 访问统计(Google Analytics)
- 服务器监控(Uptime)

## 7. 扩展性考虑

### 7.1 水平扩展
- 无状态应用设计
- 负载均衡配置
- 数据库读写分离
- 微服务拆分可能性

### 7.2 功能扩展
- 插件系统设计
- API版本控制
- 多语言支持准备
- 移动端适配 