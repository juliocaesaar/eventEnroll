import { describe, test, expect, jest, beforeEach } from '@jest/globals';
import { AsaasService } from '../../server/services/asaasService';

// Mock fetch globally
global.fetch = jest.fn();

describe('AsaasService', () => {
  let asaasService: AsaasService;
  const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

  beforeEach(() => {
    asaasService = new AsaasService();
    mockFetch.mockClear();
  });

  test('should create customer successfully', async () => {
    const mockCustomer = {
      id: 'cus_12345',
      name: 'João Silva',
      cpfCnpj: '12345678901',
      email: 'joao@example.com'
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockCustomer,
    } as Response);

    const result = await asaasService.createCustomer({
      name: 'João Silva',
      cpfCnpj: '12345678901',
      email: 'joao@example.com'
    });

    expect(result).toEqual(mockCustomer);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/customers'),
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
        }),
      })
    );
  });

  test('should handle API errors', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      statusText: 'Bad Request',
      json: async () => ({ message: 'Invalid CPF' }),
    } as Response);

    await expect(asaasService.createCustomer({
      name: 'João Silva',
      cpfCnpj: 'invalid',
      email: 'joao@example.com'
    })).rejects.toThrow('Asaas API Error: Invalid CPF');
  });

  test('should create payment successfully', async () => {
    const mockPayment = {
      id: 'pay_12345',
      status: 'PENDING',
      value: 99.90,
      dueDate: '2024-12-31'
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockPayment,
    } as Response);

    const result = await asaasService.createPayment({
      customer: 'cus_12345',
      billingType: 'PIX',
      value: 99.90,
      dueDate: '2024-12-31',
      description: 'Test payment'
    });

    expect(result).toEqual(mockPayment);
  });

  test('should create subscription successfully', async () => {
    const mockSubscription = {
      id: 'sub_12345',
      status: 'ACTIVE',
      value: 29.90,
      cycle: 'MONTHLY'
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockSubscription,
    } as Response);

    const result = await asaasService.createSubscription({
      customer: 'cus_12345',
      billingType: 'CREDIT_CARD',
      cycle: 'MONTHLY',
      value: 29.90,
      nextDueDate: '2024-01-01',
      description: 'Monthly subscription'
    });

    expect(result).toEqual(mockSubscription);
  });

  test('should get PIX QR code', async () => {
    const mockPixData = {
      encodedImage: 'base64-image-data',
      payload: 'pix-payload-string'
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockPixData,
    } as Response);

    const result = await asaasService.getPixQrCode('pay_12345');
    expect(result).toEqual(mockPixData);
  });

  test('should use correct API URLs for sandbox and production', () => {
    // Test sandbox URL
    process.env.ASAAS_SANDBOX = 'true';
    const sandboxService = new AsaasService();
    expect((sandboxService as any).baseUrl).toBe('https://sandbox.asaas.com/api/v3');

    // Test production URL
    process.env.ASAAS_SANDBOX = 'false';
    const prodService = new AsaasService();
    expect((prodService as any).baseUrl).toBe('https://api.asaas.com/v3');
  });
});