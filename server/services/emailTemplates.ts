import { generateQRCodeForEmail, generateQRCodeUrl } from '../config/resend';

export interface EmailData {
  eventName: string;
  eventDate: string;
  eventTime: string;
  eventLocation: string;
  eventAddress: string;
  eventImageUrl?: string;
  participantName: string;
  participantEmail: string;
  participantPhone?: string;
  ticketName: string;
  ticketPrice: number;
  totalAmount: number;
  qrCode: string;
  registrationId: string;
  paymentStatus: string;
  isFreeEvent: boolean;
  eventSlug?: string;
  sessionId?: string;
}

export async function generateRegistrationConfirmationEmail(data: EmailData): Promise<string> {
  console.log('🔄 Gerando template de email com QR Code:', data.qrCode);
  
  // Gerar tanto o data URL quanto a URL externa para máxima compatibilidade
  let qrCodeDataUrl = '';
  let qrCodeExternalUrl = '';
  
  try {
    // Tentar gerar data URL (funciona em alguns clientes)
    qrCodeDataUrl = await generateQRCodeForEmail(data.qrCode);
    console.log('✅ QR Code data URL gerado:', qrCodeDataUrl ? 'Sim' : 'Não');
    
    // Gerar URL externa (mais compatível com Gmail)
    qrCodeExternalUrl = generateQRCodeUrl(data.qrCode);
    console.log('✅ QR Code URL externa gerada:', qrCodeExternalUrl ? 'Sim' : 'Não');
  } catch (error) {
    console.error('❌ Erro ao gerar QR Code:', error);
    qrCodeDataUrl = '';
    qrCodeExternalUrl = generateQRCodeUrl(data.qrCode);
  }
  
  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Confirmação de Inscrição - ${data.eventName}</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #374151;
            background-color: #f9fafb;
            margin: 0;
            padding: 0;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 2rem;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 1.875rem;
            font-weight: 700;
        }
        .header p {
            margin: 0.5rem 0 0 0;
            opacity: 0.9;
        }
        .content {
            padding: 2rem;
        }
        .success-badge {
            display: inline-flex;
            align-items: center;
            background-color: #10b981;
            color: white;
            padding: 0.5rem 1rem;
            border-radius: 9999px;
            font-size: 0.875rem;
            font-weight: 600;
            margin-bottom: 1.5rem;
        }
        .success-badge svg {
            width: 1rem;
            height: 1rem;
            margin-right: 0.5rem;
        }
        .event-card {
            background-color: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 1.5rem;
            margin-bottom: 2rem;
        }
        .event-image {
            width: 100%;
            height: 200px;
            object-fit: cover;
            border-radius: 6px;
            margin-bottom: 1rem;
        }
        .event-title {
            font-size: 1.5rem;
            font-weight: 700;
            color: #1f2937;
            margin: 0 0 1rem 0;
        }
        .event-details {
            display: grid;
            gap: 0.75rem;
        }
        .event-detail {
            display: flex;
            align-items: center;
            font-size: 0.875rem;
        }
        .event-detail svg {
            width: 1rem;
            height: 1rem;
            margin-right: 0.5rem;
            color: #6b7280;
        }
        .registration-card {
            background-color: #ffffff;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            padding: 1.5rem;
            margin-bottom: 2rem;
        }
        .registration-title {
            font-size: 1.25rem;
            font-weight: 600;
            color: #1f2937;
            margin: 0 0 1rem 0;
        }
        .participant-info {
            display: grid;
            gap: 0.75rem;
            margin-bottom: 1.5rem;
        }
        .participant-detail {
            display: flex;
            align-items: center;
            font-size: 0.875rem;
        }
        .participant-detail svg {
            width: 1rem;
            height: 1rem;
            margin-right: 0.5rem;
            color: #6b7280;
        }
        .ticket-info {
            background-color: #f3f4f6;
            border-radius: 6px;
            padding: 1rem;
            margin-bottom: 1.5rem;
        }
        .ticket-name {
            font-weight: 600;
            color: #1f2937;
            margin: 0 0 0.5rem 0;
        }
        .ticket-price {
            font-size: 1.25rem;
            font-weight: 700;
            color: #059669;
        }
        .payment-info {
            background-color: #f0f9ff;
            border: 1px solid #0ea5e9;
            border-radius: 6px;
            padding: 1rem;
            margin-bottom: 1.5rem;
        }
        .payment-status {
            display: flex;
            align-items: center;
            font-weight: 600;
            margin-bottom: 0.5rem;
        }
        .payment-status.paid {
            color: #059669;
        }
        .payment-status.pending {
            color: #d97706;
        }
        .payment-status svg {
            width: 1rem;
            height: 1rem;
            margin-right: 0.5rem;
        }
        .total-amount {
            font-size: 1.125rem;
            font-weight: 600;
            color: #1f2937;
        }
        .qr-section {
            text-align: center;
            margin-top: 2rem;
            padding-top: 2rem;
            border-top: 1px solid #e5e7eb;
        }
        .qr-title {
            font-weight: 600;
            margin-bottom: 1rem;
            color: #1f2937;
        }
        .qr-container {
            background-color: #ffffff;
            border: 2px solid #e5e7eb;
            border-radius: 8px;
            padding: 1.5rem;
            display: inline-block;
        }
        .qr-code {
            width: 200px;
            height: 200px;
            margin-bottom: 1rem;
        }
        .qr-text {
            font-family: 'Courier New', monospace;
            font-size: 0.75rem;
            color: #6b7280;
            word-break: break-all;
        }
        .footer {
            background-color: #f8fafc;
            padding: 2rem;
            text-align: center;
            border-top: 1px solid #e5e7eb;
        }
        .footer p {
            margin: 0;
            font-size: 0.875rem;
            color: #6b7280;
        }
        .footer a {
            color: #3b82f6;
            text-decoration: none;
        }
        .footer a:hover {
            text-decoration: underline;
        }
        @media (max-width: 600px) {
            .container {
                margin: 0;
                border-radius: 0;
            }
            .header, .content, .footer {
                padding: 1rem;
            }
            .event-details, .participant-info {
                grid-template-columns: 1fr;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <!-- Header -->
        <div class="header">
            <h1>🎉 Inscrição Confirmada!</h1>
            <p>Você está oficialmente inscrito no evento</p>
        </div>

        <!-- Content -->
        <div class="content">
            <!-- Success Badge -->
            <div class="success-badge">
                <svg fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
                </svg>
                Inscrição Confirmada
            </div>

            <!-- Event Information -->
            <div class="event-card">
                ${data.eventImageUrl ? `<img src="${data.eventImageUrl}" alt="${data.eventName}" class="event-image">` : ''}
                <h2 class="event-title">${data.eventName}</h2>
                <div class="event-details">
                    <div class="event-detail">
                        <svg fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clip-rule="evenodd"></path>
                        </svg>
                        ${data.eventDate} às ${data.eventTime}
                    </div>
                    ${data.eventLocation ? `
                    <div class="event-detail">
                        <svg fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd"></path>
                        </svg>
                        ${data.eventLocation}
                    </div>
                    ` : ''}
                    ${data.eventAddress ? `
                    <div class="event-detail">
                        <svg fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-6a1 1 0 00-1-1H9a1 1 0 00-1 1v6a1 1 0 01-1 1H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z" clip-rule="evenodd"></path>
                        </svg>
                        ${data.eventAddress}
                    </div>
                    ` : ''}
                </div>
            </div>

            <!-- Registration Information -->
            <div class="registration-card">
                <h3 class="registration-title">📋 Informações da Inscrição</h3>
                
                <div class="participant-info">
                    <div class="participant-detail">
                        <svg fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd"></path>
                        </svg>
                        <strong>Nome:</strong> ${data.participantName}
                    </div>
                    <div class="participant-detail">
                        <svg fill="currentColor" viewBox="0 0 20 20">
                            <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"></path>
                            <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"></path>
                        </svg>
                        <strong>Email:</strong> ${data.participantEmail}
                    </div>
                    ${data.participantPhone ? `
                    <div class="participant-detail">
                        <svg fill="currentColor" viewBox="0 0 20 20">
                            <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"></path>
                        </svg>
                        <strong>Telefone:</strong> ${data.participantPhone}
                    </div>
                    ` : ''}
                </div>

                <div class="ticket-info">
                    <h4 class="ticket-name">🎫 ${data.ticketName}</h4>
                    <div class="ticket-price">
                        ${data.isFreeEvent ? 'Gratuito' : `R$ ${data.ticketPrice.toFixed(2)}`}
                    </div>
                </div>

                <div class="payment-info">
                    <div class="payment-status ${data.paymentStatus === 'paid' ? 'paid' : 'pending'}">
                        <svg fill="currentColor" viewBox="0 0 20 20">
                            ${data.paymentStatus === 'paid' ? 
                                '<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>' :
                                '<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd"></path>'
                            }
                        </svg>
                        ${data.paymentStatus === 'paid' ? 'Pagamento Confirmado' : 'Aguardando Pagamento'}
                    </div>
                    <div class="total-amount">
                        Total: ${data.isFreeEvent ? 'Gratuito' : `R$ ${data.totalAmount.toFixed(2)}`}
                    </div>
                </div>
            </div>

            <!-- QR Code Section -->
            ${(qrCodeDataUrl || qrCodeExternalUrl) ? `
            <div class="qr-section">
                <h3 class="qr-title">📱 Código QR para Check-in</h3>
                <div class="qr-container">
                    ${qrCodeDataUrl ? `
                        <img src="${qrCodeDataUrl}" alt="QR Code" class="qr-code" style="display: block;">
                    ` : ''}
                    ${qrCodeExternalUrl ? `
                        <img src="${qrCodeExternalUrl}" alt="QR Code" class="qr-code" style="display: ${qrCodeDataUrl ? 'none' : 'block'};" 
                             onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
                    ` : ''}
                    <div class="qr-fallback" style="display: ${qrCodeDataUrl || qrCodeExternalUrl ? 'none' : 'block'}; 
                                                   background-color: #f3f4f6; 
                                                   padding: 1rem; 
                                                   border-radius: 8px; 
                                                   text-align: center; 
                                                   margin: 1rem 0;">
                        <p style="margin: 0 0 0.5rem 0; font-weight: 600; color: #374151;">QR Code não disponível</p>
                        <p style="margin: 0; font-size: 0.875rem; color: #6b7280;">Use o código abaixo para check-in:</p>
                    </div>
                    <div class="qr-text" style="font-family: 'Courier New', monospace; 
                                               font-size: 0.75rem; 
                                               color: #6b7280; 
                                               word-break: break-all; 
                                               background-color: #f9fafb; 
                                               padding: 0.5rem; 
                                               border-radius: 4px; 
                                               margin-top: 0.5rem;">
                        ${data.qrCode}
                    </div>
                    <div style="margin-top: 1rem; padding: 0.75rem; background-color: #fef3c7; border-radius: 6px; border-left: 4px solid #f59e0b;">
                        <p style="margin: 0; font-size: 0.875rem; color: #92400e;">
                            <strong>💡 Dica:</strong> Se o QR Code não aparecer, use o código de texto acima ou clique 
                            <a href="${qrCodeExternalUrl}" style="color: #d97706; text-decoration: underline;">aqui para ver o QR Code</a>.
                        </p>
                    </div>
                </div>
                
                <!-- Link para página de confirmação -->
                ${data.eventSlug ? `
                <div style="margin-top: 1.5rem; text-align: center;">
                    <a href="${process.env.FRONTEND_URL || 'http://localhost:5000'}/registration/confirmation?id=${data.registrationId}&eventSlug=${data.eventSlug}${data.sessionId ? `&session_id=${data.sessionId}` : ''}" 
                       style="display: inline-block; 
                              background-color: #3b82f6; 
                              color: white; 
                              padding: 0.75rem 1.5rem; 
                              border-radius: 6px; 
                              text-decoration: none; 
                              font-weight: 600; 
                              font-size: 0.875rem;
                              transition: background-color 0.2s;">
                        📱 Ver Página de Confirmação
                    </a>
                    <p style="margin: 0.5rem 0 0 0; font-size: 0.75rem; color: #6b7280;">
                        Acesse sua página de confirmação para mais detalhes
                    </p>
                </div>
                ` : ''}
            </div>
            ` : ''}
        </div>

        <!-- Footer -->
        <div class="footer">
            <p>
                <strong>EventsEnroll</strong><br>
                Sistema de Gestão de Eventos<br>
                <a href="mailto:suporte@juliodevelop.online">suporte@juliodevelop.online</a>
            </p>
            <p style="margin-top: 1rem; font-size: 0.75rem;">
                Este é um email automático. Por favor, não responda a esta mensagem.
            </p>
        </div>
    </div>
</body>
</html>
  `;
}
