import { MailService } from '@sendgrid/mail';

class EmailService {
  private mailService: MailService | null = null;
  private isConfigured = false;

  constructor() {
    this.initialize();
  }

  private initialize() {
    if (process.env.SENDGRID_API_KEY) {
      this.mailService = new MailService();
      this.mailService.setApiKey(process.env.SENDGRID_API_KEY);
      this.isConfigured = true;
      console.log('📧 SendGrid configured successfully');
    } else {
      console.log('⚠️ SendGrid not configured - emails will be logged to console');
    }
  }

  async sendRegistrationConfirmation(to: string, data: {
    eventTitle: string;
    eventDate: string;
    attendeeName: string;
    ticketType: string;
    qrCode?: string;
    eventSlug: string;
  }) {
    const subject = `Confirmação de Inscrição - ${data.eventTitle}`;
    const html = this.generateRegistrationConfirmationHTML(data);
    
    return this.sendEmail(to, subject, html);
  }

  async sendPaymentReceived(to: string, data: {
    eventTitle: string;
    attendeeName: string;
    amount: number;
    paymentId: string;
  }) {
    const subject = `Pagamento Confirmado - ${data.eventTitle}`;
    const html = this.generatePaymentConfirmationHTML(data);
    
    return this.sendEmail(to, subject, html);
  }

  async sendEventReminder(to: string, data: {
    eventTitle: string;
    eventDate: string;
    attendeeName: string;
    eventSlug: string;
  }) {
    const subject = `Lembrete: ${data.eventTitle} é amanhã!`;
    const html = this.generateEventReminderHTML(data);
    
    return this.sendEmail(to, subject, html);
  }

  private async sendEmail(to: string, subject: string, html: string) {
    if (!this.isConfigured || !this.mailService) {
      console.log(`📧 [DEVELOPMENT] Email would be sent to: ${to}`);
      console.log(`📧 [DEVELOPMENT] Subject: ${subject}`);
      console.log(`📧 [DEVELOPMENT] Content preview: ${html.substring(0, 200)}...`);
      return { success: true, message: 'Email logged in development mode' };
    }

    try {
      await this.mailService.send({
        to,
        from: process.env.SENDGRID_FROM_EMAIL || 'noreply@eventflow.app',
        subject,
        html,
      });
      
      console.log(`📧 Email sent successfully to ${to}`);
      return { success: true, message: 'Email sent successfully' };
    } catch (error) {
      console.error('📧 SendGrid email error:', error);
      return { success: false, message: 'Failed to send email', error };
    }
  }

  private generateRegistrationConfirmationHTML(data: {
    eventTitle: string;
    eventDate: string;
    attendeeName: string;
    ticketType: string;
    qrCode?: string;
    eventSlug: string;
  }) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Confirmação de Inscrição</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: white; padding: 30px; border: 1px solid #e1e5e9; }
          .footer { background: #f8f9fa; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; }
          .ticket-info { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .qr-code { text-align: center; margin: 20px 0; }
          .button { display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Inscrição Confirmada!</h1>
            <p>Seu ingresso para ${data.eventTitle}</p>
          </div>
          
          <div class="content">
            <h2>Olá, ${data.attendeeName}!</h2>
            <p>Sua inscrição foi confirmada com sucesso. Aqui estão os detalhes do seu evento:</p>
            
            <div class="ticket-info">
              <h3>📅 Detalhes do Evento</h3>
              <p><strong>Evento:</strong> ${data.eventTitle}</p>
              <p><strong>Data:</strong> ${data.eventDate}</p>
              <p><strong>Tipo de Ingresso:</strong> ${data.ticketType}</p>
            </div>
            
            ${data.qrCode ? `
              <div class="qr-code">
                <h3>🎫 Seu QR Code</h3>
                <p>Apresente este código no evento:</p>
                <div style="background: white; padding: 20px; border: 2px dashed #ccc; display: inline-block;">
                  <strong>${data.qrCode}</strong>
                </div>
              </div>
            ` : ''}
            
            <p>Guarde este email como comprovante. Você precisará dele para acessar o evento.</p>
            
            <div style="text-align: center;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:5000'}/event/${data.eventSlug}" class="button">
                Ver Detalhes do Evento
              </a>
            </div>
          </div>
          
          <div class="footer">
            <p>Este email foi enviado automaticamente pelo EventFlow.</p>
            <p>Se você tem dúvidas, entre em contato conosco.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private generatePaymentConfirmationHTML(data: {
    eventTitle: string;
    attendeeName: string;
    amount: number;
    paymentId: string;
  }) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Pagamento Confirmado</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: white; padding: 30px; border: 1px solid #e1e5e9; }
          .footer { background: #f8f9fa; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; }
          .payment-info { background: #d4edda; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #28a745; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ Pagamento Confirmado!</h1>
            <p>Seu pagamento para ${data.eventTitle} foi processado</p>
          </div>
          
          <div class="content">
            <h2>Olá, ${data.attendeeName}!</h2>
            <p>Recebemos seu pagamento com sucesso. Sua inscrição está agora confirmada!</p>
            
            <div class="payment-info">
              <h3>💳 Detalhes do Pagamento</h3>
              <p><strong>Valor Pago:</strong> R$ ${data.amount.toFixed(2)}</p>
              <p><strong>ID do Pagamento:</strong> ${data.paymentId}</p>
              <p><strong>Status:</strong> Confirmado</p>
            </div>
            
            <p>Você receberá em breve um email com todos os detalhes do evento e seu QR Code de acesso.</p>
          </div>
          
          <div class="footer">
            <p>Obrigado por escolher o EventFlow!</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private generateEventReminderHTML(data: {
    eventTitle: string;
    eventDate: string;
    attendeeName: string;
    eventSlug: string;
  }) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Lembrete do Evento</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #ffc107 0%, #fd7e14 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: white; padding: 30px; border: 1px solid #e1e5e9; }
          .footer { background: #f8f9fa; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; }
          .reminder-info { background: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107; }
          .button { display: inline-block; background: #fd7e14; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>⏰ Lembrete do Evento</h1>
            <p>${data.eventTitle} é amanhã!</p>
          </div>
          
          <div class="content">
            <h2>Olá, ${data.attendeeName}!</h2>
            <p>Estamos ansiosos para vê-lo no evento que acontece amanhã!</p>
            
            <div class="reminder-info">
              <h3>📅 Detalhes do Evento</h3>
              <p><strong>Evento:</strong> ${data.eventTitle}</p>
              <p><strong>Data/Hora:</strong> ${data.eventDate}</p>
            </div>
            
            <p>Não se esqueça de:</p>
            <ul>
              <li>Trazer seu QR Code (neste email ou no celular)</li>
              <li>Chegar 15 minutos antes do início</li>
              <li>Trazer um documento de identificação</li>
            </ul>
            
            <div style="text-align: center;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:5000'}/event/${data.eventSlug}" class="button">
                Ver Detalhes do Evento
              </a>
            </div>
          </div>
          
          <div class="footer">
            <p>Nos vemos em breve!</p>
            <p>Equipe EventFlow</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}

export const emailService = new EmailService();