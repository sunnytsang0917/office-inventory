import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Typography, Space, message } from 'antd';
import { 
  InboxOutlined, 
  ShoppingCartOutlined, 
  BarChartOutlined,
  ExclamationCircleOutlined 
} from '@ant-design/icons';
import { InventoryApi } from '../services/inventoryApi';
import { TransactionApi } from '../services/transactionApi';

const { Title, Paragraph } = Typography;

interface HomeStats {
  totalItems: number;
  lowStockItems: number;
  todayInbound: number;
  todayOutbound: number;
}

const HomePage: React.FC = () => {
  const [stats, setStats] = useState<HomeStats>({
    totalItems: 0,
    lowStockItems: 0,
    todayInbound: 0,
    todayOutbound: 0,
  });
  const [loading, setLoading] = useState(true);

  // 加载统计数据
  const loadStats = async () => {
    try {
      setLoading(true);
      
      // 获取库存概览
      const inventoryOverview = await InventoryApi.getInventoryOverview();
      
      // 获取今日交易统计
      const today = new Date().toISOString().split('T')[0];
      const todayStats = await TransactionApi.getTransactionStatistics(today, today);
      
      setStats({
        totalItems: inventoryOverview.totalItems || 0,
        lowStockItems: inventoryOverview.lowStockItems || 0,
        todayInbound: todayStats.totalInbound || 0,
        todayOutbound: todayStats.totalOutbound || 0,
      });
    } catch (error) {
      console.error('Failed to load stats:', error);
      message.error('加载统计数据失败，使用模拟数据');
      // 使用模拟数据作为后备
      setStats({
        totalItems: 156,
        lowStockItems: 8,
        todayInbound: 12,
        todayOutbound: 25,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  return (
    <div>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <div>
          <Title level={2}>欢迎使用办公室库存管理系统</Title>
          <Paragraph type="secondary">
            实时跟踪办公用品的进出情况，高效管理库存状态
          </Paragraph>
        </div>

        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} lg={6}>
            <Card loading={loading}>
              <Statistic
                title="物品总数"
                value={stats.totalItems}
                prefix={<InboxOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          
          <Col xs={24} sm={12} lg={6}>
            <Card loading={loading}>
              <Statistic
                title="低库存预警"
                value={stats.lowStockItems}
                prefix={<ExclamationCircleOutlined />}
                valueStyle={{ color: '#ff4d4f' }}
              />
            </Card>
          </Col>
          
          <Col xs={24} sm={12} lg={6}>
            <Card loading={loading}>
              <Statistic
                title="今日入库"
                value={stats.todayInbound}
                prefix={<ShoppingCartOutlined />}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          
          <Col xs={24} sm={12} lg={6}>
            <Card loading={loading}>
              <Statistic
                title="今日出库"
                value={stats.todayOutbound}
                prefix={<BarChartOutlined />}
                valueStyle={{ color: '#faad14' }}
              />
            </Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]}>
          <Col xs={24} lg={12}>
            <Card title="快速操作" size="small">
              <Space direction="vertical" style={{ width: '100%' }}>
                <a href="/items">管理物品信息</a>
                <a href="/transactions/inbound">记录入库操作</a>
                <a href="/transactions/outbound">记录出库操作</a>
                <a href="/inventory">查看库存状态</a>
              </Space>
            </Card>
          </Col>
          
          <Col xs={24} lg={12}>
            <Card title="系统公告" size="small">
              <Space direction="vertical" style={{ width: '100%' }}>
                <Paragraph>
                  • 系统已支持Excel批量导入功能
                </Paragraph>
                <Paragraph>
                  • 新增低库存自动预警功能
                </Paragraph>
                <Paragraph>
                  • 优化了报表统计功能
                </Paragraph>
              </Space>
            </Card>
          </Col>
        </Row>
      </Space>
    </div>
  );
};

export default HomePage;