# 出入库0725系统 - Docker部署指南

## 概述

本指南将帮助您使用Docker将出入库0725系统部署到生产环境。

## 系统架构

系统包含以下组件：
- **PostgreSQL数据库**: 数据存储
- **后端API服务**: Node.js + Express + TypeScript
- **前端Web服务**: React + TypeScript
- **Nginx反向代理**: 负载均衡和安全

## 前置要求

### 1. 系统要求
- Docker 20.10+
- Docker Compose 2.0+
- 至少2GB可用内存
- 至少10GB可用磁盘空间

### 2. 安装Docker
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install docker.io docker-compose

# CentOS/RHEL
sudo yum install docker docker-compose

# macOS
brew install docker docker-compose

# Windows
# 下载并安装 Docker Desktop
```

## 快速部署

### 1. 克隆项目
```bash
git clone <your-repository-url>
cd 出入库0725
```

### 2. 运行快速部署脚本
```bash
./quick-deploy.sh
```

脚本会自动：
- 检查Docker环境
- 创建环境变量文件
- 构建Docker镜像
- 启动所有服务
- 验证服务状态

### 3. 配置环境变量
首次运行后，编辑 `.env.production` 文件：
```bash
nano .env.production
```

重要配置项：
```env
# 数据库配置
DB_PASSWORD=your_secure_password_here

# JWT配置
JWT_SECRET=your_super_secure_jwt_secret_key_here

# CORS配置
CORS_ORIGIN=https://your-domain.com
```

## 手动部署

### 1. 准备环境变量
```bash
cp env.production.example .env.production
# 编辑 .env.production 文件
```

### 2. 构建镜像
```bash
docker-compose -f docker-compose.prod.simple.yml build
```

### 3. 启动服务
```bash
docker-compose -f docker-compose.prod.simple.yml up -d
```

### 4. 检查服务状态
```bash
docker-compose -f docker-compose.prod.simple.yml ps
```

## 服务管理

### 查看服务状态
```bash
docker-compose -f docker-compose.prod.simple.yml ps
```

### 查看日志
```bash
# 查看所有服务日志
docker-compose -f docker-compose.prod.simple.yml logs -f

# 查看特定服务日志
docker-compose -f docker-compose.prod.simple.yml logs -f backend
docker-compose -f docker-compose.prod.simple.yml logs -f frontend
docker-compose -f docker-compose.prod.simple.yml logs -f postgres
```

### 重启服务
```bash
# 重启所有服务
docker-compose -f docker-compose.prod.simple.yml restart

# 重启特定服务
docker-compose -f docker-compose.prod.simple.yml restart backend
```

### 停止服务
```bash
docker-compose -f docker-compose.prod.simple.yml down
```

## 数据备份

### 备份数据库
```bash
./deploy.sh backup
```

### 恢复数据库
```bash
./deploy.sh restore backups/db_backup_20231201_143022.sql
```

## 访问地址

部署完成后，可以通过以下地址访问：

- **前端界面**: http://localhost:80
- **后端API**: http://localhost:3001
- **Nginx代理**: http://localhost:8080

## 安全配置

### 1. 修改默认密码
- 数据库密码
- JWT密钥
- 管理员账户密码

### 2. 配置防火墙
```bash
# 只开放必要端口
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

### 3. 配置SSL证书（可选）
```bash
# 使用Let's Encrypt
sudo certbot --nginx -d your-domain.com
```

## 监控和维护

### 1. 健康检查
```bash
./deploy.sh health
```

### 2. 资源监控
```bash
# 查看容器资源使用情况
docker stats

# 查看磁盘使用情况
docker system df
```

### 3. 清理资源
```bash
./deploy.sh cleanup
```

## 故障排除

### 常见问题

#### 1. 端口冲突
```bash
# 检查端口占用
netstat -tulpn | grep :80
netstat -tulpn | grep :3001

# 修改端口配置
# 编辑 .env.production 文件
```

#### 2. 数据库连接失败
```bash
# 检查数据库容器状态
docker-compose -f docker-compose.prod.simple.yml ps postgres

# 查看数据库日志
docker-compose -f docker-compose.prod.simple.yml logs postgres
```

#### 3. 前端无法访问后端API
```bash
# 检查CORS配置
# 确保 .env.production 中的 CORS_ORIGIN 配置正确

# 检查网络连接
docker network ls
docker network inspect office-inventory-network
```

#### 4. 内存不足
```bash
# 增加Docker内存限制
# 在 docker-compose.prod.simple.yml 中调整内存配置
```

### 日志分析
```bash
# 查看错误日志
docker-compose -f docker-compose.prod.simple.yml logs --tail=100 | grep ERROR

# 查看访问日志
docker-compose -f docker-compose.prod.simple.yml exec nginx tail -f /var/log/nginx/access.log
```

## 性能优化

### 1. 数据库优化
```sql
-- 创建索引
CREATE INDEX idx_transactions_date ON transactions(created_at);
CREATE INDEX idx_items_location ON items(location_id);
```

### 2. 应用优化
- 启用Gzip压缩
- 配置缓存策略
- 优化数据库查询

### 3. 系统优化
```bash
# 调整系统参数
echo 'vm.max_map_count=262144' >> /etc/sysctl.conf
sysctl -p
```

## 更新部署

### 1. 备份数据
```bash
./deploy.sh backup
```

### 2. 拉取最新代码
```bash
git pull origin main
```

### 3. 重新构建和部署
```bash
docker-compose -f docker-compose.prod.simple.yml down
docker-compose -f docker-compose.prod.simple.yml build --no-cache
docker-compose -f docker-compose.prod.simple.yml up -d
```

## 联系支持

如果遇到问题，请：
1. 查看日志文件
2. 检查系统资源
3. 验证配置文件
4. 联系技术支持

---

**注意**: 生产环境部署前，请确保：
- 修改所有默认密码
- 配置适当的防火墙规则
- 设置定期备份计划
- 监控系统资源使用情况 