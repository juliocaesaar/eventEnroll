import { resend, EMAIL_CONFIG } from '../config/resend';

export interface EmailTemplate {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

export class EmailService {
  private static readonly FROM_EMAIL = EMAIL_CONFIG.from;

  /**
   * Enviar email de notificação de parcela vencida
   */
  static async sendInstallmentReminder(data: {
    to: string;
    participantName: string;
    eventName: string;
    installmentNumber: number;
    totalInstallments: number;
    amount: number;
    dueDate: string;
    paymentUrl: string;
    whatsappNumber?: string;
  }) {
    const { to, participantName, eventName, installmentNumber, totalInstallments, amount, dueDate, paymentUrl, whatsappNumber } = data;

    const subject = `EventFlow - Lembrete de Pagamento - ${eventName}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Lembrete de Pagamento</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #3b82f6; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f8fafc; padding: 30px; border-radius: 0 0 8px 8px; }
          .amount { font-size: 24px; font-weight: bold; color: #059669; }
          .due-date { color: #dc2626; font-weight: bold; }
          .button { display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 0; }
          .whatsapp-button { background: #25d366; }
          .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 14px; color: #6b7280; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>EventFlow</h1>
            <p>Lembrete de Pagamento</p>
          </div>
          
          <div class="content">
            <h2>Olá, ${participantName}!</h2>
            
            <p>Este é um lembrete sobre o pagamento da sua inscrição no evento <strong>${eventName}</strong>.</p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3b82f6;">
              <h3>Detalhes da Parcela</h3>
              <p><strong>Parcela:</strong> ${installmentNumber} de ${totalInstallments}</p>
              <p><strong>Valor:</strong> <span class="amount">R$ ${amount.toFixed(2)}</span></p>
              <p><strong>Vencimento:</strong> <span class="due-date">${new Date(dueDate).toLocaleDateString('pt-BR')}</span></p>
            </div>
            
            <p>Para realizar o pagamento, clique no botão abaixo:</p>
            <a href="${paymentUrl}" class="button">Pagar Agora</a>
            
            ${whatsappNumber ? `
              <p>Ou entre em contato conosco via WhatsApp:</p>
              <a href="https://wa.me/${whatsappNumber.replace(/\D/g, '')}" class="button whatsapp-button">Contatar via WhatsApp</a>
            ` : ''}
            
            <div class="footer">
              <p><strong>EventFlow</strong> - Sistema de Gestão de Eventos</p>
              <p>Este é um email automático. Em caso de dúvidas, entre em contato com os organizadores do evento.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    try {
      const result = await resend.emails.send({
        from: this.FROM_EMAIL,
        to,
        subject,
        html,
      });

      console.log('Email de lembrete enviado:', result);
      return result;
    } catch (error) {
      console.error('Erro ao enviar email de lembrete:', error);
      throw error;
    }
  }

  /**
   * Enviar email de confirmação de inscrição
   */
  static async sendRegistrationConfirmation(data: {
    to: string;
    participantName: string;
    eventName: string;
    totalAmount: number;
    installmentPlan?: {
      totalInstallments: number;
      monthlyAmount: number;
      firstDueDate: string;
    };
  }) {
    const { to, participantName, eventName, totalAmount, installmentPlan } = data;

    const subject = `EventFlow - Confirmação de Inscrição - ${eventName}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Confirmação de Inscrição</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #059669; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f8fafc; padding: 30px; border-radius: 0 0 8px 8px; }
          .amount { font-size: 24px; font-weight: bold; color: #059669; }
          .installment-info { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3b82f6; }
          .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 14px; color: #6b7280; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>EventFlow</h1>
            <p>Inscrição Confirmada!</p>
          </div>
          
          <div class="content">
            <h2>Parabéns, ${participantName}!</h2>
            
            <p>Sua inscrição no evento <strong>${eventName}</strong> foi confirmada com sucesso!</p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #059669;">
              <h3>Detalhes da Inscrição</h3>
              <p><strong>Evento:</strong> ${eventName}</p>
              <p><strong>Valor Total:</strong> <span class="amount">R$ ${totalAmount.toFixed(2)}</span></p>
            </div>
            
            ${installmentPlan ? `
              <div class="installment-info">
                <h3>Plano de Pagamento</h3>
                <p><strong>Forma de Pagamento:</strong> Parcelamento em ${installmentPlan.totalInstallments} parcelas mensais</p>
                <p><strong>Valor da Parcela:</strong> <span class="amount">R$ ${installmentPlan.monthlyAmount.toFixed(2)}</span></p>
                <p><strong>Primeira Parcela:</strong> ${new Date(installmentPlan.firstDueDate).toLocaleDateString('pt-BR')}</p>
                <p><em>Você receberá lembretes mensais sobre os vencimentos das parcelas.</em></p>
              </div>
            ` : ''}
            
            <div class="footer">
              <p><strong>EventFlow</strong> - Sistema de Gestão de Eventos</p>
              <p>Em caso de dúvidas, entre em contato com os organizadores do evento.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    try {
      const result = await resend.emails.send({
        from: this.FROM_EMAIL,
        to,
        subject,
        html,
      });

      console.log('Email de confirmação enviado:', result);
      return result;
    } catch (error) {
      console.error('Erro ao enviar email de confirmação:', error);
      throw error;
    }
  }

  /**
   * Enviar email de cobrança de parcela em atraso
   */
  static async sendOverdueNotification(data: {
    to: string;
    participantName: string;
    eventName: string;
    installmentNumber: number;
    amount: number;
    daysOverdue: number;
    lateFee: number;
    paymentUrl: string;
    whatsappNumber?: string;
  }) {
    const { to, participantName, eventName, installmentNumber, amount, daysOverdue, lateFee, paymentUrl, whatsappNumber } = data;

    const subject = `EventFlow - Parcela em Atraso - ${eventName}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Parcela em Atraso</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #dc2626; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f8fafc; padding: 30px; border-radius: 0 0 8px 8px; }
          .amount { font-size: 24px; font-weight: bold; color: #dc2626; }
          .overdue-info { background: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626; }
          .button { display: inline-block; background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 0; }
          .whatsapp-button { background: #25d366; }
          .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 14px; color: #6b7280; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>EventFlow</h1>
            <p>Parcela em Atraso</p>
          </div>
          
          <div class="content">
            <h2>Olá, ${participantName}!</h2>
            
            <p>Identificamos que a parcela ${installmentNumber} do evento <strong>${eventName}</strong> está em atraso.</p>
            
            <div class="overdue-info">
              <h3>Detalhes da Parcela em Atraso</h3>
              <p><strong>Parcela:</strong> ${installmentNumber}</p>
              <p><strong>Valor Original:</strong> R$ ${amount.toFixed(2)}</p>
              <p><strong>Multa por Atraso:</strong> R$ ${lateFee.toFixed(2)}</p>
              <p><strong>Valor Total:</strong> <span class="amount">R$ ${(amount + lateFee).toFixed(2)}</span></p>
              <p><strong>Dias em Atraso:</strong> ${daysOverdue} dias</p>
            </div>
            
            <p>Para regularizar sua situação, clique no botão abaixo:</p>
            <a href="${paymentUrl}" class="button">Pagar Agora</a>
            
            ${whatsappNumber ? `
              <p>Ou entre em contato conosco via WhatsApp:</p>
              <a href="https://wa.me/${whatsappNumber.replace(/\D/g, '')}" class="button whatsapp-button">Contatar via WhatsApp</a>
            ` : ''}
            
            <div class="footer">
              <p><strong>EventFlow</strong> - Sistema de Gestão de Eventos</p>
              <p>Este é um email automático. Em caso de dúvidas, entre em contato com os organizadores do evento.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    try {
      const result = await resend.emails.send({
        from: this.FROM_EMAIL,
        to,
        subject,
        html,
      });

      console.log('Email de cobrança enviado:', result);
      return result;
    } catch (error) {
      console.error('Erro ao enviar email de cobrança:', error);
      throw error;
    }
  }
}