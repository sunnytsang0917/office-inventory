"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const LocationController_1 = __importDefault(require("../controllers/LocationController"));
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
const locationController = new LocationController_1.default();
router.post('/', auth_1.authenticateToken, auth_1.requireAdmin, locationController.create);
router.get('/', auth_1.authenticateToken, (0, auth_1.requirePermission)('locations:read'), locationController.list);
router.get('/hierarchy', auth_1.authenticateToken, (0, auth_1.requirePermission)('locations:read'), locationController.getHierarchy);
router.get('/root', auth_1.authenticateToken, (0, auth_1.requirePermission)('locations:read'), locationController.getRootLocations);
router.get('/code/:code', auth_1.authenticateToken, (0, auth_1.requirePermission)('locations:read'), locationController.getByCode);
router.get('/:id', auth_1.authenticateToken, (0, auth_1.requirePermission)('locations:read'), locationController.getById);
router.put('/:id', auth_1.authenticateToken, auth_1.requireAdmin, locationController.update);
router.delete('/:id', auth_1.authenticateToken, auth_1.requireAdmin, locationController.delete);
router.get('/:id/children', auth_1.authenticateToken, (0, auth_1.requirePermission)('locations:read'), locationController.getChildren);
router.get('/:id/path', auth_1.authenticateToken, (0, auth_1.requirePermission)('locations:read'), locationController.getPath);
router.get('/:id/inventory', auth_1.authenticateToken, (0, auth_1.requireAnyPermission)(['locations:read', 'inventory:read']), locationController.getInventory);
router.post('/set-default', auth_1.authenticateToken, auth_1.requireAdmin, locationController.setItemDefaultLocation);
router.patch('/batch/status', auth_1.authenticateToken, auth_1.requireAdmin, locationController.batchUpdateStatus);
exports.default = router;
//# sourceMappingURL=locationRoutes.js.map