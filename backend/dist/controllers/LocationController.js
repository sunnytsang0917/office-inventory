"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LocationController = void 0;
const LocationService_1 = __importDefault(require("../services/LocationService"));
const Location_1 = __importDefault(require("../models/Location"));
class LocationController {
    constructor() {
        this.create = async (req, res, next) => {
            try {
                const locationData = Location_1.default.validateCreate(req.body);
                const location = await this.locationService.create(locationData);
                const response = {
                    success: true,
                    message: '位置创建成功',
                    data: location.toJSON(),
                };
                res.status(201).json(response);
            }
            catch (error) {
                next(error);
            }
        };
        this.list = async (req, res, next) => {
            try {
                const filter = {
                    parentId: req.query.parentId,
                    level: req.query.level ? parseInt(req.query.level) : undefined,
                    isActive: req.query.isActive ? req.query.isActive === 'true' : undefined,
                    includeInactive: req.query.includeInactive === 'true',
                    search: req.query.search,
                };
                const locations = await this.locationService.list(filter);
                const response = {
                    success: true,
                    message: '位置列表获取成功',
                    data: locations.map(location => location.toJSON()),
                };
                res.json(response);
            }
            catch (error) {
                next(error);
            }
        };
        this.getHierarchy = async (req, res, next) => {
            try {
                const includeInactive = req.query.includeInactive === 'true';
                const hierarchy = await this.locationService.getHierarchy(includeInactive);
                const response = {
                    success: true,
                    message: '位置层级结构获取成功',
                    data: hierarchy,
                };
                res.json(response);
            }
            catch (error) {
                next(error);
            }
        };
        this.getRootLocations = async (req, res, next) => {
            try {
                const includeInactive = req.query.includeInactive === 'true';
                const rootLocations = await this.locationService.getRootLocations(includeInactive);
                const response = {
                    success: true,
                    message: '根级位置获取成功',
                    data: rootLocations.map(location => location.toJSON()),
                };
                res.json(response);
            }
            catch (error) {
                next(error);
            }
        };
        this.getById = async (req, res, next) => {
            try {
                const { id } = req.params;
                const location = await this.locationService.getById(id);
                if (!location) {
                    const response = {
                        success: false,
                        message: '位置不存在',
                    };
                    res.status(404).json(response);
                    return;
                }
                const response = {
                    success: true,
                    message: '位置获取成功',
                    data: location.toJSON(),
                };
                res.json(response);
            }
            catch (error) {
                next(error);
            }
        };
        this.getByCode = async (req, res, next) => {
            try {
                const { code } = req.params;
                const location = await this.locationService.getByCode(code);
                if (!location) {
                    const response = {
                        success: false,
                        message: '位置不存在',
                    };
                    res.status(404).json(response);
                    return;
                }
                const response = {
                    success: true,
                    message: '位置获取成功',
                    data: location.toJSON(),
                };
                res.json(response);
            }
            catch (error) {
                next(error);
            }
        };
        this.getChildren = async (req, res, next) => {
            try {
                const { id } = req.params;
                const includeInactive = req.query.includeInactive === 'true';
                const children = await this.locationService.getChildren(id, includeInactive);
                const response = {
                    success: true,
                    message: '子级位置获取成功',
                    data: children.map(location => location.toJSON()),
                };
                res.json(response);
            }
            catch (error) {
                next(error);
            }
        };
        this.update = async (req, res, next) => {
            try {
                const { id } = req.params;
                const updateData = Location_1.default.validateUpdate(req.body);
                const location = await this.locationService.update(id, updateData);
                const response = {
                    success: true,
                    message: '位置更新成功',
                    data: location.toJSON(),
                };
                res.json(response);
            }
            catch (error) {
                next(error);
            }
        };
        this.delete = async (req, res, next) => {
            try {
                const { id } = req.params;
                await this.locationService.delete(id);
                const response = {
                    success: true,
                    message: '位置删除成功',
                };
                res.json(response);
            }
            catch (error) {
                next(error);
            }
        };
        this.getInventory = async (req, res, next) => {
            try {
                const { id } = req.params;
                const inventory = await this.locationService.getLocationInventory(id);
                const response = {
                    success: true,
                    message: '位置库存信息获取成功',
                    data: inventory,
                };
                res.json(response);
            }
            catch (error) {
                next(error);
            }
        };
        this.setItemDefaultLocation = async (req, res, next) => {
            try {
                const { itemId, locationId } = req.body;
                if (!itemId || !locationId) {
                    const response = {
                        success: false,
                        message: '物品ID和位置ID都是必需的',
                    };
                    res.status(400).json(response);
                    return;
                }
                await this.locationService.setItemDefaultLocation(itemId, locationId);
                const response = {
                    success: true,
                    message: '物品默认位置设置成功',
                };
                res.json(response);
            }
            catch (error) {
                next(error);
            }
        };
        this.getPath = async (req, res, next) => {
            try {
                const { id } = req.params;
                const path = await this.locationService.getLocationPath(id);
                const response = {
                    success: true,
                    message: '位置路径获取成功',
                    data: path.map(location => location.toJSON()),
                };
                res.json(response);
            }
            catch (error) {
                next(error);
            }
        };
        this.batchUpdateStatus = async (req, res, next) => {
            try {
                const { locationIds, isActive } = req.body;
                if (!Array.isArray(locationIds) || typeof isActive !== 'boolean') {
                    const response = {
                        success: false,
                        message: '请提供有效的位置ID数组和状态值',
                    };
                    res.status(400).json(response);
                    return;
                }
                await this.locationService.batchUpdateStatus(locationIds, isActive);
                const response = {
                    success: true,
                    message: '位置状态批量更新成功',
                };
                res.json(response);
            }
            catch (error) {
                next(error);
            }
        };
        this.locationService = new LocationService_1.default();
    }
}
exports.LocationController = LocationController;
exports.default = LocationController;
//# sourceMappingURL=LocationController.js.map