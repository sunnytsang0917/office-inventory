#!/bin/bash

# 数据库恢复脚本
# 支持从本地备份或云存储恢复数据库

set -e

# 配置变量
BACKUP_DIR="./backups"
LOG_FILE="./logs/restore.log"
TEMP_DIR="/tmp/office_inventory_restore"

# 云存储配置
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
mkdir -p "$TEMP_DIR"

# 清理临时文件
cleanup() {
    rm -rf "$TEMP_DIR"
}
trap cleanup EXIT

# 检查Docker服务状态
check_database_status() {
    if ! docker-compose ps postgres | grep -q "Up"; then
        error "PostgreSQL容器未运行"
        exit 1
    fi
}

# 列出可用备份
list_available_backups() {
    log "可用的备份文件:"
    
    echo "本地备份:"
    local count=0
    for file in "$BACKUP_DIR"/*.sql* "$BACKUP_DIR"/*.tar.gz; do
        if [ -f "$file" ]; then
            count=$((count + 1))
            local size=$(stat -f%z "$file" 2>/dev/null || stat -c%s "$file")
            local size_mb=$((size / 1024 / 1024))
            local date=$(stat -f%Sm -t%Y-%m-%d\ %H:%M "$file" 2>/dev/null || stat -c%y "$file" | cut -d' ' -f1-2)
            printf "%2d. %-40s %10s %s\n" "$count" "$(basename "$file")" "${size_mb}MB" "$date"
        fi
    done
    
    if [ $count -eq 0 ]; then
        warning "未找到本地备份文件"
    fi
    
    # 列出S3备份
    if [ -n "$S3_BUCKET" ] && command -v aws &> /dev/null; then
        echo ""
        echo "S3备份:"
        aws s3 ls "s3://$S3_BUCKET/backups/" --recursive | grep -E '\.(sql|sql\.gz|sql\.gz\.enc)$' | while read -r line; do
            count=$((count + 1))
            local date=$(echo "$line" | awk '{print $1" "$2}')
            local size=$(echo "$line" | awk '{print $3}')
            local file=$(echo "$line" | awk '{print $4}')
            local size_mb=$((size / 1024 / 1024))
            printf "%2d. %-40s %10s %s\n" "$count" "$(basename "$file")" "${size_mb}MB" "$date"
        done
    fi
}

# 从S3下载备份
download_from_s3() {
    local s3_key=$1
    local local_file=$2
    
    log "从S3下载备份: $s3_key"
    
    if aws s3 cp "s3://$S3_BUCKET/$s3_key" "$local_file" --region "$AWS_REGION"; then
        success "备份下载完成: $local_file"
        return 0
    else
        error "S3下载失败"
        return 1
    fi
}

# 解压备份文件
decompress_backup() {
    local backup_file=$1
    local output_file=$2
    
    if [[ "$backup_file" == *.gz ]]; then
        log "解压备份文件..."
        if gunzip -c "$backup_file" > "$output_file"; then
            success "备份文件解压完成"
            return 0
        else
            error "备份文件解压失败"
            return 1
        fi
    else
        # 如果不是压缩文件，直接复制
        cp "$backup_file" "$output_file"
        return 0
    fi
}

# 解密备份文件
decrypt_backup() {
    local encrypted_file=$1
    local output_file=$2
    local encryption_key=$3
    
    log "解密备份文件..."
    
    if openssl enc -aes-256-cbc -d -in "$encrypted_file" -out "$output_file" -k "$encryption_key"; then
        success "备份文件解密完成"
        return 0
    else
        error "备份文件解密失败"
        return 1
    fi
}

# 验证SQL备份文件
verify_sql_backup() {
    local sql_file=$1
    
    log "验证SQL备份文件..."
    
    # 检查文件是否存在且不为空
    if [ ! -f "$sql_file" ] || [ ! -s "$sql_file" ]; then
        error "SQL文件不存在或为空"
        return 1
    fi
    
    # 检查是否包含PostgreSQL转储标识
    if ! head -n 10 "$sql_file" | grep -q "PostgreSQL database dump"; then
        error "不是有效的PostgreSQL备份文件"
        return 1
    fi
    
    success "SQL备份文件验证通过"
    return 0
}

# 创建数据库备份（恢复前）
create_pre_restore_backup() {
    local timestamp=$(date +%Y%m%d_%H%M%S)
    local backup_file="${BACKUP_DIR}/pre_restore_backup_${timestamp}.sql"
    
    log "创建恢复前备份..."
    
    if docker-compose exec -T postgres pg_dump -U postgres office_inventory > "$backup_file"; then
        success "恢复前备份创建成功: $backup_file"
        echo "$backup_file"
    else
        error "恢复前备份创建失败"
        return 1
    fi
}

# 恢复数据库
restore_database() {
    local sql_file=$1
    
    log "开始恢复数据库..."
    
    # 停止应用服务以避免连接冲突
    log "停止应用服务..."
    docker-compose stop backend frontend
    
    # 终止所有数据库连接
    log "终止现有数据库连接..."
    docker-compose exec -T postgres psql -U postgres -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = 'office_inventory' AND pid <> pg_backend_pid();" > /dev/null 2>&1 || true
    
    # 删除现有数据库
    log "删除现有数据库..."
    docker-compose exec -T postgres psql -U postgres -c "DROP DATABASE IF EXISTS office_inventory;" > /dev/null 2>&1 || true
    
    # 创建新数据库
    log "创建新数据库..."
    docker-compose exec -T postgres psql -U postgres -c "CREATE DATABASE office_inventory;" > /dev/null 2>&1
    
    # 恢复数据
    log "恢复数据库数据..."
    if docker-compose exec -T postgres psql -U postgres office_inventory < "$sql_file"; then
        success "数据库恢复完成"
    else
        error "数据库恢复失败"
        return 1
    fi
    
    # 重启应用服务
    log "重启应用服务..."
    docker-compose up -d backend frontend
    
    # 等待服务启动
    sleep 10
    
    # 验证恢复结果
    if docker-compose exec -T postgres psql -U postgres office_inventory -c "SELECT COUNT(*) FROM items;" > /dev/null 2>&1; then
        success "数据库恢复验证通过"
    else
        error "数据库恢复验证失败"
        return 1
    fi
}

# 恢复应用文件
restore_application_files() {
    local backup_file=$1
    
    log "恢复应用文件..."
    
    # 备份现有文件
    if [ -d "backend/uploads" ]; then
        local timestamp=$(date +%Y%m%d_%H%M%S)
        mv "backend/uploads" "backend/uploads_backup_${timestamp}"
        log "现有文件已备份为: backend/uploads_backup_${timestamp}"
    fi
    
    # 解压恢复文件
    if tar -xzf "$backup_file" -C .; then
        success "应用文件恢复完成"
    else
        error "应用文件恢复失败"
        return 1
    fi
}

# 交互式选择备份文件
select_backup_file() {
    list_available_backups
    
    echo ""
    echo "请选择要恢复的备份文件:"
    echo "格式: 文件名 或 s3:备份路径"
    echo "示例: office_inventory_20240127_120000.sql.gz"
    echo "示例: s3:backups/office_inventory_20240127_120000.sql.gz"
    
    read -r selection
    
    if [[ "$selection" == s3:* ]]; then
        # S3备份
        local s3_key="${selection#s3:}"
        local local_file="${TEMP_DIR}/$(basename "$s3_key")"
        
        if download_from_s3 "$s3_key" "$local_file"; then
            echo "$local_file"
        else
            return 1
        fi
    else
        # 本地备份
        local backup_file="${BACKUP_DIR}/$selection"
        
        if [ -f "$backup_file" ]; then
            echo "$backup_file"
        else
            error "备份文件不存在: $backup_file"
            return 1
        fi
    fi
}

# 主恢复流程
main() {
    case "${1:-interactive}" in
        "interactive")
            log "交互式数据库恢复..."
            check_database_status
            
            # 选择备份文件
            if backup_file=$(select_backup_file); then
                log "选择的备份文件: $backup_file"
            else
                error "备份文件选择失败"
                exit 1
            fi
            
            # 确认恢复操作
            warning "此操作将完全替换当前数据库！"
            echo "是否继续？(yes/no)"
            read -r confirmation
            
            if [ "$confirmation" != "yes" ]; then
                log "恢复操作已取消"
                exit 0
            fi
            
            # 创建恢复前备份
            if pre_backup=$(create_pre_restore_backup); then
                log "恢复前备份: $pre_backup"
            fi
            
            # 处理备份文件
            local sql_file="${TEMP_DIR}/restore.sql"
            
            # 解密（如果需要）
            if [[ "$backup_file" == *.enc ]]; then
                echo "请输入解密密钥:"
                read -s encryption_key
                local decrypted_file="${TEMP_DIR}/decrypted.sql.gz"
                
                if decrypt_backup "$backup_file" "$decrypted_file" "$encryption_key"; then
                    backup_file="$decrypted_file"
                else
                    exit 1
                fi
            fi
            
            # 解压
            if decompress_backup "$backup_file" "$sql_file"; then
                verify_sql_backup "$sql_file"
                restore_database "$sql_file"
                success "数据库恢复完成！"
            else
                exit 1
            fi
            ;;
        "file")
            if [ -z "$2" ]; then
                error "请指定备份文件路径"
                echo "用法: $0 file <backup_file>"
                exit 1
            fi
            
            local backup_file="$2"
            check_database_status
            
            if [ ! -f "$backup_file" ]; then
                error "备份文件不存在: $backup_file"
                exit 1
            fi
            
            # 确认恢复操作
            warning "此操作将完全替换当前数据库！"
            echo "是否继续？(yes/no)"
            read -r confirmation
            
            if [ "$confirmation" != "yes" ]; then
                log "恢复操作已取消"
                exit 0
            fi
            
            # 创建恢复前备份
            create_pre_restore_backup
            
            # 处理备份文件
            local sql_file="${TEMP_DIR}/restore.sql"
            decompress_backup "$backup_file" "$sql_file"
            verify_sql_backup "$sql_file"
            restore_database "$sql_file"
            success "数据库恢复完成！"
            ;;
        "list")
            list_available_backups
            ;;
        *)
            echo "用法: $0 [interactive|file <backup_file>|list]"
            echo "  interactive - 交互式选择备份文件恢复"
            echo "  file        - 从指定文件恢复"
            echo "  list        - 列出可用备份"
            exit 1
            ;;
    esac
}

# 执行主流程
main "$@"