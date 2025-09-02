import type { RequestHandler } from "express";
import { storage } from "../storage";
import { PlanService } from "../services/planService";

export const checkPlanLimit = (action: 'events' | 'participants' | 'templates' | 'storage' | 'emailsPerMonth'): RequestHandler => {
  return async (req: any, res, next) => {
    try {
      const userId = req.session?.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      
      const subscription = await storage.getUserSubscription(userId);
      const planId = subscription?.planId || 'free';
      
      let currentUsage = 0;
      
      switch (action) {
        case 'events':
          currentUsage = await storage.getUserEventCount(userId);
          break;
        case 'participants':
          // This would need event-specific logic
          currentUsage = 0;
          break;
        case 'templates':
          currentUsage = await storage.getUserTemplateCount(userId);
          break;
        default:
          currentUsage = 0;
      }
      
      if (!PlanService.canPerformAction(planId, action, currentUsage)) {
        const plan = PlanService.getPlan(planId);
        return res.status(403).json({
          message: `Limite de ${action} atingido para o plano ${plan?.name}`,
          planLimitReached: true,
          currentPlan: planId,
          limit: plan?.limits[action],
          currentUsage
        });
      }
      
      next();
    } catch (error) {
      console.error("Error checking plan limits:", error);
      res.status(500).json({ message: "Error checking plan limits" });
    }
  };
};

export const requirePaidPlan: RequestHandler = async (req: any, res, next) => {
  try {
    const userId = req.session?.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }
    
    const subscription = await storage.getUserSubscription(userId);
    const planId = subscription?.planId || 'free';
    
    if (planId === 'free') {
      return res.status(403).json({
        message: "Esta funcionalidade requer um plano pago",
        requiresUpgrade: true,
        currentPlan: planId
      });
    }
    
    next();
  } catch (error) {
    console.error("Error checking paid plan:", error);
    res.status(500).json({ message: "Error checking plan status" });
  }
};