#!/bin/bash

# 出入库0725系统 - 生产环境部署脚本
# 使用方法: ./deploy.sh [start|stop|restart|build|logs|backup|restore]

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 配置
COMPOSE_FILE="docker-compose.prod.yml"
ENV_FILE=".env.production"
BACKUP_DIR="./backups"
LOG_DIR="./logs"

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

# 检查Docker和Docker Compose
check_dependencies() {
    log_info "检查依赖..."
    
    if ! command -v docker &> /dev/null; then
        log_error "Docker未安装，请先安装Docker"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose未安装，请先安装Docker Compose"
        exit 1
    fi
    
    log_success "依赖检查完成"
}

# 检查环境变量文件
check_env_file() {
    if [ ! -f "$ENV_FILE" ]; then
        log_warning "环境变量文件 $ENV_FILE 不存在"
        log_info "请复制 env.production.example 为 $ENV_FILE 并配置相应的环境变量"
        exit 1
    fi
    log_success "环境变量文件检查完成"
}

# 创建必要的目录
create_directories() {
    log_info "创建必要的目录..."
    mkdir -p "$BACKUP_DIR"
    mkdir -p "$LOG_DIR"
    mkdir -p "./nginx/ssl"
    log_success "目录创建完成"
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
    
    # 等待服务启动
    log_info "等待服务启动..."
    sleep 30
    
    # 检查服务状态
    check_services_health
}

# 停止服务
stop_services() {
    log_info "停止服务..."
    docker-compose -f "$COMPOSE_FILE" down
    log_success "服务停止完成"
}

# 重启服务
restart_services() {
    log_info "重启服务..."
    docker-compose -f "$COMPOSE_FILE" restart
    log_success "服务重启完成"
}

# 检查服务健康状态
check_services_health() {
    log_info "检查服务健康状态..."
    
    # 检查数据库
    if docker-compose -f "$COMPOSE_FILE" exec -T postgres pg_isready -U postgres > /dev/null 2>&1; then
        log_success "数据库服务正常"
    else
        log_error "数据库服务异常"
        return 1
    fi
    
    # 检查后端API
    if curl -f http://localhost:3001/api/health > /dev/null 2>&1; then
        log_success "后端API服务正常"
    else
        log_error "后端API服务异常"
        return 1
    fi
    
    # 检查前端
    if curl -f http://localhost:80 > /dev/null 2>&1; then
        log_success "前端服务正常"
    else
        log_error "前端服务异常"
        return 1
    fi
    
    log_success "所有服务健康检查通过"
}

# 查看日志
show_logs() {
    log_info "显示服务日志..."
    docker-compose -f "$COMPOSE_FILE" logs -f
}

# 备份数据库
backup_database() {
    log_info "备份数据库..."
    timestamp=$(date +"%Y%m%d_%H%M%S")
    backup_file="$BACKUP_DIR/db_backup_$timestamp.sql"
    
    docker-compose -f "$COMPOSE_FILE" exec -T postgres pg_dump -U postgres office_inventory > "$backup_file"
    
    if [ $? -eq 0 ]; then
        log_success "数据库备份完成: $backup_file"
    else
        log_error "数据库备份失败"
        return 1
    fi
}

# 恢复数据库
restore_database() {
    if [ -z "$1" ]; then
        log_error "请指定要恢复的备份文件"
        log_info "使用方法: $0 restore <backup_file>"
        exit 1
    fi
    
    backup_file="$1"
    if [ ! -f "$backup_file" ]; then
        log_error "备份文件不存在: $backup_file"
        exit 1
    fi
    
    log_info "恢复数据库..."
    docker-compose -f "$COMPOSE_FILE" exec -T postgres psql -U postgres -d office_inventory < "$backup_file"
    
    if [ $? -eq 0 ]; then
        log_success "数据库恢复完成"
    else
        log_error "数据库恢复失败"
        return 1
    fi
}

# 清理资源
cleanup() {
    log_info "清理未使用的Docker资源..."
    docker system prune -f
    log_success "清理完成"
}

# 显示服务状态
show_status() {
    log_info "服务状态:"
    docker-compose -f "$COMPOSE_FILE" ps
}

# 主函数
main() {
    case "$1" in
        "start")
            check_dependencies
            check_env_file
            create_directories
            start_services
            ;;
        "stop")
            stop_services
            ;;
        "restart")
            restart_services
            ;;
        "build")
            check_dependencies
            check_env_file
            create_directories
            build_images
            ;;
        "logs")
            show_logs
            ;;
        "backup")
            backup_database
            ;;
        "restore")
            restore_database "$2"
            ;;
        "status")
            show_status
            ;;
        "cleanup")
            cleanup
            ;;
        "health")
            check_services_health
            ;;
        *)
            echo "使用方法: $0 {start|stop|restart|build|logs|backup|restore|status|cleanup|health}"
            echo ""
            echo "命令说明:"
            echo "  start     - 启动所有服务"
            echo "  stop      - 停止所有服务"
            echo "  restart   - 重启所有服务"
            echo "  build     - 构建Docker镜像"
            echo "  logs      - 查看服务日志"
            echo "  backup    - 备份数据库"
            echo "  restore   - 恢复数据库 (需要指定备份文件)"
            echo "  status    - 查看服务状态"
            echo "  cleanup   - 清理Docker资源"
            echo "  health    - 检查服务健康状态"
            exit 1
            ;;
    esac
}

# 执行主函数
main "$@" 