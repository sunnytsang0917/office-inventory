# Docker 部署指南

## 概述

本项目支持使用Docker进行容器化部署，包括开发环境和生产环境的配置。

## 架构组件

- **Frontend**: React应用，使用Nginx提供静态文件服务
- **Backend**: Node.js API服务器
- **Database**: PostgreSQL数据库
- **Nginx**: 反向代理和SSL终止（生产环境）

## 快速开始

### 1. 生产环境部署

```bash
# 1. 复制环境变量模板
cp .env.production .env

# 2. 编辑环境变量（重要！）
vim .env

# 3. 运行启动脚本
./docker-start.sh
```

### 2. 开发环境部署

```bash
# 启动开发环境（仅数据库和后端）
docker-compose -f docker-compose.dev.yml up -d

# 前端需要单独启动
cd frontend
npm start
```

## 环境变量配置

### 必须修改的配置项

```bash
# 数据库密码（强烈建议修改）
DB_PASSWORD=your-secure-password

# JWT密钥（必须修改）
JWT_SECRET=your-super-secure-jwt-secret-key-at-least-32-characters-long

# 域名配置
CORS_ORIGIN=https://your-domain.com
```

### 可选配置项

```bash
# 端口配置
FRONTEND_PORT=80
NGINX_HTTP_PORT=80
NGINX_HTTPS_PORT=443

# 文件上传限制
MAX_FILE_SIZE=10485760

# JWT过期时间
JWT_EXPIRES_IN=24h
```

## SSL证书配置

### 开发环境（自签名证书）

```bash
# 生成自签名证书
./scripts/generate-ssl.sh

# 启动带SSL的服务
docker-compose --profile production up -d
```

### 生产环境（Let's Encrypt）

```bash
# 1. 安装certbot
sudo apt-get install certbot

# 2. 获取证书
sudo certbot certonly --standalone -d your-domain.com

# 3. 复制证书到项目目录
sudo cp /etc/letsencrypt/live/your-domain.com/fullchain.pem nginx/ssl/cert.pem
sudo cp /etc/letsencrypt/live/your-domain.com/privkey.pem nginx/ssl/key.pem

# 4. 启动服务
docker-compose --profile production up -d
```

## 常用命令

### 服务管理

```bash
# 启动所有服务
docker-compose up -d

# 停止所有服务
docker-compose down

# 重启服务
docker-compose restart

# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f

# 查看特定服务日志
docker-compose logs -f backend
```

### 数据库管理

```bash
# 连接到数据库
docker-compose exec postgres psql -U postgres -d office_inventory

# 备份数据库
docker-compose exec postgres pg_dump -U postgres office_inventory > backup.sql

# 恢复数据库
docker-compose exec -T postgres psql -U postgres office_inventory < backup.sql
```

### 应用管理

```bash
# 重新构建镜像
docker-compose build

# 强制重新构建
docker-compose build --no-cache

# 更新应用
git pull
docker-compose build
docker-compose up -d
```

## 健康检查

系统提供多个健康检查端点：

- Frontend: `http://localhost/health`
- Backend: `http://localhost:3001/health`
- API: `http://localhost:3001/api/health`
- Nginx: `http://localhost:8080/nginx-health`

## 监控和日志

### 日志位置

- Nginx日志: `nginx_logs` volume
- Backend日志: `backend_logs` volume
- 应用日志: `docker-compose logs`

### 监控指标

```bash
# 查看容器资源使用情况
docker stats

# 查看磁盘使用情况
docker system df

# 清理未使用的资源
docker system prune
```

## 故障排除

### 常见问题

1. **端口冲突**
   ```bash
   # 检查端口占用
   lsof -i :80
   lsof -i :3001
   lsof -i :5432
   ```

2. **数据库连接失败**
   ```bash
   # 检查数据库状态
   docker-compose exec postgres pg_isready -U postgres
   
   # 查看数据库日志
   docker-compose logs postgres
   ```

3. **SSL证书问题**
   ```bash
   # 检查证书文件
   ls -la nginx/ssl/
   
   # 验证证书
   openssl x509 -in nginx/ssl/cert.pem -text -noout
   ```

4. **权限问题**
   ```bash
   # 修复文件权限
   sudo chown -R $USER:$USER .
   chmod +x docker-start.sh
   chmod +x scripts/generate-ssl.sh
   ```

### 调试模式

```bash
# 以调试模式启动
docker-compose up --no-daemon

# 进入容器调试
docker-compose exec backend sh
docker-compose exec frontend sh
```

## 性能优化

### 生产环境优化

1. **启用Gzip压缩**: 已在Nginx配置中启用
2. **静态文件缓存**: 已配置1年缓存
3. **数据库连接池**: 后端已配置连接池
4. **速率限制**: Nginx已配置API速率限制

### 资源限制

```yaml
# 在docker-compose.yml中添加资源限制
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 512M
        reservations:
          cpus: '0.25'
          memory: 256M
```

## 安全考虑

1. **定期更新密码**: 定期更新数据库密码和JWT密钥
2. **防火墙配置**: 只开放必要的端口
3. **SSL证书更新**: 定期更新SSL证书
4. **日志监控**: 监控异常访问日志
5. **备份策略**: 定期备份数据库和重要文件

## 备份和恢复

### 自动备份脚本

```bash
#!/bin/bash
# backup.sh
DATE=$(date +%Y%m%d_%H%M%S)
docker-compose exec postgres pg_dump -U postgres office_inventory > "backup_${DATE}.sql"
```

### 恢复数据

```bash
# 恢复特定备份
docker-compose exec -T postgres psql -U postgres office_inventory < backup_20240127_120000.sql
```