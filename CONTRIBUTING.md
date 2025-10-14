# Contributing to WebSpark.club

🎉 首先，感谢您考虑为 WebSpark.club 做出贡献！🎉

WebSpark.club 是一个开源的 Web 作品展示社区，我们欢迎所有形式的贡献，包括但不限于：

- 🐛 Bug 修复
- ✨ 新功能开发
- 📝 文档改进
- 🌐 翻译
- 🎨 UI/UX 改进
- ⚡ 性能优化

## 📋 目录

- [行为准则](#行为准则)
- [如何贡献](#如何贡献)
- [开发环境搭建](#开发环境搭建)
- [开发流程](#开发流程)
- [代码规范](#代码规范)
- [提交规范](#提交规范)
- [测试](#测试)
- [文档](#文档)
- [社区](#社区)

## 行为准则

请参阅我们的 [行为准则](CODE_OF_CONDUCT.md)。参与本项目即表示您同意遵守其条款。

## 如何贡献

### 报告 Bug

如果您发现了 bug，请通过 [GitHub Issues](https://github.com/yourusername/webspark/issues) 报告。在报告之前，请先搜索现有的 issues，避免重复报告。

创建 issue 时，请包含：
- 清晰的标题和描述
- 重现步骤
- 预期行为和实际行为
- 截图（如果适用）
- 您的环境信息（浏览器、操作系统等）

### 建议新功能

我们欢迎新功能建议！请通过 [GitHub Issues](https://github.com/yourusername/webspark/issues) 提交您的想法。

在提交之前，请：
- 检查是否已有类似建议
- 清楚地描述功能和其价值
- 如果可能，提供实现思路

### 提交代码

1. Fork 本仓库
2. 创建您的功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交您的更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

## 开发环境搭建

### 前置要求

- Node.js >= 18.0.0
- MySQL >= 8.0
- Redis >= 6.0
- Git

### 安装步骤

```bash
# 克隆仓库
git clone https://github.com/yourusername/webspark.git
cd webspark

# 安装依赖
npm install

# 设置环境变量
cp .env.example .env
# 编辑 .env 文件，填入必要的配置

# 初始化数据库
cd backend
npm run prisma:migrate
npm run prisma:seed

# 启动开发服务器
npm run dev
```

### 项目结构

```
webspark/
├── frontend/          # Next.js 前端应用
│   ├── src/
│   │   ├── app/      # App Router 页面
│   │   ├── components/ # React 组件
│   │   ├── hooks/    # 自定义 Hooks
│   │   ├── lib/      # 工具库
│   │   └── types/    # TypeScript 类型定义
├── backend/           # Express.js 后端应用
│   ├── src/
│   │   ├── routes/   # API 路由
│   │   ├── services/ # 业务逻辑
│   │   ├── middleware/ # 中间件
│   │   └── utils/    # 工具函数
│   └── prisma/       # 数据库 schema
└── docs/             # 文档
```

## 开发流程

### 1. 选择任务

- 查看 [Issues](https://github.com/yourusername/webspark/issues) 中标记为 `good first issue` 或 `help wanted` 的任务
- 如果您想处理某个 issue，请先评论表明您的意向

### 2. 分支管理

- `main` - 生产分支，始终保持稳定
- `develop` - 开发分支，新功能首先合并到这里
- `feature/*` - 功能分支
- `fix/*` - Bug 修复分支
- `docs/*` - 文档更新分支

### 3. 开发规范

#### TypeScript

- 使用 TypeScript 严格模式
- 避免使用 `any` 类型
- 为所有公共 API 添加类型定义
- 使用接口而非类型别名（除非需要联合类型）

#### React

- 使用函数组件和 Hooks
- 组件文件名使用 PascalCase
- 使用 `React.FC` 或明确的 props 类型
- 避免内联样式，使用 Tailwind CSS

#### 后端

- 遵循 RESTful API 设计原则
- 使用 async/await 而非回调
- 所有路由都要有错误处理
- 使用 Prisma 进行数据库操作

### 4. 代码风格

我们使用 ESLint 和 Prettier 来保持代码风格一致：

```bash
# 运行 linting
npm run lint

# 自动修复
npm run lint:fix

# 格式化代码
npm run format
```

## 提交规范

我们使用 [Conventional Commits](https://www.conventionalcommits.org/) 规范：

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Type

- `feat`: 新功能
- `fix`: Bug 修复
- `docs`: 仅文档更改
- `style`: 不影响代码含义的更改（空格、格式化等）
- `refactor`: 既不修复 bug 也不添加功能的代码更改
- `perf`: 提高性能的代码更改
- `test`: 添加缺失的测试或修正现有测试
- `chore`: 对构建过程或辅助工具的更改

### 示例

```
feat(auth): add GitHub OAuth login

- Implement GitHub OAuth provider
- Add login button to header
- Store user data in database

Closes #123
```

## 测试

### 运行测试

```bash
# 运行所有测试
npm test

# 运行前端测试
cd frontend && npm test

# 运行后端测试
cd backend && npm test

# 运行 E2E 测试
npm run test:e2e
```

### 编写测试

- 为所有新功能编写测试
- 保持测试覆盖率在 80% 以上
- 使用描述性的测试名称
- 遵循 AAA 模式（Arrange, Act, Assert）

## 文档

- 为新功能更新 README
- 在代码中添加 JSDoc 注释
- 更新 API 文档
- 如有必要，添加使用示例

## Pull Request 流程

1. 确保您的代码通过所有测试
2. 更新相关文档
3. 确保 PR 描述清楚地说明了更改内容
4. 链接相关的 issue
5. 等待代码审查
6. 根据反馈进行修改
7. 合并后删除您的分支

### PR 模板

```markdown
## 描述
简要描述这个 PR 的内容

## 更改类型
- [ ] Bug 修复
- [ ] 新功能
- [ ] 破坏性更改
- [ ] 文档更新

## 相关 Issue
Closes #(issue)

## 测试
- [ ] 我已经测试了这些更改
- [ ] 我已经添加了必要的测试

## 截图（如果适用）
```

## 发布流程

1. 所有更改首先合并到 `develop` 分支
2. 定期从 `develop` 创建 release 分支
3. 在 release 分支上进行最终测试
4. 合并到 `main` 并打标签
5. 自动部署到生产环境

## 获取帮助

- 📧 Email: support@webspark.club
- 💬 GitHub Discussions: [链接](https://github.com/yourusername/webspark/discussions)
- 🐦 Twitter: [@websparkclub](https://twitter.com/websparkclub)

## 贡献者

感谢所有为本项目做出贡献的人！

<!-- ALL-CONTRIBUTORS-LIST:START -->
<!-- ALL-CONTRIBUTORS-LIST:END -->

## 许可证

通过贡献代码，您同意您的贡献将根据 [MIT 许可证](LICENSE) 进行许可。
