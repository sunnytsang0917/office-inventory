#!/bin/bash

# 系统安全配置脚本
# 配置防火墙、安全设置和访问控制

set -e

# 配置变量
LOG_FILE="./logs/security.log"
ALLOWED_PORTS=(22 80 443 3001 5432)
FAIL2BAN_ENABLED=true
UFW_ENABLED=true

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

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

# 创建日志目录
mkdir -p "$(dirname "$LOG_FILE")"

# 检查是否为root用户
check_root() {
    if [ "$EUID" -ne 0 ]; then
        error "此脚本需要root权限运行"
        echo "请使用: sudo $0"
        exit 1
    fi
}

# 配置UFW防火墙
setup_firewall() {
    log "配置UFW防火墙..."
    
    # 安装UFW（如果未安装）
    if ! command -v ufw &> /dev/null; then
        log "安装UFW防火墙..."
        apt-get update
        apt-get install -y ufw
    fi
    
    # 重置UFW规则
    ufw --force reset
    
    # 设置默认策略
    ufw default deny incoming
    ufw default allow outgoing
    
    # 允许必要端口
    for port in "${ALLOWED_PORTS[@]}"; do
        case $port in
            22)
                log "允许SSH端口 $port"
                ufw allow $port/tcp comment 'SSH'
                ;;
            80)
                log "允许HTTP端口 $port"
                ufw allow $port/tcp comment 'HTTP'
                ;;
            443)
                log "允许HTTPS端口 $port"
                ufw allow $port/tcp comment 'HTTPS'
                ;;
            3001)
                log "允许后端API端口 $port（仅本地）"
                ufw allow from 127.0.0.1 to any port $port comment 'Backend API'
                ufw allow from ::1 to any port $port comment 'Backend API IPv6'
                ;;
            5432)
                log "允许PostgreSQL端口 $port（仅本地）"
                ufw allow from 127.0.0.1 to any port $port comment 'PostgreSQL'
                ufw allow from ::1 to any port $port comment 'PostgreSQL IPv6'
                ;;
        esac
    done
    
    # 启用UFW
    if [ "$UFW_ENABLED" = true ]; then
        ufw --force enable
        success "UFW防火墙已启用"
    else
        log "UFW防火墙已配置但未启用"
    fi
    
    # 显示防火墙状态
    ufw status verbose
}

# 配置Fail2Ban
setup_fail2ban() {
    if [ "$FAIL2BAN_ENABLED" != true ]; then
        log "跳过Fail2Ban配置"
        return
    fi
    
    log "配置Fail2Ban..."
    
    # 安装Fail2Ban
    if ! command -v fail2ban-server &> /dev/null; then
        log "安装Fail2Ban..."
        apt-get update
        apt-get install -y fail2ban
    fi
    
    # 创建本地配置文件
    cat > /etc/fail2ban/jail.local << 'EOF'
[DEFAULT]
# 禁止时间（秒）
bantime = 3600

# 查找时间窗口（秒）
findtime = 600

# 最大重试次数
maxretry = 5

# 忽略的IP地址
ignoreip = 127.0.0.1/8 ::1

[sshd]
enabled = true
port = ssh
filter = sshd
logpath = /var/log/auth.log
maxretry = 3

[nginx-http-auth]
enabled = true
filter = nginx-http-auth
port = http,https
logpath = /var/log/nginx/error.log

[nginx-limit-req]
enabled = true
filter = nginx-limit-req
port = http,https
logpath = /var/log/nginx/error.log
maxretry = 10

[nginx-botsearch]
enabled = true
filter = nginx-botsearch
port = http,https
logpath = /var/log/nginx/access.log
maxretry = 2
EOF
    
    # 创建nginx过滤器
    cat > /etc/fail2ban/filter.d/nginx-limit-req.conf << 'EOF'
[Definition]
failregex = limiting requests, excess: .* by zone .*, client: <HOST>
ignoreregex =
EOF
    
    cat > /etc/fail2ban/filter.d/nginx-botsearch.conf << 'EOF'
[Definition]
failregex = <HOST> -.*"(GET|POST).*(\.php|\.asp|\.exe|\.pl|\.cgi|\.scgi)
ignoreregex =
EOF
    
    # 重启Fail2Ban服务
    systemctl restart fail2ban
    systemctl enable fail2ban
    
    success "Fail2Ban已配置并启动"
    
    # 显示Fail2Ban状态
    fail2ban-client status
}

# 配置系统安全设置
setup_system_security() {
    log "配置系统安全设置..."
    
    # 禁用不必要的服务
    local services_to_disable=("telnet" "rsh" "rlogin")
    for service in "${services_to_disable[@]}"; do
        if systemctl is-enabled "$service" &>/dev/null; then
            systemctl disable "$service"
            log "已禁用服务: $service"
        fi
    done
    
    # 配置SSH安全设置
    if [ -f /etc/ssh/sshd_config ]; then
        log "配置SSH安全设置..."
        
        # 备份原配置
        cp /etc/ssh/sshd_config /etc/ssh/sshd_config.backup
        
        # 应用安全配置
        sed -i 's/#PermitRootLogin yes/PermitRootLogin no/' /etc/ssh/sshd_config
        sed -i 's/#PasswordAuthentication yes/PasswordAuthentication yes/' /etc/ssh/sshd_config
        sed -i 's/#PubkeyAuthentication yes/PubkeyAuthentication yes/' /etc/ssh/sshd_config
        sed -i 's/#Protocol 2/Protocol 2/' /etc/ssh/sshd_config
        
        # 添加其他安全设置
        cat >> /etc/ssh/sshd_config << 'EOF'

# Office Inventory Security Settings
MaxAuthTries 3
ClientAliveInterval 300
ClientAliveCountMax 2
AllowUsers $(whoami)
EOF
        
        # 重启SSH服务
        systemctl restart sshd
        success "SSH安全设置已应用"
    fi
    
    # 设置文件权限
    log "设置应用文件权限..."
    
    # 设置敏感文件权限
    if [ -f .env ]; then
        chmod 600 .env
        log "已设置.env文件权限为600"
    fi
    
    if [ -d nginx/ssl ]; then
        chmod 700 nginx/ssl
        find nginx/ssl -name "*.pem" -exec chmod 600 {} \;
        log "已设置SSL证书文件权限"
    fi
    
    if [ -d backend/uploads ]; then
        chmod 755 backend/uploads
        log "已设置上传目录权限"
    fi
}

# 配置Docker安全设置
setup_docker_security() {
    log "配置Docker安全设置..."
    
    # 创建Docker daemon配置
    mkdir -p /etc/docker
    
    cat > /etc/docker/daemon.json << 'EOF'
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  },
  "live-restore": true,
  "userland-proxy": false,
  "no-new-privileges": true,
  "seccomp-profile": "/etc/docker/seccomp.json"
}
EOF
    
    # 重启Docker服务
    systemctl restart docker
    
    success "Docker安全设置已应用"
}

# 设置日志监控
setup_log_monitoring() {
    log "设置日志监控..."
    
    # 配置logrotate
    cat > /etc/logrotate.d/office-inventory << 'EOF'
/var/log/nginx/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 www-data www-data
    postrotate
        if [ -f /var/run/nginx.pid ]; then
            kill -USR1 `cat /var/run/nginx.pid`
        fi
    endscript
}

/home/*/office-inventory/logs/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644
}
EOF
    
    success "日志轮转已配置"
}

# 创建安全检查脚本
create_security_check() {
    log "创建安全检查脚本..."
    
    cat > ./scripts/security-check.sh << 'EOF'
#!/bin/bash

# 安全检查脚本

echo "Office Inventory 安全检查报告"
echo "生成时间: $(date)"
echo "========================================"

echo ""
echo "1. 防火墙状态:"
ufw status

echo ""
echo "2. Fail2Ban状态:"
if command -v fail2ban-client &> /dev/null; then
    fail2ban-client status
else
    echo "Fail2Ban未安装"
fi

echo ""
echo "3. SSH配置检查:"
if [ -f /etc/ssh/sshd_config ]; then
    echo "PermitRootLogin: $(grep PermitRootLogin /etc/ssh/sshd_config | grep -v '#')"
    echo "PasswordAuthentication: $(grep PasswordAuthentication /etc/ssh/sshd_config | grep -v '#')"
    echo "MaxAuthTries: $(grep MaxAuthTries /etc/ssh/sshd_config | grep -v '#')"
fi

echo ""
echo "4. 文件权限检查:"
if [ -f .env ]; then
    echo ".env权限: $(stat -c %a .env)"
fi

if [ -d nginx/ssl ]; then
    echo "SSL目录权限: $(stat -c %a nginx/ssl)"
    find nginx/ssl -name "*.pem" -exec echo "SSL文件权限: {} $(stat -c %a {})" \;
fi

echo ""
echo "5. Docker安全检查:"
if command -v docker &> /dev/null; then
    echo "Docker版本: $(docker --version)"
    echo "运行中的容器:"
    docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
fi

echo ""
echo "6. 系统更新检查:"
if command -v apt &> /dev/null; then
    apt list --upgradable 2>/dev/null | wc -l | xargs echo "可更新软件包数量:"
fi

echo ""
echo "7. 磁盘空间检查:"
df -h / | tail -1

echo ""
echo "8. 内存使用检查:"
free -h

echo ""
echo "9. 最近的安全日志:"
if [ -f /var/log/auth.log ]; then
    tail -10 /var/log/auth.log | grep -E "(Failed|Invalid|Accepted)"
fi

echo ""
echo "========================================"
echo "安全检查完成"
EOF
    
    chmod +x ./scripts/security-check.sh
    success "安全检查脚本已创建: ./scripts/security-check.sh"
}

# 主函数
main() {
    case "${1:-all}" in
        "all")
            check_root
            setup_firewall
            setup_fail2ban
            setup_system_security
            setup_docker_security
            setup_log_monitoring
            create_security_check
            success "所有安全配置已完成"
            ;;
        "firewall")
            check_root
            setup_firewall
            ;;
        "fail2ban")
            check_root
            setup_fail2ban
            ;;
        "system")
            check_root
            setup_system_security
            ;;
        "docker")
            check_root
            setup_docker_security
            ;;
        "logs")
            check_root
            setup_log_monitoring
            ;;
        "check")
            if [ -f ./scripts/security-check.sh ]; then
                ./scripts/security-check.sh
            else
                error "安全检查脚本不存在，请先运行: $0 all"
            fi
            ;;
        *)
            echo "用法: $0 [all|firewall|fail2ban|system|docker|logs|check]"
            echo "  all      - 执行所有安全配置"
            echo "  firewall - 仅配置防火墙"
            echo "  fail2ban - 仅配置Fail2Ban"
            echo "  system   - 仅配置系统安全"
            echo "  docker   - 仅配置Docker安全"
            echo "  logs     - 仅配置日志监控"
            echo "  check    - 执行安全检查"
            exit 1
            ;;
    esac
}

# 执行主流程
main "$@"