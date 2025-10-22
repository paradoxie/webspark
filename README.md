# WebSpark.club

🌟 一个为 Web 开发者社群创建的作品展示、灵感碰撞和交流互动的俱乐部。

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)

## 🎯 项目愿景

为 Web 开发者创建一个充满活力的作品展示平台，让每个开发者都能展示自己的创作，发现优秀的作品，并在社区中获得成长和认可。

## ✨ 核心功能

- 🔐 **GitHub OAuth 认证** - 一键登录，无需注册
- 🎨 **作品展示** - 提交、审核、展示完整流程
- 💬 **社交互动** - 点赞、收藏、评论、回复
- 🔍 **智能搜索** - 全文搜索、高级筛选、智能排序
- 📊 **数据分析** - 用户行为分析、流量统计
- 🌙 **暗色主题** - 完整的明暗主题切换
- 📱 **PWA 支持** - 离线访问、移动端优化

## 🚀 快速开始

### 环境要求

- Node.js 18+
- MySQL 8.0+
- npm 或 yarn

### 本地开发

```bash
# 克隆项目
git clone https://github.com/your-username/webspark.git
cd webspark

# 后端设置
cd backend
npm install
cp .env.example .env  # 配置环境变量
npm run db:migrate     # 数据库迁移
npm run db:seed        # 初始数据
npm run dev            # 启动后端 (http://localhost:3001)

# 前端设置 (新终端)
cd ../frontend
npm install
cp .env.example .env.local  # 配置环境变量
npm run dev                 # 启动前端 (http://localhost:3000)
```

### 环境变量配置

参考 [GitHub OAuth 配置指南](./GITHUB_OAUTH_SETUP.md) 设置 OAuth 认证。

## 🏗️ 技术架构

### 前端技术栈
- **Next.js 14** - React 框架 (App Router)
- **TypeScript** - 类型安全
- **Tailwind CSS** - 样式框架
- **NextAuth.js** - 认证系统
- **SWR** - 数据获取
- **Chart.js** - 数据可视化

### 后端技术栈
- **Express.js** - Node.js 框架
- **Prisma ORM** - 数据库 ORM
- **MySQL 8.0** - 关系型数据库
- **JWT** - Token 认证
- **Nodemailer** - 邮件服务

## 📚 项目文档

### 📖 文档导航
- **[文档索引](./docs/INDEX.md)** - 所有文档的快速导航

### 核心文档
- [贡献指南](./CONTRIBUTING.md) - 如何为项目贡献代码
- [行为准则](./CODE_OF_CONDUCT.md) - 社区行为规范
- [更新日志](./CHANGELOG.md) - 版本变更记录
- [许可证](./LICENSE) - MIT开源许可

### 技术文档
- [架构设计](./docs/ARCHITECTURE.md) - 系统架构详解
- [API 参考](./docs/API_REFERENCE.md) - 完整的API文档
- [部署指南](./docs/DEPLOYMENT.md) - 生产环境部署教程
- [后端优化指南](./backend/OPTIMIZATION_GUIDE.md) - 性能优化完整指南
- [GitHub OAuth](./docs/GITHUB_OAUTH_SETUP.md) - OAuth配置指南

### 项目分析
- [产品分析报告](./docs/PRODUCT_ANALYSIS.md) - 产品就绪度分析（95%完成度）

### 法律合规
- [GDPR 合规](./legal/GDPR_COMPLIANCE.md) - 数据保护说明
- [Cookie 政策](./legal/COOKIE_POLICY.md) - Cookie使用政策

## 📁 项目结构

```
webspark/
├── frontend/              # Next.js 前端应用
│   ├── src/app/          # App Router 页面
│   ├── src/components/   # React 组件
│   └── src/lib/          # 工具库和配置
├── backend/              # Express 后端服务
│   ├── src/routes/       # API 路由
│   ├── src/middleware/   # 中间件
│   ├── src/services/     # 业务逻辑
│   └── prisma/           # 数据库模型
└── docs/                 # 项目文档
```

## 🌐 在线访问

- **网站**: [https://webspark.club](https://webspark.club)
- **API**: [https://api.webspark.club](https://api.webspark.club)

## 📈 项目状态

- **开发状态**: ✅ 生产就绪
- **功能完成度**: 96-98%
- **代码质量**: ⭐⭐⭐⭐⭐
- **安全等级**: 企业级

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request！

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 提交 Pull Request

## 📄 许可证

MIT License - 详见 [LICENSE](./LICENSE) 文件

## 🙏 致谢

感谢所有为这个项目做出贡献的开发者！

---

**WebSpark.club** - 让每个 Web 开发者的作品都能闪闪发光 ✨