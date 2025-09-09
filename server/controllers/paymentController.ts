import { Request, Response } from 'express';
import { storage } from '../storage';
import { PaymentService } from '../services/paymentService';

export class PaymentController {
  /**
   * Criar um plano de pagamento para um evento
   */
  static async createPaymentPlan(req: Request, res: Response) {
    try {
      const { eventId, name, description, installmentCount, installmentInterval, firstInstallmentDate, discountPolicy, lateFeePolicy, isDefault } = req.body;
      const userId = (req as any).user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'Usuário não autenticado' });
      }

      // Verificar se o usuário é organizador do evento
      const event = await storage.getEvent(eventId);
      if (!event || event.organizerId !== userId) {
        return res.status(403).json({ error: 'Acesso negado' });
      }

      // Se for o plano padrão, remover o padrão dos outros planos
      if (isDefault) {
        const existingPlans = await storage.getEventPaymentPlans(eventId);
        for (const plan of existingPlans) {
          if (plan.isDefault) {
            await storage.updateEventPaymentPlan(plan.id, { isDefault: false });
          }
        }
      }

      const plan = await storage.createEventPaymentPlan({
        eventId,
        name,
        description,
        installmentCount,
        installmentInterval: installmentInterval || 'monthly',
        firstInstallmentDate: firstInstallmentDate ? new Date(firstInstallmentDate) : undefined,
        discountPolicy: discountPolicy || {},
        lateFeePolicy: lateFeePolicy || {},
        isDefault: isDefault || false,
        status: 'active',
      });

      res.status(201).json(plan);
    } catch (error) {
      console.error('Erro ao criar plano de pagamento:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  /**
   * Obter planos de pagamento de um evento
   */
  static async getEventPaymentPlans(req: Request, res: Response) {
    try {
      const { eventId } = req.params;
      const userId = (req as any).user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'Usuário não autenticado' });
      }

      // Verificar se o usuário tem acesso ao evento
      const event = await storage.getEvent(eventId);
      if (!event) {
        return res.status(404).json({ error: 'Evento não encontrado' });
      }

      const isOrganizer = event.organizerId === userId;
      const userGroupManagers = await storage.getUserGroupManagers(userId);
      const hasGroupAccess = userGroupManagers.some(gm => {
        return gm.group?.eventId === eventId;
      });

      if (!isOrganizer && !hasGroupAccess) {
        return res.status(403).json({ error: 'Acesso negado' });
      }

      const plans = await storage.getEventPaymentPlans(eventId);
      res.json(plans);
    } catch (error) {
      console.error('Erro ao obter planos de pagamento:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  /**
   * Obter parcelas de uma inscrição
   */
  static async getRegistrationInstallments(req: Request, res: Response) {
    try {
      const { registrationId } = req.params;
      const userId = (req as any).user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'Usuário não autenticado' });
      }

      const registration = await storage.getRegistration(registrationId);
      if (!registration) {
        return res.status(404).json({ error: 'Inscrição não encontrada' });
      }

      // Verificar se o usuário tem acesso à inscrição
      const event = await storage.getEvent(registration.eventId);
      if (!event) {
        return res.status(404).json({ error: 'Evento não encontrado' });
      }

      const isOrganizer = event.organizerId === userId;
      const isParticipant = registration.userId === userId;
      const userGroupManagers = await storage.getUserGroupManagers(userId);
      const isGroupManager = registration.groupId && userGroupManagers.some(gm => gm.groupId === registration.groupId);

      if (!isOrganizer && !isParticipant && !isGroupManager) {
        return res.status(403).json({ error: 'Acesso negado' });
      }

      const installments = await storage.getRegistrationInstallments(registrationId);
      res.json(installments);
    } catch (error) {
      console.error('Erro ao obter parcelas:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  /**
   * Processar um pagamento
   */
  static async processPayment(req: Request, res: Response) {
    try {
      const { installmentId } = req.params;
      const { amount, paymentMethod, transactionId, notes } = req.body;
      const userId = (req as any).user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'Usuário não autenticado' });
      }

      const installment = await storage.getPaymentInstallment(installmentId);
      if (!installment) {
        return res.status(404).json({ error: 'Parcela não encontrada' });
      }

      // Verificar se o usuário tem permissão para processar o pagamento
      const registration = await storage.getRegistration(installment.registrationId);
      if (!registration) {
        return res.status(404).json({ error: 'Inscrição não encontrada' });
      }

      const event = await storage.getEvent(registration.eventId);
      if (!event) {
        return res.status(404).json({ error: 'Evento não encontrado' });
      }

      const isOrganizer = event.organizerId === userId;
      const userGroupManagers = await storage.getUserGroupManagers(userId);
      const isGroupManager = registration.groupId && userGroupManagers.some(gm => gm.groupId === registration.groupId);

      if (!isOrganizer && !isGroupManager) {
        return res.status(403).json({ error: 'Acesso negado' });
      }

      const result = await PaymentService.processPayment(
        installmentId,
        amount,
        paymentMethod,
        transactionId,
        notes,
        userId
      );

      res.json(result);
    } catch (error) {
      console.error('Erro ao processar pagamento:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  /**
   * Aplicar desconto a uma parcela
   */
  static async applyDiscount(req: Request, res: Response) {
    try {
      const { installmentId } = req.params;
      const { discountAmount, notes } = req.body;
      const userId = (req as any).user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'Usuário não autenticado' });
      }

      const installment = await storage.getPaymentInstallment(installmentId);
      if (!installment) {
        return res.status(404).json({ error: 'Parcela não encontrada' });
      }

      // Verificar se o usuário tem permissão para aplicar desconto
      const registration = await storage.getRegistration(installment.registrationId);
      if (!registration) {
        return res.status(404).json({ error: 'Inscrição não encontrada' });
      }

      const event = await storage.getEvent(registration.eventId);
      if (!event) {
        return res.status(404).json({ error: 'Evento não encontrado' });
      }

      const isOrganizer = event.organizerId === userId;
      const userGroupManagers = await storage.getUserGroupManagers(userId);
      const isGroupManager = registration.groupId && userGroupManagers.some(gm => gm.groupId === registration.groupId);

      if (!isOrganizer && !isGroupManager) {
        return res.status(403).json({ error: 'Acesso negado' });
      }

      const result = await PaymentService.applyDiscountToInstallment(
        installmentId,
        discountAmount,
        notes,
        userId
      );

      res.json(result);
    } catch (error) {
      console.error('Erro ao aplicar desconto:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  /**
   * Aplicar multa por atraso
   */
  static async applyLateFee(req: Request, res: Response) {
    try {
      const { installmentId } = req.params;
      const { lateFeeAmount, notes } = req.body;
      const userId = (req as any).user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'Usuário não autenticado' });
      }

      const installment = await storage.getPaymentInstallment(installmentId);
      if (!installment) {
        return res.status(404).json({ error: 'Parcela não encontrada' });
      }

      // Verificar se o usuário tem permissão para aplicar multa
      const registration = await storage.getRegistration(installment.registrationId);
      if (!registration) {
        return res.status(404).json({ error: 'Inscrição não encontrada' });
      }

      const event = await storage.getEvent(registration.eventId);
      if (!event) {
        return res.status(404).json({ error: 'Evento não encontrado' });
      }

      const isOrganizer = event.organizerId === userId;
      const userGroupManagers = await storage.getUserGroupManagers(userId);
      const isGroupManager = registration.groupId && userGroupManagers.some(gm => gm.groupId === registration.groupId);

      if (!isOrganizer && !isGroupManager) {
        return res.status(403).json({ error: 'Acesso negado' });
      }

      const result = await PaymentService.applyLateFee(
        installmentId,
        lateFeeAmount,
        notes,
        userId
      );

      res.json(result);
    } catch (error) {
      console.error('Erro ao aplicar multa:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  /**
   * Obter parcelas em atraso
   */
  static async getOverdueInstallments(req: Request, res: Response) {
    try {
      const { eventId } = req.query;
      const userId = (req as any).user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'Usuário não autenticado' });
      }

      // Se eventId for fornecido, verificar acesso ao evento
      if (eventId) {
        const event = await storage.getEvent(eventId as string);
        if (!event) {
          return res.status(404).json({ error: 'Evento não encontrado' });
        }

        const isOrganizer = event.organizerId === userId;
        const userGroupManagers = await storage.getUserGroupManagers(userId);
        const hasGroupAccess = userGroupManagers.some(gm => {
          return gm.group?.eventId === eventId;
        });

        if (!isOrganizer && !hasGroupAccess) {
          return res.status(403).json({ error: 'Acesso negado' });
        }
      }

      const overdueInstallments = await storage.getOverdueInstallments(eventId as string);
      res.json(overdueInstallments);
    } catch (error) {
      console.error('Erro ao obter parcelas em atraso:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  /**
   * Recalcular multas automaticamente
   */
  static async recalculateLateFees(req: Request, res: Response) {
    try {
      const { eventId } = req.query;
      const userId = (req as any).user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'Usuário não autenticado' });
      }

      // Se eventId for fornecido, verificar acesso ao evento
      if (eventId) {
        const event = await storage.getEvent(eventId as string);
        if (!event || event.organizerId !== userId) {
          return res.status(403).json({ error: 'Acesso negado' });
        }
      }

      await PaymentService.recalculateLateFees(eventId as string);
      res.json({ message: 'Multas recalculadas com sucesso' });
    } catch (error) {
      console.error('Erro ao recalcular multas:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  /**
   * Obter relatório de pagamentos
   */
  static async getPaymentReport(req: Request, res: Response) {
    try {
      const { eventId } = req.params;
      const userId = (req as any).user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'Usuário não autenticado' });
      }

      const event = await storage.getEvent(eventId);
      if (!event || event.organizerId !== userId) {
        return res.status(403).json({ error: 'Acesso negado' });
      }

      const report = await PaymentService.generatePaymentReport(eventId);
      res.json(report);
    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  /**
   * Obter analytics de pagamentos de um evento
   */
  static async getEventPaymentAnalytics(req: Request, res: Response) {
    try {
      const { eventId } = req.params;
      const userId = (req as any).user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'Usuário não autenticado' });
      }

      const event = await storage.getEvent(eventId);
      if (!event) {
        return res.status(404).json({ error: 'Evento não encontrado' });
      }

      const isOrganizer = event.organizerId === userId;
      const userGroupManagers = await storage.getUserGroupManagers(userId);
      const hasGroupAccess = userGroupManagers.some(gm => {
        return gm.group?.eventId === eventId;
      });

      if (!isOrganizer && !hasGroupAccess) {
        return res.status(403).json({ error: 'Acesso negado' });
      }

      const analytics = await storage.getPaymentAnalytics(eventId);
      res.json(analytics);
    } catch (error) {
      console.error('Erro ao obter analytics:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  /**
   * Obter transações de uma parcela
   */
  static async getInstallmentTransactions(req: Request, res: Response) {
    try {
      const { installmentId } = req.params;
      const userId = (req as any).user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'Usuário não autenticado' });
      }

      const installment = await storage.getPaymentInstallment(installmentId);
      if (!installment) {
        return res.status(404).json({ error: 'Parcela não encontrada' });
      }

      // Verificar se o usuário tem acesso à parcela
      const registration = await storage.getRegistration(installment.registrationId);
      if (!registration) {
        return res.status(404).json({ error: 'Inscrição não encontrada' });
      }

      const event = await storage.getEvent(registration.eventId);
      if (!event) {
        return res.status(404).json({ error: 'Evento não encontrado' });
      }

      const isOrganizer = event.organizerId === userId;
      const isParticipant = registration.userId === userId;
      const userGroupManagers = await storage.getUserGroupManagers(userId);
      const isGroupManager = registration.groupId && userGroupManagers.some(gm => gm.groupId === registration.groupId);

      if (!isOrganizer && !isParticipant && !isGroupManager) {
        return res.status(403).json({ error: 'Acesso negado' });
      }

      const transactions = await storage.getInstallmentTransactions(installmentId);
      res.json(transactions);
    } catch (error) {
      console.error('Erro ao obter transações:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
}
