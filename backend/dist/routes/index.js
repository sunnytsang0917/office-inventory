"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const locationRoutes_1 = __importDefault(require("./locationRoutes"));
const itemRoutes_1 = __importDefault(require("./itemRoutes"));
const transactionRoutes_1 = __importDefault(require("./transactionRoutes"));
const inventoryRoutes_1 = __importDefault(require("./inventoryRoutes"));
const reportRoutes_1 = __importDefault(require("./reportRoutes"));
const authRoutes_1 = __importDefault(require("./authRoutes"));
const router = (0, express_1.Router)();
const API_VERSION = '/api/v1';
router.use(`${API_VERSION}/auth`, authRoutes_1.default);
router.use(`${API_VERSION}/locations`, locationRoutes_1.default);
router.use(`${API_VERSION}/items`, itemRoutes_1.default);
router.use(`${API_VERSION}/transactions`, transactionRoutes_1.default);
router.use(`${API_VERSION}/inventory`, inventoryRoutes_1.default);
router.use(`${API_VERSION}/reports`, reportRoutes_1.default);
router.get('/api', (req, res) => {
    res.json({
        message: 'Office Inventory Management System API',
        version: '1.0.0',
        endpoints: {
            auth: `${API_VERSION}/auth`,
            locations: `${API_VERSION}/locations`,
            items: `${API_VERSION}/items`,
            transactions: `${API_VERSION}/transactions`,
            inventory: `${API_VERSION}/inventory`,
            reports: `${API_VERSION}/reports`,
        },
    });
});
exports.default = router;
//# sourceMappingURL=index.js.map