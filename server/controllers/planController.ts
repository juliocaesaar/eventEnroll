import type { Request, Response } from "express";
import { PlanService } from "../services/planService";
import { asaasService } from "../services/asaasService";
import { storage } from "../storage";

export class PlanController {
  static async getAllPlans(req: Request, res: Response) {
    try {
      const plans = PlanService.getAllPlans();
      res.json(plans);
    } catch (error) {
      console.error("Error fetching plans:", error);
      res.status(500).json({ message: "Failed to fetch plans" });
    }
  }

  static async subscribeToPlan(req: any, res: Response) {
    try {
      const userId = req.user.claims.sub;
      const { planId, paymentMethod, cardInfo } = req.body;

      const plan = PlanService.getPlan(planId);
      if (!plan) {
        return res.status(404).json({ message: "Plan not found" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // For free plan, just update user subscription
      if (plan.id === 'free') {
        await storage.updateUserSubscription(userId, {
          planId: plan.id,
          status: 'active',
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        });
        
        return res.json({ 
          success: true, 
          message: "Plano gratuito ativado com sucesso!",
          subscription: { planId: plan.id, status: 'active' }
        });
      }

      // Create or get Asaas customer
      let asaasCustomer;
      try {
        if (user.asaasCustomerId) {
          asaasCustomer = await asaasService.getCustomer(user.asaasCustomerId);
        } else {
          asaasCustomer = await asaasService.createCustomer({
            name: `${user.firstName} ${user.lastName}`.trim() || user.email || 'Cliente',
            cpfCnpj: req.body.cpfCnpj || '00000000000',
            email: user.email || '',
            phone: req.body.phone,
          });
          
          await storage.updateUser(userId, { asaasCustomerId: asaasCustomer.id });
        }
      } catch (error) {
        console.error("Error with Asaas customer:", error);
        return res.status(500).json({ message: "Erro ao processar cliente no gateway de pagamento" });
      }

      // Create subscription in Asaas
      try {
        const subscription = await asaasService.createSubscription({
          customer: asaasCustomer.id!,
          billingType: paymentMethod === 'credit_card' ? 'CREDIT_CARD' : paymentMethod === 'pix' ? 'PIX' : 'BOLETO',
          cycle: plan.interval === 'monthly' ? 'MONTHLY' : 'YEARLY',
          value: plan.price,
          nextDueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0], // tomorrow
          description: `Assinatura ${plan.name} - EventFlow`,
          externalReference: userId,
        });

        // Save subscription in database
        await storage.updateUserSubscription(userId, {
          planId: plan.id,
          status: 'pending',
          asaasSubscriptionId: subscription.id,
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(subscription.nextDueDate),
        });

        res.json({
          success: true,
          subscription,
          message: "Assinatura criada com sucesso!",
          paymentUrl: subscription.invoiceUrl
        });
      } catch (error) {
        console.error("Error creating subscription:", error);
        res.status(500).json({ message: "Erro ao criar assinatura" });
      }
    } catch (error) {
      console.error("Error subscribing to plan:", error);
      res.status(500).json({ message: "Failed to subscribe to plan" });
    }
  }

  static async cancelSubscription(req: any, res: Response) {
    try {
      const userId = req.user.claims.sub;
      const subscription = await storage.getUserSubscription(userId);
      
      if (!subscription || !subscription.asaasSubscriptionId) {
        return res.status(404).json({ message: "Subscription not found" });
      }

      await asaasService.cancelSubscription(subscription.asaasSubscriptionId);
      
      await storage.updateUserSubscription(userId, {
        status: 'cancelled',
        cancelledAt: new Date(),
      });

      res.json({ success: true, message: "Assinatura cancelada com sucesso" });
    } catch (error) {
      console.error("Error cancelling subscription:", error);
      res.status(500).json({ message: "Failed to cancel subscription" });
    }
  }

  static async getUserSubscription(req: any, res: Response) {
    try {
      const userId = req.user.claims.sub;
      const subscription = await storage.getUserSubscription(userId);
      
      if (!subscription) {
        // Return free plan as default
        const freePlan = PlanService.getTrialPlan();
        return res.json({
          planId: freePlan.id,
          status: 'active',
          plan: freePlan
        });
      }

      const plan = PlanService.getPlan(subscription.planId);
      res.json({ ...subscription, plan });
    } catch (error) {
      console.error("Error fetching user subscription:", error);
      res.status(500).json({ message: "Failed to fetch subscription" });
    }
  }
}