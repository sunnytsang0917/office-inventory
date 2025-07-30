import { Request, Response, NextFunction } from 'express';
import LocationService from '../services/LocationService';
import LocationModel, { LocationFilter } from '../models/Location';
import { ApiResponse } from '../types';

export class LocationController {
  private locationService: LocationService;

  constructor() {
    this.locationService = new LocationService();
  }

  // 创建位置
  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // 验证请求数据
      const locationData = LocationModel.validateCreate(req.body);
      
      // 创建位置
      const location = await this.locationService.create(locationData);
      
      const response: ApiResponse = {
        success: true,
        message: '位置创建成功',
        data: location.toJSON(),
      };
      
      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  };

  // 获取位置列表
  list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // 解析查询参数
      const filter: LocationFilter = {
        parentId: req.query.parentId as string,
        level: req.query.level ? parseInt(req.query.level as string) : undefined,
        isActive: req.query.isActive ? req.query.isActive === 'true' : undefined,
        includeInactive: req.query.includeInactive === 'true',
        search: req.query.search as string,
      };

      // 获取位置列表
      const locations = await this.locationService.list(filter);
      
      const response: ApiResponse = {
        success: true,
        message: '位置列表获取成功',
        data: locations.map(location => location.toJSON()),
      };
      
      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  // 获取层级结构
  getHierarchy = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const includeInactive = req.query.includeInactive === 'true';
      
      // 获取层级结构
      const hierarchy = await this.locationService.getHierarchy(includeInactive);
      
      const response: ApiResponse = {
        success: true,
        message: '位置层级结构获取成功',
        data: hierarchy,
      };
      
      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  // 获取根级位置
  getRootLocations = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const includeInactive = req.query.includeInactive === 'true';
      
      // 获取根级位置
      const rootLocations = await this.locationService.getRootLocations(includeInactive);
      
      const response: ApiResponse = {
        success: true,
        message: '根级位置获取成功',
        data: rootLocations.map(location => location.toJSON()),
      };
      
      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  // 根据ID获取位置
  getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      
      // 获取位置
      const location = await this.locationService.getById(id);
      
      if (!location) {
        const response: ApiResponse = {
          success: false,
          message: '位置不存在',
        };
        res.status(404).json(response);
        return;
      }
      
      const response: ApiResponse = {
        success: true,
        message: '位置获取成功',
        data: location.toJSON(),
      };
      
      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  // 根据编码获取位置
  getByCode = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { code } = req.params;
      
      // 获取位置
      const location = await this.locationService.getByCode(code);
      
      if (!location) {
        const response: ApiResponse = {
          success: false,
          message: '位置不存在',
        };
        res.status(404).json(response);
        return;
      }
      
      const response: ApiResponse = {
        success: true,
        message: '位置获取成功',
        data: location.toJSON(),
      };
      
      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  // 获取子级位置
  getChildren = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const includeInactive = req.query.includeInactive === 'true';
      
      // 获取子级位置
      const children = await this.locationService.getChildren(id, includeInactive);
      
      const response: ApiResponse = {
        success: true,
        message: '子级位置获取成功',
        data: children.map(location => location.toJSON()),
      };
      
      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  // 更新位置
  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      
      // 验证更新数据
      const updateData = LocationModel.validateUpdate(req.body);
      
      // 更新位置
      const location = await this.locationService.update(id, updateData);
      
      const response: ApiResponse = {
        success: true,
        message: '位置更新成功',
        data: location.toJSON(),
      };
      
      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  // 删除位置
  delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      
      // 删除位置
      await this.locationService.delete(id);
      
      const response: ApiResponse = {
        success: true,
        message: '位置删除成功',
      };
      
      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  // 获取位置库存信息
  getInventory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      
      // 获取位置库存
      const inventory = await this.locationService.getLocationInventory(id);
      
      const response: ApiResponse = {
        success: true,
        message: '位置库存信息获取成功',
        data: inventory,
      };
      
      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  // 设置物品默认位置
  setItemDefaultLocation = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { itemId, locationId } = req.body;
      
      if (!itemId || !locationId) {
        const response: ApiResponse = {
          success: false,
          message: '物品ID和位置ID都是必需的',
        };
        res.status(400).json(response);
        return;
      }
      
      // 设置默认位置
      await this.locationService.setItemDefaultLocation(itemId, locationId);
      
      const response: ApiResponse = {
        success: true,
        message: '物品默认位置设置成功',
      };
      
      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  // 获取位置路径
  getPath = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      
      // 获取位置路径
      const path = await this.locationService.getLocationPath(id);
      
      const response: ApiResponse = {
        success: true,
        message: '位置路径获取成功',
        data: path.map(location => location.toJSON()),
      };
      
      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  // 批量更新位置状态
  batchUpdateStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { locationIds, isActive } = req.body;
      
      if (!Array.isArray(locationIds) || typeof isActive !== 'boolean') {
        const response: ApiResponse = {
          success: false,
          message: '请提供有效的位置ID数组和状态值',
        };
        res.status(400).json(response);
        return;
      }
      
      // 批量更新状态
      await this.locationService.batchUpdateStatus(locationIds, isActive);
      
      const response: ApiResponse = {
        success: true,
        message: '位置状态批量更新成功',
      };
      
      res.json(response);
    } catch (error) {
      next(error);
    }
  };
}

export default LocationController;