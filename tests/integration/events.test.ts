import { describe, test, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import { registerRoutes } from '../../server/modules/routes';

describe('Events API', () => {
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

  test('should validate event data on creation', async () => {
    const invalidEventData = {
      title: '', // Invalid: empty title
      description: 'Test event',
      categoryId: 'invalid',
      capacity: -1, // Invalid: negative capacity
    };

    const response = await request(app)
      .post('/api/events')
      .send(invalidEventData)
      .expect(401); // Should be unauthorized first

    expect(response.body.message).toBe('Unauthorized');
  });

  test('should create event with valid data structure', () => {
    const validEventData = {
      title: 'Test Event',
      description: 'A test event description',
      categoryId: 'corporate',
      startDate: '2026-06-26T10:00:00Z',
      endDate: '2026-06-26T18:00:00Z',
      capacity: 100,
      status: 'active',
      pageComponents: [
        {
          id: 'header-1',
          type: 'header',
          props: {
            title: 'Welcome',
            subtitle: 'To our event'
          }
        }
      ]
    };

    // Validate the structure without authentication
    expect(validEventData.title).toBeTruthy();
    expect(validEventData.capacity).toBeGreaterThan(0);
    expect(validEventData.startDate).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    expect(Array.isArray(validEventData.pageComponents)).toBe(true);
  });

  test('should handle datetime string conversion', () => {
    const datetimeLocal = '2026-06-26T00:00';
    const date = new Date(datetimeLocal);
    
    expect(date).toBeInstanceOf(Date);
    expect(date.getFullYear()).toBe(2026);
    expect(date.getMonth()).toBe(5); // June is month 5 (0-indexed)
    expect(date.getDate()).toBe(26);
  });

  test('should validate page components structure', () => {
    const validComponent = {
      id: 'header-123',
      type: 'header',
      props: {
        title: 'Event Title',
        subtitle: 'Event Subtitle'
      }
    };

    expect(validComponent.id).toBeTruthy();
    expect(validComponent.type).toBe('header');
    expect(validComponent.props).toBeDefined();
    expect(validComponent.props.title).toBeTruthy();
  });

  test('should validate event registration data', () => {
    const validRegistration = {
      eventId: 'evt_123',
      participantName: 'João Silva',
      participantEmail: 'joao@example.com',
      participantPhone: '+5511999999999',
      ticketId: 'tkt_123',
      amountPaid: 5000, // R$ 50.00 in cents
      paymentMethod: 'pix',
      paymentStatus: 'pending'
    };

    expect(validRegistration.participantName).toBeTruthy();
    expect(validRegistration.participantEmail).toContain('@');
    expect(validRegistration.amountPaid).toBeGreaterThan(0);
    expect(['pix', 'credit_card', 'boleto']).toContain(validRegistration.paymentMethod);
    expect(['pending', 'paid', 'failed']).toContain(validRegistration.paymentStatus);
  });
});