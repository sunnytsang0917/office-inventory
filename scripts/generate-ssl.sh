#!/bin/bash

# SSL证书管理脚本
# 支持生成自签名证书和Let's Encrypt证书

set -e

# 配置变量
SSL_DIR="nginx/ssl"
DOMAIN="${SSL_DOMAIN:-localhost}"
EMAIL="${SSL_EMAIL:-admin@example.com}"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# 创建SSL目录
mkdir -p "$SSL_DIR"

# 生成自签名证书
generate_self_signed() {
    log "生成自签名SSL证书..."
    
    # 生成私钥
    openssl genrsa -out "$SSL_DIR/key.pem" 2048
    
    # 创建证书配置文件
    cat > "$SSL_DIR/cert.conf" << EOF
[req]
default_bits = 2048
prompt = no
default_md = sha256
distinguished_name = dn
req_extensions = v3_req

[dn]
C=CN
ST=Beijing
L=Beijing
O=Office Inventory
OU=IT Department
CN=$DOMAIN

[v3_req]
basicConstraints = CA:FALSE
keyUsage = nonRepudiation, digitalSignature, keyEncipherment
subjectAltName = @alt_names

[alt_names]
DNS.1 = $DOMAIN
DNS.2 = localhost
DNS.3 = *.localhost
IP.1 = 127.0.0.1
IP.2 = ::1
EOF
    
    # 生成证书签名请求
    openssl req -new -key "$SSL_DIR/key.pem" -out "$SSL_DIR/cert.csr" -config "$SSL_DIR/cert.conf"
    
    # 生成自签名证书
    openssl x509 -req -days 365 -in "$SSL_DIR/cert.csr" -signkey "$SSL_DIR/key.pem" -out "$SSL_DIR/cert.pem" -extensions v3_req -extfile "$SSL_DIR/cert.conf"
    
    # 清理临时文件
    rm "$SSL_DIR/cert.csr" "$SSL_DIR/cert.conf"
    
    # 设置文件权限
    chmod 600 "$SSL_DIR/key.pem"
    chmod 644 "$SSL_DIR/cert.pem"
    
    success "自签名SSL证书生成完成"
    log "证书位置: $SSL_DIR/"
    warning "注意: 这是自签名证书，仅用于开发环境"
}

# 使用Let's Encrypt生成证书
generate_letsencrypt() {
    log "使用Let's Encrypt生成SSL证书..."
    
    # 检查certbot是否安装
    if ! command -v certbot &> /dev/null; then
        error "certbot未安装，请先安装certbot"
        echo "Ubuntu/Debian: sudo apt-get install certbot"
        echo "CentOS/RHEL: sudo yum install certbot"
        echo "macOS: brew install certbot"
        exit 1
    fi
    
    # 检查域名是否有效
    if [ "$DOMAIN" = "localhost" ]; then
        error "Let's Encrypt不支持localhost域名"
        echo "请设置有效的域名: export SSL_DOMAIN=your-domain.com"
        exit 1
    fi
    
    # 停止nginx以释放80端口
    if docker-compose ps nginx | grep -q "Up"; then
        log "停止nginx服务以释放80端口..."
        docker-compose stop nginx
    fi
    
    # 生成证书
    log "为域名 $DOMAIN 生成Let's Encrypt证书..."
    sudo certbot certonly --standalone \
        --email "$EMAIL" \
        --agree-tos \
        --no-eff-email \
        -d "$DOMAIN"
    
    # 复制证书到项目目录
    sudo cp "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" "$SSL_DIR/cert.pem"
    sudo cp "/etc/letsencrypt/live/$DOMAIN/privkey.pem" "$SSL_DIR/key.pem"
    
    # 修改文件所有者
    sudo chown "$USER:$USER" "$SSL_DIR/cert.pem" "$SSL_DIR/key.pem"
    
    # 设置文件权限
    chmod 600 "$SSL_DIR/key.pem"
    chmod 644 "$SSL_DIR/cert.pem"
    
    success "Let's Encrypt SSL证书生成完成"
    
    # 重启nginx
    if docker-compose ps | grep -q nginx; then
        log "重启nginx服务..."
        docker-compose up -d nginx
    fi
}

# 续期Let's Encrypt证书
renew_letsencrypt() {
    log "续期Let's Encrypt证书..."
    
    if ! command -v certbot &> /dev/null; then
        error "certbot未安装"
        exit 1
    fi
    
    # 续期证书
    sudo certbot renew --quiet
    
    # 更新项目中的证书
    if [ -f "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" ]; then
        sudo cp "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" "$SSL_DIR/cert.pem"
        sudo cp "/etc/letsencrypt/live/$DOMAIN/privkey.pem" "$SSL_DIR/key.pem"
        sudo chown "$USER:$USER" "$SSL_DIR/cert.pem" "$SSL_DIR/key.pem"
        chmod 600 "$SSL_DIR/key.pem"
        chmod 644 "$SSL_DIR/cert.pem"
        
        # 重新加载nginx
        if docker-compose ps nginx | grep -q "Up"; then
            docker-compose exec nginx nginx -s reload
        fi
        
        success "证书续期完成"
    else
        error "未找到Let's Encrypt证书文件"
        exit 1
    fi
}

# 验证证书
verify_certificate() {
    log "验证SSL证书..."
    
    if [ ! -f "$SSL_DIR/cert.pem" ] || [ ! -f "$SSL_DIR/key.pem" ]; then
        error "证书文件不存在"
        exit 1
    fi
    
    # 检查证书有效性
    if openssl x509 -in "$SSL_DIR/cert.pem" -text -noout > /dev/null 2>&1; then
        success "证书文件格式正确"
        
        # 显示证书信息
        echo ""
        echo "证书信息:"
        echo "----------------------------------------"
        openssl x509 -in "$SSL_DIR/cert.pem" -text -noout | grep -E "(Subject:|Issuer:|Not Before:|Not After:|DNS:|IP Address:)"
        echo "----------------------------------------"
        
        # 检查证书过期时间
        local expiry_date=$(openssl x509 -in "$SSL_DIR/cert.pem" -noout -enddate | cut -d= -f2)
        local expiry_timestamp=$(date -d "$expiry_date" +%s 2>/dev/null || date -j -f "%b %d %T %Y %Z" "$expiry_date" +%s)
        local current_timestamp=$(date +%s)
        local days_until_expiry=$(( (expiry_timestamp - current_timestamp) / 86400 ))
        
        if [ $days_until_expiry -lt 30 ]; then
            warning "证书将在 $days_until_expiry 天后过期"
        else
            log "证书还有 $days_until_expiry 天过期"
        fi
        
    else
        error "证书文件格式错误"
        exit 1
    fi
    
    # 检查私钥
    if openssl rsa -in "$SSL_DIR/key.pem" -check -noout > /dev/null 2>&1; then
        success "私钥文件格式正确"
    else
        error "私钥文件格式错误"
        exit 1
    fi
    
    # 验证证书和私钥匹配
    local cert_hash=$(openssl x509 -in "$SSL_DIR/cert.pem" -noout -modulus | openssl md5)
    local key_hash=$(openssl rsa -in "$SSL_DIR/key.pem" -noout -modulus | openssl md5)
    
    if [ "$cert_hash" = "$key_hash" ]; then
        success "证书和私钥匹配"
    else
        error "证书和私钥不匹配"
        exit 1
    fi
}

# 创建证书续期定时任务
setup_auto_renewal() {
    log "设置证书自动续期..."
    
    # 创建续期脚本
    cat > "$SSL_DIR/renew.sh" << 'EOF'
#!/bin/bash
cd "$(dirname "$0")/../.."
./scripts/generate-ssl.sh renew
EOF
    
    chmod +x "$SSL_DIR/renew.sh"
    
    # 添加到crontab（每月1号凌晨2点执行）
    local cron_job="0 2 1 * * $PWD/$SSL_DIR/renew.sh >> $PWD/logs/ssl-renewal.log 2>&1"
    
    # 检查是否已存在相同的定时任务
    if ! crontab -l 2>/dev/null | grep -q "$SSL_DIR/renew.sh"; then
        (crontab -l 2>/dev/null; echo "$cron_job") | crontab -
        success "自动续期定时任务已设置"
        log "定时任务: 每月1号凌晨2点自动续期证书"
    else
        log "自动续期定时任务已存在"
    fi
}

# 主函数
main() {
    case "${1:-self-signed}" in
        "self-signed")
            generate_self_signed
            verify_certificate
            ;;
        "letsencrypt")
            generate_letsencrypt
            verify_certificate
            setup_auto_renewal
            ;;
        "renew")
            renew_letsencrypt
            ;;
        "verify")
            verify_certificate
            ;;
        "auto-renewal")
            setup_auto_renewal
            ;;
        *)
            echo "用法: $0 [self-signed|letsencrypt|renew|verify|auto-renewal]"
            echo "  self-signed  - 生成自签名证书（默认）"
            echo "  letsencrypt  - 使用Let's Encrypt生成证书"
            echo "  renew        - 续期Let's Encrypt证书"
            echo "  verify       - 验证现有证书"
            echo "  auto-renewal - 设置自动续期"
            echo ""
            echo "环境变量:"
            echo "  SSL_DOMAIN   - 域名（默认: localhost）"
            echo "  SSL_EMAIL    - 邮箱地址（Let's Encrypt需要）"
            exit 1
            ;;
    esac
}

# 执行主流程
main "$@"