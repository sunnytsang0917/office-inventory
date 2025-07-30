#!/bin/bash

# 办公室库存管理系统 Docker 启动脚本

set -e

echo "🚀 启动办公室库存管理系统..."

# 检查是否存在.env文件
if [ ! -f .env ]; then
    echo "⚠️  未找到.env文件，复制.env.production模板..."
    cp .env.production .env
    echo "📝 请编辑.env文件并设置正确的配置值"
    echo "💡 特别注意修改数据库密码和JWT密钥"
    exit 1
fi

# 检查Docker是否运行
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker未运行，请先启动Docker"
    exit 1
fi

# 检查docker-compose是否可用
if ! command -v docker-compose &> /dev/null; then
    echo "❌ docker-compose未安装"
    exit 1
fi

# 创建必要的目录
echo "📁 创建必要的目录..."
mkdir -p nginx/ssl
mkdir -p backend/uploads
mkdir -p backend/logs

# 构建并启动服务
echo "🔨 构建Docker镜像..."
docker-compose build

echo "🚀 启动服务..."
docker-compose up -d

# 等待服务启动
echo "⏳ 等待服务启动..."
sleep 10

# 检查服务状态
echo "🔍 检查服务状态..."
docker-compose ps

# 检查健康状态
echo "🏥 检查服务健康状态..."

# 检查数据库
if docker-compose exec -T postgres pg_isready -U postgres > /dev/null 2>&1; then
    echo "✅ 数据库服务正常"
else
    echo "❌ 数据库服务异常"
fi

# 检查后端
if curl -f http://localhost:3001/health > /dev/null 2>&1; then
    echo "✅ 后端服务正常"
else
    echo "❌ 后端服务异常"
fi

# 检查前端
if curl -f http://localhost/health > /dev/null 2>&1; then
    echo "✅ 前端服务正常"
else
    echo "❌ 前端服务异常"
fi

echo ""
echo "🎉 系统启动完成！"
echo "🌐 前端访问地址: http://localhost"
echo "🔗 后端API地址: http://localhost:3001"
echo "📊 查看日志: docker-compose logs -f"
echo "🛑 停止服务: docker-compose down"
echo ""