import { Request, Response } from 'express';
import { InventoryService, InventoryFilter } from '../services/InventoryService';
import { ApiResponse } from '../types';

export class InventoryController {
  private inventoryService = new InventoryService();

  // 获取库存总览状态
  getInventoryStatus = async (req: Request, res: Response): Promise<void> => {
    try {
      const filter: InventoryFilter = {
        search: req.query.search as string,
        category: req.query.category as string,
        locationId: req.query.locationId as string,
        isLowStock: req.query.isLowStock === 'true' ? true : req.query.isLowStock === 'false' ? false : undefined,
        hasStock: req.query.hasStock === 'true' ? true : req.query.hasStock === 'false' ? false : undefined,
        minStock: req.query.minStock ? parseInt(req.query.minStock as string) : undefined,
        maxStock: req.query.maxStock ? parseInt(req.query.maxStock as string) : undefined,
      };

      // 移除undefined值
      Object.keys(filter).forEach(key => {
        if (filter[key as keyof InventoryFilter] === undefined) {
          delete filter[key as keyof InventoryFilter];
        }
      });

      const inventoryStatus = await this.inventoryService.getInventoryStatus(filter);

      const response: ApiResponse = {
        success: true,
        message: '库存状态获取成功',
        data: inventoryStatus
      };

      res.json(response);
    } catch (error) {
      const response: ApiResponse = {
        success: false,
        message: '获取库存状态失败',
        error: error instanceof Error ? error.message : '未知错误'
      };

      res.status(500).json(response);
    }
  };

  // 获取物品库存详情
  getItemInventory = async (req: Request, res: Response): Promise<void> => {
    try {
      const { itemId } = req.params;

      if (!itemId) {
        const response: ApiResponse = {
          success: false,
          message: '物品ID不能为空'
        };
        res.status(400).json(response);
        return;
      }

      const inventoryDetail = await this.inventoryService.getItemInventory(itemId);

      const response: ApiResponse = {
        success: true,
        message: '物品库存详情获取成功',
        data: inventoryDetail
      };

      res.json(response);
    } catch (error) {
      const response: ApiResponse = {
        success: false,
        message: '获取物品库存详情失败',
        error: error instanceof Error ? error.message : '未知错误'
      };

      const statusCode = error instanceof Error && error.message.includes('不存在') ? 404 : 500;
      res.status(statusCode).json(response);
    }
  };

  // 搜索库存
  searchInventory = async (req: Request, res: Response): Promise<void> => {
    try {
      const { q } = req.query;

      if (!q || typeof q !== 'string') {
        const response: ApiResponse = {
          success: false,
          message: '搜索关键词不能为空'
        };
        res.status(400).json(response);
        return;
      }

      const searchResults = await this.inventoryService.searchInventory(q);

      const response: ApiResponse = {
        success: true,
        message: '库存搜索成功',
        data: searchResults
      };

      res.json(response);
    } catch (error) {
      const response: ApiResponse = {
        success: false,
        message: '库存搜索失败',
        error: error instanceof Error ? error.message : '未知错误'
      };

      res.status(500).json(response);
    }
  };

  // 获取低库存预警列表
  getLowStockItems = async (req: Request, res: Response): Promise<void> => {
    try {
      const threshold = req.query.threshold ? parseInt(req.query.threshold as string) : undefined;

      if (threshold !== undefined && (isNaN(threshold) || threshold < 0)) {
        const response: ApiResponse = {
          success: false,
          message: '阈值必须是非负整数'
        };
        res.status(400).json(response);
        return;
      }

      const lowStockItems = await this.inventoryService.getLowStockItems(threshold);

      const response: ApiResponse = {
        success: true,
        message: '低库存预警列表获取成功',
        data: lowStockItems
      };

      res.json(response);
    } catch (error) {
      const response: ApiResponse = {
        success: false,
        message: '获取低库存预警列表失败',
        error: error instanceof Error ? error.message : '未知错误'
      };

      res.status(500).json(response);
    }
  };

  // 获取位置库存汇总
  getLocationInventorySummary = async (req: Request, res: Response): Promise<void> => {
    try {
      const { locationId } = req.params;

      if (!locationId) {
        const response: ApiResponse = {
          success: false,
          message: '位置ID不能为空'
        };
        res.status(400).json(response);
        return;
      }

      const locationSummary = await this.inventoryService.getLocationInventorySummary(locationId);

      const response: ApiResponse = {
        success: true,
        message: '位置库存汇总获取成功',
        data: locationSummary
      };

      res.json(response);
    } catch (error) {
      const response: ApiResponse = {
        success: false,
        message: '获取位置库存汇总失败',
        error: error instanceof Error ? error.message : '未知错误'
      };

      const statusCode = error instanceof Error && error.message.includes('不存在') ? 404 : 500;
      res.status(statusCode).json(response);
    }
  };

  // 获取库存统计信息
  getInventoryStatistics = async (req: Request, res: Response): Promise<void> => {
    try {
      const statistics = await this.inventoryService.getInventoryStatistics();

      const response: ApiResponse = {
        success: true,
        message: '库存统计信息获取成功',
        data: statistics
      };

      res.json(response);
    } catch (error) {
      const response: ApiResponse = {
        success: false,
        message: '获取库存统计信息失败',
        error: error instanceof Error ? error.message : '未知错误'
      };

      res.status(500).json(response);
    }
  };

  // 获取库存变化历史
  getInventoryHistory = async (req: Request, res: Response): Promise<void> => {
    try {
      const { itemId } = req.params;
      const { locationId, days } = req.query;

      if (!itemId) {
        const response: ApiResponse = {
          success: false,
          message: '物品ID不能为空'
        };
        res.status(400).json(response);
        return;
      }

      const daysNumber = days ? parseInt(days as string) : 30;
      if (isNaN(daysNumber) || daysNumber <= 0 || daysNumber > 365) {
        const response: ApiResponse = {
          success: false,
          message: '天数必须是1-365之间的整数'
        };
        res.status(400).json(response);
        return;
      }

      const history = await this.inventoryService.getInventoryHistory(
        itemId,
        locationId as string,
        daysNumber
      );

      const response: ApiResponse = {
        success: true,
        message: '库存变化历史获取成功',
        data: history
      };

      res.json(response);
    } catch (error) {
      const response: ApiResponse = {
        success: false,
        message: '获取库存变化历史失败',
        error: error instanceof Error ? error.message : '未知错误'
      };

      const statusCode = error instanceof Error && error.message.includes('不存在') ? 404 : 500;
      res.status(statusCode).json(response);
    }
  };

  // 获取库存概览（仪表板用）
  getInventoryOverview = async (req: Request, res: Response): Promise<void> => {
    try {
      // 并行获取多个统计信息
      const [statistics, lowStockItems, recentInventoryStatus] = await Promise.all([
        this.inventoryService.getInventoryStatistics(),
        this.inventoryService.getLowStockItems(),
        this.inventoryService.getInventoryStatus({ hasStock: true })
      ]);

      // 计算一些额外的概览信息
      const overview = {
        statistics,
        lowStockCount: lowStockItems.length,
        criticalLowStock: lowStockItems.filter(item => item.currentStock === 0).length,
        activeLocationsWithStock: statistics.topLocations.length,
        totalStockValue: statistics.totalStock, // 这里可以后续加入价格计算
        recentActivity: {
          totalItemsWithStock: recentInventoryStatus.length,
          categoriesWithStock: [...new Set(recentInventoryStatus.map(item => item.category))].length
        }
      };

      const response: ApiResponse = {
        success: true,
        message: '库存概览获取成功',
        data: overview
      };

      res.json(response);
    } catch (error) {
      const response: ApiResponse = {
        success: false,
        message: '获取库存概览失败',
        error: error instanceof Error ? error.message : '未知错误'
      };

      res.status(500).json(response);
    }
  };

  // 批量检查库存可用性（用于出库前验证）
  checkStockAvailability = async (req: Request, res: Response): Promise<void> => {
    try {
      const { items } = req.body;

      if (!Array.isArray(items) || items.length === 0) {
        const response: ApiResponse = {
          success: false,
          message: '物品列表不能为空'
        };
        res.status(400).json(response);
        return;
      }

      // 验证每个物品的格式
      for (const item of items) {
        if (!item.itemId || !item.locationId || !item.quantity || item.quantity <= 0) {
          const response: ApiResponse = {
            success: false,
            message: '物品信息格式不正确，需要包含itemId、locationId和quantity'
          };
          res.status(400).json(response);
          return;
        }
      }

      // 检查每个物品的库存可用性
      const availabilityResults = await Promise.all(
        items.map(async (item: { itemId: string; locationId: string; quantity: number }) => {
          try {
            const inventoryDetail = await this.inventoryService.getItemInventory(item.itemId);
            const locationStock = inventoryDetail.locationStocks.find(
              stock => stock.locationId === item.locationId
            );

            const currentStock = locationStock ? locationStock.stock : 0;
            const isAvailable = currentStock >= item.quantity;

            return {
              itemId: item.itemId,
              itemName: inventoryDetail.itemName,
              locationId: item.locationId,
              locationCode: locationStock?.locationCode || '',
              locationName: locationStock?.locationName || '',
              requestedQuantity: item.quantity,
              currentStock,
              isAvailable,
              shortage: isAvailable ? 0 : item.quantity - currentStock
            };
          } catch (error) {
            return {
              itemId: item.itemId,
              itemName: '',
              locationId: item.locationId,
              locationCode: '',
              locationName: '',
              requestedQuantity: item.quantity,
              currentStock: 0,
              isAvailable: false,
              shortage: item.quantity,
              error: error instanceof Error ? error.message : '未知错误'
            };
          }
        })
      );

      const allAvailable = availabilityResults.every(result => result.isAvailable);
      const unavailableItems = availabilityResults.filter(result => !result.isAvailable);

      const response: ApiResponse = {
        success: true,
        message: allAvailable ? '所有物品库存充足' : '部分物品库存不足',
        data: {
          allAvailable,
          results: availabilityResults,
          unavailableCount: unavailableItems.length,
          unavailableItems
        }
      };

      res.json(response);
    } catch (error) {
      const response: ApiResponse = {
        success: false,
        message: '检查库存可用性失败',
        error: error instanceof Error ? error.message : '未知错误'
      };

      res.status(500).json(response);
    }
  };
}

export default InventoryController;