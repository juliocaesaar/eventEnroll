import { Router } from 'express';
import { pixService, PIXWebhookPayload } from '../services/pixService';

const router = Router();

// Armazenamento temporário para webhooks (em produção, usar banco de dados)
const webhookLogs = new Map<string, any>();

/**
 * POST /api/pix-webhook
 * Endpoint para receber webhooks da API PIX
 */
router.post('/', async (req, res) => {
  try {
    const signature = req.headers['x-pix-signature'] as string;
    const payload = req.body;
    
    console.log('📨 Webhook PIX recebido:', {
      signature: signature ? 'presente' : 'ausente',
      payload: payload
    });
    
    // Validar webhook
    if (!pixService.validateWebhook(payload, signature)) {
      console.error('❌ Webhook PIX inválido');
      return res.status(400).json({
        success: false,
        message: 'Webhook inválido'
      });
    }
    
    // Processar webhook
    const processedPayload = pixService.processWebhook(payload);
    
    // Log do webhook
    const webhookId = `webhook_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    webhookLogs.set(webhookId, {
      id: webhookId,
      received_at: new Date().toISOString(),
      payload: processedPayload,
      signature: signature,
      processed: true
    });
    
    console.log('✅ Webhook PIX processado:', {
      webhookId,
      paymentId: processedPayload.id,
      status: processedPayload.status,
      amount: processedPayload.amount
    });
    
    // Aqui você pode implementar lógica adicional baseada no status:
    // - Atualizar banco de dados
    // - Enviar notificações
    // - Processar confirmações de pagamento
    // - Atualizar status de participantes
    
    if (processedPayload.status === 'paid') {
      console.log('💰 Pagamento PIX confirmado:', {
        paymentId: processedPayload.id,
        amount: processedPayload.amount,
        paidAt: processedPayload.paid_at
      });
      
      // TODO: Implementar lógica de confirmação de pagamento
      // - Atualizar status do participante
      // - Enviar email de confirmação
      // - Atualizar estatísticas
    }
    
    res.json({
      success: true,
      message: 'Webhook processado com sucesso',
      webhookId: webhookId
    });
  } catch (error: any) {
    console.error('❌ Erro ao processar webhook PIX:', error);
    
    // Log do erro
    const errorId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    webhookLogs.set(errorId, {
      id: errorId,
      received_at: new Date().toISOString(),
      error: error.message,
      payload: req.body,
      processed: false
    });
    
    res.status(500).json({
      success: false,
      message: 'Erro ao processar webhook',
      error: error.message
    });
  }
});

/**
 * GET /api/pix-webhook/logs
 * Lista logs de webhooks (apenas para desenvolvimento/teste)
 */
router.get('/logs', async (req, res) => {
  try {
    const logs = Array.from(webhookLogs.values())
      .sort((a, b) => new Date(b.received_at).getTime() - new Date(a.received_at).getTime());
    
    console.log(`📋 Listando ${logs.length} logs de webhook PIX`);
    
    res.json({
      success: true,
      message: 'Logs de webhook listados com sucesso',
      data: logs
    });
  } catch (error: any) {
    console.error('❌ Erro ao listar logs de webhook:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao listar logs de webhook',
      error: error.message
    });
  }
});

/**
 * GET /api/pix-webhook/logs/:id
 * Consulta um log específico de webhook
 */
router.get('/logs/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const log = webhookLogs.get(id);
    
    if (!log) {
      return res.status(404).json({
        success: false,
        message: 'Log de webhook não encontrado'
      });
    }
    
    console.log(`🔍 Consultando log de webhook: ${id}`);
    
    res.json({
      success: true,
      message: 'Log de webhook consultado com sucesso',
      data: log
    });
  } catch (error: any) {
    console.error('❌ Erro ao consultar log de webhook:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao consultar log de webhook',
      error: error.message
    });
  }
});

/**
 * DELETE /api/pix-webhook/logs
 * Limpa logs de webhook (apenas para desenvolvimento/teste)
 */
router.delete('/logs', async (req, res) => {
  try {
    const count = webhookLogs.size;
    webhookLogs.clear();
    
    console.log(`🗑️ Limpando ${count} logs de webhook PIX`);
    
    res.json({
      success: true,
      message: `${count} logs de webhook limpos com sucesso`
    });
  } catch (error: any) {
    console.error('❌ Erro ao limpar logs de webhook:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao limpar logs de webhook',
      error: error.message
    });
  }
});

export default router;
