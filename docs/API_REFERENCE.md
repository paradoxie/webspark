# 📚 WebSpark API 完整参考文档

## 目录
- [基础配置](#基础配置)
- [认证系统](#认证系统)
- [网站管理](#网站管理)
- [用户系统](#用户系统)
- [评论系统](#评论系统)
- [搜索功能](#搜索功能)
- [通知系统](#通知系统)
- [管理员功能](#管理员功能)
- [统计分析](#统计分析)
- [错误码说明](#错误码说明)
- [最佳实践](#最佳实践)

## 基础配置

**生产环境 Base URL**: `https://api.webspark.club`  
**开发环境 Base URL**: `http://localhost:5000`  
**认证方式**: Bearer Token (NextAuth.js JWT)  
**请求格式**: JSON  
**响应格式**: JSON  

### 统一响应格式

#### 成功响应
```json
{
  "success": true,
  "data": {
    // 响应数据
  },
  "meta": {
    // 分页信息等元数据（可选）
  }
}
```

#### 错误响应
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "错误描述",
    "details": {
      // 详细错误信息（可选）
    }
  }
}
```

## 认证系统

### GitHub OAuth 登录
前端使用 NextAuth.js 处理 GitHub OAuth，后端验证 NextAuth 生成的 JWT token。

### 请求头格式
```http
Authorization: Bearer <token>
Content-Type: application/json
Accept: application/json
X-Client-Version: 1.0.0
```

### Token 刷新
```http
POST /auth/refresh
Authorization: Bearer <refresh_token>
```

## 网站管理

### 获取网站列表
```http
GET /api/websites?page=1&limit=20&status=APPROVED&tags=react,typescript
```

**查询参数**
| 参数 | 类型 | 说明 | 默认值 |
|-----|------|------|--------|
| page | number | 页码 | 1 |
| limit | number | 每页数量 | 20 |
| status | string | 状态筛选 (PENDING/APPROVED/REJECTED) | APPROVED |
| tags | string | 标签筛选，逗号分隔 | - |
| authorId | number | 作者ID筛选 | - |
| sort | string | 排序方式 (latest/popular/trending) | latest |

**成功响应 (200)**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "title": "Awesome React App",
      "slug": "awesome-react-app",
      "url": "https://example.com",
      "shortDescription": "A great React application",
      "screenshot": "https://cdn.webspark.club/screenshots/1.jpg",
      "status": "APPROVED",
      "likeCount": 42,
      "viewCount": 1337,
      "createdAt": "2024-01-15T10:00:00Z",
      "author": {
        "id": 1,
        "username": "johndoe",
        "name": "John Doe",
        "avatar": "https://github.com/johndoe.png"
      },
      "tags": [
        { "id": 1, "name": "React", "slug": "react" },
        { "id": 2, "name": "TypeScript", "slug": "typescript" }
      ]
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

### 获取热门网站（混合排序）
```http
GET /api/websites/sorted-list?page=1&limit=20
```

使用算法：`Score = (likeCount * 5) + (createdAt_timestamp / 10000)`

### 获取单个网站
```http
GET /api/websites/:slug
# 或
GET /api/websites/:id
```

### 提交网站
```http
POST /api/websites
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "My Awesome Project",
  "url": "https://myproject.com",
  "shortDescription": "A brief description of my project",
  "description": "# Detailed Description\n\nMarkdown content...",
  "tags": ["react", "nextjs", "tailwind"],
  "sourceUrl": "https://github.com/me/project"
}
```

### 更新网站
```http
PUT /api/websites/:id
Authorization: Bearer <token>
```

### 删除网站（软删除）
```http
DELETE /api/websites/:id
Authorization: Bearer <token>
```

### 点赞/取消点赞
```http
PUT /api/websites/:id/like
Authorization: Bearer <token>
```

### 收藏/取消收藏
```http
PUT /api/websites/:id/bookmark
Authorization: Bearer <token>
```

## 用户系统

### 获取用户信息
```http
GET /api/users/:username
# 或
GET /api/users/:id
```

### 获取当前用户
```http
GET /api/users/me
Authorization: Bearer <token>
```

### 更新个人资料
```http
PUT /api/users/me
Authorization: Bearer <token>
```

### 关注/取消关注
```http
PUT /api/users/:id/follow
Authorization: Bearer <token>
```

### 获取用户提交的网站
```http
GET /api/users/:id/websites
```

### 获取用户收藏
```http
GET /api/users/:id/bookmarks
Authorization: Bearer <token>
```

## 评论系统

### 获取评论列表
```http
GET /api/websites/:id/comments?page=1&limit=20
```

### 发表评论
```http
POST /api/websites/:id/comments
Authorization: Bearer <token>
Content-Type: application/json

{
  "content": "This is an amazing project!",
  "parentId": null
}
```

### 更新评论
```http
PUT /api/comments/:id
Authorization: Bearer <token>
```

### 删除评论
```http
DELETE /api/comments/:id
Authorization: Bearer <token>
```

### 点赞评论
```http
PUT /api/comments/:id/like
Authorization: Bearer <token>
```

## 搜索功能

### 搜索网站
```http
GET /api/search?q=react+tutorial&type=websites&page=1&limit=20
```

### 获取搜索建议
```http
GET /api/search/suggestions?q=rea
```

### 获取热门搜索
```http
GET /api/search/popular?limit=10&days=7
```

### 保存搜索历史
```http
POST /api/search-history
Authorization: Bearer <token>
```

## 通知系统

### 获取通知列表
```http
GET /api/notifications?page=1&limit=20&unreadOnly=true
Authorization: Bearer <token>
```

### 标记已读
```http
PUT /api/notifications/:id/read
Authorization: Bearer <token>
```

### 批量标记已读
```http
PUT /api/notifications/mark-all-read
Authorization: Bearer <token>
```

### 获取未读数量
```http
GET /api/notifications/unread-count
Authorization: Bearer <token>
```

## 管理员功能

### 审核网站 - 通过
```http
PUT /api/admin/websites/:id/approve
Authorization: Bearer <admin_token>
```

### 审核网站 - 拒绝
```http
PUT /api/admin/websites/:id/reject
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "reason": "Website contains inappropriate content"
}
```

### 批量操作
```http
POST /api/admin/websites/batch
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "ids": [123, 124, 125],
  "action": "approve"
}
```

### 用户管理
```http
# 封禁用户
PUT /api/admin/users/:id/ban
Authorization: Bearer <admin_token>

# 解封用户
PUT /api/admin/users/:id/unban
Authorization: Bearer <admin_token>

# 设置管理员
PUT /api/admin/users/:id/set-role
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "role": "ADMIN"
}
```

### 举报管理
```http
# 获取举报列表
GET /api/admin/reports?status=OPEN

# 处理举报
PUT /api/admin/reports/:id/resolve
Authorization: Bearer <admin_token>
```

## 统计分析

### 获取平台统计
```http
GET /api/stats/overview
```

### 获取趋势数据
```http
GET /api/analytics/trends?range=7d
Authorization: Bearer <admin_token>
```

### 获取排行榜
```http
GET /api/stats/leaderboard?type=websites&period=week&limit=10
```

### 用户活动分析
```http
GET /api/analytics/user-activity/:userId
Authorization: Bearer <token>
```

## 错误码说明

### HTTP 状态码
| 状态码 | 说明 |
|-------|------|
| 200 | 成功 |
| 201 | 创建成功 |
| 400 | 请求参数错误 |
| 401 | 未认证 |
| 403 | 无权限 |
| 404 | 资源不存在 |
| 409 | 冲突（如重复提交） |
| 429 | 请求过于频繁 |
| 500 | 服务器内部错误 |

### 业务错误码
| 错误码 | 说明 | 处理建议 |
|--------|------|----------|
| UNAUTHORIZED | 未认证 | 重定向到登录页 |
| FORBIDDEN | 无权限 | 提示用户权限不足 |
| NOT_FOUND | 资源不存在 | 显示404页面 |
| VALIDATION_ERROR | 验证失败 | 显示具体字段错误 |
| DUPLICATE_URL | URL已存在 | 提示用户更换URL |
| RATE_LIMIT_EXCEEDED | 请求过频 | 等待后重试 |
| ALREADY_LIKED | 已点赞 | 更新UI状态 |
| USER_BANNED | 用户被封禁 | 提示并登出 |

## 最佳实践

### 请求频率限制
- 普通用户：100次/小时
- 认证用户：1000次/小时
- 管理员：无限制

### 分页规范
- 默认每页20条
- 最大每页100条
- 使用 `page` 和 `limit` 参数

### 缓存策略
- 列表数据：5分钟
- 用户信息：10分钟
- 统计数据：1小时
- 使用 ETag 进行条件请求

### 错误处理示例
```javascript
try {
  const response = await fetch('/api/websites', {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  
  const data = await response.json();
  
  if (!data.success) {
    switch (data.error.code) {
      case 'UNAUTHORIZED':
        // 重定向到登录
        break;
      case 'VALIDATION_ERROR':
        // 显示表单错误
        break;
      default:
        // 显示通用错误消息
    }
  }
} catch (error) {
  // 网络错误处理
}
```

### 批量操作
- 最多支持100个项目
- 返回每个操作的结果
- 部分失败不影响其他操作

### WebSocket 实时通信（规划中）
```javascript
const ws = new WebSocket('wss://api.webspark.club/ws');

ws.on('connect', () => {
  ws.send(JSON.stringify({
    type: 'auth',
    token: 'your-jwt-token'
  }));
});

ws.on('message', (data) => {
  const event = JSON.parse(data);
  switch (event.type) {
    case 'notification':
      // 处理新通知
      break;
    case 'like':
      // 实时点赞通知
      break;
  }
});
```

## 健康检查端点

### 基础健康检查
```http
GET /health
```

### 详细健康检查
```http
GET /health/detailed
```

### Kubernetes 就绪探针
```http
GET /health/ready
```

### Kubernetes 存活探针
```http
GET /health/live
```

## 更新日志

- **v1.0.0** - 初始版本发布
- **v1.1.0** - 添加推荐系统API
- **v1.2.0** - 添加通知系统
- **v1.3.0** - 添加高级搜索功能
- **v1.4.0** - 添加数据分析API
- **v1.5.0** - 性能优化和安全加固
