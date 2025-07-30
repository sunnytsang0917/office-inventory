import { pool } from '../config/database';
import fs from 'fs';
import path from 'path';

const MIGRATIONS_DIR = path.join(__dirname, 'migrations');

interface Migration {
  id: string;
  filename: string;
  executed_at?: Date;
}

// 创建迁移记录表
const createMigrationsTable = async (): Promise<void> => {
  const query = `
    CREATE TABLE IF NOT EXISTS migrations (
      id VARCHAR(255) PRIMARY KEY,
      filename VARCHAR(255) NOT NULL,
      executed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `;
  
  await pool.query(query);
};

// 获取已执行的迁移
const getExecutedMigrations = async (): Promise<string[]> => {
  const result = await pool.query('SELECT id FROM migrations ORDER BY executed_at');
  return result.rows.map(row => row.id);
};

// 获取所有迁移文件
const getAllMigrations = (): Migration[] => {
  const files = fs.readdirSync(MIGRATIONS_DIR)
    .filter(file => file.endsWith('.sql'))
    .sort();
  
  return files.map(filename => ({
    id: filename.replace('.sql', ''),
    filename,
  }));
};

// 执行单个迁移
const executeMigration = async (migration: Migration): Promise<void> => {
  const filePath = path.join(MIGRATIONS_DIR, migration.filename);
  const sql = fs.readFileSync(filePath, 'utf8');
  
  console.log(`Executing migration: ${migration.filename}`);
  
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // 执行迁移SQL
    await client.query(sql);
    
    // 记录迁移
    await client.query(
      'INSERT INTO migrations (id, filename) VALUES ($1, $2)',
      [migration.id, migration.filename]
    );
    
    await client.query('COMMIT');
    console.log(`✅ Migration ${migration.filename} executed successfully`);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error(`❌ Migration ${migration.filename} failed:`, error);
    throw error;
  } finally {
    client.release();
  }
};

// 主迁移函数
export const runMigrations = async (): Promise<void> => {
  try {
    console.log('🔄 Starting database migrations...');
    
    // 创建迁移记录表
    await createMigrationsTable();
    
    // 获取已执行和所有迁移
    const executedMigrations = await getExecutedMigrations();
    const allMigrations = getAllMigrations();
    
    // 找出未执行的迁移
    const pendingMigrations = allMigrations.filter(
      migration => !executedMigrations.includes(migration.id)
    );
    
    if (pendingMigrations.length === 0) {
      console.log('✅ No pending migrations');
      return;
    }
    
    console.log(`📋 Found ${pendingMigrations.length} pending migrations`);
    
    // 执行未执行的迁移
    for (const migration of pendingMigrations) {
      await executeMigration(migration);
    }
    
    console.log('🎉 All migrations completed successfully');
  } catch (error) {
    console.error('💥 Migration failed:', error);
    throw error;
  }
};

// 如果直接运行此文件
if (require.main === module) {
  runMigrations()
    .then(() => {
      console.log('Migration process completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration process failed:', error);
      process.exit(1);
    });
}