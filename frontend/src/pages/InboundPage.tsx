import React, { useState, useEffect } from 'react';
import {
  Typography,
  Card,
  Form,
  Select,
  InputNumber,
  Button,
  DatePicker,
  Table,
  Space,
  message,
  Row,
  Col,
  Statistic,
  Tag,
  Divider,
  Tabs,
} from 'antd';
import { PlusOutlined, HistoryOutlined, ReloadOutlined, CloudUploadOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { mockItems } from '../data/mockItems';
import { mockLocations } from '../data/mockLocations';
import {
  mockTransactions,
  getInventoryStatus,
  getItemLocationStock,
  operatorOptions,
  supplierOptions,
} from '../data/mockTransactions';
import { CreateInboundDto, Transaction, InventoryStatus } from '../types/transaction';
import { Item } from '../types/item';
import { Location } from '../types/location';
import BatchImportModal from '../components/items/BatchImportModal';

const { Title } = Typography;
const { Option } = Select;

const InboundPage: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [currentStock, setCurrentStock] = useState<number>(0);
  const [inventoryStatus, setInventoryStatus] = useState<InventoryStatus[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [batchModalVisible, setBatchModalVisible] = useState(false);

  // 初始化数据
  useEffect(() => {
    loadInventoryStatus();
    loadRecentTransactions();
  }, []);

  // 加载库存状态
  const loadInventoryStatus = () => {
    const status = getInventoryStatus();
    setInventoryStatus(status);
  };

  // 加载最近的入库记录
  const loadRecentTransactions = () => {
    const inboundTransactions = mockTransactions
      .filter((t: Transaction) => t.type === 'inbound')
      .sort((a: Transaction, b: Transaction) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 10);
    setRecentTransactions(inboundTransactions);
  };

  // 物品选择变化
  const handleItemChange = (itemId: string) => {
    const item = mockItems.find(i => i.id === itemId);
    setSelectedItem(item || null);
    
    if (item && selectedLocation) {
      const stock = getItemLocationStock(itemId, selectedLocation.id);
      setCurrentStock(stock);
    }
  };

  // 位置选择变化
  const handleLocationChange = (locationId: string) => {
    const location = mockLocations.find(l => l.id === locationId);
    setSelectedLocation(location || null);
    
    if (selectedItem && location) {
      const stock = getItemLocationStock(selectedItem.id, locationId);
      setCurrentStock(stock);
    }
  };

  // 提交入库操作
  const handleSubmit = async (values: any) => {
    setLoading(true);
    
    try {
      const inboundData: CreateInboundDto = {
        itemId: values.itemId,
        locationId: values.locationId,
        quantity: values.quantity,
        supplier: values.supplier,
        operator: values.operator,
        date: values.date ? values.date.toISOString() : new Date().toISOString(),
      };

      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 创建新的交易记录
      const newTransaction: Transaction = {
        id: Date.now().toString(),
        itemId: inboundData.itemId,
        itemName: selectedItem?.name || '',
        locationId: inboundData.locationId,
        locationName: selectedLocation?.name || '',
        locationCode: selectedLocation?.code || '',
        type: 'inbound',
        quantity: inboundData.quantity,
        date: inboundData.date || new Date().toISOString(),
        operator: inboundData.operator,
        supplier: inboundData.supplier,
        createdAt: new Date().toISOString(),
      };

      // 添加到模拟数据
      mockTransactions.unshift(newTransaction);
      
      message.success('入库操作成功！');
      form.resetFields();
      setSelectedItem(null);
      setSelectedLocation(null);
      setCurrentStock(0);
      
      // 刷新数据
      loadInventoryStatus();
      loadRecentTransactions();
      
    } catch (error) {
      message.error('入库操作失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  // 获取活跃的货架位置
  const getShelfLocations = () => {
    return mockLocations.filter(loc => loc.level === 3 && loc.isActive);
  };

  // 表格列定义
  const columns = [
    {
      title: '物品名称',
      dataIndex: 'itemName',
      key: 'itemName',
    },
    {
      title: '库房位置',
      dataIndex: 'locationName',
      key: 'locationName',
      render: (text: string, record: Transaction) => (
        <span>
          <Tag color="blue">{record.locationCode}</Tag>
          {text}
        </span>
      ),
    },
    {
      title: '入库数量',
      dataIndex: 'quantity',
      key: 'quantity',
      render: (quantity: number) => (
        <span style={{ color: '#52c41a', fontWeight: 'bold' }}>
          +{quantity}
        </span>
      ),
    },
    {
      title: '供应商',
      dataIndex: 'supplier',
      key: 'supplier',
    },
    {
      title: '操作人',
      dataIndex: 'operator',
      key: 'operator',
    },
    {
      title: '入库时间',
      dataIndex: 'date',
      key: 'date',
      render: (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm'),
    },
  ];

  return (
    <div>
      <Title level={2}>入库管理</Title>
      
      <Tabs 
        defaultActiveKey="single"
        items={[
          {
            key: 'single',
            label: '单个入库',
            children: (
              <Row gutter={[16, 16]}>
                {/* 入库操作表单 */}
                <Col xs={24} lg={14}>
                  <Card 
                    title={
                      <Space>
                        <PlusOutlined />
                        入库操作
                      </Space>
                    }
                  >
                    <Form
                      form={form}
                      layout="vertical"
                      onFinish={handleSubmit}
                      initialValues={{
                        date: dayjs(),
                      }}
                    >
                      <Row gutter={16}>
                        <Col xs={24} sm={12}>
                          <Form.Item
                            name="itemId"
                            label="选择物品"
                            rules={[{ required: true, message: '请选择物品' }]}
                          >
                            <Select
                              placeholder="请选择物品"
                              showSearch
                              onChange={handleItemChange}
                            >
                              {mockItems.map(item => (
                                <Option key={item.id} value={item.id}>
                                  {item.name} ({item.specification})
                                </Option>
                              ))}
                            </Select>
                          </Form.Item>
                        </Col>
                        
                        <Col xs={24} sm={12}>
                          <Form.Item
                            name="locationId"
                            label="存储位置"
                            rules={[{ required: true, message: '请选择存储位置' }]}
                          >
                            <Select
                              placeholder="请选择存储位置"
                              showSearch
                              onChange={handleLocationChange}
                            >
                              {getShelfLocations().map(location => (
                                <Option key={location.id} value={location.id}>
                                  <Tag color="blue">{location.code}</Tag>
                                  {location.name}
                                </Option>
                              ))}
                            </Select>
                          </Form.Item>
                        </Col>
                      </Row>

                      {/* 当前库存显示 */}
                      {selectedItem && selectedLocation && (
                        <Card size="small" style={{ marginBottom: 16, backgroundColor: '#f6ffed' }}>
                          <Row gutter={16}>
                            <Col span={8}>
                              <Statistic
                                title="当前库存"
                                value={currentStock}
                                suffix={selectedItem.unit}
                                valueStyle={{ color: currentStock <= selectedItem.minStock ? '#cf1322' : '#3f8600' }}
                              />
                            </Col>
                            <Col span={8}>
                              <Statistic
                                title="最低库存"
                                value={selectedItem.minStock}
                                suffix={selectedItem.unit}
                              />
                            </Col>
                            <Col span={8}>
                              <Statistic
                                title="库存状态"
                                value={currentStock <= selectedItem.minStock ? '低库存' : '正常'}
                                valueStyle={{ 
                                  color: currentStock <= selectedItem.minStock ? '#cf1322' : '#3f8600',
                                  fontSize: '16px'
                                }}
                              />
                            </Col>
                          </Row>
                        </Card>
                      )}

                      <Row gutter={16}>
                        <Col xs={24} sm={8}>
                          <Form.Item
                            name="quantity"
                            label="入库数量"
                            rules={[
                              { required: true, message: '请输入入库数量' },
                              { type: 'number', min: 1, message: '数量必须大于0' },
                            ]}
                          >
                            <InputNumber
                              placeholder="请输入数量"
                              style={{ width: '100%' }}
                              min={1}
                              precision={0}
                            />
                          </Form.Item>
                        </Col>
                        
                        <Col xs={24} sm={8}>
                          <Form.Item
                            name="supplier"
                            label="供应商"
                          >
                            <Select
                              placeholder="请选择或输入供应商"
                              showSearch
                              allowClear
                            >
                              {supplierOptions.map((supplier: string) => (
                                <Option key={supplier} value={supplier}>
                                  {supplier}
                                </Option>
                              ))}
                            </Select>
                          </Form.Item>
                        </Col>
                        
                        <Col xs={24} sm={8}>
                          <Form.Item
                            name="operator"
                            label="操作人"
                            rules={[{ required: true, message: '请选择操作人' }]}
                          >
                            <Select placeholder="请选择操作人">
                              {operatorOptions.map((operator: string) => (
                                <Option key={operator} value={operator}>
                                  {operator}
                                </Option>
                              ))}
                            </Select>
                          </Form.Item>
                        </Col>
                      </Row>

                      <Form.Item
                        name="date"
                        label="入库时间"
                        rules={[{ required: true, message: '请选择入库时间' }]}
                      >
                        <DatePicker
                          showTime
                          style={{ width: '100%' }}
                          format="YYYY-MM-DD HH:mm"
                        />
                      </Form.Item>

                      <Form.Item>
                        <Button
                          type="primary"
                          htmlType="submit"
                          loading={loading}
                          size="large"
                          block
                        >
                          确认入库
                        </Button>
                      </Form.Item>
                    </Form>
                  </Card>
                </Col>

                {/* 库存状态面板 */}
                <Col xs={24} lg={10}>
                  <Card 
                    title={
                      <Space>
                        <ReloadOutlined />
                        实时库存状态
                        <Button 
                          type="link" 
                          size="small" 
                          onClick={loadInventoryStatus}
                          icon={<ReloadOutlined />}
                        >
                          刷新
                        </Button>
                      </Space>
                    }
                    size="small"
                  >
                    <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                      {inventoryStatus.slice(0, 10).map(inventory => (
                        <div key={`${inventory.itemId}-${inventory.locationId}`} style={{ marginBottom: 8 }}>
                          <Row justify="space-between" align="middle">
                            <Col span={14}>
                              <div style={{ fontSize: '14px', fontWeight: 'bold' }}>
                                {inventory.itemName}
                              </div>
                              <div style={{ fontSize: '12px', color: '#666' }}>
                                <Tag color="blue">{inventory.locationCode}</Tag>
                                {inventory.locationName}
                              </div>
                            </Col>
                            <Col span={10} style={{ textAlign: 'right' }}>
                              <div style={{ 
                                fontSize: '16px', 
                                fontWeight: 'bold',
                                color: inventory.isLowStock ? '#cf1322' : '#3f8600'
                              }}>
                                {inventory.currentStock}
                              </div>
                              <div style={{ fontSize: '12px', color: '#666' }}>
                                最低: {inventory.minStock}
                              </div>
                            </Col>
                          </Row>
                          {inventory.isLowStock && (
                            <Tag color="red" style={{ marginTop: 4 }}>
                              低库存警告
                            </Tag>
                          )}
                          <Divider style={{ margin: '8px 0' }} />
                        </div>
                      ))}
                    </div>
                  </Card>
                </Col>
              </Row>
            ),
          },
          {
            key: 'batch',
            label: '批量入库',
            children: (
              <Card 
                title={
                  <Space>
                    <CloudUploadOutlined />
                    批量入库操作
                  </Space>
                }
              >
                <div style={{ textAlign: 'center', padding: '40px 0' }}>
                  <CloudUploadOutlined style={{ fontSize: '48px', color: '#1890ff', marginBottom: '16px' }} />
                  <div style={{ fontSize: '18px', marginBottom: '8px' }}>批量入库操作</div>
                  <div style={{ color: '#666', marginBottom: '24px' }}>
                    支持Excel文件上传，可同时处理多个物品的入库操作
                  </div>
                  <Button
                    type="primary"
                    size="large"
                    icon={<CloudUploadOutlined />}
                    onClick={() => setBatchModalVisible(true)}
                  >
                    开始批量入库
                  </Button>
                </div>
              </Card>
            ),
          },
        ]}
      />

      {/* 最近入库记录 */}
      <Card 
        title={
          <Space>
            <HistoryOutlined />
            最近入库记录
          </Space>
        }
        style={{ marginTop: 16 }}
      >
        <Table
          columns={columns}
          dataSource={recentTransactions}
          rowKey="id"
          pagination={{
            pageSize: 5,
            showSizeChanger: false,
            showQuickJumper: true,
          }}
          size="small"
        />
      </Card>

      {/* 批量导入模态框 */}
      <BatchImportModal
        visible={batchModalVisible}
        onCancel={() => setBatchModalVisible(false)}
        onSuccess={() => {
          setBatchModalVisible(false);
          loadInventoryStatus();
          loadRecentTransactions();
        }}
        type="inbound"
      />
    </div>
  );
};

export default InboundPage;