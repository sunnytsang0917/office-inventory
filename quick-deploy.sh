#!/bin/bash

# 出入库0725系统 - 快速部署脚本
# 使用方法: ./quick-deploy.sh

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 配置
COMPOSE_FILE="docker-compose.prod.simple.yml"
ENV_FILE=".env.production"

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查Docker
check_docker() {
    if ! command -v docker &> /dev/null; then
        log_error "Docker未安装，请先安装Docker"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose未安装，请先安装Docker Compose"
        exit 1
    fi
    
    log_success "Docker环境检查完成"
}

# 创建环境变量文件
create_env_file() {
    if [ ! -f "$ENV_FILE" ]; then
        log_info "创建环境变量文件..."
        cp env.production.example "$ENV_FILE"
        log_warning "请编辑 $ENV_FILE 文件，配置您的生产环境参数"
        log_info "特别是以下重要参数："
        log_info "  - DB_PASSWORD: 数据库密码"
        log_info "  - JWT_SECRET: JWT密钥"
        log_info "  - CORS_ORIGIN: 允许的域名"
        read -p "配置完成后按回车键继续..."
    fi
}

# 创建必要目录
create_directories() {
    log_info "创建必要目录..."
    mkdir -p backups
    mkdir -p logs
    mkdir -p nginx/ssl
    log_success "目录创建完成"
}

# 停止现有服务
stop_existing() {
    log_info "停止现有服务..."
    docker-compose -f "$COMPOSE_FILE" down 2>/dev/null || true
    log_success "现有服务已停止"
}

# 构建镜像
build_images() {
    log_info "构建Docker镜像..."
    docker-compose -f "$COMPOSE_FILE" build --no-cache
    log_success "镜像构建完成"
}

# 启动服务
start_services() {
    log_info "启动服务..."
    docker-compose -f "$COMPOSE_FILE" up -d
    log_success "服务启动完成"
}

# 等待服务启动
wait_for_services() {
    log_info "等待服务启动..."
    sleep 10
    
    # 等待数据库
    log_info "等待数据库启动..."
    for i in {1..30}; do
        if docker-compose -f "$COMPOSE_FILE" exec -T postgres pg_isready -U postgres > /dev/null 2>&1; then
            log_success "数据库启动完成"
            break
        fi
        if [ $i -eq 30 ]; then
            log_error "数据库启动超时"
            exit 1
        fi
        sleep 2
    done
    
    # 等待后端API
    log_info "等待后端API启动..."
    for i in {1..30}; do
        if curl -f http://localhost:3001/api/health > /dev/null 2>&1; then
            log_success "后端API启动完成"
            break
        fi
        if [ $i -eq 30 ]; then
            log_error "后端API启动超时"
            exit 1
        fi
        sleep 2
    done
    
    # 等待前端
    log_info "等待前端启动..."
    for i in {1..30}; do
        if curl -f http://localhost:80 > /dev/null 2>&1; then
            log_success "前端启动完成"
            break
        fi
        if [ $i -eq 30 ]; then
            log_error "前端启动超时"
            exit 1
        fi
        sleep 2
    done
}

# 显示部署信息
show_deployment_info() {
    log_success "部署完成！"
    echo ""
    echo "服务访问地址："
    echo "  - 前端界面: http://localhost:80"
    echo "  - 后端API: http://localhost:3001"
    echo "  - Nginx代理: http://localhost:8080"
    echo ""
    echo "管理命令："
    echo "  - 查看状态: docker-compose -f $COMPOSE_FILE ps"
    echo "  - 查看日志: docker-compose -f $COMPOSE_FILE logs -f"
    echo "  - 停止服务: docker-compose -f $COMPOSE_FILE down"
    echo "  - 重启服务: docker-compose -f $COMPOSE_FILE restart"
    echo ""
    echo "数据库信息："
    echo "  - 主机: localhost"
    echo "  - 端口: 5432"
    echo "  - 数据库: office_inventory"
    echo "  - 用户名: postgres"
    echo ""
    log_warning "请确保修改默认密码和JWT密钥以确保安全！"
}

# 主函数
main() {
    echo "=========================================="
    echo "    出入库0725系统 - 快速部署脚本"
    echo "=========================================="
    echo ""
    
    check_docker
    create_env_file
    create_directories
    stop_existing
    build_images
    start_services
    wait_for_services
    show_deployment_info
}

# 执行主函数
main "$@" 