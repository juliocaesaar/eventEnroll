import { Resend } from 'resend';

// Configuração do Resend
export const resend = new Resend(process.env.RESEND_API_KEY || 're_L4nrK6rq_5oQT7qrdSsJaFgKWuD5oSFau');

// Configurações padrão para emails
export const EMAIL_CONFIG = {
  from: 'EventFlow <eventflow@juliodevelop.online>',
  replyTo: 'suporte@juliodevelop.online',
};

// Função para gerar QR Code em base64 (para email)
export async function generateQRCodeForEmail(qrCodeString: string): Promise<string> {
  try {
    console.log('🔄 Iniciando geração de QR Code para:', qrCodeString);
    
    if (!qrCodeString || qrCodeString.trim() === '') {
      console.error('❌ String do QR Code está vazia ou inválida');
      return '';
    }
    
    const QRCode = await import('qrcode');
    console.log('✅ Biblioteca QRCode importada com sucesso');
    
    const qrCodeDataUrl = await QRCode.toDataURL(qrCodeString, {
      width: 200,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });
    
    console.log('✅ QR Code gerado com sucesso, tamanho:', qrCodeDataUrl.length);
    return qrCodeDataUrl;
  } catch (error) {
    console.error('❌ Erro ao gerar QR Code para email:', error);
    console.error('❌ Stack trace:', error instanceof Error ? error.stack : 'No stack trace');
    return '';
  }
}

// Função para gerar URL do QR Code usando serviço externo (mais compatível com Gmail)
export function generateQRCodeUrl(qrCodeString: string): string {
  if (!qrCodeString || qrCodeString.trim() === '') {
    return '';
  }
  
  // Usar o serviço qr-server.com que é mais compatível com clientes de email
  const encodedString = encodeURIComponent(qrCodeString);
  return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodedString}&format=png&bgcolor=ffffff&color=000000&margin=10`;
}
