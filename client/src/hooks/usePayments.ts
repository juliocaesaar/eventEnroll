import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from './useAuth';

export interface PaymentPlan {
  id: string;
  eventId: string;
  name: string;
  description?: string;
  installmentCount: number;
  installmentInterval: 'monthly' | 'weekly' | 'biweekly';
  firstInstallmentDate?: string;
  lastInstallmentDate?: string;
  discountPolicy: Record<string, any>;
  lateFeePolicy: Record<string, any>;
  isDefault: boolean;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export interface PaymentInstallment {
  id: string;
  registrationId: string;
  planId: string;
  installmentNumber: number;
  dueDate: string;
  paidDate?: string;
  originalAmount: string;
  paidAmount: string;
  remainingAmount: string;
  discountAmount: string;
  lateFeeAmount: string;
  status: 'pending' | 'paid' | 'overdue' | 'waived' | 'cancelled';
  notes?: string;
  updatedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentTransaction {
  id: string;
  installmentId: string;
  amount: string;
  type: 'payment' | 'refund' | 'adjustment' | 'waiver';
  paymentMethod?: string;
  transactionId?: string;
  notes?: string;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentAnalytics {
  totalExpected: string;
  totalPaid: string;
  totalRemaining: string;
  overdueAmount: string;
  overdueCount: number;
  paidCount: number;
  pendingCount: number;
}

export interface PaymentReport {
  summary: PaymentAnalytics;
  byGroup: Array<{
    groupId: string;
    groupName: string;
    summary: PaymentAnalytics;
  }>;
}

export interface CreatePaymentPlanData {
  eventId: string;
  name: string;
  description?: string;
  installmentCount: number;
  installmentInterval?: 'monthly' | 'weekly' | 'biweekly';
  firstInstallmentDate?: string;
  discountPolicy?: Record<string, any>;
  lateFeePolicy?: Record<string, any>;
  isDefault?: boolean;
}

export interface ProcessPaymentData {
  amount: number;
  paymentMethod: string;
  transactionId?: string;
  notes?: string;
}

export interface ApplyDiscountData {
  discountAmount: number;
  notes?: string;
}

export interface ApplyLateFeeData {
  lateFeeAmount: number;
  notes?: string;
}

export const usePaymentPlans = (eventId: string) => {
  const { user, isLoading: authLoading } = useAuth();
  const queryClient = useQueryClient();

  const {
    data: plans,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['/api/events', eventId, 'payment-plans'],
    enabled: !!eventId && !!user && !authLoading,
  });

  const createPlanMutation = useMutation({
    mutationFn: async (planData: CreatePaymentPlanData) => {
      const response = await fetch(`/api/events/${eventId}/payment-plans`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(planData),
      });

      if (!response.ok) {
        throw new Error('Erro ao criar plano de pagamento');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['/api/events', eventId, 'payment-plans'],
      });
    },
  });

  return {
    plans: plans as PaymentPlan[],
    isLoading,
    error,
    createPlan: createPlanMutation.mutate,
    isCreating: createPlanMutation.isPending,
  };
};

export const usePaymentInstallments = (registrationId: string) => {
  const { user, isLoading: authLoading } = useAuth();
  const queryClient = useQueryClient();

  const {
    data: installments,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['/api/registrations', registrationId, 'installments'],
    enabled: !!registrationId && !!user && !authLoading,
  });

  const processPaymentMutation = useMutation({
    mutationFn: async ({ installmentId, data }: { installmentId: string; data: ProcessPaymentData }) => {
      const response = await fetch(`/api/installments/${installmentId}/payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Erro ao processar pagamento');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['/api/registrations', registrationId, 'installments'],
      });
    },
  });

  const applyDiscountMutation = useMutation({
    mutationFn: async ({ installmentId, data }: { installmentId: string; data: ApplyDiscountData }) => {
      const response = await fetch(`/api/installments/${installmentId}/discount`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Erro ao aplicar desconto');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['/api/registrations', registrationId, 'installments'],
      });
    },
  });

  const applyLateFeeMutation = useMutation({
    mutationFn: async ({ installmentId, data }: { installmentId: string; data: ApplyLateFeeData }) => {
      const response = await fetch(`/api/installments/${installmentId}/late-fee`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Erro ao aplicar multa');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['/api/registrations', registrationId, 'installments'],
      });
    },
  });

  return {
    installments: installments as PaymentInstallment[],
    isLoading,
    error,
    processPayment: processPaymentMutation.mutate,
    applyDiscount: applyDiscountMutation.mutate,
    applyLateFee: applyLateFeeMutation.mutate,
    isProcessing: processPaymentMutation.isPending,
    isApplyingDiscount: applyDiscountMutation.isPending,
    isApplyingLateFee: applyLateFeeMutation.isPending,
  };
};

export const usePaymentTransactions = (installmentId: string) => {
  const { user, isLoading: authLoading } = useAuth();

  const {
    data: transactions,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['/api/installments', installmentId, 'transactions'],
    enabled: !!installmentId && !!user && !authLoading,
  });

  return {
    transactions: transactions as PaymentTransaction[],
    isLoading,
    error,
  };
};

export const usePaymentAnalytics = (eventId: string) => {
  const { user, isLoading: authLoading } = useAuth();

  const {
    data: analytics,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['/api/events', eventId, 'payment-analytics'],
    enabled: !!eventId && !!user && !authLoading,
  });

  return {
    analytics: analytics as PaymentAnalytics,
    isLoading,
    error,
  };
};

export const usePaymentReport = (eventId: string) => {
  const { user, isLoading: authLoading } = useAuth();

  const {
    data: report,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['/api/events', eventId, 'payment-report'],
    enabled: !!eventId && !!user && !authLoading,
  });

  return {
    report: report as PaymentReport,
    isLoading,
    error,
  };
};

export const useOverdueInstallments = (eventId?: string) => {
  const { user, isLoading: authLoading } = useAuth();
  const queryClient = useQueryClient();

  const {
    data: overdueInstallments,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['/api/overdue-installments', eventId],
    enabled: !!user && !authLoading,
  });

  const recalculateLateFeesMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/recalculate-late-fees', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ eventId }),
      });

      if (!response.ok) {
        throw new Error('Erro ao recalcular multas');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['/api/overdue-installments', eventId],
      });
    },
  });

  return {
    overdueInstallments: overdueInstallments as PaymentInstallment[],
    isLoading,
    error,
    recalculateLateFees: recalculateLateFeesMutation.mutate,
    isRecalculating: recalculateLateFeesMutation.isPending,
  };
};
