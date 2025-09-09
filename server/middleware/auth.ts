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
    console.log('🔍 Auth middleware - Headers:', req.headers.authorization ? 'Authorization header present' : 'No authorization header');
    console.log('🔍 Auth middleware - URL:', req.url);
    console.log('🔍 Auth middleware - Full Authorization header:', req.headers.authorization);
    
    const token = extractTokenFromHeader(req.headers.authorization);
    
    if (!token) {
      console.log('❌ No token found in request');
      return res.status(401).json({ message: "Token não fornecido" });
    }
    
    console.log('🔑 Token found:', token.substring(0, 20) + '...');
    console.log('🔑 Full token:', token);
    
    const payload = verifyToken(token);
    if (!payload) {
      console.log('❌ Token verification failed');
      return res.status(401).json({ message: "Token inválido" });
    }
    
    console.log('✅ Token verified for user:', payload.userId);
    req.user = payload;
    next();
  } catch (error) {
    console.error("Error in authentication middleware:", error);
    return res.status(401).json({ message: "Token inválido" });
  }
};
