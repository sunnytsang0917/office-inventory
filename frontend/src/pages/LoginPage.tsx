import React, { useEffect } from 'react';
import { Form, Input, Button, message } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../contexts/AppContext';

interface LoginForm {
  username: string;
  password: string;
}

const LoginPage: React.FC = () => {
  const { state, login } = useAppContext();
  const navigate = useNavigate();

  // 如果已经登录，重定向到首页
  useEffect(() => {
    if (state.user?.isAuthenticated) {
      navigate('/');
    }
  }, [state.user, navigate]);

  const onFinish = async (values: LoginForm) => {
    try {
      await login(values.username, values.password);
      message.success('登录成功！');
      navigate('/');
    } catch (error) {
      // 错误已经在context中处理，这里不需要额外处理
    }
  };

  return (
    <Form
      name="login"
      onFinish={onFinish}
      autoComplete="off"
      size="large"
    >
      <Form.Item
        name="username"
        rules={[{ required: true, message: '请输入用户名!' }]}
      >
        <Input 
          prefix={<UserOutlined />} 
          placeholder="用户名" 
        />
      </Form.Item>

      <Form.Item
        name="password"
        rules={[{ required: true, message: '请输入密码!' }]}
      >
        <Input.Password
          prefix={<LockOutlined />}
          placeholder="密码"
        />
      </Form.Item>

      <Form.Item>
        <Button 
          type="primary" 
          htmlType="submit" 
          loading={state.loading}
          style={{ width: '100%' }}
        >
          登录
        </Button>
      </Form.Item>
      
      {state.error && (
        <div style={{ color: '#ff4d4f', textAlign: 'center', marginBottom: '16px' }}>
          {state.error}
        </div>
      )}
      
      <div style={{ textAlign: 'center', color: '#666', fontSize: '12px' }}>
        <p>测试账号：</p>
        <p>管理员：admin / admin</p>
        <p>员工：user / user</p>
      </div>
    </Form>
  );
};

export default LoginPage;