# WebSpark.club Frontend

这是WebSpark.club项目的前端应用，使用Next.js 14和TypeScript构建。

## 技术栈

- **框架**: Next.js 14 (App Router)
- **语言**: TypeScript
- **样式**: Tailwind CSS
- **表单处理**: React Hook Form + Zod
- **状态管理**: React状态 + SWR (数据获取)
- **认证**: NextAuth.js
- **UI库**: 自定义组件 + Lucide Icons

## 项目结构

```
src/
├── app/                    # Next.js App Router页面
│   ├── page.tsx           # 首页
│   ├── submit/            # 作品提交页面
│   ├── layout.tsx         # 根布局
│   └── globals.css        # 全局样式
├── components/            # 可复用组件
│   ├── ui/               # 基础UI组件
│   ├── features/         # 功能组件
│   └── layout/           # 布局组件
├── lib/                  # 工具库
│   ├── api.ts           # API客户端
│   ├── utils.ts         # 工具函数
│   └── validation.ts    # Zod验证schemas
└── types/               # TypeScript类型定义
    ├── api.ts           # API相关类型
    ├── website.ts       # 作品类型
    ├── user.ts          # 用户类型
    └── tag.ts           # 标签类型
```

## 安装依赖

```bash
npm install
```

## 环境变量

复制 `.env.example` 到 `.env.local` 并填入正确的值：

```env
NEXT_PUBLIC_STRAPI_API_URL=http://localhost:1337/api
NEXT_PUBLIC_STRAPI_URL=http://localhost:1337
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
```

## 开发运行

```bash
npm run dev
```

## 主要功能

### 已实现
- ✅ 项目基础结构
- ✅ TypeScript类型定义
- ✅ API客户端封装
- ✅ 表单验证schemas
- ✅ 基础UI组件
- ✅ 首页布局
- ✅ 作品提交页面
- ✅ 设计系统配置

### 待实现
- ⏳ NextAuth.js认证集成
- ⏳ 作品详情页面
- ⏳ 用户个人中心
- ⏳ 搜索和筛选功能
- ⏳ 响应式优化
- ⏳ 错误处理完善
- ⏳ 加载状态优化

## 设计系统

项目遵循统一的设计系统，主要颜色和样式定义在 `tailwind.config.js` 中：

- **主色**: `blue-600` (#2563eb)
- **次色**: `slate-500` (#64748b)
- **背景**: `slate-50` (#f8fafc)
- **反馈色**: 成功(green-500)、警告(yellow-500)、错误(red-600)、信息(sky-500)

## API集成

前端通过 `lib/api.ts` 与Strapi后端通信，支持：

- 作品的CRUD操作
- 用户认证和授权
- 点赞和收藏功能
- 标签管理
- 举报功能

## 构建部署

```bash
# 构建生产版本
npm run build

# 启动生产服务器
npm run start
```

## 贡献指南

1. 遵循TypeScript严格模式
2. 使用Tailwind CSS进行样式开发
3. 组件需要完整的类型定义
4. 提交前运行类型检查: `npm run type-check` 