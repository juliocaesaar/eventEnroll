import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth, isAuthenticated } from "../replitAuth";
import { AuthController } from "../controllers/authController";
import { EventController } from "../controllers/eventController";
import { DashboardController } from "../controllers/dashboardController";
import { PlanController } from "../controllers/planController";
import { checkPlanLimit, requirePaidPlan } from "../middleware/planLimits";

// Seed initial data
import { seedInitialData } from "./seedData";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Seed initial data
  await seedInitialData();

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, AuthController.getUser);
  app.put('/api/auth/user', isAuthenticated, AuthController.updateUserProfile);

  // Dashboard routes
  app.get('/api/dashboard/stats', isAuthenticated, DashboardController.getDashboardStats);

  // Plan routes
  app.get('/api/plans', PlanController.getAllPlans);
  app.get('/api/subscription', isAuthenticated, PlanController.getUserSubscription);
  app.post('/api/subscription', isAuthenticated, PlanController.subscribeToPlan);
  app.delete('/api/subscription', isAuthenticated, PlanController.cancelSubscription);

  // Event routes
  app.get('/api/events', isAuthenticated, EventController.getUserEvents);
  app.post('/api/events', isAuthenticated, checkPlanLimit('events'), EventController.createEvent);
  app.get('/api/events/:id', isAuthenticated, EventController.getEvent);
  app.put('/api/events/:id', isAuthenticated, EventController.updateEvent);
  app.delete('/api/events/:id', isAuthenticated, EventController.deleteEvent);

  // Ticket routes
  app.get('/api/events/:eventId/tickets', isAuthenticated, EventController.getEventTickets);
  app.post('/api/events/:eventId/tickets', isAuthenticated, EventController.createTicket);

  // Registration routes
  app.get('/api/events/:eventId/registrations', isAuthenticated, EventController.getEventRegistrations);
  app.post('/api/events/:eventId/register', EventController.registerForEvent);

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