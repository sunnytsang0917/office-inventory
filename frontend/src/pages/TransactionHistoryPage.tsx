import React from 'react';
import { Typography, Card } from 'antd';

const { Title } = Typography;

const TransactionHistoryPage: React.FC = () => {
  return (
    <div>
      <Title level={2}>交易历史</Title>
      <Card>
        <p>交易历史功能正在开发中...</p>
        <p>此页面将包含：</p>
        <ul>
          <li>出入库历史记录</li>
          <li>记录搜索和过滤</li>
          <li>详细信息查看</li>
          <li>历史数据导出</li>
        </ul>
      </Card>
    </div>
  );
};

export default TransactionHistoryPage;