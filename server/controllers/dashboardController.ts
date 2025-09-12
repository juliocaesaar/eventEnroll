import type { Response } from "express";
import { storage } from "../storage";

export class DashboardController {
  static async getDashboardStats(req: any, res: Response) {
    try {
      const userId = req.user?.userId;
      const userRole = req.user?.role;
      const sessionUserId = req.session?.user?.id;
      
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      
      console.log('=== DASHBOARD STATS REQUEST ===');
      console.log('JWT UserId:', userId);
      console.log('Session UserId:', sessionUserId);
      console.log('UserRole:', userRole);
      
      // Usar sempre o ID do JWT (usuário autenticado)
      const actualUserId = userId;
      console.log('Using UserId:', actualUserId);
      
      const stats = await storage.getUserStats(actualUserId, userRole);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching stats:", error);
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  }
}