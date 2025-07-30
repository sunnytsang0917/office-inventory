#!/bin/bash

# 应用监控脚本
# 提供健康检查、性能监控和告警功能

set -e

# 配置变量
LOG_FILE="./logs/monitor.log"
METRICS_FILE="./logs/metrics.log"
ALERT_THRESHOLD_CPU=80
ALERT_THRESHOLD_MEMORY=80
ALERT_THRESHOLD_DISK=90
ALERT_THRESHOLD_RESPONSE_TIME=5000
CHECK_INTERVAL=30

# 通知配置
SLACK_WEBHOOK_URL="${SLACK_WEBHOOK_URL:-}"
EMAIL_RECIPIENT="${MONITOR_EMAIL:-}"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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

# 创建必要目录
mkdir -p "$(dirname "$LOG_FILE")"
mkdir -p "$(dirname "$METRICS_FILE")"

# 发送告警通知
send_alert() {
    local level=$1
    local message=$2
    local timestamp=$(date +'%Y-%m-%d %H:%M:%S')
    
    log "[$level] $message"
    
    # Slack通知
    if [ -n "$SLACK_WEBHOOK_URL" ]; then
        local color="good"
        case "$level" in
            "CRITICAL") color="danger" ;;
            "WARNING") color="warning" ;;
        esac
        
        curl -X POST -H 'Content-type: application/json' \
            --data "{
                \"attachments\": [{
                    \"color\": \"$color\",
                    \"title\": \"Office Inventory Monitor Alert\",
                    \"text\": \"$message\",
                    \"footer\": \"Monitor\",
                    \"ts\": $(date +%s)
                }]
            }" \
            "$SLACK_WEBHOOK_URL" > /dev/null 2>&1
    fi
    
    # 邮件通知
    if [ -n "$EMAIL_RECIPIENT" ] && command -v mail &> /dev/null; then
        echo -e "时间: $timestamp\n级别: $level\n消息: $message" | \
            mail -s "Office Inventory Alert [$level]" "$EMAIL_RECIPIENT"
    fi
}

# 检查服务健康状态
check_service_health() {
    local service_name=$1
    local health_url=$2
    local timeout=${3:-10}
    
    local start_time=$(date +%s%3N)
    local response_code=$(curl -s -o /dev/null -w "%{http_code}" --max-time "$timeout" "$health_url" 2>/dev/null || echo "000")
    local end_time=$(date +%s%3N)
    local response_time=$((end_time - start_time))
    
    # 记录指标
    echo "$(date +'%Y-%m-%d %H:%M:%S'),$service_name,response_time,$response_time" >> "$METRICS_FILE"
    echo "$(date +'%Y-%m-%d %H:%M:%S'),$service_name,response_code,$response_code" >> "$METRICS_FILE"
    
    if [ "$response_code" = "200" ]; then
        success "$service_name 健康检查通过 (${response_time}ms)"
        
        # 检查响应时间告警
        if [ "$response_time" -gt "$ALERT_THRESHOLD_RESPONSE_TIME" ]; then
            send_alert "WARNING" "$service_name 响应时间过长: ${response_time}ms"
        fi
        
        return 0
    else
        error "$service_name 健康检查失败 (HTTP $response_code)"
        send_alert "CRITICAL" "$service_name 服务不可用 (HTTP $response_code)"
        return 1
    fi
}

# 检查Docker容器状态
check_container_status() {
    log "检查Docker容器状态..."
    
    local containers=("office-inventory-db" "office-inventory-backend" "office-inventory-frontend")
    local all_healthy=true
    
    for container in "${containers[@]}"; do
        if docker ps --format "table {{.Names}}\t{{.Status}}" | grep -q "$container.*Up"; then
            success "$container 容器运行正常"
            
            # 获取容器资源使用情况
            local stats=$(docker stats --no-stream --format "{{.CPUPerc}},{{.MemPerc}}" "$container" 2>/dev/null || echo "0.00%,0.00%")
            local cpu_usage=$(echo "$stats" | cut -d',' -f1 | sed 's/%//')
            local mem_usage=$(echo "$stats" | cut -d',' -f2 | sed 's/%//')
            
            # 记录指标
            echo "$(date +'%Y-%m-%d %H:%M:%S'),$container,cpu_usage,$cpu_usage" >> "$METRICS_FILE"
            echo "$(date +'%Y-%m-%d %H:%M:%S'),$container,memory_usage,$mem_usage" >> "$METRICS_FILE"
            
            # 检查资源使用告警
            if (( $(echo "$cpu_usage > $ALERT_THRESHOLD_CPU" | bc -l) )); then
                send_alert "WARNING" "$container CPU使用率过高: ${cpu_usage}%"
            fi
            
            if (( $(echo "$mem_usage > $ALERT_THRESHOLD_MEMORY" | bc -l) )); then
                send_alert "WARNING" "$container 内存使用率过高: ${mem_usage}%"
            fi
            
        else
            error "$container 容器未运行"
            send_alert "CRITICAL" "$container 容器停止运行"
            all_healthy=false
        fi
    done
    
    return $all_healthy
}

# 检查数据库连接
check_database_connection() {
    log "检查数据库连接..."
    
    if docker-compose exec -T postgres pg_isready -U postgres > /dev/null 2>&1; then
        success "数据库连接正常"
        
        # 检查数据库大小
        local db_size=$(docker-compose exec -T postgres psql -U postgres -d office_inventory -t -c "SELECT pg_size_pretty(pg_database_size('office_inventory'));" 2>/dev/null | xargs || echo "Unknown")
        log "数据库大小: $db_size"
        
        # 检查活跃连接数
        local active_connections=$(docker-compose exec -T postgres psql -U postgres -t -c "SELECT count(*) FROM pg_stat_activity WHERE datname='office_inventory';" 2>/dev/null | xargs || echo "0")
        log "活跃连接数: $active_connections"
        
        # 记录指标
        echo "$(date +'%Y-%m-%d %H:%M:%S'),database,active_connections,$active_connections" >> "$METRICS_FILE"
        
        return 0
    else
        error "数据库连接失败"
        send_alert "CRITICAL" "数据库连接失败"
        return 1
    fi
}

# 检查磁盘空间
check_disk_space() {
    log "检查磁盘空间..."
    
    local disk_usage=$(df -h . | awk 'NR==2 {print $5}' | sed 's/%//')
    local disk_available=$(df -h . | awk 'NR==2 {print $4}')
    
    log "磁盘使用率: ${disk_usage}% (可用: $disk_available)"
    
    # 记录指标
    echo "$(date +'%Y-%m-%d %H:%M:%S'),system,disk_usage,$disk_usage" >> "$METRICS_FILE"
    
    if [ "$disk_usage" -gt "$ALERT_THRESHOLD_DISK" ]; then
        send_alert "WARNING" "磁盘空间不足: ${disk_usage}% (可用: $disk_available)"
        return 1
    fi
    
    return 0
}

# 检查日志文件大小
check_log_sizes() {
    log "检查日志文件大小..."
    
    local log_dirs=("./logs" "backend/logs")
    
    for log_dir in "${log_dirs[@]}"; do
        if [ -d "$log_dir" ]; then
            local total_size=$(du -sh "$log_dir" 2>/dev/null | cut -f1 || echo "0")
            log "$log_dir 目录大小: $total_size"
            
            # 清理大于100MB的旧日志文件
            find "$log_dir" -name "*.log" -size +100M -mtime +7 -delete 2>/dev/null || true
        fi
    done
}

# 检查应用性能指标
check_application_metrics() {
    log "检查应用性能指标..."
    
    # 检查API响应时间
    local api_endpoints=(
        "http://localhost:3001/api/health"
        "http://localhost:3001/api/items"
        "http://localhost:3001/api/locations"
    )
    
    for endpoint in "${api_endpoints[@]}"; do
        local start_time=$(date +%s%3N)
        local response_code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$endpoint" 2>/dev/null || echo "000")
        local end_time=$(date +%s%3N)
        local response_time=$((end_time - start_time))
        
        local endpoint_name=$(echo "$endpoint" | sed 's|.*/||')
        echo "$(date +'%Y-%m-%d %H:%M:%S'),api_${endpoint_name},response_time,$response_time" >> "$METRICS_FILE"
        
        if [ "$response_code" = "200" ]; then
            log "API $endpoint_name 响应时间: ${response_time}ms"
        else
            warning "API $endpoint_name 响应异常: HTTP $response_code"
        fi
    done
}

# 生成监控报告
generate_report() {
    local report_file="./logs/monitor_report_$(date +%Y%m%d).txt"
    
    log "生成监控报告: $report_file"
    
    {
        echo "Office Inventory System 监控报告"
        echo "生成时间: $(date)"
        echo "========================================"
        echo ""
        
        echo "服务状态:"
        docker-compose ps
        echo ""
        
        echo "资源使用情况:"
        docker stats --no-stream
        echo ""
        
        echo "磁盘空间:"
        df -h .
        echo ""
        
        echo "最近的告警 (最近24小时):"
        grep -E "(WARNING|CRITICAL)" "$LOG_FILE" | tail -20 || echo "无告警记录"
        echo ""
        
        echo "性能指标 (最近1小时):"
        local one_hour_ago=$(date -d '1 hour ago' +'%Y-%m-%d %H:%M:%S' 2>/dev/null || date -v-1H +'%Y-%m-%d %H:%M:%S')
        awk -F',' -v start="$one_hour_ago" '$1 >= start {print}' "$METRICS_FILE" | tail -50 || echo "无性能数据"
        
    } > "$report_file"
    
    success "监控报告已生成: $report_file"
}

# 持续监控模式
continuous_monitor() {
    log "启动持续监控模式 (间隔: ${CHECK_INTERVAL}秒)"
    
    while true; do
        log "开始监控检查..."
        
        # 执行所有检查
        check_container_status
        check_database_connection
        check_service_health "Frontend" "http://localhost/health"
        check_service_health "Backend" "http://localhost:3001/health"
        check_disk_space
        check_log_sizes
        check_application_metrics
        
        log "监控检查完成，等待 $CHECK_INTERVAL 秒..."
        sleep "$CHECK_INTERVAL"
    done
}

# 主监控流程
main() {
    case "${1:-check}" in
        "check")
            log "执行单次健康检查..."
            
            local all_healthy=true
            
            check_container_status || all_healthy=false
            check_database_connection || all_healthy=false
            check_service_health "Frontend" "http://localhost/health" || all_healthy=false
            check_service_health "Backend" "http://localhost:3001/health" || all_healthy=false
            check_disk_space || all_healthy=false
            check_log_sizes
            check_application_metrics
            
            if [ "$all_healthy" = true ]; then
                success "所有检查通过"
                exit 0
            else
                error "部分检查失败"
                exit 1
            fi
            ;;
        "monitor")
            continuous_monitor
            ;;
        "report")
            generate_report
            ;;
        "metrics")
            if [ -f "$METRICS_FILE" ]; then
                echo "最近的性能指标:"
                tail -50 "$METRICS_FILE"
            else
                warning "未找到性能指标文件"
            fi
            ;;
        "alerts")
            if [ -f "$LOG_FILE" ]; then
                echo "最近的告警:"
                grep -E "(WARNING|CRITICAL)" "$LOG_FILE" | tail -20 || echo "无告警记录"
            else
                warning "未找到日志文件"
            fi
            ;;
        *)
            echo "用法: $0 [check|monitor|report|metrics|alerts]"
            echo "  check   - 执行单次健康检查"
            echo "  monitor - 启动持续监控模式"
            echo "  report  - 生成监控报告"
            echo "  metrics - 显示性能指标"
            echo "  alerts  - 显示告警记录"
            exit 1
            ;;
    esac
}

# 信号处理
trap 'log "监控进程被中断"; exit 0' INT TERM

# 执行主流程
main "$@"