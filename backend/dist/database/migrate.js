"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runMigrations = void 0;
const database_1 = require("../config/database");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const MIGRATIONS_DIR = path_1.default.join(__dirname, 'migrations');
const createMigrationsTable = async () => {
    const query = `
    CREATE TABLE IF NOT EXISTS migrations (
      id VARCHAR(255) PRIMARY KEY,
      filename VARCHAR(255) NOT NULL,
      executed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `;
    await database_1.pool.query(query);
};
const getExecutedMigrations = async () => {
    const result = await database_1.pool.query('SELECT id FROM migrations ORDER BY executed_at');
    return result.rows.map(row => row.id);
};
const getAllMigrations = () => {
    const files = fs_1.default.readdirSync(MIGRATIONS_DIR)
        .filter(file => file.endsWith('.sql'))
        .sort();
    return files.map(filename => ({
        id: filename.replace('.sql', ''),
        filename,
    }));
};
const executeMigration = async (migration) => {
    const filePath = path_1.default.join(MIGRATIONS_DIR, migration.filename);
    const sql = fs_1.default.readFileSync(filePath, 'utf8');
    console.log(`Executing migration: ${migration.filename}`);
    const client = await database_1.pool.connect();
    try {
        await client.query('BEGIN');
        await client.query(sql);
        await client.query('INSERT INTO migrations (id, filename) VALUES ($1, $2)', [migration.id, migration.filename]);
        await client.query('COMMIT');
        console.log(`✅ Migration ${migration.filename} executed successfully`);
    }
    catch (error) {
        await client.query('ROLLBACK');
        console.error(`❌ Migration ${migration.filename} failed:`, error);
        throw error;
    }
    finally {
        client.release();
    }
};
const runMigrations = async () => {
    try {
        console.log('🔄 Starting database migrations...');
        await createMigrationsTable();
        const executedMigrations = await getExecutedMigrations();
        const allMigrations = getAllMigrations();
        const pendingMigrations = allMigrations.filter(migration => !executedMigrations.includes(migration.id));
        if (pendingMigrations.length === 0) {
            console.log('✅ No pending migrations');
            return;
        }
        console.log(`📋 Found ${pendingMigrations.length} pending migrations`);
        for (const migration of pendingMigrations) {
            await executeMigration(migration);
        }
        console.log('🎉 All migrations completed successfully');
    }
    catch (error) {
        console.error('💥 Migration failed:', error);
        throw error;
    }
};
exports.runMigrations = runMigrations;
if (require.main === module) {
    (0, exports.runMigrations)()
        .then(() => {
        console.log('Migration process completed');
        process.exit(0);
    })
        .catch((error) => {
        console.error('Migration process failed:', error);
        process.exit(1);
    });
}
//# sourceMappingURL=migrate.js.map