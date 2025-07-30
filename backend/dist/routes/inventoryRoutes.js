"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const InventoryController_1 = require("../controllers/InventoryController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
const inventoryController = new InventoryController_1.InventoryController();
router.get('/', auth_1.authenticateToken, (0, auth_1.requirePermission)('inventory:read'), inventoryController.getInventoryStatus);
router.get('/search', auth_1.authenticateToken, (0, auth_1.requirePermission)('inventory:read'), inventoryController.searchInventory);
router.get('/overview', auth_1.authenticateToken, (0, auth_1.requirePermission)('inventory:read'), inventoryController.getInventoryOverview);
router.get('/statistics', auth_1.authenticateToken, (0, auth_1.requirePermission)('inventory:read'), inventoryController.getInventoryStatistics);
router.get('/low-stock', auth_1.authenticateToken, (0, auth_1.requirePermission)('inventory:read'), inventoryController.getLowStockItems);
router.get('/items/:itemId', auth_1.authenticateToken, (0, auth_1.requirePermission)('inventory:read'), inventoryController.getItemInventory);
router.get('/items/:itemId/history', auth_1.authenticateToken, (0, auth_1.requireAnyPermission)(['inventory:read', 'transactions:read']), inventoryController.getInventoryHistory);
router.get('/locations/:locationId', auth_1.authenticateToken, (0, auth_1.requireAnyPermission)(['inventory:read', 'locations:read']), inventoryController.getLocationInventorySummary);
router.post('/check-availability', auth_1.authenticateToken, (0, auth_1.requireAnyPermission)(['inventory:read', 'transactions:create']), inventoryController.checkStockAvailability);
exports.default = router;
//# sourceMappingURL=inventoryRoutes.js.map