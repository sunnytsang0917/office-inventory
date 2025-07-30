#!/usr/bin/env node

/**
 * E2E测试运行器
 * 用于启动服务并运行测试
 */

const { spawn } = require('child_process');
const path = require('path');

class TestRunner {
  constructor() {
    this.processes = [];
    this.isShuttingDown = false;
  }

  /**
   * 启动后端服务
   */
  async startBackend() {
    console.log('🚀 启动后端服务...');
    
    const backend = spawn('npm', ['run', 'dev'], {
      cwd: path.join(__dirname, '../backend'),
      stdio: 'pipe',
      env: { ...process.env, NODE_ENV: 'test', PORT: '3001' }
    });

    this.processes.push(backend);

    return new Promise((resolve, reject) => {
      let output = '';
      
      backend.stdout.on('data', (data) => {
        output += data.toString();
        console.log(`[Backend] ${data.toString().trim()}`);
        
        if (output.includes('Server running on port 3001')) {
          console.log('✅ 后端服务启动成功');
          resolve();
        }
      });

      backend.stderr.on('data', (data) => {
        console.error(`[Backend Error] ${data.toString().trim()}`);
      });

      backend.on('error', (error) => {
        console.error('❌ 后端服务启动失败:', error);
        reject(error);
      });

      // 超时处理
      setTimeout(() => {
        if (!this.isShuttingDown) {
          reject(new Error('后端服务启动超时'));
        }
      }, 30000);
    });
  }

  /**
   * 启动前端服务
   */
  async startFrontend() {
    console.log('🎨 启动前端服务...');
    
    const frontend = spawn('npm', ['start'], {
      cwd: path.join(__dirname, '../frontend'),
      stdio: 'pipe',
      env: { ...process.env, REACT_APP_API_URL: 'http://localhost:3001' }
    });

    this.processes.push(frontend);

    return new Promise((resolve, reject) => {
      let output = '';
      
      frontend.stdout.on('data', (data) => {
        output += data.toString();
        console.log(`[Frontend] ${data.toString().trim()}`);
        
        if (output.includes('webpack compiled') || output.includes('Local:')) {
          console.log('✅ 前端服务启动成功');
          resolve();
        }
      });

      frontend.stderr.on('data', (data) => {
        const message = data.toString().trim();
        if (!message.includes('Warning') && !message.includes('warning')) {
          console.error(`[Frontend Error] ${message}`);
        }
      });

      frontend.on('error', (error) => {
        console.error('❌ 前端服务启动失败:', error);
        reject(error);
      });

      // 超时处理
      setTimeout(() => {
        if (!this.isShuttingDown) {
          reject(new Error('前端服务启动超时'));
        }
      }, 60000);
    });
  }

  /**
   * 运行E2E测试
   */
  async runTests(testPattern = '') {
    console.log('🧪 运行E2E测试...');
    
    const args = ['test'];
    if (testPattern) {
      args.push(testPattern);
    }

    const playwright = spawn('npx', ['playwright', ...args], {
      cwd: __dirname,
      stdio: 'inherit'
    });

    return new Promise((resolve, reject) => {
      playwright.on('close', (code) => {
        if (code === 0) {
          console.log('✅ 测试完成');
          resolve();
        } else {
          console.error(`❌ 测试失败，退出码: ${code}`);
          reject(new Error(`测试失败，退出码: ${code}`));
        }
      });

      playwright.on('error', (error) => {
        console.error('❌ 测试运行出错:', error);
        reject(error);
      });
    });
  }

  /**
   * 关闭所有进程
   */
  async shutdown() {
    this.isShuttingDown = true;
    console.log('🛑 关闭服务...');

    for (const process of this.processes) {
      if (process && !process.killed) {
        process.kill('SIGTERM');
      }
    }

    // 等待进程关闭
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 强制关闭
    for (const process of this.processes) {
      if (process && !process.killed) {
        process.kill('SIGKILL');
      }
    }

    console.log('✅ 所有服务已关闭');
  }

  /**
   * 主运行方法
   */
  async run(testPattern = '') {
    try {
      // 启动服务
      await this.startBackend();
      await this.startFrontend();

      // 等待服务完全启动
      console.log('⏳ 等待服务稳定...');
      await new Promise(resolve => setTimeout(resolve, 5000));

      // 运行测试
      await this.runTests(testPattern);

    } catch (error) {
      console.error('❌ 测试运行失败:', error.message);
      process.exit(1);
    } finally {
      await this.shutdown();
    }
  }
}

// 处理命令行参数
const testPattern = process.argv[2] || '';

// 处理退出信号
const runner = new TestRunner();

process.on('SIGINT', async () => {
  console.log('\n收到中断信号，正在关闭...');
  await runner.shutdown();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n收到终止信号，正在关闭...');
  await runner.shutdown();
  process.exit(0);
});

// 运行测试
runner.run(testPattern).then(() => {
  process.exit(0);
}).catch(() => {
  process.exit(1);
});