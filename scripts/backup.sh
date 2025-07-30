#!/bin/bash

# 数据库备份脚本
# 支持自动备份、手动备份和云存储上传

set -e

# 配置变量
BACKUP_DIR="./backups"
LOG_FILE="./logs/backup.log"
RETENTION_DAYS=30
COMPRESS=true
ENCRYPT=false
ENCRYPTION_KEY=""

# 云存储配置（可选）
S3_BUCKET="${BACKUP_S3_BUCKET:-}"
AWS_REGION="${AWS_REGION:-us-east-1}"

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
mkdir -p "$BACKUP_DIR"
mkdir -p "$(dirname "$LOG_FILE")"

# 检查Docker服务状态
check_database_status() {
    if ! docker-compose ps postgres | grep -q "Up"; then
        error "PostgreSQL容器未运行"
        exit 1
    fi
}

# 创建数据库备份
create_database_backup() {
    local timestamp=$(date +%Y%m%d_%H%M%S)
    local backup_name="office_inventory_${timestamp}"
    local backup_file="${BACKUP_DIR}/${backup_name}.sql"
    
    log "开始创建数据库备份: $backup_name"
    
    # 创建备份
    if docker-compose exec -T postgres pg_dump -U postgres -h localhost office_inventory > "$backup_file"; then
        success "数据库备份创建成功: $backup_file"
    else
        error "数据库备份创建失败"
        return 1
    fi
    
    # 压缩备份文件
    if [ "$COMPRESS" = true ]; then
        log "压缩备份文件..."
        gzip "$backup_file"
        backup_file="${backup_file}.gz"
        success "备份文件已压缩: $backup_file"
    fi
    
    # 加密备份文件
    if [ "$ENCRYPT" = true ] && [ -n "$ENCRYPTION_KEY" ]; then
        log "加密备份文件..."
        openssl enc -aes-256-cbc -salt -in "$backup_file" -out "${backup_file}.enc" -k "$ENCRYPTION_KEY"
        rm "$backup_file"
        backup_file="${backup_file}.enc"
        success "备份文件已加密: $backup_file"
    fi
    
    # 记录备份信息
    echo "$backup_name|$(date)|$(stat -f%z "$backup_file" 2>/dev/null || stat -c%s "$backup_file")" >> "${BACKUP_DIR}/backup_history.txt"
    
    echo "$backup_file"
}

# 备份应用文件
backup_application_files() {
    local timestamp=$(date +%Y%m%d_%H%M%S)
    local backup_name="app_files_${timestamp}"
    local backup_file="${BACKUP_DIR}/${backup_name}.tar.gz"
    
    log "备份应用文件..."
    
    # 备份上传文件
    if [ -d "backend/uploads" ]; then
        tar -czf "$backup_file" backend/uploads/ --exclude="*.tmp"
        success "应用文件备份完成: $backup_file"
        echo "$backup_file"
    else
        warning "未找到上传文件目录"
        return 1
    fi
}

# 上传到云存储
upload_to_cloud() {
    local backup_file=$1
    
    if [ -z "$S3_BUCKET" ]; then
        log "未配置S3存储桶，跳过云上传"
        return 0
    fi
    
    log "上传备份到S3: $S3_BUCKET"
    
    if command -v aws &> /dev/null; then
        local s3_key="backups/$(basename "$backup_file")"
        if aws s3 cp "$backup_file" "s3://$S3_BUCKET/$s3_key" --region "$AWS_REGION"; then
            success "备份已上传到S3: s3://$S3_BUCKET/$s3_key"
        else
            error "S3上传失败"
            return 1
        fi
    else
        warning "AWS CLI未安装，跳过云上传"
    fi
}

# 清理旧备份
cleanup_old_backups() {
    log "清理 $RETENTION_DAYS 天前的旧备份..."
    
    # 清理本地备份文件
    find "$BACKUP_DIR" -name "*.sql" -mtime +$RETENTION_DAYS -delete
    find "$BACKUP_DIR" -name "*.sql.gz" -mtime +$RETENTION_DAYS -delete
    find "$BACKUP_DIR" -name "*.sql.gz.enc" -mtime +$RETENTION_DAYS -delete
    find "$BACKUP_DIR" -name "*.tar.gz" -mtime +$RETENTION_DAYS -delete
    
    # 清理S3备份（如果配置了）
    if [ -n "$S3_BUCKET" ] && command -v aws &> /dev/null; then
        local cutoff_date=$(date -d "$RETENTION_DAYS days ago" +%Y-%m-%d)
        aws s3 ls "s3://$S3_BUCKET/backups/" --recursive | while read -r line; do
            local file_date=$(echo "$line" | awk '{print $1}')
            local file_name=$(echo "$line" | awk '{print $4}')
            
            if [[ "$file_date" < "$cutoff_date" ]]; then
                aws s3 rm "s3://$S3_BUCKET/$file_name"
                log "已删除S3旧备份: $file_name"
            fi
        done
    fi
    
    success "旧备份清理完成"
}

# 验证备份完整性
verify_backup() {
    local backup_file=$1
    
    log "验证备份完整性: $(basename "$backup_file")"
    
    # 检查文件是否存在且不为空
    if [ ! -f "$backup_file" ] || [ ! -s "$backup_file" ]; then
        error "备份文件不存在或为空"
        return 1
    fi
    
    # 如果是压缩文件，检查压缩完整性
    if [[ "$backup_file" == *.gz ]]; then
        if ! gzip -t "$backup_file"; then
            error "压缩文件损坏"
            return 1
        fi
    fi
    
    # 如果是加密文件，尝试解密验证
    if [[ "$backup_file" == *.enc ]] && [ -n "$ENCRYPTION_KEY" ]; then
        if ! openssl enc -aes-256-cbc -d -in "$backup_file" -k "$ENCRYPTION_KEY" > /dev/null 2>&1; then
            error "加密文件无法解密"
            return 1
        fi
    fi
    
    success "备份完整性验证通过"
}

# 列出可用备份
list_backups() {
    log "可用备份列表:"
    
    if [ -f "${BACKUP_DIR}/backup_history.txt" ]; then
        echo "----------------------------------------"
        printf "%-30s %-20s %-10s\n" "备份名称" "创建时间" "文件大小"
        echo "----------------------------------------"
        
        while IFS='|' read -r name date size; do
            local size_mb=$((size / 1024 / 1024))
            printf "%-30s %-20s %-10s\n" "$name" "$date" "${size_mb}MB"
        done < "${BACKUP_DIR}/backup_history.txt"
        
        echo "----------------------------------------"
    else
        warning "未找到备份历史记录"
    fi
    
    # 列出本地备份文件
    echo ""
    log "本地备份文件:"
    ls -lh "$BACKUP_DIR"/*.sql* "$BACKUP_DIR"/*.tar.gz 2>/dev/null || echo "无备份文件"
}

# 发送备份报告
send_backup_report() {
    local status=$1
    local message=$2
    
    # 这里可以集成邮件或其他通知系统
    log "备份报告: [$status] $message"
    
    # 示例：发送邮件报告（需要配置邮件服务）
    if [ -n "$BACKUP_EMAIL" ] && command -v mail &> /dev/null; then
        echo "$message" | mail -s "Office Inventory Backup Report [$status]" "$BACKUP_EMAIL"
    fi
}

# 主备份流程
main() {
    case "${1:-full}" in
        "full")
            log "开始完整备份..."
            check_database_status
            
            # 创建数据库备份
            if db_backup=$(create_database_backup); then
                verify_backup "$db_backup"
                upload_to_cloud "$db_backup"
            else
                send_backup_report "FAILED" "数据库备份失败"
                exit 1
            fi
            
            # 备份应用文件
            if app_backup=$(backup_application_files); then
                upload_to_cloud "$app_backup"
            fi
            
            cleanup_old_backups
            send_backup_report "SUCCESS" "完整备份成功完成"
            success "完整备份完成"
            ;;
        "database")
            log "开始数据库备份..."
            check_database_status
            
            if db_backup=$(create_database_backup); then
                verify_backup "$db_backup"
                upload_to_cloud "$db_backup"
                send_backup_report "SUCCESS" "数据库备份成功完成"
                success "数据库备份完成"
            else
                send_backup_report "FAILED" "数据库备份失败"
                exit 1
            fi
            ;;
        "files")
            log "开始文件备份..."
            
            if app_backup=$(backup_application_files); then
                upload_to_cloud "$app_backup"
                send_backup_report "SUCCESS" "文件备份成功完成"
                success "文件备份完成"
            else
                send_backup_report "FAILED" "文件备份失败"
                exit 1
            fi
            ;;
        "list")
            list_backups
            ;;
        "cleanup")
            cleanup_old_backups
            ;;
        *)
            echo "用法: $0 [full|database|files|list|cleanup]"
            echo "  full     - 完整备份（数据库+文件）"
            echo "  database - 仅备份数据库"
            echo "  files    - 仅备份应用文件"
            echo "  list     - 列出可用备份"
            echo "  cleanup  - 清理旧备份"
            exit 1
            ;;
    esac
}

# 执行主流程
main "$@"