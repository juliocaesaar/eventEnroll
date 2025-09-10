import jwt from 'jsonwebtoken';

// Definir JWT_SECRET se não estiver definida
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = 'e1dad618b2990846d521f9261bbc3bef5b2dab3feb80b9133bd9b8304825e418';
}

const JWT_SECRET = process.env.JWT_SECRET;

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
}

export function generateToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    const payload = jwt.verify(token, JWT_SECRET) as JWTPayload;
    
    // Log apenas em desenvolvimento
    if (process.env.NODE_ENV === 'development') {
      console.log('✅ Token verification successful for user:', payload.userId);
    }
    
    return payload;
  } catch (error) {
    // Log apenas em desenvolvimento ou para erros específicos
    if (process.env.NODE_ENV === 'development') {
      console.error('❌ Token verification failed:', error);
    }
    return null;
  }
}

export function extractTokenFromHeader(authHeader: string | undefined): string | null {
  if (!authHeader) return null;
  
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }
  
  return parts[1];
}
