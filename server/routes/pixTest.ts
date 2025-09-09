import { Router } from 'express';
import { pixService, PIXPaymentRequest } from '../services/pixService';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Armazenamento temporário para testes (em produção, usar banco de dados)
const testPayments = new Map<string, any>();

/**
 * POST /api/pix-test/create
 * Cria um pagamento PIX de teste de R$ 1,00
 */
router.post('/create', authenticateToken, async (req, res) => {
  try {
    // Verificar se o usuário é admin
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        error: 'Acesso negado. Apenas administradores podem acessar esta funcionalidade.' 
      });
    }
    
    console.log('🧪 Criando pagamento PIX de teste...');
    
    // Gerar dados de teste
    const testPaymentData = pixService.generateTestPayment();
    
    // Criar pagamento via API PIX
    const pixPayment = await pixService.createPayment(testPaymentData);
    
    // Armazenar temporariamente para consulta
    testPayments.set(pixPayment.id, {
      ...pixPayment,
      created_at: new Date().toISOString(),
      user_id: req.user?.userId
    });
    
    console.log('✅ Pagamento PIX de teste criado:', pixPayment.id);
    
    res.json({
      success: true,
      message: 'Pagamento PIX de teste criado com sucesso',
      data: {
        id: pixPayment.id,
        status: pixPayment.status,
        amount: pixPayment.amount,
        qr_code: pixPayment.qr_code,
        qr_code_text: pixPayment.qr_code_text,
        copy_paste_code: pixPayment.copy_paste_code,
        expires_at: pixPayment.expires_at,
        external_id: pixPayment.external_id
      }
    });
  } catch (error: any) {
    console.error('❌ Erro ao criar pagamento PIX de teste:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao criar pagamento PIX de teste',
      error: error.message
    });
  }
});

/**
 * GET /api/pix-test/status/:id
 * Consulta o status de um pagamento PIX de teste
 */
router.get('/status/:id', authenticateToken, async (req, res) => {
  try {
    // Verificar se o usuário é admin
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        error: 'Acesso negado. Apenas administradores podem acessar esta funcionalidade.' 
      });
    }
    
    const { id } = req.params;
    
    console.log(`🔍 Consultando status do pagamento PIX: ${id}`);
    
    // Consultar via API PIX
    const pixPayment = await pixService.getPayment(id);
    
    // Atualizar armazenamento temporário
    if (testPayments.has(id)) {
      testPayments.set(id, {
        ...testPayments.get(id),
        ...pixPayment,
        last_checked: new Date().toISOString()
      });
    }
    
    console.log('✅ Status do pagamento PIX consultado:', pixPayment.status);
    
    res.json({
      success: true,
      message: 'Status do pagamento PIX consultado com sucesso',
      data: {
        id: pixPayment.id,
        status: pixPayment.status,
        amount: pixPayment.amount,
        paid_at: pixPayment.paid_at,
        expires_at: pixPayment.expires_at,
        external_id: pixPayment.external_id
      }
    });
  } catch (error: any) {
    console.error('❌ Erro ao consultar status do pagamento PIX:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao consultar status do pagamento PIX',
      error: error.message
    });
  }
});

/**
 * GET /api/pix-test/list
 * Lista todos os pagamentos PIX de teste do usuário
 */
router.get('/list', authenticateToken, async (req, res) => {
  try {
    // Verificar se o usuário é admin
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        error: 'Acesso negado. Apenas administradores podem acessar esta funcionalidade.' 
      });
    }
    
    const userId = req.user?.userId;
    
    console.log(`📋 Listando pagamentos PIX de teste do usuário: ${userId}`);
    
    // Filtrar pagamentos do usuário
    const userPayments = Array.from(testPayments.values())
      .filter(payment => payment.user_id === userId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    
    console.log(`✅ Encontrados ${userPayments.length} pagamentos PIX de teste`);
    
    res.json({
      success: true,
      message: 'Pagamentos PIX de teste listados com sucesso',
      data: userPayments.map(payment => ({
        id: payment.id,
        status: payment.status,
        amount: payment.amount,
        created_at: payment.created_at,
        paid_at: payment.paid_at,
        expires_at: payment.expires_at,
        external_id: payment.external_id
      }))
    });
  } catch (error: any) {
    console.error('❌ Erro ao listar pagamentos PIX de teste:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao listar pagamentos PIX de teste',
      error: error.message
    });
  }
});

/**
 * POST /api/pix-test/cancel/:id
 * Cancela um pagamento PIX de teste
 */
router.post('/cancel/:id', authenticateToken, async (req, res) => {
  try {
    // Verificar se o usuário é admin
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        error: 'Acesso negado. Apenas administradores podem acessar esta funcionalidade.' 
      });
    }
    
    const { id } = req.params;
    
    console.log(`🚫 Cancelando pagamento PIX de teste: ${id}`);
    
    // Verificar se o pagamento pertence ao usuário
    const storedPayment = testPayments.get(id);
    if (!storedPayment || storedPayment.user_id !== req.user?.userId) {
      return res.status(404).json({
        success: false,
        message: 'Pagamento PIX não encontrado ou não pertence ao usuário'
      });
    }
    
    // Cancelar via API PIX
    const pixPayment = await pixService.cancelPayment(id);
    
    // Atualizar armazenamento temporário
    testPayments.set(id, {
      ...storedPayment,
      ...pixPayment,
      cancelled_at: new Date().toISOString()
    });
    
    console.log('✅ Pagamento PIX de teste cancelado:', id);
    
    res.json({
      success: true,
      message: 'Pagamento PIX de teste cancelado com sucesso',
      data: {
        id: pixPayment.id,
        status: pixPayment.status,
        amount: pixPayment.amount,
        external_id: pixPayment.external_id
      }
    });
  } catch (error: any) {
    console.error('❌ Erro ao cancelar pagamento PIX de teste:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao cancelar pagamento PIX de teste',
      error: error.message
    });
  }
});

/**
 * POST /api/pix-test/refund/:id
 * Estorna um pagamento PIX de teste
 */
router.post('/refund/:id', authenticateToken, async (req, res) => {
  try {
    // Verificar se o usuário é admin
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        error: 'Acesso negado. Apenas administradores podem acessar esta funcionalidade.' 
      });
    }
    
    const { id } = req.params;
    const { amount } = req.body;
    
    console.log(`💰 Estornando pagamento PIX de teste: ${id}`);
    
    // Verificar se o pagamento pertence ao usuário
    const storedPayment = testPayments.get(id);
    if (!storedPayment || storedPayment.user_id !== req.user?.userId) {
      return res.status(404).json({
        success: false,
        message: 'Pagamento PIX não encontrado ou não pertence ao usuário'
      });
    }
    
    // Estornar via API PIX
    const pixPayment = await pixService.refundPayment(id, amount);
    
    // Atualizar armazenamento temporário
    testPayments.set(id, {
      ...storedPayment,
      ...pixPayment,
      refunded_at: new Date().toISOString()
    });
    
    console.log('✅ Pagamento PIX de teste estornado:', id);
    
    res.json({
      success: true,
      message: 'Pagamento PIX de teste estornado com sucesso',
      data: {
        id: pixPayment.id,
        status: pixPayment.status,
        amount: pixPayment.amount,
        external_id: pixPayment.external_id
      }
    });
  } catch (error: any) {
    console.error('❌ Erro ao estornar pagamento PIX de teste:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao estornar pagamento PIX de teste',
      error: error.message
    });
  }
});

export default router;
