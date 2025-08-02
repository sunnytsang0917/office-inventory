import React, { useState, useEffect, useMemo } from 'react';
import {
  Typography,
  Card,
  Row,
  Col,
  Input,
  Select,
  Switch,
  Table,
  Tag,
  Button,
  Space,
  Statistic,
  Badge,
  Tooltip,
  Modal,
  message,
} from 'antd';
import {
  SearchOutlined,
  WarningOutlined,
  EyeOutlined,
  BarChartOutlined,
  TableOutlined,
  LineChartOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { InventoryStatus, InventoryFilter, InventoryDetail, InventoryGroupByLocation } from '../types/inventory';
import { InventoryApi } from '../services/inventoryApi';
import { LocationApi } from '../services/locationApi';
import { ItemApi } from '../services/itemApi';
import InventoryDetailPage from '../components/inventory/InventoryDetailPage';

const { Title } = Typography;
const { Option } = Select;

const InventoryPage: React.FC = () => {
  const [filter, setFilter] = useState<InventoryFilter>({});
  const [viewMode, setViewMode] = useState<'summary' | 'detailed'>('summary');
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);
  const [currentView, setCurrentView] = useState<'overview' | 'detail'>('overview');
  const [detailItemId, setDetailItemId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [inventoryData, setInventoryData] = useState<InventoryStatus[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedItemDetail, setSelectedItemDetail] = useState<InventoryDetail | null>(null);

  // 加载库存数据
  const loadInventoryData = async () => {
    setLoading(true);
    try {
      const data = await InventoryApi.getInventoryStatus(filter);
      setInventoryData(data);
    } catch (error) {
      console.error('Failed to load inventory data:', error);
      message.error('加载库存数据失败');
    } finally {
      setLoading(false);
    }
  };

  // 加载位置数据
  const loadLocations = async () => {
    try {
      const locationsData = await LocationApi.getLocations();
      setLocations(locationsData);
    } catch (error) {
      console.error('Failed to load locations:', error);
    }
  };

  // 加载类别数据
  const loadCategories = async () => {
    try {
      const categoriesData = await ItemApi.getCategories();
      setCategories(categoriesData);
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  };

  useEffect(() => {
    loadLocations();
    loadCategories();
  }, []);

  useEffect(() => {
    loadInventoryData();
  }, [filter]);

  // 按位置分组的库存数据
  const groupedInventoryData = useMemo(() => {
    return InventoryApi.groupInventoryByLocation(inventoryData);
  }, [inventoryData]);

  // 库存汇总信息
  const inventorySummary = useMemo(() => {
    return InventoryApi.getInventorySummary(inventoryData);
  }, [inventoryData]);

  // 处理筛选条件变化
  const handleFilterChange = (key: keyof InventoryFilter, value: any) => {
    setFilter(prev => ({
      ...prev,
      [key]: value || undefined,
    }));
  };

  // 查看物品详情（模态框）
  const handleViewItemDetail = async (itemId: string) => {
    setSelectedItemId(itemId);
    try {
      const detail = await InventoryApi.getItemInventory(itemId);
      setSelectedItemDetail(detail);
      setIsDetailModalVisible(true);
    } catch (error) {
      console.error('Failed to load item detail:', error);
      message.error('加载物品详情失败');
    }
  };

  // 查看物品详细页面
  const handleViewItemDetailPage = (itemId: string) => {
    setDetailItemId(itemId);
    setCurrentView('detail');
  };

  // 返回总览页面
  const handleBackToOverview = () => {
    setCurrentView('overview');
    setDetailItemId(null);
  };

  // 汇总视图的表格列定义
  const summaryColumns: ColumnsType<InventoryGroupByLocation> = [
    {
      title: '位置编码',
      dataIndex: 'locationCode',
      key: 'locationCode',
      width: 120,
      sorter: (a, b) => a.locationCode.localeCompare(b.locationCode),
    },
    {
      title: '位置名称',
      dataIndex: 'locationName',
      key: 'locationName',
      sorter: (a, b) => a.locationName.localeCompare(b.locationName),
    },
    {
      title: '物品数量',
      dataIndex: 'totalItems',
      key: 'totalItems',
      width: 100,
      sorter: (a, b) => a.totalItems - b.totalItems,
      render: (count: number) => (
        <Badge count={count} showZero color="blue" />
      ),
    },
    {
      title: '低库存物品',
      dataIndex: 'lowStockItems',
      key: 'lowStockItems',
      width: 120,
      sorter: (a, b) => a.lowStockItems - b.lowStockItems,
      render: (count: number) => (
        count > 0 ? (
          <Badge count={count} color="red" />
        ) : (
          <Badge count={0} showZero color="green" />
        )
      ),
    },
    {
      title: '操作',
      key: 'actions',
      width: 100,
      render: (_, record) => (
        <Button
          type="link"
          icon={<EyeOutlined />}
          onClick={() => {
            // 展开该位置的详细信息
            setFilter(prev => ({ ...prev, locationId: record.locationId }));
            setViewMode('detailed');
          }}
        >
          查看详情
        </Button>
      ),
    },
  ];

  // 详细视图的表格列定义
  const detailedColumns: ColumnsType<InventoryStatus> = [
    {
      title: '物品名称',
      dataIndex: 'itemName',
      key: 'itemName',
      sorter: (a, b) => a.itemName.localeCompare(b.itemName),
      render: (name: string, record) => (
        <Space>
          <span>{name}</span>
          {record.isLowStock && (
            <Tooltip title="库存不足">
              <WarningOutlined style={{ color: '#ff4d4f' }} />
            </Tooltip>
          )}
        </Space>
      ),
    },
    {
      title: '类别',
      dataIndex: 'itemCategory',
      key: 'itemCategory',
      width: 100,
      render: (category: string) => <Tag color="blue">{category}</Tag>,
    },
    {
      title: '位置',
      key: 'location',
      width: 150,
      render: (_, record) => (
        <Space direction="vertical" size="small">
          <Tag color="green">{record.locationCode}</Tag>
          <span style={{ fontSize: '12px', color: '#666' }}>
            {record.locationName}
          </span>
        </Space>
      ),
    },
    {
      title: '当前库存',
      dataIndex: 'currentStock',
      key: 'currentStock',
      width: 100,
      sorter: (a, b) => a.currentStock - b.currentStock,
      render: (stock: number, record) => (
        <Space>
          <span style={{ color: record.isLowStock ? '#ff4d4f' : '#52c41a' }}>
            {stock}
          </span>
          <span style={{ color: '#666' }}>{record.itemUnit}</span>
        </Space>
      ),
    },
    {
      title: '最低库存',
      dataIndex: 'minStock',
      key: 'minStock',
      width: 100,
      render: (minStock: number, record) => (
        <span style={{ color: '#666' }}>
          {minStock} {record.itemUnit}
        </span>
      ),
    },
    {
      title: '库存状态',
      key: 'status',
      width: 100,
      render: (_, record) => (
        record.isLowStock ? (
          <Tag color="red">库存不足</Tag>
        ) : record.currentStock === 0 ? (
          <Tag color="volcano">缺货</Tag>
        ) : (
          <Tag color="green">正常</Tag>
        )
      ),
    },
    {
      title: '操作',
      key: 'actions',
      width: 150,
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => handleViewItemDetail(record.itemId)}
            size="small"
          >
            快览
          </Button>
          <Button
            type="link"
            icon={<LineChartOutlined />}
            onClick={() => handleViewItemDetailPage(record.itemId)}
            size="small"
          >
            详情页
          </Button>
        </Space>
      ),
    },
  ];

  // 如果当前视图是详情页，显示详情页组件
  if (currentView === 'detail' && detailItemId) {
    return (
      <InventoryDetailPage
        itemId={detailItemId}
        onBack={handleBackToOverview}
      />
    );
  }

  return (
    <div>
      <Title level={2}>库存查询</Title>
      
      {/* 库存汇总统计 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="物品总数"
              value={inventorySummary.totalItems}
              prefix={<BarChartOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="存储位置"
              value={inventorySummary.totalLocations}
              prefix={<TableOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="低库存物品"
              value={inventorySummary.lowStockItems}
              valueStyle={{ color: inventorySummary.lowStockItems > 0 ? '#cf1322' : '#3f8600' }}
              prefix={<WarningOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="缺货物品"
              value={inventorySummary.outOfStockItems}
              valueStyle={{ color: inventorySummary.outOfStockItems > 0 ? '#cf1322' : '#3f8600' }}
              prefix={<WarningOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* 搜索和过滤 */}
      <Card style={{ marginBottom: 24 }}>
        <Row gutter={16} align="middle">
          <Col span={6}>
            <Input
              placeholder="搜索物品名称"
              prefix={<SearchOutlined />}
              value={filter.itemName}
              onChange={(e) => handleFilterChange('itemName', e.target.value)}
              allowClear
            />
          </Col>
          <Col span={4}>
            <Select
              placeholder="选择类别"
              value={filter.category}
              onChange={(value) => handleFilterChange('category', value)}
              allowClear
              style={{ width: '100%' }}
            >
              {categories.map(category => (
                <Option key={category} value={category}>{category}</Option>
              ))}
            </Select>
          </Col>
          <Col span={4}>
            <Select
              placeholder="选择位置"
              value={filter.locationId}
              onChange={(value) => handleFilterChange('locationId', value)}
              allowClear
              style={{ width: '100%' }}
            >
              {locations
                .filter(loc => loc.level >= 3) // 只显示货架级别及以下
                .map(location => (
                  <Option key={location.id} value={location.id}>
                    {location.code}
                  </Option>
                ))}
            </Select>
          </Col>
          <Col span={4}>
            <Space>
              <span>仅显示低库存:</span>
              <Switch
                checked={filter.lowStockOnly}
                onChange={(checked) => handleFilterChange('lowStockOnly', checked)}
              />
            </Space>
          </Col>
          <Col span={6}>
            <Space>
              <span>视图模式:</span>
              <Select
                value={viewMode}
                onChange={setViewMode}
                style={{ width: 120 }}
              >
                <Option value="summary">汇总视图</Option>
                <Option value="detailed">详细视图</Option>
              </Select>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* 库存数据表格 */}
      <Card>
        {viewMode === 'summary' ? (
          <Table
            columns={summaryColumns}
            dataSource={groupedInventoryData}
            rowKey="locationId"
            loading={loading}
            pagination={{
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total) => `共 ${total} 个位置`,
            }}
            expandable={{
              expandedRowRender: (record) => (
                <Table
                  columns={detailedColumns.filter(col => col.key !== 'location')}
                  dataSource={record.items}
                  rowKey={(item) => `${item.itemId}-${item.locationId}`}
                  pagination={false}
                  size="small"
                />
              ),
              rowExpandable: (record) => record.items.length > 0,
            }}
          />
        ) : (
          <Table
            columns={detailedColumns}
            dataSource={inventoryData}
            loading={loading}
            rowKey={(record) => `${record.itemId}-${record.locationId}`}
            pagination={{
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total) => `共 ${total} 条记录`,
            }}
          />
        )}
      </Card>

      {/* 物品详情模态框 */}
      <Modal
        title="物品库存详情"
        open={isDetailModalVisible}
        onCancel={() => {
          setIsDetailModalVisible(false);
          setSelectedItemId(null);
        }}
        footer={null}
        width={800}
      >
        {selectedItemDetail && (
          <div>
            <Row gutter={16} style={{ marginBottom: 16 }}>
              <Col span={12}>
                <Card size="small">
                  <Statistic
                    title="物品名称"
                    value={selectedItemDetail.itemName}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card size="small">
                  <Statistic
                    title="总库存"
                    value={selectedItemDetail.totalStock}
                    suffix={selectedItemDetail.itemUnit}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card size="small">
                  <Statistic
                    title="低库存位置"
                    value={selectedItemDetail.totalLowStockLocations}
                    valueStyle={{ 
                      color: selectedItemDetail.totalLowStockLocations > 0 ? '#cf1322' : '#3f8600' 
                    }}
                  />
                </Card>
              </Col>
            </Row>
            
            <Table
              columns={[
                {
                  title: '位置编码',
                  dataIndex: 'locationCode',
                  key: 'locationCode',
                },
                {
                  title: '位置名称',
                  dataIndex: 'locationName',
                  key: 'locationName',
                },
                {
                  title: '当前库存',
                  dataIndex: 'currentStock',
                  key: 'currentStock',
                  render: (stock: number) => (
                    <span>{stock} {selectedItemDetail.itemUnit}</span>
                  ),
                },
                {
                  title: '状态',
                  key: 'status',
                  render: (_, record) => (
                    record.isLowStock ? (
                      <Tag color="red">库存不足</Tag>
                    ) : (
                      <Tag color="green">正常</Tag>
                    )
                  ),
                },
              ]}
              dataSource={selectedItemDetail.locations}
              rowKey="locationId"
              pagination={false}
              size="small"
            />
          </div>
        )}
      </Modal>
    </div>
  );
};

export default InventoryPage;