"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runSeeds = void 0;
const database_1 = require("../config/database");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const SEEDS_DIR = path_1.default.join(__dirname, 'seeds');
const createSeedsTable = async () => {
    const query = `
    CREATE TABLE IF NOT EXISTS seeds (
      id VARCHAR(255) PRIMARY KEY,
      filename VARCHAR(255) NOT NULL,
      executed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `;
    await database_1.pool.query(query);
};
const getExecutedSeeds = async () => {
    const result = await database_1.pool.query('SELECT id FROM seeds ORDER BY executed_at');
    return result.rows.map(row => row.id);
};
const insertInitialUsers = async () => {
    const adminPassword = await bcryptjs_1.default.hash('admin123', 10);
    const employeePassword = await bcryptjs_1.default.hash('employee123', 10);
    await database_1.pool.query(`
    INSERT INTO users (username, password, role, name) VALUES ($1, $2, $3, $4)
    ON CONFLICT (username) DO NOTHING
  `, ['admin', adminPassword, 'admin', '系统管理员']);
    await database_1.pool.query(`
    INSERT INTO users (username, password, role, name) VALUES ($1, $2, $3, $4)
    ON CONFLICT (username) DO NOTHING
  `, ['employee', employeePassword, 'employee', '普通员工']);
    console.log('✅ Initial users created');
};
const executeSeedFile = async (filename) => {
    const filePath = path_1.default.join(SEEDS_DIR, filename);
    const sql = fs_1.default.readFileSync(filePath, 'utf8');
    const sqlWithoutUsers = sql.replace(/INSERT INTO users.*?ON CONFLICT.*?DO NOTHING;/gs, '');
    console.log(`Executing seed file: ${filename}`);
    const client = await database_1.pool.connect();
    try {
        await client.query('BEGIN');
        await client.query(sqlWithoutUsers);
        await client.query('COMMIT');
        console.log(`✅ Seed file ${filename} executed successfully`);
    }
    catch (error) {
        await client.query('ROLLBACK');
        console.error(`❌ Seed file ${filename} failed:`, error);
        throw error;
    }
    finally {
        client.release();
    }
};
const runSeeds = async () => {
    try {
        console.log('🌱 Starting database seeding...');
        await createSeedsTable();
        const executedSeeds = await getExecutedSeeds();
        if (executedSeeds.includes('initial_data')) {
            console.log('✅ Seeds already executed');
            return;
        }
        await insertInitialUsers();
        const seedFiles = fs_1.default.readdirSync(SEEDS_DIR)
            .filter(file => file.endsWith('.sql'))
            .sort();
        for (const filename of seedFiles) {
            await executeSeedFile(filename);
        }
        await database_1.pool.query('INSERT INTO seeds (id, filename) VALUES ($1, $2)', ['initial_data', 'initial_data_complete']);
        console.log('🎉 All seeds completed successfully');
    }
    catch (error) {
        console.error('💥 Seeding failed:', error);
        throw error;
    }
};
exports.runSeeds = runSeeds;
if (require.main === module) {
    (0, exports.runSeeds)()
        .then(() => {
        console.log('Seeding process completed');
        process.exit(0);
    })
        .catch((error) => {
        console.error('Seeding process failed:', error);
        process.exit(1);
    });
}
//# sourceMappingURL=seed.js.map