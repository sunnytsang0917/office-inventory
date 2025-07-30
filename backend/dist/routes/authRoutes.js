"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const AuthController_1 = require("../controllers/AuthController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.post('/login', AuthController_1.AuthController.login);
router.post('/logout', AuthController_1.AuthController.logout);
router.post('/refresh', auth_1.validateTokenFormat, auth_1.authenticateToken, AuthController_1.AuthController.refreshToken);
router.get('/me', auth_1.authenticateToken, AuthController_1.AuthController.getCurrentUser);
router.post('/change-password', auth_1.authenticateToken, AuthController_1.AuthController.changePassword);
router.post('/validate', AuthController_1.AuthController.validateToken);
router.get('/users', auth_1.authenticateToken, auth_1.requireAdmin, AuthController_1.AuthController.getAllUsers);
exports.default = router;
//# sourceMappingURL=authRoutes.js.map