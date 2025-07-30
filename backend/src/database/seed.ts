import { pool } from '../config/database';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';

const SEEDS_DIR = path.join(__dirname, 'seeds');

// 创建种子数据记录表
const createSeedsTable = async (): Promise<void> => {
  const query = `
    CREATE TABLE IF NOT EXISTS seeds (
      id VARCHAR(255) PRIMARY KEY,
      filename VARCHAR(255) NOT NULL,
      executed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `;
  
  await pool.query(query);
};

// 获取已执行的种子数据
const getExecutedSeeds = async (): Promise<string[]> => {
  const result = await pool.query('SELECT id FROM seeds ORDER BY executed_at');
  return result.rows.map(row => row.id);
};

// 插入初始用户数据
const insertInitialUsers = async (): Promise<void> => {
  const adminPassword = await bcrypt.hash('admin123', 10);
  const employeePassword = await bcrypt.hash('employee123', 10);
  
  // 插入管理员用户
  await pool.query(`
    INSERT INTO users (username, password, role, name) VALUES ($1, $2, $3, $4)
    ON CONFLICT (username) DO NOTHING
  `, ['admin', adminPassword, 'admin', '系统管理员']);
  
  // 插入员工用户
  await pool.query(`
    INSERT INTO users (username, password, role, name) VALUES ($1, $2, $3, $4)
    ON CONFLICT (username) DO NOTHING
  `, ['employee', employeePassword, 'employee', '普通员工']);
  
  console.log('✅ Initial users created');
};

// 执行SQL种子文件
const executeSeedFile = async (filename: string): Promise<void> => {
  const filePath = path.join(SEEDS_DIR, filename);
  const sql = fs.readFileSync(filePath, 'utf8');
  
  // 跳过用户插入部分，因为我们已经在上面处理了
  const sqlWithoutUsers = sql.replace(/INSERT INTO users.*?ON CONFLICT.*?DO NOTHING;/gs, '');
  
  console.log(`Executing seed file: ${filename}`);
  
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(sqlWithoutUsers);
    await client.query('COMMIT');
    console.log(`✅ Seed file ${filename} executed successfully`);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error(`❌ Seed file ${filename} failed:`, error);
    throw error;
  } finally {
    client.release();
  }
};

// 主种子数据函数
export const runSeeds = async (): Promise<void> => {
  try {
    console.log('🌱 Starting database seeding...');
    
    // 创建种子数据记录表
    await createSeedsTable();
    
    // 检查是否已经执行过种子数据
    const executedSeeds = await getExecutedSeeds();
    
    if (executedSeeds.includes('initial_data')) {
      console.log('✅ Seeds already executed');
      return;
    }
    
    // 插入初始用户
    await insertInitialUsers();
    
    // 执行SQL种子文件
    const seedFiles = fs.readdirSync(SEEDS_DIR)
      .filter(file => file.endsWith('.sql'))
      .sort();
    
    for (const filename of seedFiles) {
      await executeSeedFile(filename);
    }
    
    // 记录种子数据已执行
    await pool.query(
      'INSERT INTO seeds (id, filename) VALUES ($1, $2)',
      ['initial_data', 'initial_data_complete']
    );
    
    console.log('🎉 All seeds completed successfully');
  } catch (error) {
    console.error('💥 Seeding failed:', error);
    throw error;
  }
};

// 如果直接运行此文件
if (require.main === module) {
  runSeeds()
    .then(() => {
      console.log('Seeding process completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Seeding process failed:', error);
      process.exit(1);
    });
}