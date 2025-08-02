import React, { useState, useEffect } from 'react';
import {
  Modal,
  Form,
  DatePicker,
  Button,
  Progress,
  Alert,
  Space,
  Typography,
  Divider,
  Radio,
  Checkbox,
  message,
  Tooltip,
  Card
} from 'antd';
import { 
  DownloadOutlined, 
  FileExcelOutlined, 
  InfoCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import dayjs, { Dayjs } from 'dayjs';
import {
  generateMonthlyStats,
  generateItemUsageRank,
  generateDailyStats,
  generateCategoryStats,
  convertToCSV,
  downloadCSV,
  getFileSizeString
} from '../../data/mockReports';

const { RangePicker } = DatePicker;
const { Text } = Typography;

interface ExportModalProps {
  visible: boolean;
  onCancel: () => void;
}

type ExportFormat = 'csv' | 'excel';
type ReportType = 'monthly' | 'daily' | 'usage' | 'category' | 'summary';

interface ExportConfig {
  reportType: ReportType;
  format: ExportFormat;
  dateRange: [Dayjs, Dayjs];
  includeCharts: boolean;
  selectedColumns: string[];
}

interface ExportProgress {
  step: string;
  percentage: number;
  message: string;
}

interface ExportStats {
  recordCount: number;
  fileSize: string;
  columns: number;
}

const ExportModal: React.FC<ExportModalProps> = ({ visible, onCancel }) => {
  const [form] = Form.useForm();
  const [exporting, setExporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [exportStatus, setExportStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [exportProgress, setExportProgress] = useState<ExportProgress>({
    step: '',
    percentage: 0,
    message: ''
  });
  const [exportedFileName, setExportedFileName] = useState<string>('');
  const [dataPreview, setDataPreview] = useState<any[]>([]);
  const [exportStats, setExportStats] = useState<ExportStats>({ recordCount: 0, fileSize: '', columns: 0 });

  const reportTypeOptions = [
    { label: '月度统计报表', value: 'monthly' },
    { label: '每日统计报表', value: 'daily' },
    { label: '物品使用排行', value: 'usage' },
    { label: '分类统计报表', value: 'category' },
    { label: '综合汇总报表', value: 'summary' },
  ];

  const formatOptions = [
    { label: 'CSV格式', value: 'csv' },
    { label: 'Excel格式', value: 'excel' },
  ];

  const columnOptions = {
    monthly: [
      { label: '月份', value: 'month' },
      { label: '入库总量', value: 'inboundTotal' },
      { label: '出库总量', value: 'outboundTotal' },
      { label: '交易次数', value: 'transactionCount' },
    ],
    daily: [
      { label: '日期', value: 'date' },
      { label: '入库数量', value: 'inboundQuantity' },
      { label: '出库数量', value: 'outboundQuantity' },
      { label: '交易次数', value: 'transactionCount' },
    ],
    usage: [
      { label: '排名', value: 'rank' },
      { label: '物品名称', value: 'itemName' },
      { label: '类别', value: 'category' },
      { label: '出库次数', value: 'outboundCount' },
      { label: '出库总量', value: 'outboundQuantity' },
    ],
    category: [
      { label: '类别', value: 'category' },
      { label: '入库数量', value: 'inboundQuantity' },
      { label: '出库数量', value: 'outboundQuantity' },
      { label: '物品数量', value: 'itemCount' },
    ],
    summary: [
      { label: '报表类型', value: 'reportType' },
      { label: '统计值', value: 'value' },
      { label: '描述', value: 'description' },
    ],
  };

  const [selectedReportType, setSelectedReportType] = useState<ReportType>('monthly');

  const updateProgress = (step: string, percentage: number, message: string) => {
    setExportProgress({ step, percentage, message });
    setProgress(percentage);
  };

  const validateDateRange = (dateRange: [Dayjs, Dayjs]): boolean => {
    const [startDate, endDate] = dateRange;
    const daysDiff = endDate.diff(startDate, 'days');
    
    if (daysDiff > 365) {
      message.warning('导出时间范围不能超过一年，请缩小时间范围');
      return false;
    }
    
    if (daysDiff < 0) {
      message.error('开始时间不能晚于结束时间');
      return false;
    }
    
    return true;
  };

  const handleExport = async () => {
    try {
      const values = await form.validateFields();
      const config: ExportConfig = {
        reportType: values.reportType,
        format: values.format,
        dateRange: values.dateRange,
        includeCharts: values.includeCharts || false,
        selectedColumns: values.selectedColumns || [],
      };

      // 验证日期范围
      if (!validateDateRange(config.dateRange)) {
        return;
      }

      setExporting(true);
      setProgress(0);
      setExportStatus('idle');
      setExportedFileName('');

      // 步骤1: 验证配置
      updateProgress('validate', 10, '正在验证导出配置...');
      await new Promise(resolve => setTimeout(resolve, 300));

      // 步骤2: 生成数据
      updateProgress('generate', 30, '正在生成报表数据...');
      const [startDate, endDate] = config.dateRange;
      let data: any[] = [];
      let filename = '';
      let headers: string[] = [];

      await new Promise(resolve => setTimeout(resolve, 500));

      switch (config.reportType) {
        case 'monthly':
          data = generateMonthlyStats(startDate.toDate(), endDate.toDate());
          filename = `月度统计报表_${dayjs().format('YYYY-MM-DD')}`;
          headers = config.selectedColumns.length > 0 ? config.selectedColumns : ['month', 'inboundTotal', 'outboundTotal', 'transactionCount'];
          break;
        case 'daily':
          data = generateDailyStats(startDate.toDate(), endDate.toDate());
          filename = `每日统计报表_${dayjs().format('YYYY-MM-DD')}`;
          headers = config.selectedColumns.length > 0 ? config.selectedColumns : ['date', 'inboundQuantity', 'outboundQuantity', 'transactionCount'];
          break;
        case 'usage':
          data = generateItemUsageRank(startDate.toDate(), endDate.toDate());
          filename = `物品使用排行_${dayjs().format('YYYY-MM-DD')}`;
          headers = config.selectedColumns.length > 0 ? config.selectedColumns : ['rank', 'itemName', 'category', 'outboundCount', 'outboundQuantity'];
          break;
        case 'category':
          data = generateCategoryStats(startDate.toDate(), endDate.toDate());
          filename = `分类统计报表_${dayjs().format('YYYY-MM-DD')}`;
          headers = config.selectedColumns.length > 0 ? config.selectedColumns : ['category', 'inboundQuantity', 'outboundQuantity', 'itemCount'];
          break;
        case 'summary':
          // 生成综合汇总数据
          updateProgress('generate', 40, '正在生成综合汇总数据...');
          const monthlyData = generateMonthlyStats(startDate.toDate(), endDate.toDate());
          const usageData = generateItemUsageRank(startDate.toDate(), endDate.toDate());
          const categoryData = generateCategoryStats(startDate.toDate(), endDate.toDate());
          
          data = [
            { reportType: '总入库量', value: monthlyData.reduce((sum, m) => sum + m.inboundTotal, 0), description: '统计期间内所有物品的入库总量' },
            { reportType: '总出库量', value: monthlyData.reduce((sum, m) => sum + m.outboundTotal, 0), description: '统计期间内所有物品的出库总量' },
            { reportType: '交易总次数', value: monthlyData.reduce((sum, m) => sum + m.transactionCount, 0), description: '统计期间内所有出入库交易的总次数' },
            { reportType: '最常用物品', value: usageData[0]?.itemName || '无', description: '出库次数最多的物品' },
            { reportType: '活跃分类数', value: categoryData.length, description: '有出入库记录的物品分类数量' },
          ];
          filename = `综合汇总报表_${dayjs().format('YYYY-MM-DD')}`;
          headers = config.selectedColumns.length > 0 ? config.selectedColumns : ['reportType', 'value', 'description'];
          break;
      }

      // 验证数据
      if (data.length === 0) {
        throw new Error('所选时间范围内没有数据，请调整时间范围后重试');
      }

      // 设置数据预览
      setDataPreview(data.slice(0, 5)); // 显示前5条数据作为预览

      // 步骤3: 处理数据
      updateProgress('process', 60, '正在处理数据格式...');
      await new Promise(resolve => setTimeout(resolve, 500));

      // 步骤4: 生成文件
      updateProgress('generate-file', 80, '正在生成导出文件...');
      await new Promise(resolve => setTimeout(resolve, 500));

      const finalFilename = `${filename}.${config.format}`;
      setExportedFileName(finalFilename);

      // 导出文件
      const csvContent = convertToCSV(data, headers);
      const fileSize = getFileSizeString(csvContent);
      
      setExportStats({
        recordCount: data.length,
        fileSize: fileSize,
        columns: headers.length
      });

      if (config.format === 'csv') {
        downloadCSV(csvContent, finalFilename);
      } else {
        // Excel格式导出（这里简化为CSV，实际项目中可以使用xlsx库）
        downloadCSV(csvContent, finalFilename);
      }

      // 步骤5: 完成
      updateProgress('complete', 100, '导出完成！');
      setExportStatus('success');
      message.success(`报表已成功导出为 ${finalFilename}`);

      // 3秒后关闭弹窗
      setTimeout(() => {
        handleCancel();
      }, 3000);

    } catch (error) {
      setExporting(false);
      setProgress(0);
      setExportStatus('error');
      setExportProgress({ step: 'error', percentage: 0, message: '' });
      
      const errorMessage = error instanceof Error ? error.message : '导出过程中发生未知错误';
      message.error(errorMessage);
      console.error('导出失败:', error);
    }
  };

  const handleCancel = () => {
    if (!exporting) {
      onCancel();
      form.resetFields();
      setProgress(0);
      setExportStatus('idle');
      setExportProgress({ step: '', percentage: 0, message: '' });
      setExportedFileName('');
      setDataPreview([]);
      setExportStats({ recordCount: 0, fileSize: '', columns: 0 });
    }
  };

  // 重置状态当模态框关闭时
  useEffect(() => {
    if (!visible) {
      setExporting(false);
      setProgress(0);
      setExportStatus('idle');
      setExportProgress({ step: '', percentage: 0, message: '' });
      setExportedFileName('');
      setDataPreview([]);
      setExportStats({ recordCount: 0, fileSize: '', columns: 0 });
    }
  }, [visible]);

  return (
    <Modal
      title={
        <Space>
          <DownloadOutlined />
          报表导出
        </Space>
      }
      open={visible}
      onCancel={handleCancel}
      footer={[
        <Button key="cancel" onClick={handleCancel} disabled={exporting}>
          取消
        </Button>,
        <Button
          key="export"
          type="primary"
          onClick={handleExport}
          loading={exporting}
          icon={<DownloadOutlined />}
        >
          {exporting ? '导出中...' : '开始导出'}
        </Button>,
      ]}
      width={600}
      maskClosable={!exporting}
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          reportType: 'monthly',
          format: 'csv',
          dateRange: [dayjs().subtract(6, 'month'), dayjs()],
          includeCharts: false,
          selectedColumns: [],
        }}
      >
        <Form.Item
          name="reportType"
          label={
            <Space>
              报表类型
              <Tooltip title="选择要导出的报表类型，不同类型包含不同的数据字段">
                <InfoCircleOutlined style={{ color: '#8c8c8c' }} />
              </Tooltip>
            </Space>
          }
          rules={[{ required: true, message: '请选择报表类型' }]}
        >
          <Radio.Group
            options={reportTypeOptions}
            onChange={(e) => setSelectedReportType(e.target.value)}
          />
        </Form.Item>

        <Form.Item
          name="dateRange"
          label={
            <Space>
              时间范围
              <Tooltip title="选择要导出数据的时间范围，最长支持一年的数据导出">
                <InfoCircleOutlined style={{ color: '#8c8c8c' }} />
              </Tooltip>
            </Space>
          }
          rules={[{ required: true, message: '请选择时间范围' }]}
        >
          <RangePicker 
            style={{ width: '100%' }} 
            placeholder={['开始日期', '结束日期']}
            format="YYYY-MM-DD"
          />
        </Form.Item>

        <Form.Item
          name="format"
          label={
            <Space>
              导出格式
              <Tooltip title="CSV格式兼容性更好，Excel格式功能更丰富">
                <InfoCircleOutlined style={{ color: '#8c8c8c' }} />
              </Tooltip>
            </Space>
          }
          rules={[{ required: true, message: '请选择导出格式' }]}
        >
          <Radio.Group options={formatOptions} />
        </Form.Item>

        <Form.Item
          name="selectedColumns"
          label={
            <Space>
              选择导出字段
              <Tooltip title="可以选择性导出特定字段，不选择则导出所有可用字段">
                <InfoCircleOutlined style={{ color: '#8c8c8c' }} />
              </Tooltip>
            </Space>
          }
        >
          <Checkbox.Group
            options={columnOptions[selectedReportType]}
            style={{ width: '100%' }}
          />
          <div style={{ marginTop: 8 }}>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              不选择则导出所有字段 ({columnOptions[selectedReportType].length} 个字段)
            </Text>
          </div>
        </Form.Item>

        <Form.Item name="includeCharts" valuePropName="checked">
          <Checkbox disabled>
            包含图表（暂不支持）
          </Checkbox>
        </Form.Item>

        {exporting && (
          <>
            <Divider />
            <Card size="small" style={{ backgroundColor: '#f8f9fa' }}>
              <div style={{ textAlign: 'center', marginBottom: 16 }}>
                <Progress
                  percent={progress}
                  status={exportStatus === 'error' ? 'exception' : 'active'}
                  strokeColor={{
                    '0%': '#108ee9',
                    '100%': '#87d068',
                  }}
                  format={(percent) => (
                    <span style={{ fontSize: '12px' }}>
                      {percent}%
                    </span>
                  )}
                />
                <div style={{ marginTop: 8 }}>
                  <Space>
                    {exportProgress.step === 'validate' && <InfoCircleOutlined style={{ color: '#1890ff' }} />}
                    {exportProgress.step === 'generate' && <InfoCircleOutlined style={{ color: '#1890ff' }} />}
                    {exportProgress.step === 'process' && <InfoCircleOutlined style={{ color: '#1890ff' }} />}
                    {exportProgress.step === 'generate-file' && <InfoCircleOutlined style={{ color: '#1890ff' }} />}
                    {exportProgress.step === 'complete' && <CheckCircleOutlined style={{ color: '#52c41a' }} />}
                    {exportStatus === 'error' && <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />}
                    <Text type="secondary" style={{ fontSize: '13px' }}>
                      {exportProgress.message}
                    </Text>
                  </Space>
                </div>
              </div>
              
              {dataPreview.length > 0 && (
                <div style={{ marginTop: 16 }}>
                  <Text strong style={{ fontSize: '12px' }}>数据预览 (前5条):</Text>
                  <div style={{ 
                    marginTop: 8, 
                    padding: 8, 
                    backgroundColor: '#fff', 
                    border: '1px solid #d9d9d9',
                    borderRadius: 4,
                    fontSize: '11px',
                    maxHeight: 100,
                    overflow: 'auto'
                  }}>
                    {dataPreview.map((item, index) => (
                      <div key={index} style={{ marginBottom: 4 }}>
                        {Object.entries(item).slice(0, 3).map(([key, value]) => (
                          <span key={key} style={{ marginRight: 12 }}>
                            <Text type="secondary">{key}:</Text> {String(value)}
                          </span>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {exportedFileName && (
                <div style={{ marginTop: 12 }}>
                  <div style={{ textAlign: 'center', marginBottom: 8 }}>
                    <Space>
                      <FileExcelOutlined style={{ color: '#52c41a' }} />
                      <Text style={{ fontSize: '12px' }}>
                        文件已生成: <Text code>{exportedFileName}</Text>
                      </Text>
                    </Space>
                  </div>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-around', 
                    fontSize: '11px',
                    color: '#666'
                  }}>
                    <span>记录数: {exportStats.recordCount}</span>
                    <span>字段数: {exportStats.columns}</span>
                    <span>文件大小: {exportStats.fileSize}</span>
                  </div>
                </div>
              )}
            </Card>
          </>
        )}

        {exportStatus === 'success' && (
          <Alert
            message="导出成功"
            description="报表文件已成功下载到您的设备"
            type="success"
            showIcon
            style={{ marginTop: 16 }}
          />
        )}

        {exportStatus === 'error' && (
          <Alert
            message="导出失败"
            description="导出过程中发生错误，请重试"
            type="error"
            showIcon
            style={{ marginTop: 16 }}
          />
        )}
      </Form>
    </Modal>
  );
};

export default ExportModal;