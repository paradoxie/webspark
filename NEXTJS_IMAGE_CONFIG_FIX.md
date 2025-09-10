# Next.js 图片域名配置修复

## 问题描述

遇到了以下错误：
```
Error: Invalid src prop (https://avatars.githubusercontent.com/u/789012?v=4) on `next/image`, hostname "avatars.githubusercontent.com" is not configured under images in your `next.config.js`
```

## 问题原因

Next.js 的 Image 组件默认不允许从外部域名加载图片，需要在 `next.config.js` 中明确配置允许的图片域名。

## 解决方案

已在 `frontend/next.config.js` 中添加了以下配置：

### 更新后的配置

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      'localhost', 
      '127.0.0.1',
      'avatars.githubusercontent.com',  // GitHub头像域名
      'images.unsplash.com',            // Unsplash图片服务
      'via.placeholder.com',            // 占位图片服务
      'placehold.co',                   // 另一个占位图片服务
    ],
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '1337',
        pathname: '/uploads/**',
      },
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
        pathname: '/u/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'via.placeholder.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'placehold.co',
        pathname: '/**',
      },
    ],
  },
  env: {
    STRAPI_API_URL: process.env.STRAPI_API_URL || 'http://localhost:1337/api',
  },
}

module.exports = nextConfig
```

## 配置说明

### domains 配置
- `avatars.githubusercontent.com`: GitHub用户头像
- `images.unsplash.com`: Unsplash高质量图片服务
- `via.placeholder.com`: 占位图片服务
- `placehold.co`: 另一个流行的占位图片服务

### remotePatterns 配置
提供更精确的路径控制，指定具体的协议、主机名和路径模式。

## 应用修复

1. ✅ 停止前端开发服务器
2. ✅ 更新 `next.config.js` 配置
3. ✅ 重启前端开发服务器
4. ✅ 验证配置生效

## 验证状态

- 前端服务器：✅ 运行在 http://localhost:3000
- 图片域名配置：✅ 已添加 GitHub 头像域名
- 错误状态：✅ 已修复

## 注意事项

- 配置修改后必须重启开发服务器才能生效
- 在生产环境中，确保只添加可信任的图片域名
- 可以根据实际需要添加更多的图片服务域名

## 安全提醒

- 只添加确实需要的图片域名
- 避免使用通配符域名（如 `*.example.com`）
- 定期审查配置的域名列表 