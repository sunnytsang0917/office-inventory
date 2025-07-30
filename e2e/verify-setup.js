#!/usr/bin/env node

/**
 * E2E测试环境验证脚本
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

class SetupVerifier {
  constructor() {
    this.errors = [];
    this.warnings = [];
  }

  /**
   * 检查文件是否存在
   */
  checkFileExists(filePath, description) {
    const fullPath = path.resolve(filePath);
    if (fs.existsSync(fullPath)) {
      console.log(`✅ ${description}: ${filePath}`);
      return true;
    } else {
      this.errors.push(`❌ ${description}不存在: ${filePath}`);
      return false;
    }
  }

  /**
   * 检查目录是否存在
   */
  checkDirectoryExists(dirPath, description) {
    const fullPath = path.resolve(dirPath);
    if (fs.existsSync(fullPath) && fs.statSync(fullPath).isDirectory()) {
      console.log(`✅ ${description}: ${dirPath}`);
      return true;
    } else {
      this.errors.push(`❌ ${description}不存在: ${dirPath}`);
      return false;
    }
  }

  /**
   * 检查package.json依赖
   */
  checkDependencies() {
    console.log('\n📦 检查依赖...');
    
    try {
      const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
      
      if (packageJson.devDependencies && packageJson.devDependencies['@playwright/test']) {
        console.log('✅ Playwright已安装');
      } else {
        this.errors.push('❌ Playwright未安装');
      }

      // 检查脚本
      const requiredScripts = ['test:e2e', 'test:setup'];
      for (const script of requiredScripts) {
        if (packageJson.scripts && packageJson.scripts[script]) {
          console.log(`✅ 脚本存在: ${script}`);
        } else {
          this.warnings.push(`⚠️  脚本缺失: ${script}`);
        }
      }

    } catch (error) {
      this.errors.push(`❌ 无法读取package.json: ${error.message}`);
    }
  }

  /**
   * 检查Playwright浏览器
   */
  async checkPlaywrightBrowsers() {
    console.log('\n🌐 检查Playwright浏览器...');
    
    return new Promise((resolve) => {
      const playwright = spawn('npx', ['playwright', '--version'], {
        stdio: 'pipe'
      });

      let output = '';
      playwright.stdout.on('data', (data) => {
        output += data.toString();
      });

      playwright.on('close', (code) => {
        if (code === 0) {
          console.log(`✅ Playwright版本: ${output.trim()}`);
        } else {
          this.warnings.push('⚠️  Playwright可能未正确安装');
        }
        resolve();
      });

      playwright.on('error', () => {
        this.warnings.push('⚠️  无法检查Playwright版本');
        resolve();
      });
    });
  }

  /**
   * 检查项目结构
   */
  checkProjectStructure() {
    console.log('\n📁 检查项目结构...');

    // 检查主要目录
    this.checkDirectoryExists('frontend', '前端目录');
    this.checkDirectoryExists('backend', '后端目录');
    this.checkDirectoryExists('e2e', 'E2E测试目录');

    // 检查E2E测试文件
    const testFiles = [
      'e2e/auth.spec.ts',
      'e2e/items.spec.ts',
      'e2e/locations.spec.ts',
      'e2e/transactions.spec.ts',
      'e2e/inventory-reports.spec.ts',
      'e2e/complete-workflow.spec.ts'
    ];

    for (const testFile of testFiles) {
      this.checkFileExists(testFile, '测试文件');
    }

    // 检查页面对象
    const pageObjects = [
      'e2e/pages/LoginPage.ts',
      'e2e/pages/ItemsPage.ts',
      'e2e/pages/LocationsPage.ts'
    ];

    for (const pageObject of pageObjects) {
      this.checkFileExists(pageObject, '页面对象');
    }

    // 检查工具文件
    this.checkFileExists('e2e/utils/test-helpers.ts', '测试工具');
    this.checkFileExists('playwright.config.ts', 'Playwright配置');
  }

  /**
   * 检查前后端配置
   */
  checkApplicationConfig() {
    console.log('\n⚙️  检查应用配置...');

    // 检查前端package.json
    if (this.checkFileExists('frontend/package.json', '前端package.json')) {
      try {
        const frontendPkg = JSON.parse(fs.readFileSync('frontend/package.json', 'utf8'));
        if (frontendPkg.scripts && frontendPkg.scripts.start) {
          console.log('✅ 前端启动脚本存在');
        } else {
          this.warnings.push('⚠️  前端启动脚本缺失');
        }
      } catch (error) {
        this.warnings.push('⚠️  无法读取前端package.json');
      }
    }

    // 检查后端package.json
    if (this.checkFileExists('backend/package.json', '后端package.json')) {
      try {
        const backendPkg = JSON.parse(fs.readFileSync('backend/package.json', 'utf8'));
        if (backendPkg.scripts && backendPkg.scripts.dev) {
          console.log('✅ 后端开发脚本存在');
        } else {
          this.warnings.push('⚠️  后端开发脚本缺失');
        }
      } catch (error) {
        this.warnings.push('⚠️  无法读取后端package.json');
      }
    }
  }

  /**
   * 生成报告
   */
  generateReport() {
    console.log('\n📊 验证报告');
    console.log('='.repeat(50));

    if (this.errors.length === 0) {
      console.log('🎉 所有必需项检查通过！');
    } else {
      console.log('❌ 发现以下错误:');
      this.errors.forEach(error => console.log(`  ${error}`));
    }

    if (this.warnings.length > 0) {
      console.log('\n⚠️  警告:');
      this.warnings.forEach(warning => console.log(`  ${warning}`));
    }

    console.log('\n📝 下一步:');
    
    if (this.errors.length > 0) {
      console.log('1. 解决上述错误');
      console.log('2. 重新运行验证: node e2e/verify-setup.js');
    } else {
      console.log('1. 确保前后端服务可以正常启动');
      console.log('2. 在前端组件中添加必要的data-testid属性 (参考 e2e/add-test-ids.md)');
      console.log('3. 运行测试: npm run test:e2e');
    }

    return this.errors.length === 0;
  }

  /**
   * 运行所有检查
   */
  async run() {
    console.log('🔍 E2E测试环境验证');
    console.log('='.repeat(50));

    this.checkProjectStructure();
    this.checkDependencies();
    await this.checkPlaywrightBrowsers();
    this.checkApplicationConfig();

    return this.generateReport();
  }
}

// 运行验证
const verifier = new SetupVerifier();
verifier.run().then((success) => {
  process.exit(success ? 0 : 1);
}).catch((error) => {
  console.error('验证过程出错:', error);
  process.exit(1);
});