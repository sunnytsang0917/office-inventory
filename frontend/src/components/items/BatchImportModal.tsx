import React, { useState } from 'react';
import {
  Modal,
  Upload,
  Button,
  Table,
  Alert,
  Progress,
  Space,
  Typography,
  Divider,
  Tag,
  message,
} from 'antd';
import { UploadOutlined, DownloadOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import type { UploadProps } from 'antd';

const { Title, Text } = Typography;

interface BatchImportModalProps {
  visible: boolean;
  onCancel: () => void;
  onSuccess: () => void;
  type: 'inbound' | 'outbound';
}

const BatchImportModal: React.FC<BatchImportModalProps> = ({
  visible,
  onCancel,
  onSuccess,
  type,
}) => {
  // const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<any>(null);
  const [fileList, setFileList] = useState<any[]>([]);

  const handleUpload = async () => {
    if (fileList.length === 0) {
      message.error('请先选择文件');
      return;
    }

    setProcessing(true);
    setProgress(0);

    // 模拟文件处理进度
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) {
          clearInterval(interval);
          return 90;
        }
        return prev + 10;
      });
    }, 200);

    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      clearInterval(interval);
      setProgress(100);

      // 模拟处理结果
      const mockResults = {
        success: 8,
        failed: 2,
        total: 10,
        errors: [
          { row: 3, itemName: '不存在的物品', error: '物品不存在' },
          { row: 7, itemName: 'A4复印纸', error: '库房位置不存在' },
        ],
      };

      setResults(mockResults);
      message.success(`批量${type === 'inbound' ? '入库' : '出库'}处理完成`);
      
    } catch (error) {
      message.error('处理失败，请重试');
    } finally {
      setProcessing(false);
    }
  };

  const uploadProps: UploadProps = {
    beforeUpload: (file) => {
      const isExcel = file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
                     file.type === 'application/vnd.ms-excel' ||
                     file.type === 'text/csv' ||
                     file.name.endsWith('.csv');
      if (!isExcel) {
        message.error('只能上传Excel文件或CSV文件');
        return false;
      }
      setFileList([file]);
      return false;
    },
    fileList,
    onRemove: () => {
      setFileList([]);
      setResults(null);
      setProgress(0);
    },
  };

  const errorColumns = [
    {
      title: '行号',
      dataIndex: 'row',
      key: 'row',
    },
    {
      title: '物品名称',
      dataIndex: 'itemName',
      key: 'itemName',
    },
    {
      title: '错误信息',
      dataIndex: 'error',
      key: 'error',
      render: (text: string) => <Text type="danger">{text}</Text>,
    },
  ];

  const handleClose = () => {
    setFileList([]);
    setResults(null);
    setProgress(0);
    setProcessing(false);
    onCancel();
  };

  const handleDownloadTemplate = () => {
    // 创建Excel模板数据
    const templateData = type === 'inbound' 
      ? [
          ['物品名称', '规格型号', '库房位置编码', '库房位置名称', '数量', '供应商', '操作人', '入库时间', '备注'],
          ['A4复印纸', '80g/㎡ 500张/包', 'A-01', 'A区-01货架', '50', '办公用品供应商', '张三', '2024-01-15 08:00', ''],
          ['黑色签字笔', '0.5mm 中性笔', 'B-03', 'B区-03货架', '100', '文具批发商', '李四', '2024-01-15 09:00', ''],
          ['订书机', '标准型 可装订20页', 'C-05', 'C区-05货架', '10', '办公设备供应商', '王五', '2024-01-15 10:00', ''],
        ]
      : [
          ['物品名称', '规格型号', '库房位置编码', '库房位置名称', '数量', '领用人/部门', '用途', '操作人', '出库时间', '备注'],
          ['A4复印纸', '80g/㎡ 500张/包', 'A-01', 'A区-01货架', '25', '行政部', '日常办公使用', '张三', '2024-01-15 08:00', ''],
          ['黑色签字笔', '0.5mm 中性笔', 'B-03', 'B区-03货架', '50', '销售部', '签署合同使用', '李四', '2024-01-15 09:00', ''],
          ['便利贴', '76×76mm 黄色', 'B-02', 'B区-02货架', '5', '人事部', '会议记录', '王五', '2024-01-15 10:00', ''],
        ];

    // 创建CSV内容
    const csvContent = templateData.map(row => 
      row.map(cell => `"${cell}"`).join(',')
    ).join('\n');

    // 添加BOM以支持中文
    const BOM = '\uFEFF';
    const csvWithBOM = BOM + csvContent;

    // 创建Blob对象
    const blob = new Blob([csvWithBOM], { type: 'text/csv;charset=utf-8;' });
    
    // 创建下载链接
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${type === 'inbound' ? '入库' : '出库'}模板.csv`);
    link.style.visibility = 'hidden';
    
    // 触发下载
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    message.success('模板下载成功！');
  };

  return (
    <Modal
      title={`批量${type === 'inbound' ? '入库' : '出库'}`}
      open={visible}
      onCancel={handleClose}
      width={800}
      footer={[
        <Button key="cancel" onClick={handleClose}>
          关闭
        </Button>,
        <Button
          key="upload"
          type="primary"
          loading={processing}
          onClick={handleUpload}
          disabled={fileList.length === 0 || processing}
        >
          {processing ? '处理中...' : '开始处理'}
        </Button>,
      ]}
    >
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        {/* 模板下载 */}
        <div>
          <Title level={5}>1. 下载模板</Title>
          <Button
            icon={<DownloadOutlined />}
            onClick={handleDownloadTemplate}
          >
            下载{type === 'inbound' ? '入库' : '出库'}模板
          </Button>
          <Text type="secondary" style={{ marginLeft: 16 }}>
            下载CSV模板文件，请按照模板格式填写数据，包含库房位置信息
          </Text>
        </div>

        <Divider />

        {/* 文件上传 */}
        <div>
          <Title level={5}>2. 上传文件</Title>
          <Upload {...uploadProps}>
            <Button icon={<UploadOutlined />}>选择Excel文件</Button>
          </Upload>
          <Text type="secondary" style={{ display: 'block', marginTop: 8 }}>
            支持 .xlsx、.xls 和 .csv 格式文件
          </Text>
        </div>

        {/* 处理进度 */}
        {processing && (
          <>
            <Divider />
            <div>
              <Title level={5}>3. 处理进度</Title>
              <Progress percent={progress} status={progress === 100 ? 'success' : 'active'} />
            </div>
          </>
        )}

        {/* 处理结果 */}
        {results && (
          <>
            <Divider />
            <div>
              <Title level={5}>4. 处理结果</Title>
              <Space size="large">
                <Tag color="green" icon={<CheckCircleOutlined />}>
                  成功: {results.success}
                </Tag>
                <Tag color="red" icon={<CloseCircleOutlined />}>
                  失败: {results.failed}
                </Tag>
                <Tag color="blue">
                  总计: {results.total}
                </Tag>
              </Space>

              {results.errors && results.errors.length > 0 && (
                <div style={{ marginTop: 16 }}>
                  <Alert
                    message="处理过程中发现以下错误："
                    type="warning"
                    style={{ marginBottom: 16 }}
                  />
                  <Table
                    columns={errorColumns}
                    dataSource={results.errors}
                    size="small"
                    pagination={false}
                    rowKey="row"
                  />
                </div>
              )}
            </div>
          </>
        )}
      </Space>
    </Modal>
  );
};

export default BatchImportModal;