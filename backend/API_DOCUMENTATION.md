# WebSpark Backend API 文档

## 基础配置

**Base URL**: `https://api.webspark.club`
**认证方式**: Bearer Token (NextAuth.js JWT)

## 认证说明

前端使用NextAuth.js处理GitHub OAuth，后端验证NextAuth生成的JWT token。

### 请求头格式 