# WebSpark.club

🌟 一个为Web开发者社群创建的作品展示、灵感碰撞和交流互动的俱乐部。

## 🎯 项目愿景

为Web开发者社群创建一个充满活力的作品展示、灵感碰撞和交流互动的俱乐部，让每个开发者都能展示自己的创作，发现优秀的作品，并在社区中获得成长和认可。

## 🏗️ 技术架构

### 前端
- **框架**: Next.js 14 (App Router)
- **语言**: TypeScript
- **样式**: Tailwind CSS
- **认证**: NextAuth.js (GitHub OAuth)
- **数据获取**: SWR + API Routes
- **图表**: Chart.js + React Chart.js 2
- **部署**: Cloudflare Pages

### 后端
- **框架**: Express.js
- **语言**: TypeScript
- **数据库**: MySQL + Prisma ORM
- **认证**: JWT Token 验证
- **安全**: 企业级安全防护体系
- **部署**: 宝塔面板 + PM2

## ✨ 核心功能

### 🔐 用户系统
- GitHub OAuth 快速登录
- 个人中心管理
- 用户资料与头像
- 作品提交与管理

### 🎨 作品展示
- 作品提交与审核
- 多维度筛选搜索
- 智能排序算法
- 收藏与点赞系统

### 💬 社交互动
- 嵌套评论回复
- 实时通知系统
- 邮件通知服务
- 用户行为分析

### 🛡️ 安全与分析
- 企业级安全防护
- 安全审计日志
- 数据分析统计
- 实时监控系统

### 🎭 用户体验
- 暗色主题支持
- 响应式设计
- PWA 支持
- 高性能优化

## 🚀 快速开始

### 环境要求
- Node.js 18+
- MySQL 8.0+
- npm 或 yarn

### 安装与运行

```bash
# 克隆项目
git clone https://github.com/your-username/webspark.git
cd webspark

# 安装前端依赖
cd frontend
npm install

# 安装后端依赖
cd ../backend
npm install

# 配置环境变量
cp .env.example .env
# 编辑 .env 文件，填入必要配置

# 数据库迁移
npx prisma migrate dev
npx prisma db seed

# 启动开发服务
npm run dev
```

### 访问应用
- 前端: http://localhost:3000
- 后端API: http://localhost:3001

## 📚 文档

- [部署指南](./DEPLOYMENT.md) - 完整的生产环境部署教程
- [GitHub OAuth 配置](./GITHUB_OAUTH_SETUP.md) - OAuth 认证设置指南
- [后端API文档](./backend/API_DOCUMENTATION.md) - 完整的API接口文档
- [项目进度报告](./项目进度报告.md) - 详细的项目评估报告
- [开发指南](./CLAUDE.md) - 面向开发者的项目指导

## 🏆 项目特色

### 🌟 技术亮点
- **全栈TypeScript**: 类型安全的前后端开发
- **现代化架构**: Next.js 14 App Router + Express
- **企业级安全**: 全方位安全防护和审计
- **智能分析**: 数据驱动的用户行为分析
- **高性能**: 优化的查询和缓存策略

### 💎 产品亮点
- **智能排序**: 基于热度、时间和互动的推荐算法
- **高级搜索**: 多维度筛选和全文检索
- **社交互动**: 完整的评论、点赞、收藏体系
- **实时统计**: 详细的数据分析和可视化
- **用户体验**: 现代化UI和流畅交互

## 🌐 在线访问

- **网站**: [https://webspark.club](https://webspark.club)
- **API**: [https://api.webspark.club](https://api.webspark.club)

## 📈 项目状态

- **开发状态**: ✅ 生产就绪
- **功能完成度**: 98%
- **代码质量**: ⭐⭐⭐⭐⭐
- **部署状态**: ✅ 已上线

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License

## 👥 团队

如果你对这个项目感兴趣，欢迎加入我们的开发者社区！

---

**WebSpark.club** - 让每个Web开发者的作品都能闪闪发光 ✨

### 作品展示
- 首页展示优质作品
- 智能排序算法
- 分类与标签筛选
- 全文搜索功能

### 互动系统
- 点赞与收藏
- 作品评论
- 举报机制

### 管理后台
- 作品审核
- 用户管理
- 数据洞察

## 开发计划

1. **Phase 1**: 后端数据模型与API
2. **Phase 2**: 前端核心页面
3. **Phase 3**: 用户认证与权限
4. **Phase 4**: 互动功能
5. **Phase 5**: 部署与优化

## 许可证

MIT License

## 贡献

欢迎提交 Issue 和 Pull Request！ 