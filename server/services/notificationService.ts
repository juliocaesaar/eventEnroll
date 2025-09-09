import { storage } from '../storage';
import { EmailService } from './emailService';
import { PaymentService } from './paymentService';

export class NotificationService {
  /**
   * Enviar lembretes de parcelas que vencem em 3 dias
   */
  static async sendUpcomingDueReminders() {
    try {
      console.log('=== INICIANDO ENVIO DE LEMBRETES DE VENCIMENTO ===');
      
      const threeDaysFromNow = new Date();
      threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
      
      // Buscar parcelas que vencem em 3 dias
      const upcomingInstallments = await storage.getUpcomingInstallments(threeDaysFromNow);
      
      console.log(`Encontradas ${upcomingInstallments.length} parcelas vencendo em 3 dias`);
      
      for (const installment of upcomingInstallments) {
        try {
          // Buscar dados da inscrição e evento
          const registration = await storage.getRegistration(installment.registrationId);
          if (!registration) continue;
          
          const event = await storage.getEvent(registration.eventId);
          if (!event) continue;
          
          // Buscar dados do grupo se existir
          let groupWhatsapp = event.whatsappNumber;
          if (registration.groupId) {
            const group = await storage.getEventGroup(registration.groupId);
            if (group?.whatsappNumber) {
              groupWhatsapp = group.whatsappNumber;
            }
          }
          
          // Gerar URL de pagamento
          const paymentUrl = `${process.env.FRONTEND_URL || 'http://localhost:5000'}/payment/confirmation?registrationId=${registration.id}&eventSlug=${event.slug}`;
          
          // Enviar email de lembrete
          await EmailService.sendInstallmentReminder({
            to: registration.email,
            participantName: `${registration.firstName} ${registration.lastName}`,
            eventName: event.title,
            installmentNumber: installment.installmentNumber,
            totalInstallments: installment.totalInstallments,
            amount: parseFloat(installment.amount),
            dueDate: installment.dueDate.toISOString(),
            paymentUrl,
            whatsappNumber: groupWhatsapp
          });
          
          console.log(`Lembrete enviado para ${registration.email} - Parcela ${installment.installmentNumber}`);
          
        } catch (error) {
          console.error(`Erro ao enviar lembrete para parcela ${installment.id}:`, error);
        }
      }
      
      console.log('=== ENVIO DE LEMBRETES CONCLUÍDO ===');
      
    } catch (error) {
      console.error('Erro no serviço de lembretes:', error);
    }
  }
  
  /**
   * Enviar notificações de parcelas em atraso
   */
  static async sendOverdueNotifications() {
    try {
      console.log('=== INICIANDO ENVIO DE NOTIFICAÇÕES DE ATRASO ===');
      
      const today = new Date();
      
      // Buscar parcelas em atraso
      const overdueInstallments = await storage.getOverdueInstallments(today);
      
      console.log(`Encontradas ${overdueInstallments.length} parcelas em atraso`);
      
      for (const installment of overdueInstallments) {
        try {
          // Buscar dados da inscrição e evento
          const registration = await storage.getRegistration(installment.registrationId);
          if (!registration) continue;
          
          const event = await storage.getEvent(registration.eventId);
          if (!event) continue;
          
          // Calcular multa se aplicável
          const paymentService = new PaymentService();
          const lateFee = await paymentService.calculateLateFee(installment);
          
          // Buscar dados do grupo se existir
          let groupWhatsapp = event.whatsappNumber;
          if (registration.groupId) {
            const group = await storage.getEventGroup(registration.groupId);
            if (group?.whatsappNumber) {
              groupWhatsapp = group.whatsappNumber;
            }
          }
          
          // Calcular dias em atraso
          const daysOverdue = Math.floor((today.getTime() - installment.dueDate.getTime()) / (1000 * 60 * 60 * 24));
          
          // Gerar URL de pagamento
          const paymentUrl = `${process.env.FRONTEND_URL || 'http://localhost:5000'}/payment/confirmation?registrationId=${registration.id}&eventSlug=${event.slug}`;
          
          // Enviar email de cobrança
          await EmailService.sendOverdueNotification({
            to: registration.email,
            participantName: `${registration.firstName} ${registration.lastName}`,
            eventName: event.title,
            installmentNumber: installment.installmentNumber,
            amount: parseFloat(installment.amount),
            daysOverdue,
            lateFee,
            paymentUrl,
            whatsappNumber: groupWhatsapp
          });
          
          console.log(`Notificação de atraso enviada para ${registration.email} - Parcela ${installment.installmentNumber}`);
          
        } catch (error) {
          console.error(`Erro ao enviar notificação de atraso para parcela ${installment.id}:`, error);
        }
      }
      
      console.log('=== ENVIO DE NOTIFICAÇÕES DE ATRASO CONCLUÍDO ===');
      
    } catch (error) {
      console.error('Erro no serviço de notificações de atraso:', error);
    }
  }
  
  /**
   * Enviar confirmação de inscrição
   */
  static async sendRegistrationConfirmation(registrationId: string) {
    try {
      const registration = await storage.getRegistration(registrationId);
      if (!registration) return;
      
      const event = await storage.getEvent(registration.eventId);
      if (!event) return;
      
      // Buscar plano de pagamento se existir
      let installmentPlan;
      if (registration.paymentPlanId) {
        const paymentPlan = await storage.getEventPaymentPlan(registration.paymentPlanId);
        if (paymentPlan) {
          installmentPlan = {
            totalInstallments: paymentPlan.installmentCount,
            monthlyAmount: parseFloat(registration.totalAmount || '0') / paymentPlan.installmentCount,
            firstDueDate: paymentPlan.firstInstallmentDate?.toISOString() || new Date().toISOString()
          };
        }
      }
      
      await EmailService.sendRegistrationConfirmation({
        to: registration.email,
        participantName: `${registration.firstName} ${registration.lastName}`,
        eventName: event.title,
        totalAmount: parseFloat(registration.totalAmount || '0'),
        installmentPlan
      });
      
      console.log(`Confirmação de inscrição enviada para ${registration.email}`);
      
    } catch (error) {
      console.error('Erro ao enviar confirmação de inscrição:', error);
    }
  }
}
