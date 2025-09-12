import { Response } from 'express';
import { storage } from '../storage';
import { requireAdmin } from '../middleware/permissions';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

export class UserController {
  // Criar novo usuário (apenas admin)
  static async createUser(req: any, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      // Verificar se o usuário é admin
      const currentUser = await storage.getUser(userId);
      if (!currentUser || currentUser.role !== 'admin') {
        return res.status(403).json({ message: "Access denied. Admin role required." });
      }

      const { email, firstName, lastName, role, password, eventId, groupId } = req.body;

      // Validar dados obrigatórios
      if (!email || !firstName || !role) {
        return res.status(400).json({ 
          message: "Email, nome e role são obrigatórios" 
        });
      }

      // Verificar se email já existe
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ 
          message: "Email já está em uso" 
        });
      }

      // Gerar senha temporária se não fornecida
      const tempPassword = password || Math.random().toString(36).slice(-8);
      const hashedPassword = await bcrypt.hash(tempPassword, 10);

      // Criar usuário
      const userData = {
        id: uuidv4(),
        email,
        firstName,
        lastName: lastName || '',
        passwordHash: hashedPassword,
        role: role as 'admin' | 'organizer' | 'manager' | 'user',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const newUser = await storage.createUser(userData);

      // Se for gestor e tiver grupo especificado, criar associação
      if (role === 'manager' && groupId) {
        await storage.createGroupManager({
          id: uuidv4(),
          groupId,
          userId: newUser.id,
          role: 'manager',
          permissions: {},
          assignedAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }

      // Retornar dados do usuário (sem senha)
      const { passwordHash, ...userResponse } = newUser;
      
      res.status(201).json({
        success: true,
        message: "Usuário criado com sucesso",
        user: userResponse,
        tempPassword: !password ? tempPassword : undefined, // Só retorna se foi gerada
      });

    } catch (error) {
      console.error("Error creating user:", error);
      res.status(500).json({ message: "Failed to create user" });
    }
  }

  // Listar todos os usuários (admin e organizadores)
  static async getAllUsers(req: any, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      // Verificar se o usuário é admin ou organizador
      const currentUser = await storage.getUser(userId);
      if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'organizer')) {
        return res.status(403).json({ message: "Access denied. Admin or organizer role required." });
      }

      const users = await storage.getAllUsers();
      
      // Remover senhas dos dados retornados
      const safeUsers = users.map(user => {
        const { passwordHash, ...safeUser } = user;
        return safeUser;
      });

      res.json({ users: safeUsers });

    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  }

  // Atualizar usuário (apenas admin)
  static async updateUser(req: any, res: Response) {
    try {
      const userId = req.user?.userId;
      const targetUserId = req.params.id;
      
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      // Verificar se o usuário é admin
      const currentUser = await storage.getUser(userId);
      if (!currentUser || currentUser.role !== 'admin') {
        return res.status(403).json({ message: "Access denied. Admin role required." });
      }

      const { email, firstName, lastName, role, status } = req.body;

      // Verificar se usuário existe
      const targetUser = await storage.getUser(targetUserId);
      if (!targetUser) {
        return res.status(404).json({ message: "User not found" });
      }

      // Atualizar dados
      const updateData: any = {
        updatedAt: new Date(),
      };

      if (email) updateData.email = email;
      if (firstName) updateData.firstName = firstName;
      if (lastName !== undefined) updateData.lastName = lastName;
      if (role) updateData.role = role;
      if (status) updateData.status = status;

      const updatedUser = await storage.updateUser(targetUserId, updateData);

      // Remover senha dos dados retornados
      const { passwordHash, ...userResponse } = updatedUser;

      res.json({
        success: true,
        message: "Usuário atualizado com sucesso",
        user: userResponse,
      });

    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ message: "Failed to update user" });
    }
  }

  // Deletar usuário (apenas admin)
  static async deleteUser(req: any, res: Response) {
    try {
      const userId = req.user?.userId;
      const targetUserId = req.params.id;
      
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      // Verificar se o usuário é admin
      const currentUser = await storage.getUser(userId);
      if (!currentUser || currentUser.role !== 'admin') {
        return res.status(403).json({ message: "Access denied. Admin role required." });
      }

      // Não permitir deletar a si mesmo
      if (userId === targetUserId) {
        return res.status(400).json({ message: "Não é possível deletar seu próprio usuário" });
      }

      // Verificar se usuário existe
      const targetUser = await storage.getUser(targetUserId);
      if (!targetUser) {
        return res.status(404).json({ message: "User not found" });
      }

      // Deletar usuário
      await storage.deleteUser(targetUserId);

      res.json({
        success: true,
        message: "Usuário deletado com sucesso",
      });

    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ message: "Failed to delete user" });
    }
  }

  // Atribuir gestor a grupo
  static async assignManagerToGroup(req: any, res: Response) {
    try {
      const userId = req.user?.userId;
      const { groupId, managerId } = req.body;
      
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      // Verificar se o usuário é admin ou organizador do evento
      const currentUser = await storage.getUser(userId);
      if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'organizer')) {
        return res.status(403).json({ message: "Access denied. Admin or organizer role required." });
      }

      // Verificar se o grupo existe
      const group = await storage.getEventGroup(groupId);
      if (!group) {
        return res.status(404).json({ message: "Group not found" });
      }

      // Verificar se o usuário é organizador do evento (se não for admin)
      if (currentUser.role !== 'admin') {
        const event = await storage.getEvent(group.eventId);
        if (!event) {
          return res.status(404).json({ message: "Event not found" });
        }

        // Verificar se é organizador principal
        const isMainOrganizer = event.organizerId === userId;
        
        // Verificar se é organizador adicional
        const organizers = await storage.getEventOrganizers(event.id);
        const isAdditionalOrganizer = organizers.some(org => org.userId === userId);
        
        if (!isMainOrganizer && !isAdditionalOrganizer) {
          return res.status(403).json({ message: "Access denied. You can only assign managers to events you organize." });
        }
      }

      // Verificar se o gestor existe
      const manager = await storage.getUser(managerId);
      if (!manager) {
        return res.status(404).json({ message: "Manager not found" });
      }

      // Verificar se já é gestor deste grupo
      const existingManager = await storage.getGroupManagers(groupId);
      const isAlreadyManager = existingManager.some(m => m.userId === managerId);
      
      if (isAlreadyManager) {
        return res.status(400).json({ message: "Usuário já é gestor deste grupo" });
      }

      // Criar associação
      const groupManager = await storage.createGroupManager({
        id: uuidv4(),
        groupId,
        userId: managerId,
        role: 'manager',
        permissions: ['read', 'write', 'participants', 'payments'], // Permissões padrão para gestores
        assignedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      res.status(201).json({
        success: true,
        message: "Gestor atribuído ao grupo com sucesso",
        groupManager,
      });

    } catch (error) {
      console.error("Error assigning manager to group:", error);
      res.status(500).json({ message: "Failed to assign manager to group" });
    }
  }

  // Remover gestor de grupo
  static async removeManagerFromGroup(req: any, res: Response) {
    try {
      const userId = req.user?.userId;
      const { groupId, managerId } = req.body;
      
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      // Verificar se o usuário é admin ou organizador do evento
      const currentUser = await storage.getUser(userId);
      if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'organizer')) {
        return res.status(403).json({ message: "Access denied. Admin or organizer role required." });
      }

      // Verificar se o grupo existe
      const group = await storage.getEventGroup(groupId);
      if (!group) {
        return res.status(404).json({ message: "Group not found" });
      }

      // Verificar se o usuário é organizador do evento (se não for admin)
      if (currentUser.role !== 'admin') {
        const event = await storage.getEvent(group.eventId);
        if (!event) {
          return res.status(404).json({ message: "Event not found" });
        }

        // Verificar se é organizador principal
        const isMainOrganizer = event.organizerId === userId;
        
        // Verificar se é organizador adicional
        const organizers = await storage.getEventOrganizers(event.id);
        const isAdditionalOrganizer = organizers.some(org => org.userId === userId);
        
        if (!isMainOrganizer && !isAdditionalOrganizer) {
          return res.status(403).json({ message: "Access denied. You can only remove managers from events you organize." });
        }
      }

      // Buscar associação do gestor
      const groupManagers = await storage.getGroupManagers(groupId);
      const managerAssociation = groupManagers.find(m => m.userId === managerId);
      
      if (!managerAssociation) {
        return res.status(404).json({ message: "Gestor não encontrado neste grupo" });
      }

      // Remover associação
      await storage.deleteGroupManager(managerAssociation.id);

      res.json({
        success: true,
        message: "Gestor removido do grupo com sucesso",
      });

    } catch (error) {
      console.error("Error removing manager from group:", error);
      res.status(500).json({ message: "Failed to remove manager from group" });
    }
  }

  // Listar gestores de um grupo
  static async getGroupManagers(req: any, res: Response) {
    try {
      const userId = req.user?.userId;
      const groupId = req.params.groupId;
      
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      // Verificar se o usuário tem acesso ao grupo
      const hasAccess = await storage.checkUserGroupAccess(userId, groupId);
      if (!hasAccess) {
        return res.status(403).json({ message: "Access denied to this group" });
      }

      const managers = await storage.getGroupManagers(groupId);
      
      // Buscar dados completos dos usuários
      const managersWithDetails = await Promise.all(
        managers.map(async (manager) => {
          const user = await storage.getUser(manager.userId);
          return {
            ...manager,
            // Garantir que permissions seja sempre um array
            permissions: Array.isArray(manager.permissions) ? manager.permissions : [],
            user: user ? {
              id: user.id,
              email: user.email,
              firstName: user.firstName,
              lastName: user.lastName,
              role: user.role,
            } : null,
          };
        })
      );

      res.json({ managers: managersWithDetails });

    } catch (error) {
      console.error("Error fetching group managers:", error);
      res.status(500).json({ message: "Failed to fetch group managers" });
    }
  }

  // Criar gestor e atribuir a grupo em uma operação
  static async createManagerForGroup(req: any, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      // Verificar se o usuário é admin ou organizador
      const currentUser = await storage.getUser(userId);
      if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'organizer')) {
        return res.status(403).json({ message: "Access denied. Admin or organizer role required." });
      }

      const { email, firstName, lastName, password, groupId } = req.body;

      // Validar dados obrigatórios
      if (!email || !firstName || !groupId) {
        return res.status(400).json({ 
          message: "Email, nome e grupo são obrigatórios" 
        });
      }

      // Verificar se email já existe
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ 
          message: "Email já está em uso" 
        });
      }

      // Verificar se o grupo existe
      const group = await storage.getGroupById(groupId);
      if (!group) {
        return res.status(404).json({ message: "Group not found" });
      }

      // Verificar se o usuário é organizador do evento (se não for admin)
      if (currentUser.role !== 'admin') {
        const event = await storage.getEvent(group.eventId);
        if (!event || event.organizerId !== userId) {
          return res.status(403).json({ message: "Access denied. You can only create managers for your own events." });
        }
      }

      // Gerar senha se não fornecida
      const finalPassword = password || Math.random().toString(36).slice(-8);
      const hashedPassword = await bcrypt.hash(finalPassword, 10);

      // Criar usuário gestor
      const userData = {
        id: uuidv4(),
        email,
        firstName,
        lastName: lastName || '',
        passwordHash: hashedPassword,
        role: 'manager' as const,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const newUser = await storage.createUser(userData);

      // Criar associação com o grupo
      const groupManager = await storage.createGroupManager({
        id: uuidv4(),
        groupId,
        userId: newUser.id,
        role: 'manager',
        permissions: ['read', 'write', 'participants', 'payments'], // Permissões padrão para gestores
        assignedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Retornar dados do usuário (sem senha)
      const { passwordHash, ...userResponse } = newUser;
      
      res.status(201).json({
        success: true,
        message: "Gestor criado e atribuído ao grupo com sucesso",
        user: userResponse,
        groupManager,
        tempPassword: !password ? finalPassword : undefined,
      });

    } catch (error) {
      console.error("Error creating manager for group:", error);
      res.status(500).json({ message: "Failed to create manager for group" });
    }
  }

  // Endpoint temporário para atualizar permissões dos gestores existentes
  static async updateManagerPermissions(req: any, res: Response) {
    try {
      const userId = req.user?.userId;
      
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      // Verificar se é admin
      const currentUser = await storage.getUser(userId);
      if (!currentUser || currentUser.role !== 'admin') {
        return res.status(403).json({ message: "Access denied. Admin role required." });
      }

      // Atualizar permissões de todos os gestores
      const result = await storage.updateAllManagerPermissions();
      
      res.json({
        success: true,
        message: "Permissões dos gestores atualizadas com sucesso",
        updatedCount: result
      });
    } catch (error) {
      console.error("Error updating manager permissions:", error);
      res.status(500).json({ message: "Failed to update manager permissions" });
    }
  }
}
