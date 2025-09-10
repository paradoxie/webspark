# 🚀 WebSpark.club 服务器启动指南

## 问题解决 ✅

你的首页数据获取失败问题已经解决！

**问题原因**: 后端服务器没有运行，导致前端无法获取API数据

**解决方案**: 现在两个服务器都已经正常启动

## 当前服务器状态

### ✅ 后端服务器
- **地址**: `http://localhost:3001`
- **状态**: 正常运行
- **API测试**: `curl -s http://localhost:3001/api/websites | jq '.data | length'` 返回 `10`

### ✅ 前端服务器  
- **地址**: `http://localhost:3000`
- **状态**: 正常运行
- **页面测试**: `curl -I http://localhost:3000` 返回 `HTTP/1.1 200 OK`

## 快速启动命令

### 方法一：分别启动（推荐用于开发）

```bash
# 终端1：启动后端
cd backend && npm run dev

# 终端2：启动前端  
cd frontend && npm run dev
```

### 方法二：使用启动脚本

```bash
# 使用项目提供的启动脚本
./start-project.sh
```

### 方法三：后台启动

```bash
# 后台启动后端
cd backend && npm run dev &

# 后台启动前端
cd frontend && npm run dev &
```

## 验证服务器运行状态

```bash
# 检查后端API
curl -s http://localhost:3001/api/websites | jq '.data | length'

# 检查前端页面
curl -I http://localhost:3000

# 检查OAuth配置
curl -s http://localhost:3000/api/auth/providers | jq .
```

## 常见问题排查

### 1. 端口被占用
```bash
# 查看端口占用
lsof -i :3000
lsof -i :3001

# 杀死进程
kill -9 <PID>
```

### 2. 依赖问题
```bash
# 重新安装依赖
cd frontend && npm install
cd backend && npm install
```

### 3. 数据库连接问题
```bash
# 检查数据库状态
cd backend && npx prisma studio
```

## 开发建议

1. **保持两个服务器同时运行**: 前端需要后端API支持
2. **使用不同终端窗口**: 方便查看各自的日志输出
3. **定期重启**: 如果遇到问题，重启服务器通常能解决

## 现在可以做什么

✅ **访问首页**: `http://localhost:3000` - 应该能看到网站列表  
✅ **测试搜索**: 使用搜索框过滤网站  
✅ **测试登录**: 使用GitHub OAuth或测试凭证（admin/admin）  
✅ **提交作品**: 登录后访问 `/submit` 页面  
✅ **查看详情**: 点击任意网站查看详细信息  

## 🎉 恭喜！

你的WebSpark.club现在已经完全正常运行了！两个服务器都在工作，数据获取也没有问题。

**下一步**: 在浏览器中访问 `http://localhost:3000` 享受你的Web作品展示平台吧！ 