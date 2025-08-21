import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import { registerRoutes } from '../../server/modules/routes';

describe('Authentication Routes', () => {
  let app: express.Application;
  let server: any;

  beforeAll(async () => {
    app = express();
    app.use(express.json());
    server = await registerRoutes(app);
  });

  afterAll(async () => {
    if (server) {
      server.close();
    }
  });

  test('should return 401 for unauthenticated user', async () => {
    const response = await request(app)
      .get('/api/auth/user')
      .expect(401);

    expect(response.body.message).toBe('Unauthorized');
  });

  test('should return 401 for protected dashboard route', async () => {
    const response = await request(app)
      .get('/api/dashboard/stats')
      .expect(401);

    expect(response.body.message).toBe('Unauthorized');
  });

  test('should return 401 for protected events route', async () => {
    const response = await request(app)
      .get('/api/events')
      .expect(401);

    expect(response.body.message).toBe('Unauthorized');
  });

  test('should allow access to public routes', async () => {
    // Categories should be public
    const categoriesResponse = await request(app)
      .get('/api/categories')
      .expect(200);

    expect(Array.isArray(categoriesResponse.body)).toBe(true);

    // Templates should be public
    const templatesResponse = await request(app)
      .get('/api/templates')
      .expect(200);

    expect(Array.isArray(templatesResponse.body)).toBe(true);

    // Plans should be public
    const plansResponse = await request(app)
      .get('/api/plans')
      .expect(200);

    expect(Array.isArray(plansResponse.body)).toBe(true);
    expect(plansResponse.body).toHaveLength(4);
  });
});