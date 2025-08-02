import React, { useState, useEffect, useMemo } from 'react';
import {
  Typography,
  Card,
  Table,
  Button,
  Input,
  Select,
  Space,
  Tag,
  Popconfirm,
  message,
  Row,
  Col,
  Tooltip,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ExclamationCircleOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { Item, ItemFilter } from '../types/item';
import { ItemApi, CreateItemRequest, UpdateItemRequest } from '../services/itemApi';
import { LocationApi } from '../services/locationApi';
import ItemForm from '../components/items/ItemForm';
import BatchImportModal from '../components/items/BatchImportModal';
import { useAppContext } from '../contexts/AppContext';

const { Title } = Typography;
const { Search } = Input;

const ItemsPage: React.FC = () => {
  const { state } = useAppContext();
  const [items, setItems] = useState<Item[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [formVisible, setFormVisible] = useState(false);
  const [batchImportVisible, setBatchImportVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | undefined>();
  const [filters, setFilters] = useState<ItemFilter>({});

  // 加载物品数据
  const loadItems = async () => {
    setLoading(true);
    try {
      const itemsData = await ItemApi.getItems(filters);
      setItems(itemsData);
    } catch (error) {
      console.error('Failed to load items:', error);
      message.error('加载物品数据失败');
    } finally {
      setLoading(false);
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

  // 加载位置数据
  const loadLocations = async () => {
    try {
      const locationsData = await LocationApi.getLocations();
      setLocations(locationsData);
    } catch (error) {
      console.error('Failed to load locations:', error);
    }
  };

  useEffect(() => {
    loadItems();
    loadCategories();
    loadLocations();
  }, []);

  useEffect(() => {
    loadItems();
  }, [filters]);

  // 过滤后的物品列表
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      if (filters.name && !item.name.toLowerCase().includes(filters.name.toLowerCase())) {
        return false;
      }
      if (filters.category && item.category !== filters.category) {
        return false;
      }
      if (filters.location && item.location !== filters.location) {
        return false;
      }
      if (filters.lowStock && item.currentStock >= item.minStock) {
        return false;
      }
      return true;
    });
  }, [items, filters]);

  // 处理添加物品
  const handleAdd = () => {
    setEditingItem(undefined);
    setFormVisible(true);
  };

  // 处理编辑物品
  const handleEdit = (item: Item) => {
    setEditingItem(item);
    setFormVisible(true);
  };

  // 处理删除物品
  const handleDelete = async (item: Item) => {
    setLoading(true);
    try {
      await ItemApi.deleteItem(item.id);
      setItems(prev => prev.filter(i => i.id !== item.id));
      message.success('删除成功');
    } catch (error) {
      console.error('Failed to delete item:', error);
      message.error('删除失败');
    } finally {
      setLoading(false);
    }
  };

  // 处理表单提交
  const handleFormSubmit = async (values: CreateItemRequest | UpdateItemRequest) => {
    setLoading(true);
    try {
      if (editingItem) {
        // 编辑
        const updatedItem = await ItemApi.updateItem(editingItem.id, values);
        setItems(prev => prev.map(item => 
          item.id === editingItem.id ? updatedItem : item
        ));
        message.success('编辑成功');
      } else {
        // 添加
        const newItem = await ItemApi.createItem(values as CreateItemRequest);
        setItems(prev => [...prev, newItem]);
        message.success('添加成功');
      }
      setFormVisible(false);
    } catch (error) {
      console.error('Failed to save item:', error);
      message.error(editingItem ? '编辑失败' : '添加失败');
    } finally {
      setLoading(false);
    }
  };

  // 处理批量导入成功
  const handleBatchImportSuccess = () => {
    loadItems(); // 重新加载数据
  };

  // 表格列定义
  const columns: ColumnsType<Item> = [
    {
      title: '物品名称',
      dataIndex: 'name',
      key: 'name',
      width: 150,
      ellipsis: true,
    },
    {
      title: '类别',
      dataIndex: 'category',
      key: 'category',
      width: 120,
      filters: categories.map(cat => ({ text: cat, value: cat })),
      onFilter: (value, record) => record.category === value,
    },
    {
      title: '规格',
      dataIndex: 'specification',
      key: 'specification',
      width: 200,
      ellipsis: {
        showTitle: false,
      },
      render: (text: string) => (
        <Tooltip title={text}>
          {text}
        </Tooltip>
      ),
    },
    {
      title: '单位',
      dataIndex: 'unit',
      key: 'unit',
      width: 80,
      align: 'center',
    },
    {
      title: '库房位置',
      dataIndex: 'defaultLocationId',
      key: 'defaultLocationId',
      width: 120,
      render: (locationId: string) => {
        const location = locations.find(loc => loc.id === locationId);
        return location ? location.name : '-';
      },
      filters: locations.map(loc => ({ text: loc.name, value: loc.id })),
      onFilter: (value, record) => record.location === value,
    },
    {
      title: '当前库存',
      dataIndex: 'currentStock',
      key: 'currentStock',
      width: 100,
      align: 'right',
      sorter: (a, b) => a.currentStock - b.currentStock,
      render: (stock: number, record: Item) => (
        <span style={{ 
          color: stock < record.minStock ? '#ff4d4f' : '#52c41a',
          fontWeight: stock < record.minStock ? 'bold' : 'normal'
        }}>
          {stock}
        </span>
      ),
    },
    {
      title: '最低库存',
      dataIndex: 'minStock',
      key: 'minStock',
      width: 100,
      align: 'right',
      sorter: (a, b) => a.minStock - b.minStock,
    },
    {
      title: '库存状态',
      key: 'stockStatus',
      width: 100,
      align: 'center',
      render: (_, record: Item) => (
        <Tag color={record.currentStock < record.minStock ? 'red' : 'green'}>
          {record.currentStock < record.minStock ? '库存不足' : '库存正常'}
        </Tag>
      ),
    },
    {
      title: '更新时间',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      width: 150,
      sorter: (a, b) => new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime(),
      render: (date: string) => new Date(date).toLocaleDateString('zh-CN'),
    },
    {
      title: '操作',
      key: 'actions',
      width: 120,
      fixed: 'right',
      render: (_, record: Item) => (
        <Space size="small">
          <Tooltip title="编辑">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
              disabled={state.user?.role !== 'admin'}
            />
          </Tooltip>
          <Tooltip title="删除">
            <Popconfirm
              title="确认删除"
              description={`确定要删除物品"${record.name}"吗？`}
              onConfirm={() => handleDelete(record)}
              okText="确定"
              cancelText="取消"
              icon={<ExclamationCircleOutlined style={{ color: 'red' }} />}
              disabled={state.user?.role !== 'admin'}
            >
              <Button
                type="text"
                danger
                icon={<DeleteOutlined />}
                disabled={state.user?.role !== 'admin'}
              />
            </Popconfirm>
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
        <Col>
          <Title level={2} style={{ margin: 0 }}>物品管理</Title>
        </Col>
        <Col>
          <Space>
            <Button
              icon={<ReloadOutlined />}
              onClick={loadItems}
              loading={loading}
            >
              刷新
            </Button>
            {state.user?.role === 'admin' && (
              <>
                <Button
                  icon={<PlusOutlined />}
                  onClick={handleAdd}
                >
                  添加物品
                </Button>
                <Button
                  type="primary"
                  onClick={() => setBatchImportVisible(true)}
                >
                  批量导入
                </Button>
              </>
            )}
          </Space>
        </Col>
      </Row>

      <Card>
        {/* 搜索和过滤区域 */}
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col xs={24} sm={12} md={8}>
            <Search
              placeholder="搜索物品名称"
              allowClear
              onSearch={(value) => setFilters(prev => ({ ...prev, name: value }))}
              onChange={(e) => {
                if (!e.target.value) {
                  setFilters(prev => ({ ...prev, name: undefined }));
                }
              }}
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Select
              placeholder="选择类别"
              allowClear
              style={{ width: '100%' }}
              options={categories.map(cat => ({ label: cat, value: cat }))}
              onChange={(value) => setFilters(prev => ({ ...prev, category: value }))}
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Select
              placeholder="选择位置"
              allowClear
              style={{ width: '100%' }}
              options={locations.map(loc => ({ label: loc.name, value: loc.id }))}
              onChange={(value) => setFilters(prev => ({ ...prev, locationId: value }))}
            />
          </Col>
          <Col xs={24} sm={12} md={4}>
            <Select
              placeholder="库存状态"
              allowClear
              style={{ width: '100%' }}
              options={[
                { label: '全部', value: undefined },
                { label: '库存不足', value: true },
                { label: '库存正常', value: false },
              ]}
              onChange={(value) => setFilters(prev => ({ ...prev, lowStock: value }))}
            />
          </Col>
        </Row>

        {/* 统计信息 */}
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={6}>
            <Card size="small">
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 24, fontWeight: 'bold', color: '#1890ff' }}>
                  {items.length}
                </div>
                <div style={{ color: '#666' }}>总物品数</div>
              </div>
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small">
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 24, fontWeight: 'bold', color: '#52c41a' }}>
                  {items.filter(item => item.currentStock >= item.minStock).length}
                </div>
                <div style={{ color: '#666' }}>库存正常</div>
              </div>
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small">
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 24, fontWeight: 'bold', color: '#ff4d4f' }}>
                  {items.filter(item => item.currentStock < item.minStock).length}
                </div>
                <div style={{ color: '#666' }}>库存不足</div>
              </div>
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small">
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 24, fontWeight: 'bold', color: '#faad14' }}>
                  {new Set(items.map(item => item.category)).size}
                </div>
                <div style={{ color: '#666' }}>物品类别</div>
              </div>
            </Card>
          </Col>
        </Row>

        {/* 物品列表表格 */}
        <Table
          columns={columns}
          dataSource={filteredItems}
          rowKey="id"
          loading={loading}
          pagination={{
            total: filteredItems.length,
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => 
              `第 ${range[0]}-${range[1]} 条/共 ${total} 条`,
          }}
          scroll={{ x: 1200 }}
          size="middle"
        />
      </Card>

      {/* 添加/编辑物品表单 */}
      <ItemForm
        visible={formVisible}
        onCancel={() => setFormVisible(false)}
        onSubmit={handleFormSubmit}
        item={editingItem}
        loading={loading}
      />

      {/* 批量导入模态框 */}
      <BatchImportModal
        visible={batchImportVisible}
        onCancel={() => setBatchImportVisible(false)}
        onSuccess={handleBatchImportSuccess}
        type="inbound"
      />
    </div>
  );
};

export default ItemsPage;