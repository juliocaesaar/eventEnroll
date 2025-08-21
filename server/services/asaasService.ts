interface AsaasCustomer {
  id?: string;
  name: string;
  cpfCnpj: string;
  email: string;
  phone?: string;
}

interface AsaasPayment {
  customer: string;
  billingType: 'BOLETO' | 'CREDIT_CARD' | 'PIX' | 'UNDEFINED';
  value: number;
  dueDate: string;
  description?: string;
  externalReference?: string;
  installmentCount?: number;
  creditCard?: {
    holderName: string;
    number: string;
    expiryMonth: string;
    expiryYear: string;
    ccv: string;
  };
  creditCardHolderInfo?: {
    name: string;
    email: string;
    cpfCnpj: string;
    postalCode: string;
    addressNumber: string;
    phone: string;
  };
}

interface AsaasResponse<T> {
  object: string;
  hasMore: boolean;
  totalCount: number;
  limit: number;
  offset: number;
  data: T[];
}

export class AsaasService {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = process.env.ASAAS_API_KEY || '';
    this.baseUrl = process.env.ASAAS_SANDBOX === 'true' 
      ? 'https://sandbox.asaas.com/api/v3' 
      : 'https://api.asaas.com/v3';
  }

  private async makeRequest<T>(
    endpoint: string, 
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
    data?: any
  ): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method,
      headers: {
        'access_token': this.apiKey,
        'Content-Type': 'application/json',
      },
      body: data ? JSON.stringify(data) : undefined,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Asaas API Error: ${error.message || response.statusText}`);
    }

    return response.json();
  }

  async createCustomer(customerData: AsaasCustomer): Promise<AsaasCustomer> {
    return this.makeRequest<AsaasCustomer>('/customers', 'POST', customerData);
  }

  async getCustomer(customerId: string): Promise<AsaasCustomer> {
    return this.makeRequest<AsaasCustomer>(`/customers/${customerId}`);
  }

  async createPayment(paymentData: AsaasPayment): Promise<any> {
    return this.makeRequest('/payments', 'POST', paymentData);
  }

  async getPayment(paymentId: string): Promise<any> {
    return this.makeRequest(`/payments/${paymentId}`);
  }

  async createSubscription(subscriptionData: {
    customer: string;
    billingType: 'BOLETO' | 'CREDIT_CARD' | 'PIX';
    cycle: 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'SEMIANNUALLY' | 'YEARLY';
    value: number;
    nextDueDate: string;
    description?: string;
    externalReference?: string;
  }): Promise<any> {
    return this.makeRequest('/subscriptions', 'POST', subscriptionData);
  }

  async cancelSubscription(subscriptionId: string): Promise<any> {
    return this.makeRequest(`/subscriptions/${subscriptionId}`, 'DELETE');
  }

  async getPixQrCode(paymentId: string): Promise<{ encodedImage: string; payload: string }> {
    return this.makeRequest(`/payments/${paymentId}/pixQrCode`);
  }

  async generateBoleto(paymentId: string): Promise<{ bankSlipUrl: string }> {
    return this.makeRequest(`/payments/${paymentId}/identificationField`);
  }
}

export const asaasService = new AsaasService();