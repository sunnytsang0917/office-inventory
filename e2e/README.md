# 端到端测试 (E2E Tests)

本目录包含办公室出入库系统的端到端测试，使用Playwright测试框架。

## 测试覆盖范围

### 1. 用户认证和权限控制 (`auth.spec.ts`)
- 管理员和普通员工登录
- 权限验证和页面访问控制
- 登出功能

### 2. 物品管理功能 (`items.spec.ts`)
- 创建、编辑、删除物品
- 物品搜索和筛选
- 批量导入物品
- 表单验证

### 3. 库房位置管理 (`locations.spec.ts`)
- 创建、编辑、删除库房位置
- 层级结构管理
- 位置库存查看
- 唯一性验证

### 4. 出入库操作 (`transactions.spec.ts`)
- 单个和批量入库操作
- 单个和批量出库操作
- 库存不足验证
- 交易历史记录查看

### 5. 库存查询和报表 (`inventory-reports.spec.ts`)
- 库存总览和搜索
- 低库存预警
- 月度统计报表
- 使用排行统计
- 报表导出功能

### 6. 完整用户流程 (`complete-workflow.spec.ts`)
- 端到端业务流程测试
- 权限控制完整流程
- 批量操作流程
- 错误处理和恢复

## 运行测试

### 前置条件

1. 确保后端服务运行在 `http://localhost:3001`
2. 确保前端应用运行在 `http://localhost:3000`
3. 数据库已正确配置并包含测试数据

### 安装依赖

```bash
npm install
npx playwright install
```

### 运行所有测试

```bash
npm run test:e2e
```

### 运行特定测试套件

```bash
# 认证测试
npm run test:auth

# 物品管理测试
npm run test:items

# 库房位置测试
npm run test:locations

# 出入库测试
npm run test:transactions

# 库存和报表测试
npm run test:inventory

# 完整流程测试
npm run test:workflow
```

### 调试模式运行

```bash
# 有界面模式运行
npm run test:e2e:headed

# 调试模式
npm run test:e2e:debug

# UI模式
npm run test:e2e:ui
```

### 查看测试报告

```bash
npm run test:e2e:report
```

## 测试数据

测试使用以下默认用户：

- **管理员**: `admin` / `admin123`
- **普通员工**: `employee` / `employee123`

测试数据文件位于 `fixtures/` 目录下，包括：
- `test-items.xlsx` - 物品批量导入测试数据
- `batch-inbound.xlsx` - 批量入库测试数据
- `batch-outbound.xlsx` - 批量出库测试数据

## 页面对象模型

测试使用页面对象模型 (Page Object Model) 来组织代码：

- `pages/LoginPage.ts` - 登录页面操作
- `pages/ItemsPage.ts` - 物品管理页面操作
- `pages/LocationsPage.ts` - 库房位置页面操作
- `utils/test-helpers.ts` - 通用测试工具函数

## 测试配置

- `playwright.config.ts` - Playwright主配置文件
- `test.config.ts` - 测试数据和环境配置
- `fixtures/` - 测试数据文件

## 注意事项

1. **数据隔离**: 每个测试应该创建自己的测试数据，避免测试间相互影响
2. **清理**: 测试完成后应清理创建的测试数据
3. **等待**: 使用适当的等待策略，避免因异步操作导致的测试不稳定
4. **错误处理**: 测试应该验证错误情况和边界条件
5. **可维护性**: 使用页面对象模型和工具函数提高代码复用性

## 持续集成

测试可以集成到CI/CD流水线中：

```yaml
# GitHub Actions 示例
- name: Run E2E Tests
  run: |
    npm install
    npx playwright install
    npm run test:e2e
```

## 故障排除

### 常见问题

1. **服务未启动**: 确保前后端服务正在运行
2. **端口冲突**: 检查配置的端口是否正确
3. **数据库连接**: 确保测试数据库可访问
4. **浏览器问题**: 运行 `npx playwright install` 重新安装浏览器

### 调试技巧

1. 使用 `--headed` 模式查看浏览器操作
2. 使用 `--debug` 模式逐步调试
3. 查看测试报告中的截图和视频
4. 检查网络请求和响应