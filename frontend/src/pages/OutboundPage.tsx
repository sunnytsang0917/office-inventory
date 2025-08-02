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
  Alert,
  Tabs,
} from 'antd';
import { MinusCircleOutlined, HistoryOutlined, ReloadOutlined, WarningOutlined, CloudUploadOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { mockItems } from '../data/mockItems';
import { mockLocations } from '../data/mockLocations';
import {
  mockTransactions,
  // getInventoryStatus,
  getItemLocationStock,
  getItemStockDistribution,
  operatorOptions,
  departmentOptions,
  purposeOptions,
} from '../data/mockTransactions';
import { CreateOutboundDto, Transaction, InventoryStatus } from '../types/transaction';
import { Item } from '../types/item';
import { Location } from '../types/location';
import BatchImportModal from '../components/items/BatchImportModal';

const { Title } = Typography;
const { Option } = Select;

const OutboundPage: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [currentStock, setCurrentStock] = useState<number>(0);
  const [itemStockDistribution, setItemStockDistribution] = useState<InventoryStatus[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [stockWarning, setStockWarning] = useState<string>('');
  const [batchModalVisible, setBatchModalVisible] = useState(false);

  // 初始化数据
  useEffect(() => {
    loadRecentTransactions();
  }, []);

  // 加载最近的出库记录
  const loadRecentTransactions = () => {
    const outboundTransactions = mockTransactions
      .filter((t: Transaction) => t.type === 'outbound')
      .sort((a: Transaction, b: Transaction) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 10);
    setRecentTransactions(outboundTransactions);
  };

  // 物品选择变化
  const handleItemChange = (itemId: string) => {
    const item = mockItems.find(i => i.id === itemId);
    setSelectedItem(item || null);
    
    if (item) {
      // 获取该物品在所有位置的库存分布
      const distribution = getItemStockDistribution(itemId);
      setItemStockDistribution(distribution);
      
      // 如果已选择位置，更新当前库存
      if (selectedLocation) {
        const stock = getItemLocationStock(itemId, selectedLocation.id);
        setCurrentStock(stock);
        checkStockWarning(stock, item.minStock);
      }
    } else {
      setItemStockDistribution([]);
      setCurrentStock(0);
      setStockWarning('');
    }
  };

  // 位置选择变化
  const handleLocationChange = (locationId: string) => {
    const location = mockLocations.find(l => l.id === locationId);
    setSelectedLocation(location || null);
    
    if (selectedItem && location) {
      const stock = getItemLocationStock(selectedItem.id, locationId);
      setCurrentStock(stock);
      checkStockWarning(stock, selectedItem.minStock);
    }
  };

  // 检查库存警告
  const checkStockWarning = (currentStock: number, minStock: number) => {
    if (currentStock === 0) {
      setStockWarning('该位置库存为0，无法出库');
    } else if (currentStock <= minStock) {
      setStockWarning('当前库存已达到最低库存警戒线');
    } else {
      setStockWarning('');
    }
  };

  // 数量变化检查
  const handleQuantityChange = (quantity: number | null) => {
    if (selectedItem && selectedLocation && quantity) {
      if (quantity > currentStock) {
        message.warning(`出库数量不能超过当前库存 ${currentStock}`);
      }
    }
  };

  // 提交出库操作
  const handleSubmit = async (values: any) => {
    // 检查库存是否充足
    if (values.quantity > currentStock) {
      message.error(`出库数量 ${values.quantity} 超过当前库存 ${currentStock}，无法出库`);
      return;
    }

    if (currentStock === 0) {
      message.error('该位置库存为0，无法出库');
      return;
    }

    setLoading(true);
    
    try {
      const outboundData: CreateOutboundDto = {
        itemId: values.itemId,
        locationId: values.locationId,
        quantity: values.quantity,
        recipient: values.recipient,
        purpose: values.purpose,
        operator: values.operator,
        date: values.date ? values.date.toISOString() : new Date().toISOString(),
      };

      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 创建新的交易记录
      const newTransaction: Transaction = {
        id: Date.now().toString(),
        itemId: outboundData.itemId,
        itemName: selectedItem?.name || '',
        locationId: outboundData.locationId,
        locationName: selectedLocation?.name || '',
        locationCode: selectedLocation?.code || '',
        type: 'outbound',
        quantity: outboundData.quantity,
        date: outboundData.date || new Date().toISOString(),
        operator: outboundData.operator,
        recipient: outboundData.recipient,
        purpose: outboundData.purpose,
        createdAt: new Date().toISOString(),
      };

      // 添加到模拟数据
      mockTransactions.unshift(newTransaction);
      
      message.success('出库操作成功！');
      form.resetFields();
      
      // 更新库存显示
      const newStock = currentStock - values.quantity;
      setCurrentStock(newStock);
      checkStockWarning(newStock, selectedItem?.minStock || 0);
      
      // 刷新数据
      loadRecentTransactions();
      if (selectedItem) {
        const distribution = getItemStockDistribution(selectedItem.id);
        setItemStockDistribution(distribution);
      }
      
    } catch (error) {
      message.error('出库操作失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  // 获取活跃的货架位置
  const getShelfLocations = () => {
    return mockLocations.filter(loc => loc.level === 3 && loc.isActive);
  };

  // 获取有库存的位置
  const getAvailableLocations = () => {
    if (!selectedItem) return getShelfLocations();
    
    const availableLocationIds = itemStockDistribution
      .filter(dist => dist.currentStock > 0)
      .map(dist => dist.locationId);
    
    return getShelfLocations().filter(loc => availableLocationIds.includes(loc.id));
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
          <Tag color="orange">{record.locationCode}</Tag>
          {text}
        </span>
      ),
    },
    {
      title: '出库数量',
      dataIndex: 'quantity',
      key: 'quantity',
      render: (quantity: number) => (
        <span style={{ color: '#ff4d4f', fontWeight: 'bold' }}>
          -{quantity}
        </span>
      ),
    },
    {
      title: '领用人',
      dataIndex: 'recipient',
      key: 'recipient',
    },
    {
      title: '用途',
      dataIndex: 'purpose',
      key: 'purpose',
    },
    {
      title: '操作人',
      dataIndex: 'operator',
      key: 'operator',
    },
    {
      title: '出库时间',
      dataIndex: 'date',
      key: 'date',
      render: (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm'),
    },
  ];

  return (
    <div>
      <Title level={2}>出库管理</Title>
      
      <Tabs 
        defaultActiveKey="single"
        items={[
          {
            key: 'single',
            label: '单个出库',
            children: (
          <Row gutter={[16, 16]}>
            {/* 出库操作表单 */}
            <Col xs={24} lg={14}>
              <Card 
                title={
                  <Space>
                    <MinusCircleOutlined />
                    出库操作
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
                        label="出库位置"
                        rules={[{ required: true, message: '请选择出库位置' }]}
                      >
                        <Select
                          placeholder="请选择出库位置"
                          showSearch
                          onChange={handleLocationChange}
                          disabled={!selectedItem}
                        >
                          {getAvailableLocations().map(location => {
                            const stock = selectedItem ? getItemLocationStock(selectedItem.id, location.id) : 0;
                            return (
                              <Option key={location.id} value={location.id} disabled={stock === 0}>
                                <Tag color="orange">{location.code}</Tag>
                                {location.name}
                                {selectedItem && (
                                  <span style={{ color: '#666', marginLeft: 8 }}>
                                    (库存: {stock})
                                  </span>
                                )}
                              </Option>
                            );
                          })}
                        </Select>
                      </Form.Item>
                    </Col>
                  </Row>

                  {/* 库存警告 */}
                  {stockWarning && (
                    <Alert
                      message={stockWarning}
                      type={currentStock === 0 ? 'error' : 'warning'}
                      icon={<WarningOutlined />}
                      style={{ marginBottom: 16 }}
                      showIcon
                    />
                  )}

                  {/* 当前库存显示 */}
                  {selectedItem && selectedLocation && (
                    <Card size="small" style={{ marginBottom: 16, backgroundColor: '#fff2e8' }}>
                      <Row gutter={16}>
                        <Col span={8}>
                          <Statistic
                            title="当前库存"
                            value={currentStock}
                            suffix={selectedItem.unit}
                            valueStyle={{ color: currentStock <= selectedItem.minStock ? '#cf1322' : '#fa8c16' }}
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
                            value={currentStock === 0 ? '无库存' : currentStock <= selectedItem.minStock ? '低库存' : '正常'}
                            valueStyle={{ 
                              color: currentStock === 0 ? '#cf1322' : currentStock <= selectedItem.minStock ? '#fa541c' : '#fa8c16',
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
                        label="出库数量"
                        rules={[
                          { required: true, message: '请输入出库数量' },
                          { type: 'number', min: 1, message: '数量必须大于0' },
                          {
                            validator: (_, value) => {
                              if (value && currentStock > 0 && value > currentStock) {
                                return Promise.reject(new Error(`数量不能超过当前库存 ${currentStock}`));
                              }
                              return Promise.resolve();
                            },
                          },
                        ]}
                      >
                        <InputNumber
                          placeholder="请输入数量"
                          style={{ width: '100%' }}
                          min={1}
                          max={currentStock || undefined}
                          precision={0}
                          onChange={handleQuantityChange}
                        />
                      </Form.Item>
                    </Col>
                    
                    <Col xs={24} sm={8}>
                      <Form.Item
                        name="recipient"
                        label="领用人/部门"
                        rules={[{ required: true, message: '请输入领用人或部门' }]}
                      >
                        <Select
                          placeholder="请选择或输入领用人"
                          showSearch
                        >
                          {departmentOptions.map((dept: string) => (
                            <Option key={dept} value={dept}>
                              {dept}
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
                    name="purpose"
                    label="用途说明"
                  >
                    <Select
                      placeholder="请选择或输入用途"
                      showSearch
                      allowClear
                    >
                      {purposeOptions.map((purpose: string) => (
                        <Option key={purpose} value={purpose}>
                          {purpose}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>

                  <Form.Item
                    name="date"
                    label="出库时间"
                    rules={[{ required: true, message: '请选择出库时间' }]}
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
                      disabled={currentStock === 0}
                    >
                      确认出库
                    </Button>
                  </Form.Item>
                </Form>
              </Card>
            </Col>

            {/* 物品库存分布 */}
            <Col xs={24} lg={10}>
              <Card 
                title={
                  <Space>
                    <ReloadOutlined />
                    {selectedItem ? `${selectedItem.name} 库存分布` : '选择物品查看库存分布'}
                  </Space>
                }
                size="small"
              >
                <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                  {selectedItem ? (
                    itemStockDistribution.length > 0 ? (
                      itemStockDistribution.map(inventory => (
                        <div key={`${inventory.itemId}-${inventory.locationId}`} style={{ marginBottom: 8 }}>
                          <Row justify="space-between" align="middle">
                            <Col span={14}>
                              <div style={{ fontSize: '14px', fontWeight: 'bold' }}>
                                <Tag color="orange">{inventory.locationCode}</Tag>
                                {inventory.locationName}
                              </div>
                            </Col>
                            <Col span={10} style={{ textAlign: 'right' }}>
                              <div style={{ 
                                fontSize: '16px', 
                                fontWeight: 'bold',
                                color: inventory.currentStock === 0 ? '#cf1322' : inventory.isLowStock ? '#fa541c' : '#fa8c16'
                              }}>
                                {inventory.currentStock} {selectedItem.unit}
                              </div>
                            </Col>
                          </Row>
                          {inventory.currentStock === 0 && (
                            <Tag color="red" style={{ marginTop: 4 }}>
                              无库存
                            </Tag>
                          )}
                          {inventory.isLowStock && inventory.currentStock > 0 && (
                            <Tag color="orange" style={{ marginTop: 4 }}>
                              低库存
                            </Tag>
                          )}
                          <Divider style={{ margin: '8px 0' }} />
                        </div>
                      ))
                    ) : (
                      <div style={{ textAlign: 'center', color: '#999', padding: '20px' }}>
                        该物品暂无库存记录
                      </div>
                    )
                  ) : (
                    <div style={{ textAlign: 'center', color: '#999', padding: '20px' }}>
                      请先选择物品
                    </div>
                  )}
                </div>
              </Card>
            </Col>
          </Row>
            ),
          },
          {
            key: 'batch',
            label: '批量出库',
            children: (
          <Card 
            title={
              <Space>
                <CloudUploadOutlined />
                批量出库操作
              </Space>
            }
          >
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <CloudUploadOutlined style={{ fontSize: '48px', color: '#fa8c16', marginBottom: '16px' }} />
              <div style={{ fontSize: '18px', marginBottom: '8px' }}>批量出库操作</div>
              <div style={{ color: '#666', marginBottom: '24px' }}>
                支持Excel文件上传，可同时处理多个物品的出库操作，包含库存验证
              </div>
              <Button
                type="primary"
                size="large"
                icon={<CloudUploadOutlined />}
                onClick={() => setBatchModalVisible(true)}
                style={{ backgroundColor: '#fa8c16', borderColor: '#fa8c16' }}
              >
                开始批量出库
              </Button>
            </div>
          </Card>
            ),
          },
        ]}
      />

      {/* 最近出库记录 */}
      <Card 
        title={
          <Space>
            <HistoryOutlined />
            最近出库记录
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
          loadRecentTransactions();
          if (selectedItem) {
            const distribution = getItemStockDistribution(selectedItem.id);
            setItemStockDistribution(distribution);
          }
        }}
        type="outbound"
      />
    </div>
  );
};

export default OutboundPage;