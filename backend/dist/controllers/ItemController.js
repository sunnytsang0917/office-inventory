"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.ItemController = void 0;
const ItemService_1 = require("../services/ItemService");
const Item_1 = require("../models/Item");
const zod_1 = require("zod");
const XLSX = __importStar(require("xlsx"));
class ItemController {
    constructor() {
        this.itemService = new ItemService_1.ItemService();
        this.createItem = async (req, res, next) => {
            try {
                const validatedData = Item_1.ItemModel.validate(req.body);
                const item = await this.itemService.createItem(validatedData);
                res.status(201).json({
                    success: true,
                    message: '物品创建成功',
                    data: item.toJSON()
                });
            }
            catch (error) {
                next(error);
            }
        };
        this.getItem = async (req, res, next) => {
            try {
                const { id } = req.params;
                const includeInventory = req.query.includeInventory === 'true';
                if (includeInventory) {
                    const item = await this.itemService.getItemWithInventory(id);
                    res.json({
                        success: true,
                        data: item
                    });
                }
                else {
                    const item = await this.itemService.getItem(id);
                    res.json({
                        success: true,
                        data: item.toJSON()
                    });
                }
            }
            catch (error) {
                next(error);
            }
        };
        this.updateItem = async (req, res, next) => {
            try {
                const { id } = req.params;
                const validatedData = Item_1.ItemModel.validateUpdate(req.body);
                const item = await this.itemService.updateItem(id, validatedData);
                res.json({
                    success: true,
                    message: '物品更新成功',
                    data: item.toJSON()
                });
            }
            catch (error) {
                next(error);
            }
        };
        this.deleteItem = async (req, res, next) => {
            try {
                const { id } = req.params;
                await this.itemService.deleteItem(id);
                res.json({
                    success: true,
                    message: '物品删除成功'
                });
            }
            catch (error) {
                next(error);
            }
        };
        this.listItems = async (req, res, next) => {
            try {
                const filter = {
                    category: req.query.category,
                    search: req.query.search,
                    defaultLocationId: req.query.defaultLocationId,
                    hasDefaultLocation: req.query.hasDefaultLocation === 'true' ? true :
                        req.query.hasDefaultLocation === 'false' ? false : undefined
                };
                Object.keys(filter).forEach(key => {
                    if (filter[key] === undefined) {
                        delete filter[key];
                    }
                });
                const items = await this.itemService.listItems(filter);
                res.json({
                    success: true,
                    data: items.map(item => item.toJSON()),
                    total: items.length
                });
            }
            catch (error) {
                next(error);
            }
        };
        this.getCategories = async (req, res, next) => {
            try {
                const categories = await this.itemService.getCategories();
                res.json({
                    success: true,
                    data: categories
                });
            }
            catch (error) {
                next(error);
            }
        };
        this.batchImportItems = async (req, res, next) => {
            try {
                if (!req.file) {
                    res.status(400).json({
                        success: false,
                        message: '请上传Excel文件'
                    });
                    return;
                }
                const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const jsonData = XLSX.utils.sheet_to_json(worksheet);
                if (jsonData.length === 0) {
                    res.status(400).json({
                        success: false,
                        message: 'Excel文件为空'
                    });
                    return;
                }
                const ExcelRowSchema = zod_1.z.object({
                    '物品名称': zod_1.z.string().min(1, '物品名称不能为空'),
                    '物品类别': zod_1.z.string().min(1, '物品类别不能为空'),
                    '规格型号': zod_1.z.string().optional(),
                    '计量单位': zod_1.z.string().min(1, '计量单位不能为空'),
                    '默认位置编码': zod_1.z.string().optional(),
                    '低库存阈值': zod_1.z.union([zod_1.z.number(), zod_1.z.string()]).optional()
                });
                const items = [];
                const validationErrors = [];
                for (let i = 0; i < jsonData.length; i++) {
                    try {
                        const row = jsonData[i];
                        const validatedRow = ExcelRowSchema.parse(row);
                        let defaultLocationId;
                        if (validatedRow['默认位置编码']) {
                            defaultLocationId = validatedRow['默认位置编码'];
                        }
                        const lowStockThreshold = validatedRow['低库存阈值'] ?
                            (typeof validatedRow['低库存阈值'] === 'string' ?
                                parseInt(validatedRow['低库存阈值']) :
                                validatedRow['低库存阈值']) : 0;
                        items.push({
                            name: validatedRow['物品名称'],
                            category: validatedRow['物品类别'],
                            specification: validatedRow['规格型号'] || undefined,
                            unit: validatedRow['计量单位'],
                            defaultLocationId,
                            lowStockThreshold: isNaN(lowStockThreshold) ? 0 : lowStockThreshold
                        });
                    }
                    catch (error) {
                        validationErrors.push({
                            row: i + 1,
                            error: error instanceof Error ? error.message : '数据格式错误'
                        });
                    }
                }
                if (validationErrors.length > 0) {
                    res.status(400).json({
                        success: false,
                        message: 'Excel数据格式错误',
                        errors: validationErrors
                    });
                    return;
                }
                const result = await this.itemService.batchImportItems(items);
                res.json({
                    success: true,
                    message: '批量导入完成',
                    data: {
                        total: items.length,
                        success: result.success,
                        failed: result.failed,
                        errors: result.errors
                    }
                });
            }
            catch (error) {
                next(error);
            }
        };
        this.downloadTemplate = async (req, res, next) => {
            try {
                const templateData = [
                    {
                        '物品名称': '示例物品',
                        '物品类别': '办公用品',
                        '规格型号': 'A4规格',
                        '计量单位': '个',
                        '默认位置编码': 'A-1-01',
                        '低库存阈值': 10
                    }
                ];
                const workbook = XLSX.utils.book_new();
                const worksheet = XLSX.utils.json_to_sheet(templateData);
                worksheet['!cols'] = [
                    { width: 20 },
                    { width: 15 },
                    { width: 20 },
                    { width: 10 },
                    { width: 15 },
                    { width: 12 }
                ];
                XLSX.utils.book_append_sheet(workbook, worksheet, '物品导入模板');
                const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
                res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
                res.setHeader('Content-Disposition', 'attachment; filename="item_import_template.xlsx"');
                res.send(buffer);
            }
            catch (error) {
                next(error);
            }
        };
    }
}
exports.ItemController = ItemController;
exports.default = ItemController;
//# sourceMappingURL=ItemController.js.map