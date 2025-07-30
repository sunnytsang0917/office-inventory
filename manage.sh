#!/bin/bash

# Office Inventory System 管理脚本
# 提供系统部署、监控、备份等一站式管理功能

set -e

# 配置变量
PROJECT_NAME="Office Inventory System"
VERSION="1.0.0"
LOG_FILE="./logs/manage.log"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

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

info() {
    echo -e "${CYAN}[INFO]${NC} $1"
}

# 创建必要目录
mkdir -p "$(dirname "$LOG_FILE")"

# 显示横幅
show_banner() {
    echo -e "${PURPLE}"
    cat << 'EOF'
   ____   __  __ _            ___                      _                   
  / __ \ / _|/ _(_)          |_ _|_ ____   _____ _ __ | |_ ___  _ __ _   _ 
 | |  | | |_| |_ _  ___ ___   | || '_ \ \ / / _ \ '_ \| __/ _ \| '__| | | |
 | |  | |  _|  _| |/ __/ _ \  | || | | \ V /  __/ | | | || (_) | |  | |_| |
 | |__| | | | | | | (_|  __/ |___|_| |_|\_/ \___|_| |_|\__\___/|_|   \__, |
  \____/|_| |_| |_|\___\___| |_____|                                 |___/ 
                                                                           
EOF
    echo -e "${NC}"
    echo -e "${CYAN}$PROJECT_NAME 管理工具 v$VERSION${NC}"
    echo -e "${CYAN}======================================${NC}"
    echo ""
}

# 检查系统要求
check_requirements() {
    log "检查系统要求..."
    
    local missing_tools=()
    
    # 检查必需工具
    local required_tools=("docker" "docker-compose" "git" "curl")
    for tool in "${required_tools[@]}"; do
        if ! command -v "$tool" &> /dev/null; then
            missing_tools+=("$tool")
        fi
    done
    
    if [ ${#missing_tools[@]} -ne 0 ]; then
        error "缺少必需工具: ${missing_tools[*]}"
        echo "请安装缺少的工具后重试"
        exit 1
    fi
    
    success "系统要求检查通过"
}

# 显示系统状态
show_status() {
    info "系统状态概览:"
    echo ""
    
    # Docker服务状态
    echo -e "${YELLOW}Docker 服务状态:${NC}"
    if docker-compose ps 2>/dev/null; then
        echo ""
    else
        echo "Docker服务未运行或配置文件不存在"
        echo ""
    fi
    
    # 健康检查
    echo -e "${YELLOW}服务健康检查:${NC}"
    local services=(
        "Frontend:http://localhost/health"
        "Backend:http://localhost:3001/health"
        "Database:http://localhost:5432"
    )
    
    for service_info in "${services[@]}"; do
        local name=$(echo "$service_info" | cut -d: -f1)
        local url=$(echo "$service_info" | cut -d: -f2-)
        
        if [ "$name" = "Database" ]; then
            if docker-compose exec -T postgres pg_isready -U postgres > /dev/null 2>&1; then
                echo -e "  ✅ $name: 正常"
            else
                echo -e "  ❌ $name: 异常"
            fi
        else
            if curl -f "$url" > /dev/null 2>&1; then
                echo -e "  ✅ $name: 正常"
            else
                echo -e "  ❌ $name: 异常"
            fi
        fi
    done
    
    echo ""
    
    # 系统资源
    echo -e "${YELLOW}系统资源:${NC}"
    echo "  磁盘使用: $(df -h . | awk 'NR==2 {print $5}') (可用: $(df -h . | awk 'NR==2 {print $4}'))"
    echo "  内存使用: $(free -h | awk 'NR==2{printf "%.1f%%", $3/$2*100}')"
    
    if command -v docker &> /dev/null; then
        echo "  Docker镜像: $(docker images | wc -l) 个"
        echo "  Docker容器: $(docker ps -a | wc -l) 个"
    fi
    
    echo ""
}

# 显示帮助信息
show_help() {
    echo -e "${CYAN}用法: $0 <命令> [选项]${NC}"
    echo ""
    echo -e "${YELLOW}部署命令:${NC}"
    echo "  install         - 首次安装系统"
    echo "  start           - 启动所有服务"
    echo "  stop            - 停止所有服务"
    echo "  restart         - 重启所有服务"
    echo "  deploy          - 部署新版本"
    echo "  rollback        - 回滚到上一版本"
    echo ""
    echo -e "${YELLOW}管理命令:${NC}"
    echo "  status          - 显示系统状态"
    echo "  logs [service]  - 查看日志"
    echo "  shell <service> - 进入容器shell"
    echo "  update          - 更新系统"
    echo "  cleanup         - 清理系统资源"
    echo ""
    echo -e "${YELLOW}备份命令:${NC}"
    echo "  backup [type]   - 创建备份 (full|database|files)"
    echo "  restore         - 恢复备份"
    echo "  list-backups    - 列出可用备份"
    echo ""
    echo -e "${YELLOW}监控命令:${NC}"
    echo "  monitor         - 启动监控"
    echo "  health          - 健康检查"
    echo "  metrics         - 显示性能指标"
    echo "  alerts          - 显示告警信息"
    echo ""
    echo -e "${YELLOW}安全命令:${NC}"
    echo "  security-setup  - 配置系统安全"
    echo "  security-check  - 安全检查"
    echo "  ssl-setup       - 配置SSL证书"
    echo ""
    echo -e "${YELLOW}开发命令:${NC}"
    echo "  dev-start       - 启动开发环境"
    echo "  dev-stop        - 停止开发环境"
    echo "  test            - 运行测试"
    echo ""
    echo -e "${YELLOW}其他命令:${NC}"
    echo "  version         - 显示版本信息"
    echo "  help            - 显示此帮助信息"
}

# 首次安装
install_system() {
    log "开始系统安装..."
    
    # 检查要求
    check_requirements
    
    # 创建环境配置
    if [ ! -f .env ]; then
        log "创建环境配置文件..."
        cp .env.production .env
        warning "请编辑 .env 文件并设置正确的配置值"
        warning "特别注意修改数据库密码和JWT密钥"
        
        echo "是否现在编辑配置文件？(y/N)"
        read -r response
        if [[ "$response" =~ ^[Yy]$ ]]; then
            ${EDITOR:-nano} .env
        fi
    fi
    
    # 生成SSL证书
    log "生成SSL证书..."
    ./scripts/generate-ssl.sh self-signed
    
    # 构建和启动服务
    log "构建Docker镜像..."
    docker-compose build
    
    log "启动服务..."
    docker-compose up -d
    
    # 等待服务启动
    log "等待服务启动..."
    sleep 15
    
    # 健康检查
    if ./scripts/monitor.sh check; then
        success "系统安装完成！"
        echo ""
        echo -e "${GREEN}访问地址:${NC}"
        echo "  前端: http://localhost"
        echo "  后端API: http://localhost:3001"
        echo ""
        echo -e "${YELLOW}下一步:${NC}"
        echo "  1. 访问前端页面测试功能"
        echo "  2. 运行 $0 security-setup 配置安全设置"
        echo "  3. 运行 $0 backup full 创建初始备份"
    else
        error "系统安装失败，请检查日志"
        exit 1
    fi
}

# 主函数
main() {
    # 显示横幅
    show_banner
    
    case "${1:-help}" in
        "install")
            install_system
            ;;
        "start")
            log "启动系统..."
            ./docker-start.sh
            ;;
        "stop")
            log "停止系统..."
            docker-compose down
            success "系统已停止"
            ;;
        "restart")
            log "重启系统..."
            docker-compose restart
            success "系统已重启"
            ;;
        "deploy")
            ./scripts/deploy.sh deploy
            ;;
        "rollback")
            ./scripts/deploy.sh rollback
            ;;
        "status")
            show_status
            ;;
        "logs")
            if [ -n "$2" ]; then
                docker-compose logs -f "$2"
            else
                docker-compose logs -f
            fi
            ;;
        "shell")
            if [ -n "$2" ]; then
                docker-compose exec "$2" sh
            else
                error "请指定服务名称: backend, frontend, postgres"
            fi
            ;;
        "update")
            log "更新系统..."
            git pull origin main
            docker-compose build
            docker-compose up -d
            success "系统更新完成"
            ;;
        "cleanup")
            log "清理系统资源..."
            docker system prune -f
            docker volume prune -f
            success "清理完成"
            ;;
        "backup")
            ./scripts/backup.sh "${2:-full}"
            ;;
        "restore")
            ./scripts/restore.sh interactive
            ;;
        "list-backups")
            ./scripts/backup.sh list
            ;;
        "monitor")
            ./scripts/monitor.sh monitor
            ;;
        "health")
            ./scripts/monitor.sh check
            ;;
        "metrics")
            ./scripts/monitor.sh metrics
            ;;
        "alerts")
            ./scripts/monitor.sh alerts
            ;;
        "security-setup")
            sudo ./scripts/security-setup.sh all
            ;;
        "security-check")
            ./scripts/security-setup.sh check
            ;;
        "ssl-setup")
            ./scripts/generate-ssl.sh "${2:-self-signed}"
            ;;
        "dev-start")
            log "启动开发环境..."
            docker-compose -f docker-compose.dev.yml up -d
            success "开发环境已启动"
            ;;
        "dev-stop")
            log "停止开发环境..."
            docker-compose -f docker-compose.dev.yml down
            success "开发环境已停止"
            ;;
        "test")
            log "运行测试..."
            # 后端测试
            docker-compose exec backend npm test
            # E2E测试
            npm run test:e2e
            ;;
        "version")
            echo -e "${CYAN}$PROJECT_NAME v$VERSION${NC}"
            echo "Docker版本: $(docker --version)"
            echo "Docker Compose版本: $(docker-compose --version)"
            ;;
        "help"|*)
            show_help
            ;;
    esac
}

# 信号处理
trap 'log "管理脚本被中断"; exit 0' INT TERM

# 执行主流程
main "$@"