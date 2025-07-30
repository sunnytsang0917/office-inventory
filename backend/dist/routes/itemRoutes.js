"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const ItemController_1 = require("../controllers/ItemController");
const upload_1 = require("../middleware/upload");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
const itemController = new ItemController_1.ItemController();
router.post('/', auth_1.authenticateToken, (0, auth_1.requirePermission)('items:create'), itemController.createItem);
router.get('/', auth_1.authenticateToken, (0, auth_1.requirePermission)('items:read'), itemController.listItems);
router.get('/categories', auth_1.authenticateToken, (0, auth_1.requirePermission)('items:read'), itemController.getCategories);
router.get('/:id', auth_1.authenticateToken, (0, auth_1.requirePermission)('items:read'), itemController.getItem);
router.put('/:id', auth_1.authenticateToken, (0, auth_1.requirePermission)('items:update'), itemController.updateItem);
router.delete('/:id', auth_1.authenticateToken, auth_1.requireAdmin, itemController.deleteItem);
router.post('/batch-import', auth_1.authenticateToken, auth_1.requireAdmin, upload_1.uploadSingle, upload_1.handleUploadError, itemController.batchImportItems);
router.get('/template/download', auth_1.authenticateToken, (0, auth_1.requireAnyPermission)(['items:create', 'items:update']), itemController.downloadTemplate);
exports.default = router;
//# sourceMappingURL=itemRoutes.js.map