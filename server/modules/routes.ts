import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { setupAuth, isAuthenticated } from "../replitAuth";
import { AuthController } from "../controllers/authController";
import { EventController } from "../controllers/eventController";
import { DashboardController } from "../controllers/dashboardController";
import { PlanController } from "../controllers/planController";
import { NotificationController } from "../controllers/notificationController";
import { GroupController } from "../controllers/groupController";
import { PaymentController } from "../controllers/paymentController";
import { PixController } from "../controllers/pixController";
import { CronController } from "../controllers/cronController";
import { UserController } from "../controllers/userController";
import { checkPlanLimit, requirePaidPlan } from "../middleware/planLimits";
import { requireGroupDashboardAccess, restrictManagersFromCreatingEvents } from "../middleware/permissions";
import { requireGroupRead, requireGroupWrite, requireGroupPayments, requireGroupParticipants } from "../middleware/groupPermissions";

// Import PIX test and webhook routes
import pixTestRoutes from "../routes/pixTest";
import pixWebhookRoutes from "../routes/pixWebhook";

// Seed initial data
import { seedInitialData } from "./seedData";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Seed initial data
  await seedInitialData();

  // Auth routes
  app.post('/api/auth/login', AuthController.login);
  app.post('/api/auth/register', AuthController.register);
  app.post('/api/auth/logout', AuthController.logout);
  app.get('/api/auth/validate', isAuthenticated, AuthController.validateToken);
  app.get('/api/auth/user', isAuthenticated, AuthController.getUser);
  app.put('/api/auth/user', isAuthenticated, AuthController.updateUserProfile);

  // User management routes (admin only)
  app.get('/api/users', isAuthenticated, UserController.getAllUsers);
  app.post('/api/users', isAuthenticated, UserController.createUser);
  app.put('/api/users/:id', isAuthenticated, UserController.updateUser);
  app.delete('/api/users/:id', isAuthenticated, UserController.deleteUser);
  
  // Group manager assignment routes
  app.post('/api/groups/assign-manager', isAuthenticated, UserController.assignManagerToGroup);
  app.delete('/api/groups/remove-manager', isAuthenticated, UserController.removeManagerFromGroup);
  app.get('/api/groups/:groupId/managers', isAuthenticated, UserController.getGroupManagers);
  app.post('/api/groups/create-manager', isAuthenticated, UserController.createManagerForGroup);
  app.post('/api/admin/update-manager-permissions', isAuthenticated, UserController.updateManagerPermissions);

  // Dashboard routes
  app.get('/api/dashboard/stats', isAuthenticated, DashboardController.getDashboardStats);

  // Plan routes
  app.get('/api/plans', PlanController.getAllPlans);
  app.get('/api/subscription', isAuthenticated, PlanController.getUserSubscription);
  app.post('/api/subscription', isAuthenticated, PlanController.subscribeToPlan);
  app.delete('/api/subscription', isAuthenticated, PlanController.cancelSubscription);

  // Event routes
  app.get('/api/events', isAuthenticated, EventController.getUserEvents);
  app.post('/api/events', isAuthenticated, restrictManagersFromCreatingEvents, checkPlanLimit('events'), EventController.createEvent);
  app.get('/api/events/:id', isAuthenticated, EventController.getEvent);
  app.put('/api/events/:id', isAuthenticated, restrictManagersFromCreatingEvents, EventController.updateEvent);
  app.delete('/api/events/:id', isAuthenticated, restrictManagersFromCreatingEvents, EventController.deleteEvent);

  // Ticket routes
  app.get('/api/events/:eventId/tickets', isAuthenticated, EventController.getEventTickets);
  app.post('/api/events/:eventId/tickets', isAuthenticated, restrictManagersFromCreatingEvents, EventController.createTicket);
  app.put('/api/events/:eventId/tickets/:ticketId', isAuthenticated, restrictManagersFromCreatingEvents, EventController.updateTicket);
  app.delete('/api/events/:eventId/tickets/:ticketId', isAuthenticated, restrictManagersFromCreatingEvents, EventController.deleteTicket);

  // Registration routes
  app.get('/api/events/:eventId/registrations', isAuthenticated, EventController.getEventRegistrations);
  app.get('/api/events/:eventId/participants-with-installments', isAuthenticated, EventController.getEventParticipantsWithInstallments);
app.put('/api/installments/:installmentId/mark-as-paid', isAuthenticated, EventController.markInstallmentAsPaid);
  app.post('/api/events/:eventId/register', EventController.registerForEvent);

  // Group routes
  app.post('/api/events/:eventId/groups', isAuthenticated, GroupController.createGroup);
  app.get('/api/events/:eventId/groups', isAuthenticated, GroupController.getEventGroups);
  
  // Group Dashboard routes (must be before parameterized routes)
  app.get('/api/groups/dashboard', isAuthenticated, requireGroupDashboardAccess, GroupController.getUserGroupDashboard);
  
  // Group parameterized routes
  app.get('/api/groups/:id', isAuthenticated, requireGroupRead, GroupController.getGroup);
  app.put('/api/groups/:id', isAuthenticated, requireGroupWrite, GroupController.updateGroup);
  app.delete('/api/groups/:id', isAuthenticated, requireGroupWrite, GroupController.deleteGroup);
  app.get('/api/groups/:groupId/analytics', isAuthenticated, requireGroupRead, GroupController.getGroupAnalytics);

  // Group Manager routes
  app.post('/api/groups/:groupId/managers', isAuthenticated, requireGroupWrite, GroupController.addGroupManager);
  app.get('/api/groups/:groupId/managers', isAuthenticated, UserController.getGroupManagers);
  app.delete('/api/groups/:groupId/managers/:managerId', isAuthenticated, requireGroupWrite, GroupController.removeGroupManager);

  // Group specific routes
  app.get('/api/groups/:groupId/participants', isAuthenticated, requireGroupParticipants, GroupController.getGroupParticipants);
  app.get('/api/groups/:groupId/participants/:participantId', isAuthenticated, requireGroupParticipants, GroupController.getGroupParticipant);
  app.get('/api/groups/:groupId/payments', isAuthenticated, requireGroupPayments, GroupController.getGroupPayments);

  // Payment Plan routes
  app.post('/api/events/:eventId/payment-plans', isAuthenticated, PaymentController.createPaymentPlan);
  app.get('/api/events/:eventId/payment-plans', isAuthenticated, PaymentController.getEventPaymentPlans);

  // Payment Installment routes
  app.get('/api/registrations/:registrationId/installments', isAuthenticated, PaymentController.getRegistrationInstallments);
  app.post('/api/installments/:installmentId/payment', isAuthenticated, PaymentController.processPayment);
  app.post('/api/installments/:installmentId/discount', isAuthenticated, PaymentController.applyDiscount);
  app.post('/api/installments/:installmentId/late-fee', isAuthenticated, PaymentController.applyLateFee);
  app.get('/api/installments/:installmentId/transactions', isAuthenticated, PaymentController.getInstallmentTransactions);

  // Payment Analytics routes
  app.get('/api/events/:eventId/payment-analytics', isAuthenticated, PaymentController.getEventPaymentAnalytics);
  app.get('/api/events/:eventId/payment-report', isAuthenticated, PaymentController.getPaymentReport);
  app.get('/api/overdue-installments', isAuthenticated, PaymentController.getOverdueInstallments);
  app.post('/api/recalculate-late-fees', isAuthenticated, PaymentController.recalculateLateFees);

  // PIX Payment routes
  app.post('/api/payments/generate-pix-qr', PixController.generatePixQr);
  app.post('/api/payments/confirm-manual', PixController.confirmManualPayment);
  app.get('/api/payments/status/:registrationId', PixController.checkPaymentStatus);

  // PIX Test routes (temporary for testing)
  app.use('/api/pix-test', pixTestRoutes);
  
  // PIX Webhook routes
  app.use('/api/pix-webhook', pixWebhookRoutes);

  // Cron routes
  app.post('/api/cron/run-tasks', CronController.runCronTasks);
  app.post('/api/cron/upcoming-reminders', CronController.sendUpcomingReminders);
  app.post('/api/cron/overdue-notifications', CronController.sendOverdueNotifications);
  
  // Pusher authentication route
  app.post('/api/pusher/auth', isAuthenticated, EventController.authenticatePusher);
  
  // Pusher test route
  app.post('/api/pusher/test', isAuthenticated, EventController.testPusher);
  
  // Debug Pusher auth route (without authentication for testing)
  app.post('/api/pusher/auth-debug', async (req, res) => {
    // Interceptar o raw body antes de qualquer parsing
    let rawBody = '';
    req.on('data', (chunk) => {
      rawBody += chunk.toString();
    });
    
    req.on('end', async () => {
      console.log('=== RAW BODY INTERCEPTED ===');
      console.log('Raw Body String:', rawBody);
      
      // Parse manual do raw body
      const params = new URLSearchParams(rawBody);
      const socket_id = params.get('socket_id');
      const channel_name = params.get('channel_name');
      
      console.log('Parsed socket_id:', socket_id);
      console.log('Parsed channel_name:', channel_name);
      
      if (!socket_id || !channel_name) {
        console.log('❌ Missing socket_id or channel_name in raw body');
        return res.status(400).json({ message: "Missing socket_id or channel_name" });
      }
      
      // Simular autenticação bem-sucedida
      const userId = req.session?.user?.id;
      console.log('Using User ID:', userId);
      
      // Verificar se o usuário tem acesso ao canal
      if (channel_name.startsWith('private-user-')) {
        const channelUserId = channel_name.replace('private-user-', '');
        console.log('Channel User ID:', channelUserId);
        console.log('Current User ID:', userId);
        
        if (channelUserId !== userId) {
          console.log('❌ User ID mismatch for private-user channel');
          return res.status(403).json({ message: "Forbidden" });
        }
      }
      
      // Autenticar com Pusher
      console.log('🔐 Authenticating with Pusher...');
      const { pusher } = await import('../config/pusher');
      
      const auth = pusher.authenticate(socket_id, channel_name, {
        user_id: userId,
        user_info: {
          name: 'User'
        }
      });
      
      console.log('✅ Pusher authentication successful');
      console.log('Auth response:', auth);
      
      res.json(auth);
    });
  });
  
  // Test route to check body parsing
  app.post('/api/pusher/test-body', (req, res) => {
    console.log('=== TEST BODY PARSING ===');
    console.log('Headers:', req.headers);
    console.log('Body:', req.body);
    console.log('Body type:', typeof req.body);
    console.log('Body keys:', Object.keys(req.body || {}));
    res.json({ 
      success: true, 
      body: req.body,
      headers: req.headers,
      bodyType: typeof req.body
    });
  });

  // Test route with raw body parsing
  app.post('/api/pusher/test-raw', express.raw({ type: 'application/x-www-form-urlencoded' }), (req, res) => {
    console.log('=== TEST RAW BODY PARSING ===');
    console.log('Headers:', req.headers);
    console.log('Raw Body:', req.body);
    console.log('Raw Body type:', typeof req.body);
    console.log('Raw Body length:', req.body?.length);
    
    // Parse manually
    const bodyString = req.body.toString();
    console.log('Body String:', bodyString);
    
    const params = new URLSearchParams(bodyString);
    const parsedBody: Record<string, string> = {};
    params.forEach((value, key) => {
      parsedBody[key] = value;
    });
    console.log('Parsed Body:', parsedBody);
    
    res.json({ 
      success: true, 
      rawBody: req.body.toString(),
      parsedBody: parsedBody,
      headers: req.headers
    });
  });
  
  // Notification routes
  app.get('/api/notifications', isAuthenticated, NotificationController.getUserNotifications);
  app.put('/api/notifications/:notificationId/read', isAuthenticated, NotificationController.markAsRead);
  app.put('/api/notifications/read-all', isAuthenticated, NotificationController.markAllAsRead);
  
  // Analytics routes
  app.get('/api/events/:eventId/analytics', isAuthenticated, EventController.getEventAnalytics);
  
  // Participant management routes
  app.get('/api/registrations/:registrationId', EventController.getRegistration);
  app.post('/api/registrations/:registrationId/checkin', isAuthenticated, EventController.checkinParticipant);
  app.post('/api/registrations/:registrationId/remind', isAuthenticated, EventController.sendReminder);
  app.get('/api/events/:eventId/export/:format', isAuthenticated, EventController.exportParticipants);
  
  // Public routes for events
  app.get('/api/public/events/:slug', EventController.getPublicEvent);
  app.get('/api/public/events/:slug/tickets', EventController.getPublicEventTickets);
  app.post('/api/public/events/:slug/register', EventController.publicRegisterForEvent);

  // Webhook do Stripe agora está configurado em server/index.ts

  // Endpoint para testar envio de email
  app.post('/api/test/email', async (req, res) => {
    try {
      const { EmailService } = await import("../services/emailService");
      
      const testData = {
        eventName: "Evento de Teste",
        eventDate: "15/01/2025",
        eventTime: "19:00",
        eventLocation: "Centro de Convenções",
        eventAddress: "Rua das Flores, 123 - São Paulo, SP",
        eventImageUrl: "https://via.placeholder.com/400x200",
        participantName: "João Silva",
        participantEmail: req.body.email || "teste@exemplo.com",
        participantPhone: "(11) 99999-9999",
        ticketName: "Ingresso VIP",
        ticketPrice: 50.00,
        totalAmount: 50.00,
        qrCode: "QR_TEST_123456789",
        registrationId: "test-reg-123",
        paymentStatus: "paid",
        isFreeEvent: false
      };

      const emailSent = await EmailService.sendRegistrationConfirmation(testData);
      
      if (emailSent) {
        res.json({ success: true, message: "Email de teste enviado com sucesso!" });
      } else {
        res.status(500).json({ success: false, message: "Falha ao enviar email de teste" });
      }
    } catch (error) {
      console.error('Erro ao enviar email de teste:', error);
      res.status(500).json({ success: false, message: "Erro interno do servidor" });
    }
  });

  // Stripe session data
  app.get('/api/stripe/session/:sessionId', async (req, res) => {
    try {
      const { stripe } = await import("../config/stripe");
      const session = await stripe.checkout.sessions.retrieve(req.params.sessionId);
      res.json(session);
    } catch (error) {
      console.error('Erro ao buscar sessão Stripe:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  // Confirmar pagamento e atualizar inscrição
  app.post('/api/stripe/confirm-payment', async (req, res) => {
    try {
      const { sessionId } = req.body;
      
      if (!sessionId) {
        return res.status(400).json({ error: 'Session ID é obrigatório' });
      }

      console.log('=== CONFIRMANDO PAGAMENTO ===');
      console.log('Session ID:', sessionId);

      const { stripe } = await import("../config/stripe");
      const { StripeWebhookController } = await import("../controllers/stripeWebhookController");
      
      // Buscar dados da sessão
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      console.log('Session encontrada:', {
        id: session.id,
        status: session.status,
        payment_status: session.payment_status,
        metadata: session.metadata
      });

      if (session.payment_status === 'paid') {
        // Simular evento de checkout completado
        const mockEvent = {
          type: 'checkout.session.completed',
          data: { object: session }
        };

        // Processar como se fosse um webhook
        await StripeWebhookController.processEvent(mockEvent);
        
        console.log('✅ Pagamento confirmado e inscrição atualizada');
        res.json({ 
          success: true, 
          message: 'Pagamento confirmado com sucesso',
          sessionId: session.id,
          paymentStatus: session.payment_status
        });
      } else {
        console.log('❌ Pagamento não foi processado:', session.payment_status);
        res.status(400).json({ 
          error: 'Pagamento não foi processado',
          paymentStatus: session.payment_status
        });
      }
    } catch (error) {
      console.error('Erro ao confirmar pagamento:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  // Debug routes
  app.get('/api/debug/events/slug/:slug', async (req, res) => {
    try {
      const { storage } = await import("../storage");
      const event = await storage.getEventBySlug(req.params.slug);
      res.json({
        found: !!event,
        event: event,
        slug: req.params.slug,
        status: event?.status
      });
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  // Debug webhook endpoint
  app.get('/api/debug/webhook/test', async (req, res) => {
    try {
      res.json({
        message: 'Webhook endpoint está funcionando',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
        webhookSecretConfigured: !!process.env.STRIPE_WEBHOOK_SECRET,
        stripeKeyConfigured: !!process.env.STRIPE_SECRET_KEY
      });
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  // Debug route to list all events
  app.get('/api/debug/events', async (req, res) => {
    try {
      const { storage } = await import("../storage");
      const events = await storage.getUserEvents(req.session?.user?.id || '');
      res.json({ 
        count: events.length,
        events: events.map(e => ({ id: e.id, title: e.title, slug: e.slug, status: e.status }))
      });
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  // Analytics routes
  app.get('/api/events/:eventId/analytics', isAuthenticated, requirePaidPlan, EventController.getEventAnalytics);

  // Template routes (public)
  app.get('/api/templates', async (req, res) => {
    try {
      const { storage } = await import("../storage");
      const categoryId = req.query.categoryId as string;
      const templates = categoryId 
        ? await storage.getTemplatesByCategory(categoryId)
        : await storage.getTemplates();
      res.json(templates);
    } catch (error) {
      console.error("Error fetching templates:", error);
      res.status(500).json({ message: "Failed to fetch templates" });
    }
  });

  app.get('/api/templates/:id', async (req, res) => {
    try {
      const { storage } = await import("../storage");
      const template = await storage.getTemplate(req.params.id);
      if (!template) {
        return res.status(404).json({ message: "Template not found" });
      }
      res.json(template);
    } catch (error) {
      console.error("Error fetching template:", error);
      res.status(500).json({ message: "Failed to fetch template" });
    }
  });

  // Category routes (public)
  app.get('/api/categories', async (req, res) => {
    try {
      const { storage } = await import("../storage");
      const categories = await storage.getEventCategories();
      res.json(categories);
    } catch (error) {
      console.error("Error fetching categories:", error);
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}