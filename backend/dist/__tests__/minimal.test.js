"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const testApp_1 = require("./testApp");
describe('Minimal Test', () => {
    it('should respond to health check', async () => {
        const response = await (0, supertest_1.default)(testApp_1.app)
            .get('/health')
            .expect(200);
        expect(response.body.status).toBe('OK');
    });
});
//# sourceMappingURL=minimal.test.js.map