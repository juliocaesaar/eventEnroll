import { storage } from '../storage';
import type { 
  EventPaymentPlan, 
  PaymentInstallment, 
  PaymentTransaction,
  InsertPaymentInstallment,
  InsertPaymentTransaction,
  Registration
} from '@shared/schema';

export interface PaymentCalculationResult {
  installments: Array<{
    installmentNumber: number;
    dueDate: Date;
    originalAmount: number;
    remainingAmount: number;
    discountAmount: number;
    lateFeeAmount: number;
  }>;
  totalAmount: number;
  totalPaid: number;
  totalRemaining: number;
}

export interface DiscountPolicy {
  cashDiscount?: {
    enabled: boolean;
    percentage: number;
    description: string;
  };
  earlyPaymentDiscount?: {
    enabled: boolean;
    daysBeforeDue: number;
    percentage: number;
    description: string;
  };
  groupDiscounts?: {
    [groupId: string]: {
      enabled: boolean;
      percentage: number;
      description: string;
    };
  };
}

export interface LateFeePolicy {
  enabled: boolean;
  gracePeriodDays: number;
  fixedFee: number;
  interestRate: number;
  maxLateFee: number;
  description: string;
}

export class PaymentService {
  /**
   * Calcula as parcelas baseado no plano de pagamento
   */
  static calculateInstallments(
    plan: EventPaymentPlan,
    totalAmount: number,
    registrationDate: Date = new Date()
  ): PaymentCalculationResult {
    const installments: PaymentCalculationResult['installments'] = [];
    const installmentAmount = totalAmount / plan.installmentCount;
    
    // Calcular datas das parcelas
    const dueDates = this.calculateDueDates(
      plan.firstInstallmentDate || registrationDate,
      plan.installmentCount,
      plan.installmentInterval
    );

    let totalPaid = 0;
    let totalRemaining = totalAmount;

    for (let i = 0; i < plan.installmentCount; i++) {
      const installmentNumber = i + 1;
      const dueDate = dueDates[i];
      const originalAmount = this.roundToTwoDecimals(installmentAmount);
      const remainingAmount = originalAmount;

      installments.push({
        installmentNumber,
        dueDate,
        originalAmount,
        remainingAmount,
        discountAmount: 0,
        lateFeeAmount: 0,
      });
    }

    return {
      installments,
      totalAmount,
      totalPaid,
      totalRemaining,
    };
  }

  /**
   * Calcula as datas de vencimento das parcelas
   */
  private static calculateDueDates(
    firstDate: Date,
    count: number,
    interval: string
  ): Date[] {
    console.log('=== CALCULATE DUE DATES ===');
    console.log('firstDate:', firstDate);
    console.log('count:', count);
    console.log('interval:', interval);
    
    const dates: Date[] = [];
    const currentDate = new Date(firstDate);

    for (let i = 0; i < count; i++) {
      dates.push(new Date(currentDate));
      console.log(`Parcela ${i + 1}: ${currentDate.toISOString()}`);
      
      switch (interval) {
        case 'weekly':
          currentDate.setDate(currentDate.getDate() + 7);
          break;
        case 'biweekly':
          currentDate.setDate(currentDate.getDate() + 14);
          break;
        case 'monthly':
        default:
          currentDate.setMonth(currentDate.getMonth() + 1);
          break;
      }
    }

    console.log('Total dates calculated:', dates.length);
    return dates;
  }

  /**
   * Aplica desconto a uma parcela
   */
  static applyDiscount(
    installment: PaymentInstallment,
    discountPolicy: DiscountPolicy,
    groupId?: string
  ): number {
    let discountAmount = 0;

    // Desconto por pagamento à vista
    if (discountPolicy.cashDiscount?.enabled) {
      discountAmount += installment.originalAmount * (discountPolicy.cashDiscount.percentage / 100);
    }

    // Desconto por grupo
    if (groupId && discountPolicy.groupDiscounts?.[groupId]?.enabled) {
      const groupDiscount = discountPolicy.groupDiscounts[groupId];
      discountAmount += installment.originalAmount * (groupDiscount.percentage / 100);
    }

    return this.roundToTwoDecimals(discountAmount);
  }

  /**
   * Calcula multa por atraso
   */
  static calculateLateFee(
    installment: PaymentInstallment,
    lateFeePolicy: LateFeePolicy
  ): number {
    if (!lateFeePolicy.enabled) return 0;

    const now = new Date();
    const dueDate = new Date(installment.dueDate);
    const daysOverdue = Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));

    if (daysOverdue <= lateFeePolicy.gracePeriodDays) return 0;

    // Multa fixa
    let lateFee = lateFeePolicy.fixedFee;

    // Juros por dia de atraso
    const interestDays = daysOverdue - lateFeePolicy.gracePeriodDays;
    const interestAmount = installment.remainingAmount * (lateFeePolicy.interestRate / 100) * (interestDays / 30);

    lateFee += interestAmount;

    // Limite máximo de multa
    return this.roundToTwoDecimals(Math.min(lateFee, lateFeePolicy.maxLateFee));
  }

  /**
   * Cria parcelas para uma inscrição
   */
  static async createInstallmentsForRegistration(
    registration: Registration,
    plan: EventPaymentPlan
  ): Promise<PaymentInstallment[]> {
    console.log('=== CREATE INSTALLMENTS FOR REGISTRATION ===');
    console.log('Registration ID:', registration.id);
    console.log('Plan ID:', plan.id);
    console.log('Plan installmentCount:', plan.installmentCount);
    console.log('Plan installmentInterval:', plan.installmentInterval);
    
    const totalAmount = parseFloat(registration.totalAmount || '0');
    console.log('Total amount:', totalAmount);
    
    const calculation = this.calculateInstallments(plan, totalAmount, new Date(registration.createdAt));
    console.log('Calculation installments count:', calculation.installments.length);

    const installments: PaymentInstallment[] = [];

    for (const installmentData of calculation.installments) {
      console.log(`Creating installment ${installmentData.installmentNumber} for date ${installmentData.dueDate}`);
      
      const installment = await storage.createPaymentInstallment({
        registrationId: registration.id,
        planId: plan.id,
        installmentNumber: installmentData.installmentNumber,
        dueDate: installmentData.dueDate,
        originalAmount: installmentData.originalAmount.toString(),
        remainingAmount: installmentData.remainingAmount.toString(),
        status: 'pending',
      });

      installments.push(installment);
    }

    console.log('Total installments created:', installments.length);
    return installments;
  }

  /**
   * Processa um pagamento
   */
  static async processPayment(
    installmentId: string,
    amount: number,
    paymentMethod: string,
    transactionId?: string,
    notes?: string,
    createdBy?: string
  ): Promise<{ installment: PaymentInstallment; transaction: PaymentTransaction }> {
    const installment = await storage.getPaymentInstallment(installmentId);
    if (!installment) {
      throw new Error('Parcela não encontrada');
    }

    const paidAmount = parseFloat(installment.paidAmount || '0');
    const newPaidAmount = paidAmount + amount;
    const remainingAmount = Math.max(0, parseFloat(installment.originalAmount) - newPaidAmount);

    // Atualizar parcela
    const updatedInstallment = await storage.updatePaymentInstallment(installmentId, {
      paidAmount: newPaidAmount.toString(),
      remainingAmount: remainingAmount.toString(),
      status: remainingAmount === 0 ? 'paid' : 'partial',
      paidDate: remainingAmount === 0 ? new Date() : undefined,
      updatedBy: createdBy,
    });

    // Criar transação
    const transaction = await storage.createPaymentTransaction({
      installmentId,
      amount: amount.toString(),
      type: 'payment',
      paymentMethod,
      transactionId,
      notes,
      createdBy,
    });

    // Atualizar status da inscrição
    await this.updateRegistrationPaymentStatus(installment.registrationId);

    return { installment: updatedInstallment, transaction };
  }

  /**
   * Aplica desconto a uma parcela
   */
  static async applyDiscountToInstallment(
    installmentId: string,
    discountAmount: number,
    notes?: string,
    updatedBy?: string
  ): Promise<{ installment: PaymentInstallment; transaction: PaymentTransaction }> {
    const installment = await storage.getPaymentInstallment(installmentId);
    if (!installment) {
      throw new Error('Parcela não encontrada');
    }

    const currentDiscount = parseFloat(installment.discountAmount || '0');
    const newDiscountAmount = currentDiscount + discountAmount;
    const remainingAmount = Math.max(0, parseFloat(installment.originalAmount) - parseFloat(installment.paidAmount || '0') - newDiscountAmount);

    // Atualizar parcela
    const updatedInstallment = await storage.updatePaymentInstallment(installmentId, {
      discountAmount: newDiscountAmount.toString(),
      remainingAmount: remainingAmount.toString(),
      status: remainingAmount === 0 ? 'waived' : installment.status,
      updatedBy,
    });

    // Criar transação de desconto
    const transaction = await storage.createPaymentTransaction({
      installmentId,
      amount: discountAmount.toString(),
      type: 'waiver',
      notes: notes || 'Desconto aplicado',
      createdBy: updatedBy,
    });

    return { installment: updatedInstallment, transaction };
  }

  /**
   * Aplica multa por atraso
   */
  static async applyLateFee(
    installmentId: string,
    lateFeeAmount: number,
    notes?: string,
    updatedBy?: string
  ): Promise<{ installment: PaymentInstallment; transaction: PaymentTransaction }> {
    const installment = await storage.getPaymentInstallment(installmentId);
    if (!installment) {
      throw new Error('Parcela não encontrada');
    }

    const currentLateFee = parseFloat(installment.lateFeeAmount || '0');
    const newLateFeeAmount = currentLateFee + lateFeeAmount;
    const remainingAmount = parseFloat(installment.originalAmount) - parseFloat(installment.paidAmount || '0') + newLateFeeAmount;

    // Atualizar parcela
    const updatedInstallment = await storage.updatePaymentInstallment(installmentId, {
      lateFeeAmount: newLateFeeAmount.toString(),
      remainingAmount: remainingAmount.toString(),
      status: 'overdue',
      updatedBy,
    });

    // Criar transação de multa
    const transaction = await storage.createPaymentTransaction({
      installmentId,
      amount: lateFeeAmount.toString(),
      type: 'adjustment',
      notes: notes || 'Multa por atraso aplicada',
      createdBy: updatedBy,
    });

    return { installment: updatedInstallment, transaction };
  }

  /**
   * Atualiza o status de pagamento da inscrição
   */
  private static async updateRegistrationPaymentStatus(registrationId: string): Promise<void> {
    const installments = await storage.getRegistrationInstallments(registrationId);
    
    if (installments.length === 0) return;

    const totalAmount = installments.reduce((sum, inst) => sum + parseFloat(inst.originalAmount), 0);
    const totalPaid = installments.reduce((sum, inst) => sum + parseFloat(inst.paidAmount || '0'), 0);
    const totalRemaining = installments.reduce((sum, inst) => sum + parseFloat(inst.remainingAmount), 0);
    
    let paymentStatus: string;
    if (totalPaid === 0) {
      paymentStatus = 'pending';
    } else if (totalRemaining === 0) {
      paymentStatus = 'paid';
    } else {
      paymentStatus = 'partial';
    }

    // Verificar se há parcelas em atraso
    const now = new Date();
    const hasOverdue = installments.some(inst => 
      new Date(inst.dueDate) < now && inst.status === 'pending'
    );

    if (hasOverdue && paymentStatus !== 'paid') {
      paymentStatus = 'overdue';
    }

    await storage.updateRegistration(registrationId, {
      totalAmount: totalAmount.toString(),
      amountPaid: totalPaid.toString(),
      remainingAmount: totalRemaining.toString(),
      paymentStatus,
    });
  }

  /**
   * Recalcula multas para parcelas em atraso
   */
  static async recalculateLateFees(eventId?: string): Promise<void> {
    const overdueInstallments = await storage.getOverdueInstallments(eventId);
    
    for (const installment of overdueInstallments) {
      const plan = await storage.getEventPaymentPlan(installment.planId);
      if (!plan) continue;

      const lateFeePolicy = plan.lateFeePolicy as LateFeePolicy;
      const calculatedLateFee = this.calculateLateFee(installment, lateFeePolicy);
      const currentLateFee = parseFloat(installment.lateFeeAmount || '0');

      if (calculatedLateFee > currentLateFee) {
        const additionalLateFee = calculatedLateFee - currentLateFee;
        await this.applyLateFee(
          installment.id,
          additionalLateFee,
          'Multa recalculada automaticamente',
          'system'
        );
      }
    }
  }

  /**
   * Arredonda para 2 casas decimais
   */
  private static roundToTwoDecimals(value: number): number {
    return Math.round(value * 100) / 100;
  }

  /**
   * Gera relatório de pagamentos
   */
  static async generatePaymentReport(eventId: string): Promise<{
    summary: {
      totalExpected: string;
      totalPaid: string;
      totalRemaining: string;
      overdueAmount: string;
      overdueCount: number;
      paidCount: number;
      pendingCount: number;
    };
    byGroup: Array<{
      groupId: string;
      groupName: string;
      summary: {
        totalExpected: string;
        totalPaid: string;
        totalRemaining: string;
        overdueAmount: string;
        overdueCount: number;
        paidCount: number;
        pendingCount: number;
      };
    }>;
  }> {
    const eventAnalytics = await storage.getPaymentAnalytics(eventId);
    const groups = await storage.getEventGroups(eventId);
    
    const byGroup = await Promise.all(
      groups.map(async (group) => {
        const groupAnalytics = await storage.getGroupPaymentAnalytics(group.id);
        return {
          groupId: group.id,
          groupName: group.name,
          summary: groupAnalytics,
        };
      })
    );

    return {
      summary: eventAnalytics,
      byGroup,
    };
  }
}
