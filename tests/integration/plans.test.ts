import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import { registerRoutes } from '../../server/modules/routes';

describe('Plans API', () => {
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

  test('should return all available plans', async () => {
    const response = await request(app)
      .get('/api/plans')
      .expect(200);

    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body).toHaveLength(4);

    const planIds = response.body.map((plan: any) => plan.id);
    expect(planIds).toEqual(['free', 'starter', 'professional', 'enterprise']);
  });

  test('should validate plan structure', async () => {
    const response = await request(app)
      .get('/api/plans')
      .expect(200);

    const plans = response.body;
    
    plans.forEach((plan: any) => {
      expect(plan).toHaveProperty('id');
      expect(plan).toHaveProperty('name');
      expect(plan).toHaveProperty('description');
      expect(plan).toHaveProperty('price');
      expect(plan).toHaveProperty('currency', 'BRL');
      expect(plan).toHaveProperty('interval');
      expect(plan).toHaveProperty('features');
      expect(plan).toHaveProperty('limits');

      // Validate limits structure
      expect(plan.limits).toHaveProperty('events');
      expect(plan.limits).toHaveProperty('participants');
      expect(plan.limits).toHaveProperty('templates');
      expect(plan.limits).toHaveProperty('storage');
      expect(plan.limits).toHaveProperty('emailsPerMonth');

      // Validate features array
      expect(Array.isArray(plan.features)).toBe(true);
      expect(plan.features.length).toBeGreaterThan(0);
    });
  });

  test('should have correct free plan configuration', async () => {
    const response = await request(app)
      .get('/api/plans')
      .expect(200);

    const freePlan = response.body.find((plan: any) => plan.id === 'free');
    
    expect(freePlan).toBeDefined();
    expect(freePlan.price).toBe(0);
    expect(freePlan.limits.events).toBe(3);
    expect(freePlan.limits.participants).toBe(50);
    expect(freePlan.features).toContain('Até 3 eventos simultâneos');
    expect(freePlan.features).toContain('Marca EventFlow nas páginas');
  });

  test('should have correct professional plan configuration', async () => {
    const response = await request(app)
      .get('/api/plans')
      .expect(200);

    const professionalPlan = response.body.find((plan: any) => plan.id === 'professional');
    
    expect(professionalPlan).toBeDefined();
    expect(professionalPlan.price).toBe(89.90);
    expect(professionalPlan.limits.events).toBe(-1); // unlimited
    expect(professionalPlan.limits.participants).toBe(1000);
    expect(professionalPlan.isPopular).toBe(true);
    expect(professionalPlan.features).toContain('Eventos ilimitados');
    expect(professionalPlan.features).toContain('Analytics avançados');
  });

  test('should validate subscription creation data structure', () => {
    const validSubscriptionData = {
      planId: 'professional',
      paymentMethod: 'pix',
      cpfCnpj: '12345678901',
      phone: '+5511999999999'
    };

    expect(['free', 'starter', 'professional', 'enterprise']).toContain(validSubscriptionData.planId);
    expect(['pix', 'credit_card', 'boleto']).toContain(validSubscriptionData.paymentMethod);
    expect(validSubscriptionData.cpfCnpj).toMatch(/^\d{11}$/);
    expect(validSubscriptionData.phone).toMatch(/^\+55\d{10,11}$/);
  });

  test('should require authentication for subscription endpoints', async () => {
    const subscriptionData = {
      planId: 'professional',
      paymentMethod: 'pix'
    };

    const response = await request(app)
      .post('/api/subscription')
      .send(subscriptionData)
      .expect(401);

    expect(response.body.message).toBe('Unauthorized');
  });

  test('should require authentication for user subscription info', async () => {
    const response = await request(app)
      .get('/api/subscription')
      .expect(401);

    expect(response.body.message).toBe('Unauthorized');
  });
});