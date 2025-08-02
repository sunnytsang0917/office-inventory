import React from 'react';
import { Layout, Card, Typography } from 'antd';

const { Content } = Layout;
const { Title } = Typography;

interface AuthLayoutProps {
  children: React.ReactNode;
}

const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => {
  return (
    <Layout style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    }}>
      <Content style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        padding: '50px'
      }}>
        <Card 
          style={{ 
            width: 400, 
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            borderRadius: '8px'
          }}
        >
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <Title level={2} style={{ color: '#1890ff', marginBottom: 8 }}>
              办公室库存系统
            </Title>
            <p style={{ color: '#666', margin: 0 }}>
              Office Inventory Management System
            </p>
          </div>
          {children}
        </Card>
      </Content>
    </Layout>
  );
};

export default AuthLayout;