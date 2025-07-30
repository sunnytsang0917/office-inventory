-- 插入默认管理员用户 (密码: admin123)
INSERT INTO users (username, password, role, name) VALUES 
('admin', '$2b$10$rOzJqKqVQQGVQQGVQQGVQeKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKK', 'admin', '系统管理员')
ON CONFLICT (username) DO NOTHING;

-- 插入示例员工用户 (密码: employee123)
INSERT INTO users (username, password, role, name) VALUES 
('employee', '$2b$10$rOzJqKqVQQGVQQGVQQGVQeKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKK', 'employee', '普通员工')
ON CONFLICT (username) DO NOTHING;

-- 插入库房位置层级结构
-- 主仓库
INSERT INTO locations (code, name, description, level) VALUES 
('MAIN', '主仓库', '办公室主要存储区域', 0)
ON CONFLICT (code) DO NOTHING;

-- A区域
INSERT INTO locations (code, name, description, parent_id, level) VALUES 
('A', 'A区', 'A区存储区域', (SELECT id FROM locations WHERE code = 'MAIN'), 1)
ON CONFLICT (code) DO NOTHING;

-- B区域
INSERT INTO locations (code, name, description, parent_id, level) VALUES 
('B', 'B区', 'B区存储区域', (SELECT id FROM locations WHERE code = 'MAIN'), 1)
ON CONFLICT (code) DO NOTHING;

-- A区楼层
INSERT INTO locations (code, name, description, parent_id, level) VALUES 
('A-1', 'A区1层', 'A区第1层', (SELECT id FROM locations WHERE code = 'A'), 2),
('A-2', 'A区2层', 'A区第2层', (SELECT id FROM locations WHERE code = 'A'), 2)
ON CONFLICT (code) DO NOTHING;

-- B区楼层
INSERT INTO locations (code, name, description, parent_id, level) VALUES 
('B-1', 'B区1层', 'B区第1层', (SELECT id FROM locations WHERE code = 'B'), 2)
ON CONFLICT (code) DO NOTHING;

-- A区1层货架
INSERT INTO locations (code, name, description, parent_id, level) VALUES 
('A-1-01', 'A区1层货架01', 'A区1层第1个货架', (SELECT id FROM locations WHERE code = 'A-1'), 3),
('A-1-02', 'A区1层货架02', 'A区1层第2个货架', (SELECT id FROM locations WHERE code = 'A-1'), 3),
('A-1-03', 'A区1层货架03', 'A区1层第3个货架', (SELECT id FROM locations WHERE code = 'A-1'), 3)
ON CONFLICT (code) DO NOTHING;

-- A区2层货架
INSERT INTO locations (code, name, description, parent_id, level) VALUES 
('A-2-01', 'A区2层货架01', 'A区2层第1个货架', (SELECT id FROM locations WHERE code = 'A-2'), 3),
('A-2-02', 'A区2层货架02', 'A区2层第2个货架', (SELECT id FROM locations WHERE code = 'A-2'), 3)
ON CONFLICT (code) DO NOTHING;

-- B区1层货架
INSERT INTO locations (code, name, description, parent_id, level) VALUES 
('B-1-01', 'B区1层货架01', 'B区1层第1个货架', (SELECT id FROM locations WHERE code = 'B-1'), 3),
('B-1-02', 'B区1层货架02', 'B区1层第2个货架', (SELECT id FROM locations WHERE code = 'B-1'), 3)
ON CONFLICT (code) DO NOTHING;

-- 插入示例物品
INSERT INTO items (name, category, specification, unit, default_location_id, low_stock_threshold) VALUES 
('A4复印纸', '办公用品', '80g/m² 500张/包', '包', (SELECT id FROM locations WHERE code = 'A-1-01'), 10),
('圆珠笔', '文具', '蓝色 0.7mm', '支', (SELECT id FROM locations WHERE code = 'A-1-01'), 20),
('订书机', '办公设备', '标准型 可装订20页', '台', (SELECT id FROM locations WHERE code = 'A-1-02'), 2),
('文件夹', '办公用品', 'A4规格 塑料材质', '个', (SELECT id FROM locations WHERE code = 'A-1-02'), 15),
('打印机墨盒', '耗材', 'HP LaserJet 黑色', '个', (SELECT id FROM locations WHERE code = 'A-2-01'), 5),
('便利贴', '文具', '黄色 76x76mm', '本', (SELECT id FROM locations WHERE code = 'A-1-01'), 30),
('计算器', '办公设备', '12位数显示 太阳能', '台', (SELECT id FROM locations WHERE code = 'A-2-02'), 3),
('胶带', '办公用品', '透明胶带 18mm宽', '卷', (SELECT id FROM locations WHERE code = 'B-1-01'), 25)
ON CONFLICT DO NOTHING;

-- 插入示例交易记录
INSERT INTO transactions (item_id, location_id, type, quantity, date, operator, supplier) VALUES 
-- A4复印纸入库
((SELECT id FROM items WHERE name = 'A4复印纸'), (SELECT id FROM locations WHERE code = 'A-1-01'), 'inbound', 50, '2024-01-15 09:00:00', '张三', '办公用品供应商'),
-- 圆珠笔入库
((SELECT id FROM items WHERE name = '圆珠笔'), (SELECT id FROM locations WHERE code = 'A-1-01'), 'inbound', 100, '2024-01-15 09:30:00', '张三', '文具供应商'),
-- 订书机入库
((SELECT id FROM items WHERE name = '订书机'), (SELECT id FROM locations WHERE code = 'A-1-02'), 'inbound', 10, '2024-01-16 10:00:00', '李四', '办公设备供应商'),
-- 文件夹入库
((SELECT id FROM items WHERE name = '文件夹'), (SELECT id FROM locations WHERE code = 'A-1-02'), 'inbound', 30, '2024-01-16 10:30:00', '李四', '办公用品供应商'),
-- 打印机墨盒入库
((SELECT id FROM items WHERE name = '打印机墨盒'), (SELECT id FROM locations WHERE code = 'A-2-01'), 'inbound', 15, '2024-01-17 11:00:00', '王五', '耗材供应商'),
-- 便利贴入库
((SELECT id FROM items WHERE name = '便利贴'), (SELECT id FROM locations WHERE code = 'A-1-01'), 'inbound', 50, '2024-01-17 11:30:00', '张三', '文具供应商'),
-- 计算器入库
((SELECT id FROM items WHERE name = '计算器'), (SELECT id FROM locations WHERE code = 'A-2-02'), 'inbound', 8, '2024-01-18 14:00:00', '李四', '办公设备供应商'),
-- 胶带入库
((SELECT id FROM items WHERE name = '胶带'), (SELECT id FROM locations WHERE code = 'B-1-01'), 'inbound', 40, '2024-01-18 14:30:00', '王五', '办公用品供应商')
ON CONFLICT DO NOTHING;

-- 插入一些出库记录
INSERT INTO transactions (item_id, location_id, type, quantity, date, operator, recipient, purpose) VALUES 
-- A4复印纸出库
((SELECT id FROM items WHERE name = 'A4复印纸'), (SELECT id FROM locations WHERE code = 'A-1-01'), 'outbound', 5, '2024-01-20 09:00:00', '张三', '财务部', '月度报表打印'),
-- 圆珠笔出库
((SELECT id FROM items WHERE name = '圆珠笔'), (SELECT id FROM locations WHERE code = 'A-1-01'), 'outbound', 10, '2024-01-20 09:30:00', '李四', '销售部', '日常办公使用'),
-- 文件夹出库
((SELECT id FROM items WHERE name = '文件夹'), (SELECT id FROM locations WHERE code = 'A-1-02'), 'outbound', 3, '2024-01-21 10:00:00', '王五', '人事部', '员工档案整理'),
-- 便利贴出库
((SELECT id FROM items WHERE name = '便利贴'), (SELECT id FROM locations WHERE code = 'A-1-01'), 'outbound', 5, '2024-01-21 10:30:00', '张三', '项目组', '会议记录'),
-- 胶带出库
((SELECT id FROM items WHERE name = '胶带'), (SELECT id FROM locations WHERE code = 'B-1-01'), 'outbound', 2, '2024-01-22 11:00:00', '李四', '行政部', '包装用品')
ON CONFLICT DO NOTHING;