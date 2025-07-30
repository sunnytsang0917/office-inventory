#!/bin/bash

# 自动化部署脚本
# 用于生产环境的零停机部署

set -e

# 配置变量
PROJECT_NAME="office-inventory"
BACKUP_DIR="./backups"
LOG_FILE="./logs/deploy.log"
HEALTH_CHECK_TIMEOUT=60
ROLLBACK_ENABLED=true

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "$LOG_FILE"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1" | tee -a "$LOG_FILE"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a "$LOG_FILE"
}

# 创建必要目录
mkdir -p "$BACKUP_DIR"
mkdir -p "$(dirname "$LOG_FILE")"

# 检查先决条件
check_prerequisites() {
    log "检查部署先决条件..."
    
    # 检查Docker
    if ! command -v docker &> /dev/null; then
        error "Docker未安装"
        exit 1
    fi
    
    # 检查docker-compose
    if ! command -v docker-compose &> /dev/null; then
        error "docker-compose未安装"
        exit 1
    fi
    
    # 检查Git
    if ! command -v git &> /dev/null; then
        error "Git未安装"
        exit 1
    fi
    
    # 检查环境变量文件
    if [ ! -f .env ]; then
        error ".env文件不存在"
        exit 1
    fi
    
    success "先决条件检查通过"
}

# 备份当前版本
backup_current_version() {
    log "备份当前版本..."
    
    local timestamp=$(date +%Y%m%d_%H%M%S)
    local backup_name="${PROJECT_NAME}_backup_${timestamp}"
    
    # 备份数据库
    if docker-compose ps postgres | grep -q "Up"; then
        log "备份数据库..."
        docker-compose exec -T postgres pg_dump -U postgres office_inventory > "${BACKUP_DIR}/db_${backup_name}.sql"
        success "数据库备份完成: ${BACKUP_DIR}/db_${backup_name}.sql"
    fi
    
    # 备份上传文件
    if [ -d "backend/uploads" ]; then
        log "备份上传文件..."
        tar -czf "${BACKUP_DIR}/uploads_${backup_name}.tar.gz" backend/uploads/
        success "上传文件备份完成: ${BACKUP_DIR}/uploads_${backup_name}.tar.gz"
    fi
    
    # 记录当前Git版本
    git rev-parse HEAD > "${BACKUP_DIR}/git_version_${backup_name}.txt"
    
    echo "$backup_name" > "${BACKUP_DIR}/latest_backup.txt"
    success "版本备份完成: $backup_name"
}

# 拉取最新代码
pull_latest_code() {
    log "拉取最新代码..."
    
    # 检查是否有未提交的更改
    if ! git diff-index --quiet HEAD --; then
        warning "检测到未提交的更改，将被暂存"
        git stash push -m "Auto-stash before deployment $(date)"
    fi
    
    # 拉取最新代码
    git fetch origin
    git pull origin main
    
    success "代码更新完成"
}

# 构建新镜像
build_images() {
    log "构建Docker镜像..."
    
    # 构建镜像
    docker-compose build --no-cache
    
    success "镜像构建完成"
}

# 健康检查
health_check() {
    local service=$1
    local url=$2
    local timeout=${3:-$HEALTH_CHECK_TIMEOUT}
    
    log "检查 $service 服务健康状态..."
    
    local count=0
    while [ $count -lt $timeout ]; do
        if curl -f "$url" > /dev/null 2>&1; then
            success "$service 服务健康检查通过"
            return 0
        fi
        
        sleep 1
        count=$((count + 1))
        
        if [ $((count % 10)) -eq 0 ]; then
            log "等待 $service 服务启动... ($count/$timeout)"
        fi
    done
    
    error "$service 服务健康检查失败"
    return 1
}

# 部署新版本
deploy_new_version() {
    log "部署新版本..."
    
    # 停止旧服务（保留数据库）
    docker-compose stop frontend backend
    
    # 启动新服务
    docker-compose up -d
    
    # 等待服务启动
    sleep 10
    
    # 健康检查
    if ! health_check "数据库" "http://localhost:5432" 30; then
        error "数据库健康检查失败"
        return 1
    fi
    
    if ! health_check "后端" "http://localhost:3001/health"; then
        error "后端健康检查失败"
        return 1
    fi
    
    if ! health_check "前端" "http://localhost/health"; then
        error "前端健康检查失败"
        return 1
    fi
    
    success "新版本部署成功"
}

# 回滚到上一个版本
rollback() {
    if [ "$ROLLBACK_ENABLED" != "true" ]; then
        error "回滚功能已禁用"
        return 1
    fi
    
    warning "开始回滚到上一个版本..."
    
    # 获取最新备份名称
    if [ ! -f "${BACKUP_DIR}/latest_backup.txt" ]; then
        error "未找到备份信息，无法回滚"
        return 1
    fi
    
    local backup_name=$(cat "${BACKUP_DIR}/latest_backup.txt")
    
    # 回滚Git版本
    if [ -f "${BACKUP_DIR}/git_version_${backup_name}.txt" ]; then
        local git_version=$(cat "${BACKUP_DIR}/git_version_${backup_name}.txt")
        git checkout "$git_version"
        log "Git版本已回滚到: $git_version"
    fi
    
    # 重新构建和部署
    docker-compose build
    docker-compose up -d
    
    # 恢复数据库（如果需要）
    if [ -f "${BACKUP_DIR}/db_${backup_name}.sql" ]; then
        warning "是否需要恢复数据库？这将覆盖当前数据！(y/N)"
        read -r response
        if [[ "$response" =~ ^[Yy]$ ]]; then
            docker-compose exec -T postgres psql -U postgres office_inventory < "${BACKUP_DIR}/db_${backup_name}.sql"
            log "数据库已恢复"
        fi
    fi
    
    success "回滚完成"
}

# 清理旧资源
cleanup() {
    log "清理旧资源..."
    
    # 清理未使用的Docker镜像
    docker image prune -f
    
    # 清理旧备份（保留最近7天）
    find "$BACKUP_DIR" -name "*.sql" -mtime +7 -delete
    find "$BACKUP_DIR" -name "*.tar.gz" -mtime +7 -delete
    find "$BACKUP_DIR" -name "git_version_*.txt" -mtime +7 -delete
    
    success "清理完成"
}

# 发送通知
send_notification() {
    local status=$1
    local message=$2
    
    # 这里可以集成Slack、邮件或其他通知系统
    log "通知: [$status] $message"
    
    # 示例：发送到Slack（需要配置SLACK_WEBHOOK_URL）
    if [ -n "$SLACK_WEBHOOK_URL" ]; then
        curl -X POST -H 'Content-type: application/json' \
            --data "{\"text\":\"[$status] Office Inventory Deployment: $message\"}" \
            "$SLACK_WEBHOOK_URL" > /dev/null 2>&1
    fi
}

# 主部署流程
main() {
    log "开始部署 Office Inventory System..."
    
    # 检查参数
    case "${1:-deploy}" in
        "deploy")
            check_prerequisites
            backup_current_version
            pull_latest_code
            build_images
            
            if deploy_new_version; then
                cleanup
                send_notification "SUCCESS" "部署成功完成"
                success "部署完成！"
            else
                error "部署失败，开始回滚..."
                rollback
                send_notification "FAILED" "部署失败，已回滚到上一版本"
                exit 1
            fi
            ;;
        "rollback")
            rollback
            send_notification "ROLLBACK" "手动回滚到上一版本"
            ;;
        "backup")
            backup_current_version
            ;;
        "health")
            health_check "后端" "http://localhost:3001/health"
            health_check "前端" "http://localhost/health"
            ;;
        *)
            echo "用法: $0 [deploy|rollback|backup|health]"
            echo "  deploy  - 部署新版本（默认）"
            echo "  rollback - 回滚到上一版本"
            echo "  backup  - 仅备份当前版本"
            echo "  health  - 健康检查"
            exit 1
            ;;
    esac
}

# 信号处理
trap 'error "部署被中断"; exit 1' INT TERM

# 执行主流程
main "$@"