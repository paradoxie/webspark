# WebSpark.club Frontend

WebSpark.club项目的前端应用，使用Next.js 14和TypeScript构建的现代化Web开发者作品展示平台。

## 🚀 技术栈

- **框架**: Next.js 14 (App Router)
- **语言**: TypeScript
- **样式**: Tailwind CSS + 暗色主题支持
- **表单处理**: React Hook Form + Zod
- **状态管理**: React状态 + SWR (数据获取)
- **认证**: NextAuth.js (GitHub OAuth)
- **图表**: Chart.js + React Chart.js 2
- **UI库**: 自定义组件库 + Lucide Icons

## 📁 项目结构

```
src/
├── app/                    # Next.js App Router页面
│   ├── page.tsx           # 首页
│   ├── sites/             # 网站详情页
│   ├── submit/            # 作品提交页
│   ├── dashboard/         # 用户面板
│   ├── analytics/         # 数据分析页面
│   └── api/               # API路由(代理到后端)
├── components/            # React组件
│   ├── analytics/         # 数据分析组件
│   ├── common/            # 通用组件
│   ├── search/            # 搜索组件
│   ├── ui/                # 基础UI组件
│   └── layout/            # 布局组件
├── contexts/              # React上下文
│   └── ThemeContext.tsx   # 主题上下文
├── hooks/                 # 自定义钩子
│   └── useWebsiteActions.ts # 网站操作钩子
├── lib/                   # 工具库
│   ├── auth.ts           # 认证配置
│   └── api.ts            # API客户端
└── styles/               # 全局样式
```

## 🌟 核心功能

### 用户界面
- 🎨 现代化设计语言
- 🌙 完整的暗色主题支持
- 📱 响应式设计，全设备适配
- ♿ 无障碍访问支持

### 高级功能
- 🔍 多维度高级搜索
- 📊 交互式数据分析图表
- 🖼️ 图片上传和管理
- 💬 嵌套评论系统
- 🔔 实时通知系统

### 开发体验
- 📝 完整的TypeScript类型支持
- 🧩 高度复用的组件库
- 🎯 自定义Hooks封装
- ⚡ 优化的性能和加载速度

## 🛠️ 开发命令

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev          # http://localhost:3000

# 生产构建
npm run build
npm run start

# 代码质量检查
npm run lint
npm run type-check

# 代码格式化
npm run format
```

## 🔧 环境配置

创建 `.env.local` 文件：

```env
# NextAuth配置
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret

# GitHub OAuth
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret

# API配置
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## 🎨 组件库

项目包含完整的可复用组件库：

### 基础组件
- `Button` - 多样式按钮组件
- `Input` - 输入框组件
- `Icon` - 图标组件
- `Avatar` - 头像组件
- `Tag` - 标签组件

### 复合组件
- `WebsiteCard` - 网站卡片
- `WebsiteGrid` - 网站网格布局
- `Pagination` - 分页组件
- `LoadingGrid` - 加载状态
- `EmptyState` - 空状态

### 高级组件
- `AdvancedSearch` - 高级搜索
- `ThemeToggle` - 主题切换
- `ImageUpload` - 图片上传
- `AnalyticsDashboard` - 数据分析面板

## 📚 开发指南

### 添加新页面
1. 在 `src/app/` 下创建路由文件夹
2. 创建 `page.tsx` 文件
3. 导出默认React组件

### 创建新组件
1. 在适当的 `components/` 子目录创建
2. 使用TypeScript定义Props接口
3. 支持暗色主题样式
4. 考虑可复用性

### API集成
1. 在 `src/lib/api.ts` 添加API函数
2. 使用SWR进行数据获取
3. 实现适当的错误处理

## 🎯 性能优化

- ⚡ Next.js App Router优化
- 🖼️ 图片自动优化
- 📦 代码分割和懒加载
- 💾 SWR数据缓存
- 🚀 Cloudflare Pages部署

## 🔗 相关链接

- [项目主README](../README.md)
- [后端README](../backend/README.md)
- [部署指南](../DEPLOYMENT.md)
- [开发指南](../CLAUDE.md) 