#!/bin/bash

# WebSpark.club 项目初始化脚本
# 使用方法: ./scripts/setup.sh

set -e

echo "🚀 开始初始化 WebSpark.club 项目..."

# 检查必要的工具
check_requirements() {
    echo "📋 检查系统要求..."
    
    # 检查 Node.js
    if ! command -v node &> /dev/null; then
        echo "❌ Node.js 未安装，请先安装 Node.js 18+"
        exit 1
    fi
    
    node_version=$(node -v | cut -d'.' -f1 | sed 's/v//')
    if [ "$node_version" -lt 18 ]; then
        echo "❌ Node.js 版本过低，需要 18+，当前版本: $(node -v)"
        exit 1
    fi
    
    # 检查 Docker
    if ! command -v docker &> /dev/null; then
        echo "❌ Docker 未安装，请先安装 Docker"
        exit 1
    fi
    
    # 检查 Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        echo "❌ Docker Compose 未安装，请先安装 Docker Compose"
        exit 1
    fi
    
    echo "✅ 系统要求检查通过"
}

# 初始化前端项目
setup_frontend() {
    echo "🎨 初始化前端项目..."
    
    cd frontend
    
    # 创建 Next.js 项目
    if [ ! -f "package.json" ]; then
        npx create-next-app@latest . --typescript --tailwind --eslint --app --use-npm --no-git
    fi
    
    # 安装额外依赖
    npm install \
        @next-auth/prisma-adapter \
        next-auth \
        @types/node \
        react-hook-form \
        @hookform/resolvers \
        zod \
        react-hot-toast \
        @headlessui/react \
        @heroicons/react \
        swr \
        date-fns \
        react-markdown \
        remark-gfm
    
    cd ..
    echo "✅ 前端项目初始化完成"
}

# 初始化后端项目
setup_backend() {
    echo "⚙️  初始化后端项目..."
    
    cd backend
    
    # 创建 Strapi 项目
    if [ ! -f "package.json" ]; then
        npx create-strapi-app@latest . --quickstart --no-run --typescript
    fi
    
    cd ..
    echo "✅ 后端项目初始化完成"
}

# 创建环境变量文件
setup_env() {
    echo "🔐 创建环境变量文件..."
    
    # 前端环境变量
    if [ ! -f "frontend/.env.local" ]; then
        cat > frontend/.env.local << EOF
# NextAuth配置
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=$(openssl rand -base64 32)

# GitHub OAuth
GITHUB_ID=your_github_client_id
GITHUB_SECRET=your_github_client_secret

# Strapi API
NEXT_PUBLIC_STRAPI_URL=http://localhost:1337
STRAPI_API_TOKEN=your_strapi_api_token
EOF
        echo "📝 已创建 frontend/.env.local"
    fi
    
    # 后端环境变量
    if [ ! -f "backend/.env" ]; then
        cat > backend/.env << EOF
# 数据库配置
DATABASE_CLIENT=postgres
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=webspark
DATABASE_USERNAME=strapi
DATABASE_PASSWORD=$(openssl rand -base64 16)

# Strapi密钥 (生产环境请更换)
JWT_SECRET=$(openssl rand -base64 32)
ADMIN_JWT_SECRET=$(openssl rand -base64 32)
APP_KEYS=$(openssl rand -base64 16),$(openssl rand -base64 16),$(openssl rand -base64 16),$(openssl rand -base64 16)
API_TOKEN_SALT=$(openssl rand -base64 16)
TRANSFER_TOKEN_SALT=$(openssl rand -base64 16)

# 环境
NODE_ENV=development
EOF
        echo "📝 已创建 backend/.env"
    fi
    
    # Docker环境变量
    if [ ! -f "docker/.env" ]; then
        cp backend/.env docker/.env
        echo "📝 已创建 docker/.env"
    fi
    
    echo "✅ 环境变量文件创建完成"
}

# 创建开发脚本
create_dev_scripts() {
    echo "📜 创建开发脚本..."
    
    # 创建启动脚本
    cat > scripts/dev.sh << EOF
#!/bin/bash
# 启动开发环境

echo "🚀 启动 WebSpark.club 开发环境..."

# 启动后端 (在后台)
echo "⚙️  启动 Strapi 后端..."
cd backend && npm run develop &
BACKEND_PID=\$!

# 等待后端启动
sleep 10

# 启动前端
echo "🎨 启动 Next.js 前端..."
cd ../frontend && npm run dev &
FRONTEND_PID=\$!

echo "✅ 开发环境已启动!"
echo "🎨 前端: http://localhost:3000"
echo "⚙️  后端: http://localhost:1337"
echo "📊 Strapi后台: http://localhost:1337/admin"

# 等待用户中断
trap "kill \$BACKEND_PID \$FRONTEND_PID; exit" INT
wait
EOF

    chmod +x scripts/dev.sh
    
    # 创建构建脚本
    cat > scripts/build.sh << EOF
#!/bin/bash
# 构建生产版本

echo "🏗️  构建 WebSpark.club 生产版本..."

# 构建前端
echo "🎨 构建前端..."
cd frontend && npm run build

# 构建后端
echo "⚙️  构建后端..."
cd ../backend && npm run build

echo "✅ 构建完成!"
EOF

    chmod +x scripts/build.sh
    
    echo "✅ 开发脚本创建完成"
}

# 主执行流程
main() {
    check_requirements
    setup_frontend
    setup_backend
    setup_env
    create_dev_scripts
    
    echo ""
    echo "🎉 WebSpark.club 项目初始化完成!"
    echo ""
    echo "📖 下一步操作:"
    echo "1. 配置环境变量 (frontend/.env.local 和 backend/.env)"
    echo "2. 运行 ./scripts/dev.sh 启动开发环境"
    echo "3. 访问 http://localhost:3000 查看前端"
    echo "4. 访问 http://localhost:1337/admin 配置Strapi后台"
    echo ""
    echo "📚 更多信息请查看 README.md"
}

# 执行主函数
main "$@" 