import React, { useState } from 'react';
import { Card, Button, Typography, Space, Alert, Spin } from 'antd';
import { ApiClient } from '../services/api';

const { Title, Text, Paragraph } = Typography;

interface TestResult {
  endpoint: string;
  status: 'success' | 'error' | 'loading';
  message: string;
  data?: any;
}

const ApiTestPage: React.FC = () => {
  const [testResults, setTestResults] = useState<TestResult[]>([]);

  const updateTestResult = (endpoint: string, status: TestResult['status'], message: string, data?: any) => {
    setTestResults(prev => {
      const existing = prev.find(r => r.endpoint === endpoint);
      const newResult = { endpoint, status, message, data };
      
      if (existing) {
        return prev.map(r => r.endpoint === endpoint ? newResult : r);
      } else {
        return [...prev, newResult];
      }
    });
  };

  const testHealthCheck = async () => {
    const endpoint = '/health';
    updateTestResult(endpoint, 'loading', '测试中...');
    
    try {
      const response = await fetch('http://localhost:3001/health');
      const data = await response.json();
      
      if (response.ok) {
        updateTestResult(endpoint, 'success', '健康检查成功', data);
      } else {
        updateTestResult(endpoint, 'error', `HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      updateTestResult(endpoint, 'error', `网络错误: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  };

  const testApiRoot = async () => {
    const endpoint = '/api';
    updateTestResult(endpoint, 'loading', '测试中...');
    
    try {
      const response = await fetch('http://localhost:3001/api');
      const data = await response.json();
      
      if (response.ok) {
        updateTestResult(endpoint, 'success', 'API根路径访问成功', data);
      } else {
        updateTestResult(endpoint, 'error', `HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      updateTestResult(endpoint, 'error', `网络错误: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  };

  const testAuthEndpoint = async () => {
    const endpoint = '/api/v1/auth/validate';
    updateTestResult(endpoint, 'loading', '测试中...');
    
    try {
      const data = await ApiClient.post('/auth/validate', { token: 'test-token' });
      updateTestResult(endpoint, 'success', '认证端点访问成功', data);
    } catch (error) {
      updateTestResult(endpoint, 'error', `API错误: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  };

  const testInventoryEndpoint = async () => {
    const endpoint = '/api/v1/inventory';
    updateTestResult(endpoint, 'loading', '测试中...');
    
    try {
      const data = await ApiClient.get('/inventory');
      updateTestResult(endpoint, 'success', '库存端点访问成功', data);
    } catch (error) {
      updateTestResult(endpoint, 'error', `API错误: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  };

  const clearResults = () => {
    setTestResults([]);
  };

  const runAllTests = async () => {
    clearResults();
    await testHealthCheck();
    await testApiRoot();
    await testAuthEndpoint();
    await testInventoryEndpoint();
  };

  return (
    <div>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <div>
          <Title level={2}>前后端API集成测试</Title>
          <Paragraph type="secondary">
            测试前端与后端API的连接状态和基本功能
          </Paragraph>
        </div>

        <Card title="测试控制">
          <Space>
            <Button type="primary" onClick={runAllTests}>
              运行所有测试
            </Button>
            <Button onClick={testHealthCheck}>
              健康检查
            </Button>
            <Button onClick={testApiRoot}>
              API根路径
            </Button>
            <Button onClick={testAuthEndpoint}>
              认证端点
            </Button>
            <Button onClick={testInventoryEndpoint}>
              库存端点
            </Button>
            <Button onClick={clearResults}>
              清除结果
            </Button>
          </Space>
        </Card>

        <Card title="测试结果">
          {testResults.length === 0 ? (
            <Text type="secondary">暂无测试结果</Text>
          ) : (
            <Space direction="vertical" style={{ width: '100%' }}>
              {testResults.map((result, index) => (
                <Card key={index} size="small">
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <div>
                      <Text strong>端点: </Text>
                      <Text code>{result.endpoint}</Text>
                    </div>
                    
                    {result.status === 'loading' && (
                      <Alert
                        message={<><Spin size="small" /> {result.message}</>}
                        type="info"
                        showIcon={false}
                      />
                    )}
                    
                    {result.status === 'success' && (
                      <Alert
                        message={result.message}
                        type="success"
                        showIcon
                      />
                    )}
                    
                    {result.status === 'error' && (
                      <Alert
                        message={result.message}
                        type="error"
                        showIcon
                      />
                    )}
                    
                    {result.data && (
                      <div>
                        <Text strong>响应数据:</Text>
                        <pre style={{ 
                          background: '#f5f5f5', 
                          padding: '8px', 
                          borderRadius: '4px',
                          fontSize: '12px',
                          overflow: 'auto',
                          maxHeight: '200px'
                        }}>
                          {JSON.stringify(result.data, null, 2)}
                        </pre>
                      </div>
                    )}
                  </Space>
                </Card>
              ))}
            </Space>
          )}
        </Card>

        <Card title="集成状态说明">
          <Space direction="vertical">
            <div>
              <Text strong>✅ 健康检查通过:</Text>
              <Text> 后端服务正常运行</Text>
            </div>
            <div>
              <Text strong>✅ API根路径通过:</Text>
              <Text> 后端路由配置正确</Text>
            </div>
            <div>
              <Text strong>⚠️ 认证端点错误:</Text>
              <Text> 正常现象，需要有效token</Text>
            </div>
            <div>
              <Text strong>⚠️ 库存端点错误:</Text>
              <Text> 正常现象，需要认证</Text>
            </div>
          </Space>
        </Card>
      </Space>
    </div>
  );
};

export default ApiTestPage;