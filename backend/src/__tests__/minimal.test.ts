import request from 'supertest';
import { app } from './testApp';

describe('Minimal Test', () => {
  it('should respond to health check', async () => {
    const response = await request(app)
      .get('/health')
      .expect(200);

    expect(response.body.status).toBe('OK');
  });
});