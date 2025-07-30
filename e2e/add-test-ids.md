# 添加测试ID指南

为了使E2E测试能够正常运行，需要在前端组件中添加 `data-testid` 属性。以下是需要添加的测试ID列表：

## 通用组件

### 用户信息和导航
```tsx
// 用户信息显示
<div data-testid="user-info">
<span data-testid="user-role">管理员</span>
<div data-testid="user-menu">
<button data-testid="logout-button">登出</button>

// 页面容器
<div data-testid="items-page">
<div data-testid="locations-page">
<div data-testid="inventory-page">
<div data-testid="inbound-page">
<div data-testid="outbound-page">
<div data-testid="transaction-history-page">
<div data-testid="reports-page">
<div data-testid="api-test-page">
```

## 登录页面 (LoginPage.tsx)

```tsx
<form data-testid="login-form">
  <input data-testid="username-input" />
  <input data-testid="password-input" />
  <button data-testid="login-button">登录</button>
</form>
```

## 物品管理页面 (ItemsPage.tsx)

```tsx
// 操作按钮
<button data-testid="add-item-button">添加物品</button>
<button data-testid="batch-import-button">批量导入</button>
<input data-testid="search-input" placeholder="搜索物品" />

// 表格
<table data-testid="data-table">
  <tr data-testid="item-row">
    <td data-testid="item-name">物品名称</td>
    <button data-testid="edit-button">编辑</button>
    <button data-testid="delete-button">删除</button>
  </tr>
</table>

// 表单
<input data-testid="item-name-input" />
<input data-testid="item-category-input" />
<input data-testid="item-specification-input" />
<input data-testid="item-unit-input" />
<input data-testid="item-threshold-input" />
<button data-testid="submit-button">提交</button>

// 批量导入
<input data-testid="file-upload" type="file" />
<button data-testid="upload-button">上传</button>
<button data-testid="confirm-delete-button">确认删除</button>
```

## 库房位置页面 (LocationsPage.tsx)

```tsx
// 操作按钮
<button data-testid="add-location-button">添加位置</button>

// 表格
<tr data-testid="location-row">
  <td data-testid="location-code">位置编码</td>
  <td data-testid="location-name">位置名称</td>
  <button data-testid="edit-button">编辑</button>
  <button data-testid="delete-button">删除</button>
  <button data-testid="view-inventory-button">查看库存</button>
</tr>

// 表单
<input data-testid="location-code-input" />
<input data-testid="location-name-input" />
<input data-testid="location-description-input" />
<select data-testid="parent-location-select" />

// 模态框
<div data-testid="location-inventory-modal">
  <h3 data-testid="modal-title">位置库存</h3>
</div>
```

## 出入库页面

```tsx
// 表单元素
<select data-testid="item-select" />
<select data-testid="location-select" />
<input data-testid="quantity-input" />
<input data-testid="supplier-input" />
<input data-testid="recipient-input" />
<input data-testid="purpose-input" />
<input data-testid="operator-input" />

// 库存显示
<span data-testid="current-stock">当前库存: 100</span>

// 批量导入结果
<span data-testid="import-success-count">成功: 10</span>
<span data-testid="import-failed-count">失败: 0</span>
```

## 库存页面 (InventoryPage.tsx)

```tsx
// 页面容器
<div data-testid="inventory-overview">

// 表格
<table data-testid="inventory-table">
  <th data-testid="column-item-name">物品名称</th>
  <th data-testid="column-location">库房位置</th>
  <th data-testid="column-quantity">库存数量</th>
  <th data-testid="column-last-updated">最后更新</th>
</table>

<tr data-testid="inventory-row">
  <td data-testid="item-name">物品名称</td>
  <td data-testid="location-name">位置名称</td>
  <td data-testid="stock-quantity">数量</td>
  <button data-testid="view-details-button">查看详情</button>
</tr>

// 搜索和筛选
<input data-testid="search-input" />
<button data-testid="search-button">搜索</button>
<select data-testid="location-filter" />
<button data-testid="filter-button">筛选</button>

// 标签页
<div data-testid="low-stock-tab">低库存</div>
<div data-testid="location-summary-tab">位置汇总</div>

// 低库存
<table data-testid="low-stock-table">
  <tr data-testid="low-stock-row">
    <span data-testid="low-stock-badge">低库存</span>
  </tr>
</table>

// 位置汇总
<table data-testid="location-summary-table">
  <tr data-testid="location-summary-row">
    <td data-testid="location-name">位置名称</td>
    <td data-testid="total-items">物品总数</td>
    <td data-testid="total-quantity">总数量</td>
  </tr>
</table>

// 详情模态框
<div data-testid="inventory-detail-modal">
  <div data-testid="item-basic-info">基本信息</div>
  <div data-testid="location-distribution">位置分布</div>
  <div data-testid="transaction-history">交易历史</div>
</div>

// 分析功能
<button data-testid="trend-analysis-button">趋势分析</button>
<button data-testid="alert-settings-button">预警设置</button>

<div data-testid="trend-analysis-modal">
  <div data-testid="trend-chart">趋势图表</div>
  <select data-testid="trend-period-select">时间范围</select>
</div>

<div data-testid="alert-settings-modal">
  <input data-testid="global-threshold-input" />
  <button data-testid="save-settings-button">保存设置</button>
</div>
```

## 交易历史页面

```tsx
<table data-testid="transaction-history-table">
  <tr data-testid="transaction-row">
    <td data-testid="item-name">物品名称</td>
    <td data-testid="transaction-type">交易类型</td>
    <td data-testid="quantity">数量</td>
    <td data-testid="location">位置</td>
    <td data-testid="date">日期</td>
  </tr>
</table>

// 筛选
<select data-testid="type-filter" />
<input data-testid="start-date" />
<input data-testid="end-date" />
<button data-testid="filter-button">筛选</button>
<button data-testid="export-button">导出</button>
```

## 报表页面 (ReportsPage.tsx)

```tsx
// 标签页
<div data-testid="monthly-report-tab">月度统计</div>
<div data-testid="usage-ranking-tab">使用排行</div>
<div data-testid="custom-report-tab">自定义统计</div>

// 月度报表
<select data-testid="month-select" />
<button data-testid="generate-report-button">生成报表</button>
<div data-testid="monthly-chart">月度图表</div>
<span data-testid="inbound-total">入库总量</span>
<span data-testid="outbound-total">出库总量</span>
<span data-testid="net-change">净变化</span>

// 使用排行
<input data-testid="start-date" />
<input data-testid="end-date" />
<button data-testid="generate-ranking-button">生成排行</button>
<table data-testid="usage-ranking-table">
  <tr data-testid="ranking-row">
    <td data-testid="rank-number">排名</td>
    <td data-testid="item-name">物品名称</td>
    <td data-testid="usage-count">使用次数</td>
  </tr>
</table>

// 自定义报表
<input data-testid="custom-start-date" />
<input data-testid="custom-end-date" />
<input data-testid="include-inbound" type="checkbox" />
<input data-testid="include-outbound" type="checkbox" />
<input data-testid="include-inventory" type="checkbox" />
<button data-testid="generate-custom-report-button">生成自定义报表</button>
<div data-testid="custom-report-chart">自定义图表</div>
<div data-testid="custom-report-summary">报表摘要</div>

// 导出按钮
<button data-testid="export-csv-button">导出CSV</button>
<button data-testid="export-excel-button">导出Excel</button>
<button data-testid="refresh-report-button">刷新报表</button>
```

## 通用组件

```tsx
// 分页
<div data-testid="pagination-info">第 2 页</div>

// 通知 (由Ant Design自动生成，无需手动添加)
// .ant-notification-notice-success
// .ant-notification-notice-error
// .ant-notification-notice-warning
// .ant-notification-notice-info
```

## 实施建议

1. **逐步添加**: 可以先为一个页面添加测试ID，然后逐步扩展到其他页面
2. **命名规范**: 使用描述性的名称，如 `item-name-input` 而不是 `input1`
3. **保持一致**: 相同功能的元素使用相同的测试ID模式
4. **文档更新**: 添加测试ID时同时更新相关文档

## 验证测试ID

添加测试ID后，可以运行以下命令验证：

```bash
# 运行特定测试验证
npm run test:auth
npm run test:items
```