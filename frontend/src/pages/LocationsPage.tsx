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
  Tabs,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ExclamationCircleOutlined,
  ReloadOutlined,
  EyeOutlined,
  UnorderedListOutlined,
  ApartmentOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { Location, LocationFilter, LOCATION_LEVEL_NAMES } from '../types/location';
import { LocationApi, CreateLocationRequest, UpdateLocationRequest } from '../services/locationApi';
import LocationForm from '../components/locations/LocationForm';
import LocationTree from '../components/locations/LocationTree';
import LocationItemsModal from '../components/locations/LocationItemsModal';
import { useAppContext } from '../contexts/AppContext';

const { Title } = Typography;
const { Search } = Input;
const { TabPane } = Tabs;

const LocationsPage: React.FC = () => {
  const { state } = useAppContext();
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(false);
  const [formVisible, setFormVisible] = useState(false);
  const [itemsModalVisible, setItemsModalVisible] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | undefined>();
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [parentLocationId, setParentLocationId] = useState<string | undefined>();
  const [filters, setFilters] = useState<LocationFilter>({});
  const [activeTab, setActiveTab] = useState('list');

  // 加载位置数据
  const loadLocations = async () => {
    setLoading(true);
    try {
      const locationsData = await LocationApi.getLocations();
      setLocations(locationsData);
    } catch (error) {
      console.error('Failed to load locations:', error);
      message.error('加载位置数据失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLocations();
  }, []);

  // 过滤后的位置列表
  const filteredLocations = useMemo(() => {
    return locations.filter(location => {
      if (filters.name && !location.name.toLowerCase().includes(filters.name.toLowerCase())) {
        return false;
      }
      if (filters.code && !location.code.toLowerCase().includes(filters.code.toLowerCase())) {
        return false;
      }
      if (filters.level !== undefined && location.level !== filters.level) {
        return false;
      }
      if (filters.isActive !== undefined && location.isActive !== filters.isActive) {
        return false;
      }
      if (filters.parentId && location.parentId !== filters.parentId) {
        return false;
      }
      return true;
    });
  }, [locations, filters]);

  // 处理添加位置
  const handleAdd = (parentId?: string) => {
    setEditingLocation(undefined);
    setParentLocationId(parentId);
    setFormVisible(true);
  };

  // 处理编辑位置
  const handleEdit = (location: Location) => {
    setEditingLocation(location);
    setParentLocationId(undefined);
    setFormVisible(true);
  };

  // 处理删除位置
  const handleDelete = async (location: Location) => {
    // 检查是否有子位置
    const hasChildren = locations.some(loc => loc.parentId === location.id);
    if (hasChildren) {
      message.error('该位置下还有子位置，无法删除');
      return;
    }

    setLoading(true);
    try {
      await LocationApi.deleteLocation(location.id);
      setLocations(prev => prev.filter(loc => loc.id !== location.id));
      message.success('删除成功');
    } catch (error) {
      console.error('Failed to delete location:', error);
      message.error('删除失败');
    } finally {
      setLoading(false);
    }
  };

  // 处理查看位置物品
  const handleViewItems = (location: Location) => {
    setSelectedLocation(location);
    setItemsModalVisible(true);
  };

  // 处理表单提交
  const handleFormSubmit = async (values: CreateLocationRequest | UpdateLocationRequest) => {
    setLoading(true);
    try {
      if (editingLocation) {
        // 编辑
        const updatedLocation = await LocationApi.updateLocation(editingLocation.id, values);
        setLocations(prev => prev.map(location => 
          location.id === editingLocation.id ? updatedLocation : location
        ));
        message.success('编辑成功');
      } else {
        // 添加
        const locationData = {
          ...values,
          parentId: parentLocationId,
        } as CreateLocationRequest;
        const newLocation = await LocationApi.createLocation(locationData);
        setLocations(prev => [...prev, newLocation]);
        message.success('添加成功');
      }
      setFormVisible(false);
    } catch (error) {
      console.error('Failed to save location:', error);
      message.error(editingLocation ? '编辑失败' : '添加失败');
    } finally {
      setLoading(false);
    }
  };

  // 表格列定义
  const columns: ColumnsType<Location> = [
    {
      title: '位置编码',
      dataIndex: 'code',
      key: 'code',
      width: 120,
      sorter: (a, b) => a.code.localeCompare(b.code),
    },
    {
      title: '位置名称',
      dataIndex: 'name',
      key: 'name',
      width: 150,
      ellipsis: true,
    },
    {
      title: '完整路径',
      key: 'fullPath',
      width: 250,
      ellipsis: {
        showTitle: false,
      },
      render: (_, record: Location) => {
        const path = LocationApi.getLocationFullPath(record.id, locations);
        return (
          <Tooltip title={path}>
            {path}
          </Tooltip>
        );
      },
    },
    {
      title: '层级',
      dataIndex: 'level',
      key: 'level',
      width: 100,
      align: 'center',
      filters: Object.entries(LOCATION_LEVEL_NAMES).map(([level, name]) => ({
        text: name,
        value: parseInt(level),
      })),
      onFilter: (value, record) => record.level === value,
      render: (level: number) => (
        <Tag color="blue">
          {LOCATION_LEVEL_NAMES[level as keyof typeof LOCATION_LEVEL_NAMES]}
        </Tag>
      ),
    },
    {
      title: '状态',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 80,
      align: 'center',
      filters: [
        { text: '启用', value: true },
        { text: '禁用', value: false },
      ],
      onFilter: (value, record) => record.isActive === value,
      render: (isActive: boolean) => (
        <Tag color={isActive ? 'green' : 'red'}>
          {isActive ? '启用' : '禁用'}
        </Tag>
      ),
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      width: 200,
      ellipsis: {
        showTitle: false,
      },
      render: (text: string) => (
        <Tooltip title={text}>
          {text || '-'}
        </Tooltip>
      ),
    },
    {
      title: '更新时间',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      width: 120,
      sorter: (a, b) => new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime(),
      render: (date: string) => new Date(date).toLocaleDateString('zh-CN'),
    },
    {
      title: '操作',
      key: 'actions',
      width: 150,
      fixed: 'right',
      render: (_, record: Location) => (
        <Space size="small">
          <Tooltip title="查看物品">
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => handleViewItems(record)}
            />
          </Tooltip>
          {state.user?.role === 'admin' && (
            <>
              <Tooltip title="添加子位置">
                <Button
                  type="text"
                  icon={<PlusOutlined />}
                  onClick={() => handleAdd(record.id)}
                />
              </Tooltip>
              <Tooltip title="编辑">
                <Button
                  type="text"
                  icon={<EditOutlined />}
                  onClick={() => handleEdit(record)}
                />
              </Tooltip>
              <Tooltip title="删除">
                <Popconfirm
                  title="确认删除"
                  description={`确定要删除位置"${record.name}"吗？`}
                  onConfirm={() => handleDelete(record)}
                  okText="确定"
                  cancelText="取消"
                  icon={<ExclamationCircleOutlined style={{ color: 'red' }} />}
                >
                  <Button
                    type="text"
                    danger
                    icon={<DeleteOutlined />}
                  />
                </Popconfirm>
              </Tooltip>
            </>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
        <Col>
          <Title level={2} style={{ margin: 0 }}>库房位置管理</Title>
        </Col>
        <Col>
          <Space>
            <Button
              icon={<ReloadOutlined />}
              onClick={loadLocations}
              loading={loading}
            >
              刷新
            </Button>
            {state.user?.role === 'admin' && (
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => handleAdd()}
              >
                添加位置
              </Button>
            )}
          </Space>
        </Col>
      </Row>

      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        <TabPane
          tab={
            <span>
              <UnorderedListOutlined />
              列表视图
            </span>
          }
          key="list"
        >
          <Card>
            {/* 搜索和过滤区域 */}
            <Row gutter={16} style={{ marginBottom: 16 }}>
              <Col xs={24} sm={12} md={6}>
                <Search
                  placeholder="搜索位置名称"
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
                <Search
                  placeholder="搜索位置编码"
                  allowClear
                  onSearch={(value) => setFilters(prev => ({ ...prev, code: value }))}
                  onChange={(e) => {
                    if (!e.target.value) {
                      setFilters(prev => ({ ...prev, code: undefined }));
                    }
                  }}
                />
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Select
                  placeholder="选择层级"
                  allowClear
                  style={{ width: '100%' }}
                  options={Object.entries(LOCATION_LEVEL_NAMES).map(([level, name]) => ({
                    label: name,
                    value: parseInt(level),
                  }))}
                  onChange={(value) => setFilters(prev => ({ ...prev, level: value }))}
                />
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Select
                  placeholder="状态"
                  allowClear
                  style={{ width: '100%' }}
                  options={[
                    { label: '全部', value: undefined },
                    { label: '启用', value: true },
                    { label: '禁用', value: false },
                  ]}
                  onChange={(value) => setFilters(prev => ({ ...prev, isActive: value }))}
                />
              </Col>
            </Row>

            {/* 统计信息 */}
            <Row gutter={16} style={{ marginBottom: 16 }}>
              <Col span={6}>
                <Card size="small">
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 24, fontWeight: 'bold', color: '#1890ff' }}>
                      {locations.length}
                    </div>
                    <div style={{ color: '#666' }}>总位置数</div>
                  </div>
                </Card>
              </Col>
              <Col span={6}>
                <Card size="small">
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 24, fontWeight: 'bold', color: '#52c41a' }}>
                      {locations.filter(loc => loc.isActive).length}
                    </div>
                    <div style={{ color: '#666' }}>启用位置</div>
                  </div>
                </Card>
              </Col>
              <Col span={6}>
                <Card size="small">
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 24, fontWeight: 'bold', color: '#ff4d4f' }}>
                      {locations.filter(loc => !loc.isActive).length}
                    </div>
                    <div style={{ color: '#666' }}>禁用位置</div>
                  </div>
                </Card>
              </Col>
              <Col span={6}>
                <Card size="small">
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 24, fontWeight: 'bold', color: '#faad14' }}>
                      {new Set(locations.map(loc => loc.level)).size}
                    </div>
                    <div style={{ color: '#666' }}>层级类型</div>
                  </div>
                </Card>
              </Col>
            </Row>

            {/* 位置列表表格 */}
            <Table
              columns={columns}
              dataSource={filteredLocations}
              rowKey="id"
              loading={loading}
              pagination={{
                total: filteredLocations.length,
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
        </TabPane>

        <TabPane
          tab={
            <span>
              <ApartmentOutlined />
              树形视图
            </span>
          }
          key="tree"
        >
          <LocationTree
            locations={locations}
            onAdd={handleAdd}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onViewItems={handleViewItems}
            loading={loading}
            userRole={state.user?.role}
          />
        </TabPane>
      </Tabs>

      {/* 添加/编辑位置表单 */}
      <LocationForm
        visible={formVisible}
        onCancel={() => setFormVisible(false)}
        onSubmit={handleFormSubmit}
        location={editingLocation}
        locations={locations}
        loading={loading}
      />

      {/* 位置物品清单模态框 */}
      <LocationItemsModal
        visible={itemsModalVisible}
        onCancel={() => setItemsModalVisible(false)}
        location={selectedLocation}
        locations={locations}
      />
    </div>
  );
};

export default LocationsPage;