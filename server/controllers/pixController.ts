import { Request, Response } from 'express';
import { storage } from '../storage';
import { z } from 'zod';

export class PixController {
  // Gerar QR Code PIX
  static async generatePixQr(req: Request, res: Response) {
    try {
      const { registrationId, amount, pixUrl } = req.body;

      if (!registrationId || !amount || !pixUrl) {
        return res.status(400).json({ 
          error: 'registrationId, amount e pixUrl são obrigatórios' 
        });
      }

      // Buscar inscrição
      const registration = await storage.getRegistration(registrationId);
      if (!registration) {
        return res.status(404).json({ error: 'Inscrição não encontrada' });
      }

      // Validar se a inscrição está pendente
      if (registration.status !== 'pending_payment') {
        return res.status(400).json({ 
          error: 'Inscrição não está pendente de pagamento' 
        });
      }

      // Gerar QR Code PIX (simulação - em produção usar biblioteca real)
      const qrCodeData = {
        pixUrl,
        amount: parseFloat(amount),
        registrationId,
        expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 minutos
        qrCodeImage: `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==`, // Placeholder
      };

      // Salvar dados do PIX na inscrição
      await storage.updateRegistration(registrationId, {
        paymentData: JSON.stringify(qrCodeData),
        paymentMethod: 'pix',
      });

      res.json({
        success: true,
        qrCode: qrCodeData,
        message: 'QR Code PIX gerado com sucesso'
      });

    } catch (error) {
      console.error('Erro ao gerar QR Code PIX:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  // Confirmar pagamento manual (para organizadores)
  static async confirmManualPayment(req: Request, res: Response) {
    try {
      const { registrationId, paymentProof, installmentId, amount } = req.body;

      if (!registrationId) {
        return res.status(400).json({ error: 'registrationId é obrigatório' });
      }

      // Buscar inscrição
      const registration = await storage.getRegistration(registrationId);
      if (!registration) {
        return res.status(404).json({ error: 'Inscrição não encontrada' });
      }

      // Buscar evento para obter dados
      const event = await storage.getEvent(registration.eventId);
      if (!event) {
        return res.status(404).json({ error: 'Evento não encontrado' });
      }

      // Se for confirmação de parcela específica
      if (installmentId) {
        const installment = await storage.getPaymentInstallment(installmentId);
        if (!installment) {
          return res.status(404).json({ error: 'Parcela não encontrada' });
        }

        // Atualizar parcela como paga
        await storage.updatePaymentInstallment(installmentId, {
          status: 'paid',
          paidAt: new Date(),
          paymentProof: paymentProof || null,
          paidAmount: amount || installment.amount
        });

        // Recalcular o total pago baseado em todas as parcelas pagas
        const allInstallments = await storage.getRegistrationInstallments(registrationId);
        const totalPaid = allInstallments
          .filter(inst => inst.status === 'paid')
          .reduce((sum, inst) => sum + parseFloat(inst.paidAmount || '0'), 0);
        
        const remainingAmount = parseFloat(registration.totalAmount || '0') - totalPaid;

        await storage.updateRegistration(registrationId, {
          amountPaid: totalPaid.toFixed(2),
          remainingAmount: remainingAmount.toFixed(2),
          paymentStatus: remainingAmount <= 0 ? 'paid' : 'partial_paid'
        });

        // Verificar se todas as parcelas foram pagas
        if (remainingAmount <= 0) {
          await storage.updateRegistration(registrationId, {
            status: 'confirmed',
            paymentStatus: 'paid',
            paidAt: new Date()
          });
        }

        res.json({
          success: true,
          message: 'Parcela confirmada com sucesso',
          installment: {
            id: installmentId,
            status: 'paid',
            amountPaid: installmentAmount
          },
          registration: {
            id: registration.id,
            amountPaid: newAmountPaid.toFixed(2),
            remainingAmount: remainingAmount.toFixed(2),
            paymentStatus: remainingAmount <= 0 ? 'paid' : 'partial_paid'
          }
        });
        return;
      }

      // Confirmação de pagamento total (método antigo para compatibilidade)
      if (registration.status !== 'pending_payment' && registration.paymentStatus !== 'installment_plan') {
        return res.status(400).json({ 
          error: 'Inscrição não está pendente de pagamento' 
        });
      }

      // Atualizar status da inscrição
      await storage.updateRegistration(registrationId, {
        status: 'confirmed',
        paymentStatus: 'paid',
        amountPaid: registration.totalAmount || '0.00',
        remainingAmount: '0.00',
        paymentMethod: 'pix_manual',
        paymentProof: paymentProof || null,
        paidAt: new Date(),
      });

      // Enviar notificação (se Pusher estiver configurado)
      try {
        const { sendPusherNotificationToChannels, getEventChannel, getUserChannel, PUSHER_EVENTS } = await import('../config/pusher');
        
        const eventChannel = getEventChannel(event.id);
        const userChannel = getUserChannel(event.organizerId);
        const channels = [eventChannel, userChannel];
        
        await sendPusherNotificationToChannels(channels, PUSHER_EVENTS.PAYMENT_CONFIRMED, {
          registration: {
            id: registration.id,
            firstName: registration.firstName,
            lastName: registration.lastName,
            email: registration.email,
            status: 'confirmed',
            paymentStatus: 'paid',
            amountPaid: registration.totalAmount,
            paidAt: new Date()
          },
          event: {
            id: event.id,
            title: event.title
          }
        });
      } catch (pusherError) {
        console.log('Erro ao enviar notificação Pusher:', pusherError);
        // Não falhar por causa do Pusher
      }

      res.json({
        success: true,
        message: 'Pagamento confirmado com sucesso',
        registration: {
          id: registration.id,
          status: 'confirmed',
          paymentStatus: 'paid'
        }
      });

    } catch (error) {
      console.error('Erro ao confirmar pagamento manual:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  // Verificar status do pagamento
  static async checkPaymentStatus(req: Request, res: Response) {
    try {
      const { registrationId } = req.params;

      if (!registrationId) {
        return res.status(400).json({ error: 'registrationId é obrigatório' });
      }

      // Buscar inscrição
      const registration = await storage.getRegistration(registrationId);
      if (!registration) {
        return res.status(404).json({ error: 'Inscrição não encontrada' });
      }

      res.json({
        success: true,
        registration: {
          id: registration.id,
          status: registration.status,
          paymentStatus: registration.paymentStatus,
          amountPaid: registration.amountPaid,
          totalAmount: registration.totalAmount,
          paymentMethod: registration.paymentMethod,
          paidAt: registration.paidAt
        }
      });

    } catch (error) {
      console.error('Erro ao verificar status do pagamento:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
}
