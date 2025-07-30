# 设计文档

## 概述

办公室出入库系统是一个基于Web的轻量级库存管理应用，采用前后端分离架构。系统支持物品管理、出入库操作、Excel批量导入导出、库存查询和基本的用户权限控制。

### 技术栈选择
- **前端**: React + TypeScript + Ant Design
- **后端**: Node.js + Express + TypeScript  
- **数据库**: PostgreSQL (云服务器部署)
- **文件处理**: xlsx库处理Excel文件
- **认证**: JWT Token
- **部署**: Docker容器化部署
- **反向代理**: Nginx
## 架构


### 部署架构

#### 开发环境
- **数据库**: 本地SQLite数据库
- **文件存储**: 本地文件系统
- **运行方式**: npm run dev

#### 云服务器生产环境
- **数据库**: PostgreSQL (云数据库或自建)
- **文件存储**: 云服务器本地存储或对象存储
- **容器化**: Docker + Docker Compose
- **反向代理**: Nginx处理静态文件和API代理
- **进程管理**: PM2管理Node.js进程
- **SSL**: Let's Encrypt自动证书
- **监控**: 基本的健康检查和日志记录#
# 组件和接口

### 核心组件

#### 1. 物品管理组件 (ItemService)
```typescript
interface ItemService {
  createItem(item: CreateItemDto): Promise<Item>
  updateItem(id: string, item: UpdateItemDto): Promise<Item>
  deleteItem(id: string): Promise<void>
  getItem(id: string): Promise<Item>
  listItems(filter?: ItemFilter): Promise<Item[]>
  batchImportItems(file: File): Promise<ImportResult>
}
```

#### 2. 库存管理组件 (InventoryService)
```typescript
interface InventoryService {
  getInventoryStatus(): Promise<InventoryStatus[]>
  getItemInventory(itemId: string): Promise<InventoryDetail>
  searchInventory(query: string): Promise<InventoryStatus[]>
  getLowStockItems(threshold?: number): Promise<InventoryStatus[]>
}
```

#### 3. 出入库组件 (TransactionService)
```typescript
interface TransactionService {
  createInboundTransaction(transaction: CreateInboundDto): Promise<Transaction>
  createOutboundTransaction(transaction: CreateOutboundDto): Promise<Transaction>
  batchInbound(file: File): Promise<BatchResult>
  batchOutbound(file: File): Promise<BatchResult>
  getTransactionHistory(filter?: TransactionFilter): Promise<Transaction[]>
}
```

#### 4. 库房位置管理组件 (LocationService)
```typescript
interface LocationService {
  createLocation(location: CreateLocationDto): Promise<Location>
  updateLocation(id: string, location: UpdateLocationDto): Promise<Location>
  deleteLocation(id: string): Promise<void>
  getLocation(id: string): Promise<Location>
  listLocations(): Promise<Location[]>
  getLocationInventory(locationId: string): Promise<LocationInventory[]>
  setDefaultLocation(itemId: string, locationId: string): Promise<void>
}
```

## 数据模型

### 核心实体

#### 1. 物品 (Item)
```typescript
interface Item {
  id: string
  name: string
  category: string
  specification: string
  unit: string
  defaultLocationId?: string  // 默认库房位置
  lowStockThreshold: number
  createdAt: Date
  updatedAt: Date
}
```

#### 2. 库房位置 (Location)
```typescript
interface Location {
  id: string
  code: string           // 位置编码，如 "A-1-01"
  name: string           // 位置名称，如 "A区1层货架01"
  description?: string   // 位置描述
  parentId?: string      // 父级位置ID，支持层级结构
  level: number          // 层级深度 (0=仓库, 1=区域, 2=楼层, 3=货架, 4=具体位置)
  isActive: boolean      // 是否启用
  createdAt: Date
  updatedAt: Date
}
```

#### 3. 交易记录 (Transaction)
```typescript
interface Transaction {
  id: string
  itemId: string
  locationId: string     // 库房位置ID
  type: 'inbound' | 'outbound'
  quantity: number
  date: Date
  operator: string       // 操作人
  supplier?: string      // 供应商（入库时）
  recipient?: string     // 领用人（出库时）
  purpose?: string       // 用途（出库时）
  batchId?: string       // 批量操作ID
  createdAt: Date
}
```

#### 4. 库存视图 (InventoryView)
```typescript
interface InventoryView {
  itemId: string
  locationId: string
  itemName: string
  locationName: string
  locationCode: string
  currentStock: number
  lastTransactionDate: Date
}
```

#### 5. 用户 (User)
```typescript
interface User {
  id: string
  username: string
  password: string
  role: 'admin' | 'employee'
  name: string
  createdAt: Date
  updatedAt: Date
}
```
## 错误
处理

### 库房位置相关错误处理

1. **位置不存在错误**: 当指定的库房位置ID不存在时，返回404错误
2. **位置已被使用错误**: 当尝试删除有库存记录的位置时，返回409冲突错误
3. **位置层级错误**: 当位置层级结构不正确时，返回400验证错误
4. **库存不足错误**: 当指定位置库存不足时，返回400错误并提供详细的库存信息

### 出入库操作错误处理

1. **位置库存检查**: 出库前检查指定位置的库存是否充足
2. **位置验证**: 验证指定的库房位置是否存在且处于活跃状态
3. **批量操作回滚**: 批量操作中如果任何一个位置库存不足，回滚整个操作

## 测试策略

### 库房位置功能测试

1. **单元测试**
   - 位置CRUD操作测试
   - 位置层级结构验证测试
   - 默认位置设置测试

2. **集成测试**
   - 位置与库存关联测试
   - 出入库操作中位置验证测试
   - 批量操作中位置处理测试

3. **端到端测试**
   - 完整的位置管理流程测试
   - 跨位置库存转移测试
   - 位置相关报表生成测试

### 数据库设计考虑

#### 表结构设计

1. **locations表**: 存储库房位置信息，支持层级结构
2. **items表**: 添加default_location_id字段
3. **transactions表**: 添加location_id字段
4. **inventory_view视图**: 按位置汇总库存信息

#### 索引优化

1. 在transactions表的location_id字段上创建索引
2. 在locations表的parent_id字段上创建索引
3. 在inventory_view上创建复合索引(item_id, location_id)