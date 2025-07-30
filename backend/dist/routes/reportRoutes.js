"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const ReportController_1 = __importDefault(require("../controllers/ReportController"));
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
const reportController = new ReportController_1.default();
router.get('/types', auth_1.authenticateToken, (0, auth_1.requirePermission)('reports:read'), reportController.getAvailableReports);
router.get('/monthly-stats', auth_1.authenticateToken, (0, auth_1.requirePermission)('reports:read'), reportController.getMonthlyStats);
router.get('/monthly-stats/export', auth_1.authenticateToken, (0, auth_1.requirePermission)('reports:read'), reportController.exportMonthlyStats);
router.get('/item-usage', auth_1.authenticateToken, (0, auth_1.requirePermission)('reports:read'), reportController.getItemUsageRanking);
router.get('/item-usage/export', auth_1.authenticateToken, (0, auth_1.requirePermission)('reports:read'), reportController.exportItemUsageRanking);
router.get('/inventory-status', auth_1.authenticateToken, (0, auth_1.requirePermission)('reports:read'), reportController.getInventoryStatus);
router.get('/inventory-status/export', auth_1.authenticateToken, (0, auth_1.requirePermission)('reports:read'), reportController.exportInventoryStatus);
router.get('/transaction-history', auth_1.authenticateToken, (0, auth_1.requirePermission)('reports:read'), reportController.getTransactionHistory);
router.get('/transaction-history/export', auth_1.authenticateToken, (0, auth_1.requirePermission)('reports:read'), reportController.exportTransactionHistory);
router.get('/custom-range', auth_1.authenticateToken, (0, auth_1.requirePermission)('reports:read'), reportController.getCustomRangeStats);
router.get('/export/:reportType', auth_1.authenticateToken, (0, auth_1.requirePermission)('reports:read'), reportController.exportReport);
exports.default = router;
//# sourceMappingURL=reportRoutes.js.map