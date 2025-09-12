import type { Request, Response } from "express";
import { storage } from "../storage";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import { generateToken, verifyToken, extractTokenFromHeader } from "../config/jwt";

export class AuthController {
  static async validateToken(req: any, res: Response) {
    try {
      const token = extractTokenFromHeader(req.headers.authorization);
      if (!token) {
        return res.status(401).json({ message: "Token não fornecido" });
      }
      
      const payload = verifyToken(token);
      if (!payload) {
        return res.status(401).json({ message: "Token inválido" });
      }
      
      const user = await storage.getUser(payload.userId);
      if (!user) {
        return res.status(401).json({ message: "Usuário não encontrado" });
      }
      
      res.json(user);
    } catch (error) {
      console.error("Error validating token:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  }

  static async getUser(req: any, res: Response) {
    try {
      const token = extractTokenFromHeader(req.headers.authorization);
      if (!token) {
        return res.status(401).json({ message: "Token não fornecido" });
      }
      
      const payload = verifyToken(token);
      if (!payload) {
        return res.status(401).json({ message: "Token inválido" });
      }
      
      const user = await storage.getUser(payload.userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  }

  static async updateUserProfile(req: any, res: Response) {
    try {
      const token = extractTokenFromHeader(req.headers.authorization);
      if (!token) {
        return res.status(401).json({ message: "Token não fornecido" });
      }
      
      const payload = verifyToken(token);
      if (!payload) {
        return res.status(401).json({ message: "Token inválido" });
      }
      
      const updates = req.body;
      const user = await storage.updateUser(payload.userId, updates);
      res.json(user);
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ message: "Failed to update user" });
    }
  }

  static async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ message: "Email e senha são obrigatórios" });
      }

      // Buscar usuário por email
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: "Credenciais inválidas" });
      }

      // Verificar senha
      const isValidPassword = await bcrypt.compare(password, user.passwordHash);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Credenciais inválidas" });
      }

      // Gerar token JWT
      const token = generateToken({
        userId: user.id,
        email: user.email || '',
        role: user.role || 'user'
      });

      res.json({
        message: "Login realizado com sucesso",
        token,
        user: {
          id: user.id,
          email: user.email || '',
          firstName: user.firstName || '',
          lastName: user.lastName || '',
          role: user.role || 'user'
        }
      });
    } catch (error) {
      console.error("Error during login:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  }

  static async register(req: Request, res: Response) {
    try {
      const { firstName, lastName, email, password } = req.body;

      if (!firstName || !lastName || !email || !password) {
        return res.status(400).json({ message: "Todos os campos são obrigatórios" });
      }

      if (password.length < 6) {
        return res.status(400).json({ message: "A senha deve ter pelo menos 6 caracteres" });
      }

      // Verificar se o usuário já existe
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(409).json({ message: "Este email já está em uso" });
      }

      // Hash da senha
      const saltRounds = 12;
      const passwordHash = await bcrypt.hash(password, saltRounds);

      // Criar usuário
      const newUser = {
        id: uuidv4(),
        email,
        firstName,
        lastName,
        passwordHash,
        currentPlan: 'free',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const user = await storage.createUser(newUser);

      // Gerar token JWT
      const token = generateToken({
        userId: user.id,
        email: user.email || '',
        role: user.role || 'user'
      });

      res.status(201).json({
        message: "Conta criada com sucesso",
        token,
        user: {
          id: user.id,
          email: user.email || '',
          firstName: user.firstName || '',
          lastName: user.lastName || '',
          role: user.role || 'user'
        }
      });
    } catch (error) {
      console.error("Error during registration:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  }

  static async logout(req: Request, res: Response) {
    try {
      // Com JWT, o logout é feito no frontend removendo o token
      // Aqui apenas confirmamos o logout
      res.json({ message: "Logout realizado com sucesso" });
    } catch (error) {
      console.error("Error during logout:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  }

  static async changePassword(req: any, res: Response) {
    try {
      const token = extractTokenFromHeader(req.headers.authorization);
      if (!token) {
        return res.status(401).json({ message: "Token não fornecido" });
      }
      
      const payload = verifyToken(token);
      if (!payload) {
        return res.status(401).json({ message: "Token inválido" });
      }

      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: "Senha atual e nova senha são obrigatórias" });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ message: "A nova senha deve ter pelo menos 6 caracteres" });
      }

      // Buscar usuário
      const user = await storage.getUser(payload.userId);
      if (!user) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }

      // Verificar senha atual
      const isValidPassword = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Senha atual incorreta" });
      }

      // Hash da nova senha
      const saltRounds = 12;
      const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

      // Atualizar senha
      await storage.updateUser(payload.userId, {
        passwordHash: newPasswordHash,
        updatedAt: new Date()
      });

      res.json({ message: "Senha alterada com sucesso" });
    } catch (error) {
      console.error("Error changing password:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  }

  static async forgotPassword(req: Request, res: Response) {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ message: "Email é obrigatório" });
      }

      // Buscar usuário por email
      const user = await storage.getUserByEmail(email);
      if (!user) {
        // Por segurança, não revelamos se o email existe ou não
        return res.json({ message: "Se o email existir, você receberá instruções de recuperação" });
      }

      // Gerar token de recuperação (válido por 1 hora)
      const resetToken = generateToken({
        userId: user.id,
        email: user.email || '',
        purpose: 'password_reset'
      }, '1h');

      // TODO: Implementar envio de email com Resend
      // Por enquanto, apenas logamos o token (em produção, enviar por email)
      console.log(`Password reset token for ${email}: ${resetToken}`);

      res.json({ 
        message: "Se o email existir, você receberá instruções de recuperação",
        // Em desenvolvimento, retornar o token para facilitar testes
        ...(process.env.NODE_ENV === 'development' && { resetToken })
      });
    } catch (error) {
      console.error("Error in forgot password:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  }

  static async resetPassword(req: Request, res: Response) {
    try {
      const { token, newPassword } = req.body;

      if (!token || !newPassword) {
        return res.status(400).json({ message: "Token e nova senha são obrigatórios" });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ message: "A nova senha deve ter pelo menos 6 caracteres" });
      }

      // Verificar token
      const payload = verifyToken(token);
      if (!payload || payload.purpose !== 'password_reset') {
        return res.status(401).json({ message: "Token inválido ou expirado" });
      }

      // Buscar usuário
      const user = await storage.getUser(payload.userId);
      if (!user) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }

      // Hash da nova senha
      const saltRounds = 12;
      const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

      // Atualizar senha
      await storage.updateUser(payload.userId, {
        passwordHash: newPasswordHash,
        updatedAt: new Date()
      });

      res.json({ message: "Senha redefinida com sucesso" });
    } catch (error) {
      console.error("Error resetting password:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  }
}