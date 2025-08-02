import React, { useState, useMemo } from 'react';
import {
  Typography,
  Card,
  Row,
  Col,
  Table,
  Tag,
  Button,
  Space,
  Statistic,
  DatePicker,
  Select,
  Timeline,
  Progress,
  Tooltip,
  Empty,
} from 'antd';
import {
  ArrowLeftOutlined,
  BarChartOutlined,
  LineChartOutlined,
  HistoryOutlined,
  WarningOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { RangePickerProps } from 'antd/es/date-picker';
import dayjs, { Dayjs } from 'dayjs';
import { Transaction } from '../../types/transaction';
import { getItemInventoryDetail } from '../../data/mockInventory';
import { mockTransactions } from '../../data/mockTransactions';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

interface InventoryDetailPageProps {
  itemId: string;
  onBack: () => void;
}

const InventoryDetailPage: React.FC<InventoryDetailPageProps> = ({ itemId, onBack }) => {
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs] | null>(null);
  const [selectedLocationId, setSelectedLocationId] = useState<string | undefined>();

  // 处理日期范围变化
  const handleDateRangeChange: RangePickerProps['onChange'] = (dates) => {
    if (dates && dates[0] && dates[1]) {
      setDateRange([dates[0], dates[1]]);
    } else {
      setDateRange(null);
    }
  };

  // 获取物品详细信息
  const itemDetail = useMemo(() => {
    return getItemInventoryDetail(itemId);
  }, [itemId]);

  // 获取物品的交易历史
  const itemTransactions = useMemo(() => {
    let transactions = mockTransactions.filter(t => t.itemId === itemId);
    
    // 按日期范围过滤
    if (dateRange) {
      const [start, end] = dateRange;
      transactions = transactions.filter(t => {
        const transactionDate = dayjs(t.date);
        return transactionDate.isAfter(start.startOf('day')) && transactionDate.isBefore(end.endOf('day'));
      });
    }
    
    // 按位置过滤
    if (selectedLocationId) {
      transactions = transactions.filter(t => t.locationId === selectedLocationId);
    }
    
    return transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [itemId, dateRange, selectedLocationId]);

  // 计算库存变化趋势数据
  const stockTrendData = useMemo(() => {
    if (!itemDetail) return [];
    
    const allTransactions = mockTransactions
      .filter(t => t.itemId === itemId)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    const trendData: { date: string; stock: number; locationId: string; locationName: string }[] = [];
    const locationStocks = new Map<string, number>();
    
    // 初始化各位置库存为0
    itemDetail.locations.forEach(loc => {
      locationStocks.set(loc.locationId, 0);
    });
    
    allTransactions.forEach(transaction => {
      const currentStock = locationStocks.get(transaction.locationId) || 0;
      const newStock = transaction.type === 'inbound' 
        ? currentStock + transaction.quantity 
        : Math.max(0, currentStock - transaction.quantity);
      
      locationStocks.set(transaction.locationId, newStock);
      
      trendData.push({
        date: transaction.date,
        stock: newStock,
        locationId: transaction.locationId,
        locationName: transaction.locationName,
      });
    });
    
    return trendData;
  }, [itemId, itemDetail]);

  if (!itemDetail) {
    return (
      <div>
        <Button icon={<ArrowLeftOutlined />} onClick={onBack} style={{ marginBottom: 16 }}>
          返回库存总览
        </Button>
        <Empty description="未找到物品信息" />
      </div>
    );
  }

  // 位置库存表格列定义
  const locationColumns: ColumnsType<typeof itemDetail.locations[0]> = [
    {
      title: '位置编码',
      dataIndex: 'locationCode',
      key: 'locationCode',
      width: 120,
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
      width: 120,
      render: (stock: number) => (
        <Space>
          <span style={{ fontWeight: 'bold' }}>{stock}</span>
          <span style={{ color: '#666' }}>{itemDetail.itemUnit}</span>
        </Space>
      ),
    },
    {
      title: '库存状态',
      key: 'status',
      width: 100,
      render: (_, record) => {
        const percentage = (record.currentStock / itemDetail.minStock) * 100;
        return (
          <Space direction="vertical" size="small">
            {record.isLowStock ? (
              <Tag color="red" icon={<WarningOutlined />}>库存不足</Tag>
            ) : (
              <Tag color="green" icon={<CheckCircleOutlined />}>正常</Tag>
            )}
            <Progress
              percent={Math.min(percentage, 100)}
              size="small"
              status={record.isLowStock ? 'exception' : 'success'}
              showInfo={false}
            />
          </Space>
        );
      },
    },
    {
      title: '库存占比',
      key: 'percentage',
      width: 100,
      render: (_, record) => {
        const percentage = itemDetail.totalStock > 0 
          ? ((record.currentStock / itemDetail.totalStock) * 100).toFixed(1)
          : '0.0';
        return <span>{percentage}%</span>;
      },
    },
  ];

  // 交易历史表格列定义
  const transactionColumns: ColumnsType<Transaction> = [
    {
      title: '日期',
      dataIndex: 'date',
      key: 'date',
      width: 120,
      render: (date: string) => dayjs(date).format('MM-DD HH:mm'),
      sorter: (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 80,
      render: (type: string) => (
        <Tag color={type === 'inbound' ? 'green' : 'red'}>
          {type === 'inbound' ? '入库' : '出库'}
        </Tag>
      ),
    },
    {
      title: '位置',
      key: 'location',
      width: 120,
      render: (_, record) => (
        <Space direction="vertical" size="small">
          <Tag color="blue">{record.locationCode}</Tag>
          <Text style={{ fontSize: '12px' }}>{record.locationName}</Text>
        </Space>
      ),
    },
    {
      title: '数量',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 80,
      render: (quantity: number, record) => (
        <span style={{ 
          color: record.type === 'inbound' ? '#52c41a' : '#ff4d4f',
          fontWeight: 'bold'
        }}>
          {record.type === 'inbound' ? '+' : '-'}{quantity}
        </span>
      ),
    },
    {
      title: '操作人',
      dataIndex: 'operator',
      key: 'operator',
      width: 80,
    },
    {
      title: '相关方',
      key: 'party',
      width: 100,
      render: (_, record) => (
        record.type === 'inbound' ? record.supplier : record.recipient
      ),
    },
    {
      title: '备注',
      key: 'note',
      render: (_, record) => (
        record.type === 'inbound' ? '入库' : record.purpose
      ),
    },
  ];

  return (
    <div>
      {/* 页面头部 */}
      <div style={{ marginBottom: 24 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={onBack} style={{ marginBottom: 16 }}>
          返回库存总览
        </Button>
        <Title level={2}>{itemDetail.itemName} - 库存详情</Title>
        <Text type="secondary">类别: {itemDetail.itemCategory} | 单位: {itemDetail.itemUnit}</Text>
      </div>

      {/* 库存汇总统计 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="总库存"
              value={itemDetail.totalStock}
              suffix={itemDetail.itemUnit}
              prefix={<BarChartOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="存储位置"
              value={itemDetail.locations.length}
              prefix={<LineChartOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="最低库存"
              value={itemDetail.minStock}
              suffix={itemDetail.itemUnit}
              prefix={<WarningOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="低库存位置"
              value={itemDetail.totalLowStockLocations}
              valueStyle={{ 
                color: itemDetail.totalLowStockLocations > 0 ? '#cf1322' : '#3f8600' 
              }}
              prefix={<WarningOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* 位置库存分布 */}
      <Card title="位置库存分布" style={{ marginBottom: 24 }}>
        <Table
          columns={locationColumns}
          dataSource={itemDetail.locations}
          rowKey="locationId"
          pagination={false}
          size="small"
        />
      </Card>

      {/* 库存变化趋势 */}
      <Card 
        title="库存变化趋势" 
        extra={
          <Tooltip title="简化的趋势展示，实际项目中可集成图表库">
            <HistoryOutlined />
          </Tooltip>
        }
        style={{ marginBottom: 24 }}
      >
        {stockTrendData.length > 0 ? (
          <Timeline mode="left">
            {stockTrendData.slice(-10).reverse().map((trend, index) => (
              <Timeline.Item
                key={index}
                color={trend.stock > itemDetail.minStock ? 'green' : 'red'}
                label={dayjs(trend.date).format('MM-DD HH:mm')}
              >
                <Space direction="vertical" size="small">
                  <Text strong>{trend.locationName}</Text>
                  <Text>库存: {trend.stock} {itemDetail.itemUnit}</Text>
                </Space>
              </Timeline.Item>
            ))}
          </Timeline>
        ) : (
          <Empty description="暂无库存变化记录" />
        )}
      </Card>

      {/* 出入库历史记录 */}
      <Card 
        title="出入库历史记录"
        extra={
          <Space>
            <RangePicker
              value={dateRange}
              onChange={handleDateRangeChange}
              placeholder={['开始日期', '结束日期']}
              size="small"
            />
            <Select
              placeholder="选择位置"
              value={selectedLocationId}
              onChange={setSelectedLocationId}
              allowClear
              size="small"
              style={{ width: 150 }}
            >
              {itemDetail.locations.map(location => (
                <Option key={location.locationId} value={location.locationId}>
                  {location.locationCode}
                </Option>
              ))}
            </Select>
          </Space>
        }
      >
        <Table
          columns={transactionColumns}
          dataSource={itemTransactions}
          rowKey="id"
          pagination={{
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`,
          }}
          size="small"
        />
      </Card>
    </div>
  );
};

export default InventoryDetailPage;