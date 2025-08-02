import React, { useState } from 'react';
import { Layout, Menu, Avatar, Dropdown, Space, Typography, Button } from 'antd';
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  HomeOutlined,
  InboxOutlined,
  EnvironmentOutlined,
  ShoppingCartOutlined,
  BarChartOutlined,
  UserOutlined,
  LogoutOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAppContext } from '../../contexts/AppContext';

const { Header, Sider, Content } = Layout;
const { Title } = Typography;

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const { state, logout } = useAppContext();
  const navigate = useNavigate();
  const location = useLocation();

  // 菜单项配置
  const menuItems = [
    {
      key: '/',
      icon: <HomeOutlined />,
      label: '首页',
    },
    {
      key: '/items',
      icon: <InboxOutlined />,
      label: '物品管理',
    },
    {
      key: '/locations',
      icon: <EnvironmentOutlined />,
      label: '库房位置',
    },
    {
      key: '/inventory',
      icon: <ShoppingCartOutlined />,
      label: '库存查询',
    },
    {
      key: '/transactions',
      icon: <BarChartOutlined />,
      label: '出入库管理',
      children: [
        {
          key: '/transactions/inbound',
          label: '入库管理',
        },
        {
          key: '/transactions/outbound',
          label: '出库管理',
        },
        {
          key: '/transactions/history',
          label: '历史记录',
        },
      ],
    },
    {
      key: '/reports',
      icon: <BarChartOutlined />,
      label: '报表统计',
    },
    ...(state.user?.role === 'admin' ? [{
      key: '/api-test',
      icon: <SettingOutlined />,
      label: 'API测试',
    }] : []),
  ];

  // 用户下拉菜单
  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '个人信息',
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: '设置',
    },
    {
      type: 'divider' as const,
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: async () => {
        await logout();
        navigate('/login');
      },
    },
  ];

  const handleMenuClick = ({ key }: { key: string }) => {
    navigate(key);
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider trigger={null} collapsible collapsed={collapsed}>
        <div style={{ 
          height: 64, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          borderBottom: '1px solid #f0f0f0'
        }}>
          <Title level={4} style={{ color: 'white', margin: 0 }}>
            {collapsed ? '库存' : '办公室库存系统'}
          </Title>
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={handleMenuClick}
        />
      </Sider>
      <Layout>
        <Header style={{ 
          padding: '0 16px', 
          background: '#fff', 
          display: 'flex', 
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid #f0f0f0'
        }}>
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{
              fontSize: '16px',
              width: 64,
              height: 64,
            }}
          />
          
          <Space>
            {state.user && (
              <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
                <Space style={{ cursor: 'pointer' }}>
                  <Avatar icon={<UserOutlined />} />
                  <span>{state.user.name}</span>
                  <span style={{ 
                    fontSize: '12px', 
                    backgroundColor: state.user.role === 'admin' ? '#1890ff' : '#52c41a',
                    color: 'white',
                    padding: '2px 6px',
                    borderRadius: '4px'
                  }}>
                    {state.user.role === 'admin' ? '管理员' : '员工'}
                  </span>
                </Space>
              </Dropdown>
            )}
          </Space>
        </Header>
        <Content
          style={{
            margin: '16px',
            padding: 24,
            minHeight: 280,
            background: '#fff',
            borderRadius: '6px',
          }}
        >
          {children}
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout;