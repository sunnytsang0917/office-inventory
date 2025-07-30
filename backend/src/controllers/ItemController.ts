import { Request, Response, NextFunction } from 'express';
import { ItemService } from '../services/ItemService';
import { ItemModel } from '../models/Item';
import { z } from 'zod';
import * as XLSX from 'xlsx';

export class ItemController {
  private itemService = new ItemService();

  // 创建物品
  createItem = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const validatedData = ItemModel.validate(req.body);
      const item = await this.itemService.createItem(validatedData);
      
      res.status(201).json({
        success: true,
        message: '物品创建成功',
        data: item.toJSON()
      });
    } catch (error) {
      next(error);
    }
  };

  // 获取物品详情
  getItem = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const includeInventory = req.query.includeInventory === 'true';

      if (includeInventory) {
        const item = await this.itemService.getItemWithInventory(id);
        res.json({
          success: true,
          data: item
        });
      } else {
        const item = await this.itemService.getItem(id);
        res.json({
          success: true,
          data: item.toJSON()
        });
      }
    } catch (error) {
      next(error);
    }
  };

  // 更新物品
  updateItem = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const validatedData = ItemModel.validateUpdate(req.body);
      const item = await this.itemService.updateItem(id, validatedData);
      
      res.json({
        success: true,
        message: '物品更新成功',
        data: item.toJSON()
      });
    } catch (error) {
      next(error);
    }
  };

  // 删除物品
  deleteItem = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      await this.itemService.deleteItem(id);
      
      res.json({
        success: true,
        message: '物品删除成功'
      });
    } catch (error) {
      next(error);
    }
  };

  // 获取物品列表
  listItems = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const filter = {
        category: req.query.category as string,
        search: req.query.search as string,
        defaultLocationId: req.query.defaultLocationId as string,
        hasDefaultLocation: req.query.hasDefaultLocation === 'true' ? true : 
                           req.query.hasDefaultLocation === 'false' ? false : undefined
      };

      // 移除undefined值
      Object.keys(filter).forEach(key => {
        if (filter[key as keyof typeof filter] === undefined) {
          delete filter[key as keyof typeof filter];
        }
      });

      const items = await this.itemService.listItems(filter);
      
      res.json({
        success: true,
        data: items.map(item => item.toJSON()),
        total: items.length
      });
    } catch (error) {
      next(error);
    }
  };

  // 获取物品分类
  getCategories = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const categories = await this.itemService.getCategories();
      
      res.json({
        success: true,
        data: categories
      });
    } catch (error) {
      next(error);
    }
  };

  // 批量导入物品
  batchImportItems = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.file) {
        res.status(400).json({
          success: false,
          message: '请上传Excel文件'
        });
        return;
      }

      // 解析Excel文件
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

      // 验证Excel格式并转换数据
      const ExcelRowSchema = z.object({
        '物品名称': z.string().min(1, '物品名称不能为空'),
        '物品类别': z.string().min(1, '物品类别不能为空'),
        '规格型号': z.string().optional(),
        '计量单位': z.string().min(1, '计量单位不能为空'),
        '默认位置编码': z.string().optional(),
        '低库存阈值': z.union([z.number(), z.string()]).optional()
      });

      const items = [];
      const validationErrors = [];

      for (let i = 0; i < jsonData.length; i++) {
        try {
          const row = jsonData[i] as any;
          const validatedRow = ExcelRowSchema.parse(row);
          
          // 如果提供了位置编码，需要查找对应的位置ID
          let defaultLocationId: string | undefined;
          if (validatedRow['默认位置编码']) {
            // 这里需要根据位置编码查找位置ID
            // 为了简化，暂时跳过位置验证，在ItemService中处理
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
        } catch (error) {
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

      // 执行批量导入
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
    } catch (error) {
      next(error);
    }
  };

  // 下载导入模板
  downloadTemplate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // 创建模板数据
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

      // 创建工作簿
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(templateData);
      
      // 设置列宽
      worksheet['!cols'] = [
        { width: 20 }, // 物品名称
        { width: 15 }, // 物品类别
        { width: 20 }, // 规格型号
        { width: 10 }, // 计量单位
        { width: 15 }, // 默认位置编码
        { width: 12 }  // 低库存阈值
      ];

      XLSX.utils.book_append_sheet(workbook, worksheet, '物品导入模板');

      // 生成Excel文件
      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename="item_import_template.xlsx"');
      res.send(buffer);
    } catch (error) {
      next(error);
    }
  };
}

export default ItemController;