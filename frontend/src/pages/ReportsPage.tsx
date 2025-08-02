import React, { useState, useEffect } from 'react';
import { 
  Typography, 
  Card, 
  Row, 
  Col, 
  DatePicker, 
  Button, 
  Table, 
  Space,
  Statistic,
  Select,
  message,
  Spin
} from 'antd';
import { 
  DownloadOutlined, 
  BarChartOutlined, 
  LineChartOutlined,
  PieChartOutlined,
  ExportOutlined
} from '@ant-design/icons';
import ExportModal from '../components/reports/ExportModal';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title as ChartTitle,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar, Line, Pie } from 'react-chartjs-2';
import dayjs, { Dayjs } from 'dayjs';
import {
  mockMonthlyStats,
  mockItemUsageRank,
  mockDailyStats,
  mockCategoryStats,
  generateMonthlyStats,
  generateItemUsageRank,
  generateDailyStats,
  generateCategoryStats,
  convertToCSV,
  downloadCSV,
  MonthlyStats,
  ItemUsageRank,
  DailyStats,
  CategoryStats
} from '../data/mockReports';

const { Title } = Typography;
const { RangePicker } = DatePicker;

// 注册Chart.js组件
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  ChartTitle,
  Tooltip,
  Legend
);

const ReportsPage: React.FC = () => {
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs]>([
    dayjs().subtract(6, 'month'),
    dayjs()
  ]);
  const [reportType, setReportType] = useState<'monthly' | 'daily' | 'usage' | 'category'>('monthly');
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportModalVisible, setExportModalVisible] = useState(false);
  
  // 数据状态
  const [monthlyStats, setMonthlyStats] = useState<MonthlyStats[]>(mockMonthlyStats);
  const [itemUsageRank, setItemUsageRank] = useState<ItemUsageRank[]>(mockItemUsageRank);
  const [dailyStats, setDailyStats] = useState<DailyStats[]>(mockDailyStats);
  const [categoryStats, setCategoryStats] = useState<CategoryStats[]>(mockCategoryStats);

  // 更新数据
  const updateData = () => {
    setLoading(true);
    const [startDate, endDate] = dateRange;
    
    setTimeout(() => {
      setMonthlyStats(generateMonthlyStats(startDate.toDate(), endDate.toDate()));
      setItemUsageRank(generateItemUsageRank(startDate.toDate(), endDate.toDate()));
      setDailyStats(generateDailyStats(startDate.toDate(), endDate.toDate()));
      setCategoryStats(generateCategoryStats(startDate.toDate(), endDate.toDate()));
      setLoading(false);
    }, 500);
  };

  useEffect(() => {
    updateData();
  }, [dateRange]);

  // 月度统计图表配置
  const monthlyChartData = {
    labels: monthlyStats.map(stat => stat.month),
    datasets: [
      {
        label: '入库数量',
        data: monthlyStats.map(stat => stat.inboundTotal),
        backgroundColor: 'rgba(54, 162, 235, 0.6)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1,
      },
      {
        label: '出库数量',
        data: monthlyStats.map(stat => stat.outboundTotal),
        backgroundColor: 'rgba(255, 99, 132, 0.6)',
        borderColor: 'rgba(255, 99, 132, 1)',
        borderWidth: 1,
      },
    ],
  };

  // 每日统计图表配置
  const dailyChartData = {
    labels: dailyStats.map(stat => stat.date),
    datasets: [
      {
        label: '入库数量',
        data: dailyStats.map(stat => stat.inboundQuantity),
        borderColor: 'rgba(54, 162, 235, 1)',
        backgroundColor: 'rgba(54, 162, 235, 0.2)',
        tension: 0.1,
      },
      {
        label: '出库数量',
        data: dailyStats.map(stat => stat.outboundQuantity),
        borderColor: 'rgba(255, 99, 132, 1)',
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        tension: 0.1,
      },
    ],
  };

  // 分类统计饼图配置
  const categoryChartData = {
    labels: categoryStats.map(stat => stat.category),
    datasets: [
      {
        data: categoryStats.map(stat => stat.inboundQuantity + stat.outboundQuantity),
        backgroundColor: [
          'rgba(255, 99, 132, 0.6)',
          'rgba(54, 162, 235, 0.6)',
          'rgba(255, 205, 86, 0.6)',
          'rgba(75, 192, 192, 0.6)',
          'rgba(153, 102, 255, 0.6)',
          'rgba(255, 159, 64, 0.6)',
        ],
        borderColor: [
          'rgba(255, 99, 132, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 205, 86, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(153, 102, 255, 1)',
          'rgba(255, 159, 64, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  const pieChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'right' as const,
      },
    },
  };

  // 物品使用排行表格列配置
  const usageRankColumns = [
    {
      title: '排名',
      dataIndex: 'rank',
      key: 'rank',
      width: 80,
    },
    {
      title: '物品名称',
      dataIndex: 'itemName',
      key: 'itemName',
    },
    {
      title: '类别',
      dataIndex: 'category',
      key: 'category',
    },
    {
      title: '出库次数',
      dataIndex: 'outboundCount',
      key: 'outboundCount',
      sorter: (a: ItemUsageRank, b: ItemUsageRank) => a.outboundCount - b.outboundCount,
    },
    {
      title: '出库总量',
      dataIndex: 'outboundQuantity',
      key: 'outboundQuantity',
      sorter: (a: ItemUsageRank, b: ItemUsageRank) => a.outboundQuantity - b.outboundQuantity,
    },
  ];

  // 导出功能
  const handleExport = async () => {
    setExporting(true);
    
    try {
      let csvContent = '';
      let filename = '';
      
      switch (reportType) {
        case 'monthly':
          csvContent = convertToCSV(monthlyStats, ['month', 'inboundTotal', 'outboundTotal', 'transactionCount']);
          filename = `月度统计报表_${dayjs().format('YYYY-MM-DD')}.csv`;
          break;
        case 'daily':
          csvContent = convertToCSV(dailyStats, ['date', 'inboundQuantity', 'outboundQuantity', 'transactionCount']);
          filename = `每日统计报表_${dayjs().format('YYYY-MM-DD')}.csv`;
          break;
        case 'usage':
          csvContent = convertToCSV(itemUsageRank, ['rank', 'itemName', 'category', 'outboundCount', 'outboundQuantity']);
          filename = `物品使用排行_${dayjs().format('YYYY-MM-DD')}.csv`;
          break;
        case 'category':
          csvContent = convertToCSV(categoryStats, ['category', 'inboundQuantity', 'outboundQuantity', 'itemCount']);
          filename = `分类统计报表_${dayjs().format('YYYY-MM-DD')}.csv`;
          break;
      }
      
      // 模拟导出延迟
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      downloadCSV(csvContent, filename);
      message.success('报表导出成功！');
    } catch (error) {
      message.error('报表导出失败，请重试');
    } finally {
      setExporting(false);
    }
  };

  // 计算汇总统计
  const totalInbound = monthlyStats.reduce((sum, stat) => sum + stat.inboundTotal, 0);
  const totalOutbound = monthlyStats.reduce((sum, stat) => sum + stat.outboundTotal, 0);
  const totalTransactions = monthlyStats.reduce((sum, stat) => sum + stat.transactionCount, 0);

  return (
    <div>
      <Title level={2}>报表统计</Title>
      
      {/* 控制面板 */}
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={16} align="middle">
          <Col>
            <span>时间范围：</span>
            <RangePicker
              value={dateRange}
              onChange={(dates) => dates && setDateRange(dates as [Dayjs, Dayjs])}
              format="YYYY-MM-DD"
            />
          </Col>
          <Col>
            <span>报表类型：</span>
            <Select
              value={reportType}
              onChange={setReportType}
              style={{ width: 120 }}
            >
              <Select.Option value="monthly">月度统计</Select.Option>
              <Select.Option value="daily">每日统计</Select.Option>
              <Select.Option value="usage">使用排行</Select.Option>
              <Select.Option value="category">分类统计</Select.Option>
            </Select>
          </Col>
          <Col>
            <Space>
              <Button 
                type="primary" 
                icon={<DownloadOutlined />}
                onClick={handleExport}
                loading={exporting}
              >
                快速导出
              </Button>
              <Button 
                icon={<ExportOutlined />}
                onClick={() => setExportModalVisible(true)}
              >
                高级导出
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* 汇总统计卡片 */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="总入库量"
              value={totalInbound}
              prefix={<BarChartOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="总出库量"
              value={totalOutbound}
              prefix={<BarChartOutlined />}
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="交易次数"
              value={totalTransactions}
              prefix={<LineChartOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="库存周转率"
              value={totalOutbound > 0 ? ((totalOutbound / (totalInbound || 1)) * 100).toFixed(1) : '0'}
              suffix="%"
              prefix={<PieChartOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Spin spinning={loading}>
        {/* 图表展示区域 */}
        {reportType === 'monthly' && (
          <Card title="月度出入库统计" style={{ marginBottom: 16 }}>
            <Bar data={monthlyChartData} options={chartOptions} />
          </Card>
        )}

        {reportType === 'daily' && (
          <Card title="每日出入库趋势" style={{ marginBottom: 16 }}>
            <Line data={dailyChartData} options={chartOptions} />
          </Card>
        )}

        {reportType === 'category' && (
          <Card title="分类统计分布" style={{ marginBottom: 16 }}>
            <Row gutter={16}>
              <Col span={12}>
                <Pie data={categoryChartData} options={pieChartOptions} />
              </Col>
              <Col span={12}>
                <Table
                  dataSource={categoryStats}
                  columns={[
                    { title: '类别', dataIndex: 'category', key: 'category' },
                    { title: '入库量', dataIndex: 'inboundQuantity', key: 'inboundQuantity' },
                    { title: '出库量', dataIndex: 'outboundQuantity', key: 'outboundQuantity' },
                    { title: '物品数', dataIndex: 'itemCount', key: 'itemCount' },
                  ]}
                  pagination={false}
                  size="small"
                />
              </Col>
            </Row>
          </Card>
        )}

        {reportType === 'usage' && (
          <Card title="物品使用排行榜" style={{ marginBottom: 16 }}>
            <Table
              dataSource={itemUsageRank}
              columns={usageRankColumns}
              rowKey="itemId"
              pagination={{ pageSize: 10 }}
            />
          </Card>
        )}
      </Spin>

      {/* 高级导出模态框 */}
      <ExportModal
        visible={exportModalVisible}
        onCancel={() => setExportModalVisible(false)}
      />
    </div>
  );
};

export default ReportsPage;