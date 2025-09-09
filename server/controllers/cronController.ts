import { Request, Response } from 'express';
import { NotificationService } from '../services/notificationService';

export class CronController {
  /**
   * Endpoint para executar tarefas de cron manualmente
   * Em produção, isso seria executado por um cron job real
   */
  static async runCronTasks(req: Request, res: Response) {
    try {
      console.log('=== INICIANDO EXECUÇÃO DE TAREFAS CRON ===');
      
      const results = {
        upcomingReminders: 0,
        overdueNotifications: 0,
        errors: [] as string[]
      };

      // Executar lembretes de vencimento (parcelas que vencem em 3 dias)
      try {
        await NotificationService.sendUpcomingDueReminders();
        results.upcomingReminders = 1;
        console.log('✅ Lembretes de vencimento executados com sucesso');
      } catch (error) {
        const errorMsg = `Erro nos lembretes de vencimento: ${error instanceof Error ? error.message : 'Erro desconhecido'}`;
        results.errors.push(errorMsg);
        console.error('❌', errorMsg);
      }

      // Executar notificações de atraso
      try {
        await NotificationService.sendOverdueNotifications();
        results.overdueNotifications = 1;
        console.log('✅ Notificações de atraso executadas com sucesso');
      } catch (error) {
        const errorMsg = `Erro nas notificações de atraso: ${error instanceof Error ? error.message : 'Erro desconhecido'}`;
        results.errors.push(errorMsg);
        console.error('❌', errorMsg);
      }

      console.log('=== EXECUÇÃO DE TAREFAS CRON CONCLUÍDA ===');

      return res.json({
        success: true,
        message: 'Tarefas de cron executadas',
        results,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Erro geral na execução de cron:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro na execução de tarefas de cron',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  }

  /**
   * Endpoint para testar envio de email específico
   */
  static async testEmail(req: Request, res: Response) {
    try {
      const { type, email, registrationId } = req.body;

      if (!type || !email) {
        return res.status(400).json({
          success: false,
          message: 'Tipo de email e endereço são obrigatórios'
        });
      }

      switch (type) {
        case 'registration_confirmation':
          if (!registrationId) {
            return res.status(400).json({
              success: false,
              message: 'ID da inscrição é obrigatório para confirmação'
            });
          }
          await NotificationService.sendRegistrationConfirmation(registrationId);
          break;

        case 'installment_reminder':
          // Dados de teste para lembrete
          const { EmailService } = await import('../services/emailService');
          await EmailService.sendInstallmentReminder({
            to: email,
            participantName: 'Usuário Teste',
            eventName: 'Evento Teste',
            installmentNumber: 1,
            totalInstallments: 12,
            amount: 100.00,
            dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 dias
            paymentUrl: 'https://example.com/payment',
            whatsappNumber: '5511999999999'
          });
          break;

        case 'overdue_notification':
          // Dados de teste para notificação de atraso
          const { EmailService: EmailService2 } = await import('../services/emailService');
          await EmailService2.sendOverdueNotification({
            to: email,
            participantName: 'Usuário Teste',
            eventName: 'Evento Teste',
            installmentNumber: 1,
            amount: 100.00,
            daysOverdue: 5,
            lateFee: 10.00,
            paymentUrl: 'https://example.com/payment',
            whatsappNumber: '5511999999999'
          });
          break;

        default:
          return res.status(400).json({
            success: false,
            message: 'Tipo de email inválido. Use: registration_confirmation, installment_reminder, overdue_notification'
          });
      }

      return res.json({
        success: true,
        message: `Email de teste (${type}) enviado com sucesso para ${email}`
      });

    } catch (error) {
      console.error('Erro ao enviar email de teste:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro ao enviar email de teste',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  }

  /**
   * Endpoint para enviar lembretes de vencimento
   */
  static async sendUpcomingReminders(req: Request, res: Response) {
    try {
      console.log('=== ENVIANDO LEMBRETES DE VENCIMENTO ===');
      
      await NotificationService.sendUpcomingDueReminders();
      
      return res.json({
        success: true,
        message: 'Lembretes de vencimento enviados com sucesso'
      });

    } catch (error) {
      console.error('Erro ao enviar lembretes de vencimento:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro ao enviar lembretes de vencimento',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  }

  /**
   * Endpoint para enviar notificações de atraso
   */
  static async sendOverdueNotifications(req: Request, res: Response) {
    try {
      console.log('=== ENVIANDO NOTIFICAÇÕES DE ATRASO ===');
      
      await NotificationService.sendOverdueNotifications();
      
      return res.json({
        success: true,
        message: 'Notificações de atraso enviadas com sucesso'
      });

    } catch (error) {
      console.error('Erro ao enviar notificações de atraso:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro ao enviar notificações de atraso',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  }

  /**
   * Endpoint para verificar status das tarefas de cron
   */
  static async getCronStatus(req: Request, res: Response) {
    try {
      // Aqui você pode implementar lógica para verificar o status das tarefas
      // Por exemplo, verificar quando foi a última execução, quantos emails foram enviados, etc.
      
      return res.json({
        success: true,
        message: 'Status das tarefas de cron',
        lastExecution: new Date().toISOString(),
        nextExecution: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Próximo dia
        status: 'active'
      });

    } catch (error) {
      console.error('Erro ao verificar status de cron:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro ao verificar status de cron',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  }
}
