/**
 * E2E测试配置
 */
export const testConfig = {
  // 测试用户凭据
  users: {
    admin: {
      username: 'admin',
      password: 'admin123',
      role: 'admin'
    },
    employee: {
      username: 'employee', 
      password: 'employee123',
      role: 'employee'
    }
  },

  // API端点
  api: {
    baseUrl: 'http://localhost:3001',
    endpoints: {
      login: '/api/auth/login',
      items: '/api/items',
      locations: '/api/locations',
      transactions: '/api/transactions',
      inventory: '/api/inventory',
      reports: '/api/reports'
    }
  },

  // 前端URL
  frontend: {
    baseUrl: 'http://localhost:3000',
    pages: {
      login: '/login',
      home: '/',
      items: '/items',
      locations: '/locations',
      inventory: '/inventory',
      inbound: '/transactions/inbound',
      outbound: '/transactions/outbound',
      history: '/transactions/history',
      reports: '/reports'
    }
  },

  // 测试数据
  testData: {
    items: [
      {
        name: '测试物品A',
        category: '办公用品',
        specification: '规格A',
        unit: '个',
        lowStockThreshold: 10
      },
      {
        name: '测试物品B',
        category: '电子设备',
        specification: '规格B',
        unit: '台',
        lowStockThreshold: 5
      }
    ],
    locations: [
      {
        code: 'A-01-001',
        name: 'A区1层货架001',
        description: '测试位置A'
      },
      {
        code: 'B-01-001',
        name: 'B区1层货架001',
        description: '测试位置B'
      }
    ]
  },

  // 超时设置
  timeouts: {
    default: 30000,
    navigation: 10000,
    api: 5000
  }
};