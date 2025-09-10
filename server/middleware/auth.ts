import { Request, Response, NextFunction } from 'express';
import { verifyToken, extractTokenFromHeader } from '../config/jwt';

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: string;
  };
}

export const authenticateToken = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const token = extractTokenFromHeader(req.headers.authorization);
    
    if (!token) {
      // Log apenas em desenvolvimento
      if (process.env.NODE_ENV === 'development') {
        console.log('❌ No token found in request:', req.url);
      }
      return res.status(401).json({ message: "Token não fornecido" });
    }
    
    const payload = verifyToken(token);
    if (!payload) {
      // Log apenas em desenvolvimento
      if (process.env.NODE_ENV === 'development') {
        console.log('❌ Token verification failed for:', req.url);
      }
      return res.status(401).json({ message: "Token inválido" });
    }
    
    // Log apenas em desenvolvimento
    if (process.env.NODE_ENV === 'development') {
      console.log('✅ Token verified for user:', payload.userId, 'on:', req.url);
    }
    
    req.user = payload;
    next();
  } catch (error) {
    console.error("Error in authentication middleware:", error);
    return res.status(401).json({ message: "Token inválido" });
  }
};
