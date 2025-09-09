import { useState, useEffect, useCallback } from 'react';
import { useToast } from './use-toast';
import { apiRequest } from '../lib/queryClient';

export interface PIXPayment {
  id: string;
  status: 'pending' | 'paid' | 'cancelled' | 'expired' | 'failed';
  amount: number;
  qr_code: string;
  qr_code_text: string;
  copy_paste_code: string;
  expires_at: string;
  paid_at?: string;
  external_id: string;
}

export interface PIXPaymentResponse {
  success: boolean;
  message: string;
  data: PIXPayment;
}

export interface PIXPaymentsListResponse {
  success: boolean;
  message: string;
  data: PIXPayment[];
}

export function usePIXPayments() {
  const [payments, setPayments] = useState<PIXPayment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();

  // Carregar pagamentos
  const loadPayments = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await apiRequest('GET', '/api/pix-test/list');
      const data = await response.json();

      if (data.success) {
        setPayments(data.data);
        console.log('✅ Pagamentos PIX carregados:', data.data);
        return data.data;
      }
    } catch (error) {
      console.error('❌ Erro ao carregar pagamentos PIX:', error);
      toast({
        title: "Erro",
        description: "Falha ao carregar pagamentos PIX",
        variant: "destructive"
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Criar pagamento de teste
  const createTestPayment = useCallback(async (): Promise<PIXPayment | null> => {
    try {
      setIsCreating(true);
      const response = await apiRequest('POST', '/api/pix-test/create');
      const data = await response.json();

      if (data.success) {
        const newPayment = data.data;
        setPayments(prev => [newPayment, ...prev]);
        
        toast({
          title: "Pagamento Criado",
          description: "Pagamento PIX de R$ 1,00 criado com sucesso!",
        });
        
        console.log('✅ Pagamento PIX criado:', newPayment);
        return newPayment;
      }
    } catch (error: any) {
      console.error('❌ Erro ao criar pagamento PIX:', error);
      toast({
        title: "Erro",
        description: error.message || "Falha ao criar pagamento PIX",
        variant: "destructive"
      });
      throw error;
    } finally {
      setIsCreating(false);
    }
    return null;
  }, [toast]);

  // Verificar status de um pagamento
  const checkPaymentStatus = useCallback(async (paymentId: string): Promise<PIXPayment | null> => {
    try {
      const response = await apiRequest('GET', `/api/pix-test/status/${paymentId}`);
      const data = await response.json();

      if (data.success) {
        const updatedPayment = data.data;
        
        // Atualizar lista de pagamentos
        setPayments(prev => prev.map(p => 
          p.id === paymentId ? { ...p, ...updatedPayment } : p
        ));
        
        console.log('✅ Status do pagamento PIX atualizado:', updatedPayment);
        return updatedPayment;
      }
    } catch (error) {
      console.error('❌ Erro ao verificar status do pagamento PIX:', error);
      throw error;
    }
    return null;
  }, []);

  // Cancelar pagamento
  const cancelPayment = useCallback(async (paymentId: string): Promise<boolean> => {
    try {
      const response = await apiRequest('POST', `/api/pix-test/cancel/${paymentId}`);
      const data = await response.json();

      if (data.success) {
        setPayments(prev => prev.map(p => 
          p.id === paymentId ? { ...p, status: 'cancelled' } : p
        ));
        
        toast({
          title: "Pagamento Cancelado",
          description: "Pagamento PIX foi cancelado com sucesso",
        });
        
        console.log('✅ Pagamento PIX cancelado:', paymentId);
        return true;
      }
    } catch (error: any) {
      console.error('❌ Erro ao cancelar pagamento PIX:', error);
      toast({
        title: "Erro",
        description: error.message || "Falha ao cancelar pagamento",
        variant: "destructive"
      });
      throw error;
    }
    return false;
  }, [toast]);

  // Estornar pagamento
  const refundPayment = useCallback(async (paymentId: string, amount?: number): Promise<boolean> => {
    try {
      const response = await apiRequest('POST', `/api/pix-test/refund/${paymentId}`, { amount });
      const data = await response.json();

      if (data.success) {
        setPayments(prev => prev.map(p => 
          p.id === paymentId ? { ...p, status: 'refunded' } : p
        ));
        
        toast({
          title: "Pagamento Estornado",
          description: "Pagamento PIX foi estornado com sucesso",
        });
        
        console.log('✅ Pagamento PIX estornado:', paymentId);
        return true;
      }
    } catch (error: any) {
      console.error('❌ Erro ao estornar pagamento PIX:', error);
      toast({
        title: "Erro",
        description: error.message || "Falha ao estornar pagamento",
        variant: "destructive"
      });
      throw error;
    }
    return false;
  }, [toast]);

  // Hook para auto-refresh de pagamentos pendentes
  const useAutoRefresh = (paymentId: string | null, interval: number = 5000) => {
    const [isAutoRefreshing, setIsAutoRefreshing] = useState(false);

    useEffect(() => {
      if (!isAutoRefreshing || !paymentId) {
        return;
      }

      const intervalId = setInterval(async () => {
        try {
          const updatedPayment = await checkPaymentStatus(paymentId);
          
          // Parar auto-refresh se pagamento foi confirmado ou cancelado
          if (updatedPayment && ['paid', 'cancelled', 'expired', 'failed'].includes(updatedPayment.status)) {
            setIsAutoRefreshing(false);
            
            if (updatedPayment.status === 'paid') {
              toast({
                title: "Pagamento Confirmado! 🎉",
                description: `Pagamento de R$ ${updatedPayment.amount.toFixed(2)} foi confirmado!`,
              });
            }
          }
        } catch (error) {
          console.error('❌ Erro no auto-refresh:', error);
        }
      }, interval);

      return () => clearInterval(intervalId);
    }, [isAutoRefreshing, paymentId, interval, checkPaymentStatus, toast]);

    return {
      isAutoRefreshing,
      startAutoRefresh: () => setIsAutoRefreshing(true),
      stopAutoRefresh: () => setIsAutoRefreshing(false),
      toggleAutoRefresh: () => setIsAutoRefreshing(prev => !prev)
    };
  };

  // Carregar pagamentos na inicialização
  useEffect(() => {
    loadPayments();
  }, [loadPayments]);

  return {
    payments,
    isLoading,
    isCreating,
    loadPayments,
    createTestPayment,
    checkPaymentStatus,
    cancelPayment,
    refundPayment,
    useAutoRefresh
  };
}
