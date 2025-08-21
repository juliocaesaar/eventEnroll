import type { Response } from "express";
import { storage } from "../storage";

export class DashboardController {
  static async getDashboardStats(req: any, res: Response) {
    try {
      const userId = req.user.claims.sub;
      const stats = await storage.getUserStats(userId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching stats:", error);
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  }
}