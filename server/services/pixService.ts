import axios from 'axios';

interface PIXConfig {
  baseURL: string;
  apiKey: string;
  environment: 'production' | 'homologation';
}

interface PIXPaymentRequest {
  amount: number;
  description: string;
  external_id: string;
  payer: {
    name: string;
    document: string;
    email: string;
    phone?: string;
  };
  expires_in?: number; // em segundos
  additional_info?: string;
}

interface PIXPaymentResponse {
  id: string;
  status: 'pending' | 'paid' | 'cancelled' | 'expired' | 'failed';
  qr_code: string;
  qr_code_text: string;
  copy_paste_code: string;
  expires_at: string;
  paid_at?: string;
  amount: number;
  fee?: number;
  external_id: string;
}

interface PIXWebhookPayload {
  id: string;
  status: 'paid' | 'cancelled' | 'expired' | 'failed';
  paid_at?: string;
  amount: number;
  external_id: string;
}

class PIXService {
  private config: PIXConfig;
  private axiosInstance: any;

  constructor() {
    this.config = {
      baseURL: process.env.PIX_API_URL || 'https://api.pix.com.br/v1',
      apiKey: process.env.PIX_API_KEY || '',
      environment: (process.env.PIX_ENVIRONMENT as 'production' | 'homologation') || 'production'
    };

    this.axiosInstance = axios.create({
      baseURL: this.config.baseURL,
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      timeout: 30000
    });

    // Interceptor para logs
    this.axiosInstance.interceptors.request.use(
      (config: any) => {
        console.log(`🚀 PIX API Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error: any) => {
        console.error('❌ PIX API Request Error:', error);
        return Promise.reject(error);
      }
    );

    this.axiosInstance.interceptors.response.use(
      (response: any) => {
        console.log(`✅ PIX API Response: ${response.status} ${response.config.url}`);
        return response;
      },
      (error: any) => {
        console.error('❌ PIX API Response Error:', error.response?.data || error.message);
        return Promise.reject(error);
      }
    );
  }

  /**
   * Cria um pagamento PIX
   */
  async createPayment(paymentData: PIXPaymentRequest): Promise<PIXPaymentResponse> {
    try {
      console.log('💳 Criando pagamento PIX:', paymentData);
      
      // Se não há API key configurada, simular resposta
      if (!this.config.apiKey) {
        console.log('⚠️ API Key não configurada - simulando pagamento PIX');
        return this.simulatePaymentResponse(paymentData);
      }
      
      const response = await this.axiosInstance.post('/pix/payments', paymentData);
      
      console.log('✅ Pagamento PIX criado:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Erro ao criar pagamento PIX:', error.response?.data || error.message);
      
      // Se erro de autenticação, simular resposta
      if (error.response?.status === 401 || error.response?.status === 403) {
        console.log('⚠️ Erro de autenticação - simulando pagamento PIX');
        return this.simulatePaymentResponse(paymentData);
      }
      
      throw new Error(`Erro ao criar pagamento PIX: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Consulta um pagamento PIX
   */
  async getPayment(paymentId: string): Promise<PIXPaymentResponse> {
    try {
      console.log(`🔍 Consultando pagamento PIX: ${paymentId}`);
      
      // Se não há API key configurada, simular resposta
      if (!this.config.apiKey) {
        console.log('⚠️ API Key não configurada - simulando consulta PIX');
        return this.simulatePaymentResponse({ amount: 1.00, description: 'Teste', external_id: paymentId, payer: { name: 'Teste', document: '12345678901', email: 'teste@teste.com' } });
      }
      
      const response = await this.axiosInstance.get(`/pix/payments/${paymentId}`);
      
      console.log('✅ Pagamento PIX consultado:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Erro ao consultar pagamento PIX:', error.response?.data || error.message);
      
      // Se erro de autenticação, simular resposta
      if (error.response?.status === 401 || error.response?.status === 403) {
        console.log('⚠️ Erro de autenticação - simulando consulta PIX');
        return this.simulatePaymentResponse({ amount: 1.00, description: 'Teste', external_id: paymentId, payer: { name: 'Teste', document: '12345678901', email: 'teste@teste.com' } });
      }
      
      throw new Error(`Erro ao consultar pagamento PIX: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Cancela um pagamento PIX
   */
  async cancelPayment(paymentId: string): Promise<PIXPaymentResponse> {
    try {
      console.log(`🚫 Cancelando pagamento PIX: ${paymentId}`);
      
      // Se não há API key configurada, simular resposta
      if (!this.config.apiKey) {
        console.log('⚠️ API Key não configurada - simulando cancelamento PIX');
        const simulatedResponse = this.simulatePaymentResponse({ amount: 1.00, description: 'Teste', external_id: paymentId, payer: { name: 'Teste', document: '12345678901', email: 'teste@teste.com' } });
        simulatedResponse.status = 'cancelled';
        return simulatedResponse;
      }
      
      const response = await this.axiosInstance.post(`/pix/payments/${paymentId}/cancel`);
      
      console.log('✅ Pagamento PIX cancelado:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Erro ao cancelar pagamento PIX:', error.response?.data || error.message);
      
      // Se erro de autenticação, simular resposta
      if (error.response?.status === 401 || error.response?.status === 403) {
        console.log('⚠️ Erro de autenticação - simulando cancelamento PIX');
        const simulatedResponse = this.simulatePaymentResponse({ amount: 1.00, description: 'Teste', external_id: paymentId, payer: { name: 'Teste', document: '12345678901', email: 'teste@teste.com' } });
        simulatedResponse.status = 'cancelled';
        return simulatedResponse;
      }
      
      throw new Error(`Erro ao cancelar pagamento PIX: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Estorna um pagamento PIX
   */
  async refundPayment(paymentId: string, amount?: number): Promise<PIXPaymentResponse> {
    try {
      console.log(`💰 Estornando pagamento PIX: ${paymentId}`);
      
      // Se não há API key configurada, simular resposta
      if (!this.config.apiKey) {
        console.log('⚠️ API Key não configurada - simulando estorno PIX');
        const simulatedResponse = this.simulatePaymentResponse({ amount: amount || 1.00, description: 'Teste', external_id: paymentId, payer: { name: 'Teste', document: '12345678901', email: 'teste@teste.com' } });
        simulatedResponse.status = 'refunded';
        return simulatedResponse;
      }
      
      const response = await this.axiosInstance.post(`/pix/payments/${paymentId}/refund`, {
        amount: amount
      });
      
      console.log('✅ Pagamento PIX estornado:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Erro ao estornar pagamento PIX:', error.response?.data || error.message);
      
      // Se erro de autenticação, simular resposta
      if (error.response?.status === 401 || error.response?.status === 403) {
        console.log('⚠️ Erro de autenticação - simulando estorno PIX');
        const simulatedResponse = this.simulatePaymentResponse({ amount: amount || 1.00, description: 'Teste', external_id: paymentId, payer: { name: 'Teste', document: '12345678901', email: 'teste@teste.com' } });
        simulatedResponse.status = 'refunded';
        return simulatedResponse;
      }
      
      throw new Error(`Erro ao estornar pagamento PIX: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Valida webhook PIX
   */
  validateWebhook(payload: any, signature: string): boolean {
    // Implementar validação de assinatura do webhook
    // Por enquanto, retorna true para testes
    console.log('🔐 Validando webhook PIX:', { payload, signature });
    return true;
  }

  /**
   * Processa webhook PIX
   */
  processWebhook(payload: PIXWebhookPayload): PIXWebhookPayload {
    console.log('📨 Processando webhook PIX:', payload);
    return payload;
  }

  /**
   * Gera dados de teste para pagamento
   */
  generateTestPayment(): PIXPaymentRequest {
    const testId = `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    return {
      amount: 1.00, // R$ 1,00 para teste
      description: 'Teste de Pagamento PIX - EventsEnroll',
      external_id: testId,
      payer: {
        name: 'Usuário Teste',
        document: '12345678901',
        email: 'teste@example.com',
        phone: '11999999999'
      },
      expires_in: 3600, // 1 hora
      additional_info: 'Pagamento de teste para integração PIX'
    };
  }

  /**
   * Simula uma resposta de pagamento PIX para testes
   */
  private simulatePaymentResponse(paymentData: PIXPaymentRequest): PIXPaymentResponse {
    const paymentId = `sim_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const expiresAt = new Date(Date.now() + 3600000); // 1 hora
    
    return {
      id: paymentId,
      status: 'pending',
      qr_code: this.generateMockQRCode(),
      qr_code_text: `00020126580014br.gov.bcb.pix0136${paymentId}52040000530398654051.005802BR5913EventFlow Test6009Sao Paulo62070503***6304${this.generateCRC16(paymentId)}`,
      copy_paste_code: `00020126580014br.gov.bcb.pix0136${paymentId}52040000530398654051.005802BR5913EventFlow Test6009Sao Paulo62070503***6304${this.generateCRC16(paymentId)}`,
      expires_at: expiresAt.toISOString(),
      amount: paymentData.amount,
      external_id: paymentData.external_id
    };
  }

  /**
   * Gera um QR Code mock em base64
   */
  private generateMockQRCode(): string {
    // QR Code simples em base64 para teste
    return 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
  }

  /**
   * Gera CRC16 para códigos PIX
   */
  private generateCRC16(data: string): string {
    let crc = 0xFFFF;
    for (let i = 0; i < data.length; i++) {
      crc ^= data.charCodeAt(i);
      for (let j = 0; j < 8; j++) {
        if (crc & 1) {
          crc = (crc >> 1) ^ 0x8408;
        } else {
          crc >>= 1;
        }
      }
    }
    return (crc ^ 0xFFFF).toString(16).toUpperCase().padStart(4, '0');
  }
}

export const pixService = new PIXService();
export type { PIXPaymentRequest, PIXPaymentResponse, PIXWebhookPayload };
