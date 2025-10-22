# 📚 WebSpark 文档索引

> 快速导航 WebSpark 项目的所有文档

---

## 🚀 快速开始

- [项目主页](../README.md) - 项目介绍和快速开始
- [部署指南](./DEPLOYMENT.md) - 从零到生产环境
- [贡献指南](../CONTRIBUTING.md) - 如何参与项目开发

---

## 📖 核心文档

### 技术架构
- [架构设计](./ARCHITECTURE.md) - 系统架构和技术栈
- [API 参考](./API_REFERENCE.md) - 完整的 API 接口文档

### 开发指南
- [后端开发](../backend/README.md) - Express.js 后端开发指南
- [前端开发](../frontend/README.md) - Next.js 前端开发指南
- [后端优化指南](../backend/OPTIMIZATION_GUIDE.md) - 性能优化完整指南

### 部署运维
- [部署指南](./DEPLOYMENT.md) - 生产环境部署
- [后端部署详解](../backend/deploy/README.md) - 后端部署详细步骤
- [R2 存储配置](../backend/deploy/R2_SETUP.md) - Cloudflare R2 图片存储

### 产品分析
- [产品分析报告](./PRODUCT_ANALYSIS.md) - 完整的产品分析和功能清单

---

## 🔧 配置指南

### OAuth 配置
- [GitHub OAuth 设置](./GITHUB_OAUTH_SETUP.md) - GitHub 登录配置指南

### 环境配置
后端环境变量请参考 [后端 README](../backend/README.md#环境变量)

---

## 📝 开发规范

### 贡献流程
- [贡献指南](../CONTRIBUTING.md) - 如何提交代码
- [行为准则](../CODE_OF_CONDUCT.md) - 社区行为规范
- [变更日志](../CHANGELOG.md) - 版本更新记录

### GitHub 模板
- [Bug 报告](../.github/ISSUE_TEMPLATE/bug_report.md)
- [功能请求](../.github/ISSUE_TEMPLATE/feature_request.md)
- [PR 模板](../.github/pull_request_template.md)
- [Claude AI 指导](../.github/CLAUDE.md) - AI 开发助手指南

---

## ⚖️ 法律文档

- [GDPR 合规](../legal/GDPR_COMPLIANCE.md) - GDPR 数据保护
- [Cookie 政策](../legal/COOKIE_POLICY.md) - Cookie 使用说明

---

## 📂 文档目录结构

```
webspark/
├── README.md                           # 项目主页
├── CONTRIBUTING.md                     # 贡献指南
├── CODE_OF_CONDUCT.md                  # 行为准则
├── CHANGELOG.md                        # 版本日志
│
├── docs/                               # 📖 技术文档
│   ├── INDEX.md                        # 文档索引（本文件）
│   ├── ARCHITECTURE.md                 # 架构设计
│   ├── API_REFERENCE.md                # API 参考
│   ├── DEPLOYMENT.md                   # 部署指南
│   ├── GITHUB_OAUTH_SETUP.md           # OAuth 配置
│   └── PRODUCT_ANALYSIS.md             # 产品分析
│
├── backend/                            # 🔧 后端
│   ├── README.md                       # 后端开发指南
│   ├── OPTIMIZATION_GUIDE.md           # 优化指南（性能+代码+迁移）
│   └── deploy/
│       ├── README.md                   # 部署详解
│       └── R2_SETUP.md                 # R2 配置
│
├── frontend/                           # 🎨 前端
│   └── README.md                       # 前端开发指南
│
├── legal/                              # ⚖️ 法律文档
│   ├── GDPR_COMPLIANCE.md             # GDPR 合规
│   └── COOKIE_POLICY.md               # Cookie 政策
│
└── .github/                            # 🤖 GitHub 配置
    ├── CLAUDE.md                       # AI 助手指南
    ├── pull_request_template.md       # PR 模板
    └── ISSUE_TEMPLATE/
        ├── bug_report.md              # Bug 报告
        └── feature_request.md         # 功能请求
```

---

## 🔍 按主题查找

### 我想要...

#### 快速开始项目
1. [README](../README.md) - 了解项目
2. [后端 README](../backend/README.md) - 启动后端
3. [前端 README](../frontend/README.md) - 启动前端

#### 部署到生产环境
1. [部署指南](./DEPLOYMENT.md) - 总体流程
2. [后端部署](../backend/deploy/README.md) - 后端详细步骤
3. [R2 配置](../backend/deploy/R2_SETUP.md) - 图片存储

#### 优化性能
1. [优化指南](../backend/OPTIMIZATION_GUIDE.md) - 完整优化方案
   - 代码审计结果
   - 性能优化步骤
   - 数据库迁移

#### 了解系统架构
1. [架构设计](./ARCHITECTURE.md) - 技术架构
2. [产品分析](./PRODUCT_ANALYSIS.md) - 功能清单

#### 开发新功能
1. [API 参考](./API_REFERENCE.md) - 接口文档
2. [贡献指南](../CONTRIBUTING.md) - 开发规范

#### 配置第三方服务
1. [GitHub OAuth](./GITHUB_OAUTH_SETUP.md) - GitHub 登录
2. [R2 存储](../backend/deploy/R2_SETUP.md) - 图片存储

---

## 📊 文档统计

- **总文档数**: 23 个
- **技术文档**: 8 个
- **开发指南**: 4 个
- **部署相关**: 3 个
- **规范模板**: 5 个
- **法律文档**: 2 个

---

## 🔄 最近更新

- **2025-10-20**: 整合后端优化文档为 `OPTIMIZATION_GUIDE.md`
- **2025-10-14**: 清理重复文档，优化目录结构
- **2025-10-13**: 完善部署指南

---

## ❓ 找不到需要的文档？

1. 检查 [Issues](https://github.com/your-repo/webspark/issues) 是否有相关问题
2. 提交新的 [Issue](https://github.com/your-repo/webspark/issues/new/choose)
3. 联系维护者

---

**保持文档更新**: 如发现文档过时或错误，请提交 PR 或 Issue 反馈！
