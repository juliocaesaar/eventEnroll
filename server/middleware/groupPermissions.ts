import { Request, Response, NextFunction } from 'express';
import { storage } from '../storage';

export interface GroupPermissionRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: string;
  };
  groupPermissions?: string[];
}

export const requireGroupPermission = (requiredPermission: string) => {
  return async (req: GroupPermissionRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.userId;
      const groupId = req.params.groupId || req.params.id;

      console.log('=== GROUP PERMISSION CHECK ===');
      console.log('UserId:', userId);
      console.log('GroupId:', groupId);
      console.log('Required Permission:', requiredPermission);

      if (!userId) {
        return res.status(401).json({ error: 'Usuário não autenticado' });
      }

      if (!groupId) {
        return res.status(400).json({ error: 'ID do grupo não fornecido' });
      }

      // Verificar se o usuário tem acesso ao grupo
      const hasAccess = await storage.checkUserGroupAccess(userId, groupId);
      if (!hasAccess) {
        console.log('ERROR: Usuário não tem acesso ao grupo');
        return res.status(403).json({ error: 'Acesso negado ao grupo' });
      }

      // Se for organizador do evento, tem todas as permissões
      const group = await storage.getGroupById(groupId);
      if (group?.eventId) {
        const event = await storage.getEventById(group.eventId);
        if (event) {
          // Verificar se é organizador principal
          const isMainOrganizer = event.organizerId === userId;
          
          // Verificar se é organizador adicional
          const organizers = await storage.getEventOrganizers(group.eventId);
          const isAdditionalOrganizer = organizers.some(org => org.userId === userId);
          
          if (isMainOrganizer || isAdditionalOrganizer) {
            console.log('✅ Usuário é organizador do evento - acesso total');
            req.groupPermissions = ['read', 'write', 'payments', 'participants'];
            return next();
          }
        }
      }

      // Verificar permissões específicas do gestor
      const managers = await storage.getGroupManagers(groupId);
      const userManager = managers.find(m => m.userId === userId);
      
      if (!userManager) {
        console.log('ERROR: Usuário não é gestor do grupo');
        return res.status(403).json({ error: 'Acesso negado - não é gestor do grupo' });
      }

      const userPermissions = Array.isArray(userManager.permissions) ? userManager.permissions : [];
      console.log('User permissions:', userPermissions);

      if (!userPermissions.includes(requiredPermission)) {
        console.log('ERROR: Usuário não tem a permissão necessária');
        return res.status(403).json({ 
          error: `Acesso negado - permissão '${requiredPermission}' necessária` 
        });
      }

      console.log('✅ Permissão verificada com sucesso');
      req.groupPermissions = userPermissions;
      next();
    } catch (error) {
      console.error('Erro ao verificar permissões do grupo:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  };
};

// Middlewares específicos para cada tipo de permissão
export const requireGroupRead = requireGroupPermission('read');
export const requireGroupWrite = requireGroupPermission('write');
export const requireGroupPayments = requireGroupPermission('payments');
export const requireGroupParticipants = requireGroupPermission('participants');

// Middleware para verificar múltiplas permissões (OR)
export const requireAnyGroupPermission = (permissions: string[]) => {
  return async (req: GroupPermissionRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.userId;
      const groupId = req.params.groupId || req.params.id;

      console.log('=== ANY GROUP PERMISSION CHECK ===');
      console.log('UserId:', userId);
      console.log('GroupId:', groupId);
      console.log('Required Permissions (any):', permissions);

      if (!userId) {
        return res.status(401).json({ error: 'Usuário não autenticado' });
      }

      if (!groupId) {
        return res.status(400).json({ error: 'ID do grupo não fornecido' });
      }

      // Verificar se o usuário tem acesso ao grupo
      const hasAccess = await storage.checkUserGroupAccess(userId, groupId);
      if (!hasAccess) {
        console.log('ERROR: Usuário não tem acesso ao grupo');
        return res.status(403).json({ error: 'Acesso negado ao grupo' });
      }

      // Se for organizador do evento, tem todas as permissões
      const group = await storage.getGroupById(groupId);
      if (group?.eventId) {
        const event = await storage.getEventById(group.eventId);
        if (event) {
          // Verificar se é organizador principal
          const isMainOrganizer = event.organizerId === userId;
          
          // Verificar se é organizador adicional
          const organizers = await storage.getEventOrganizers(group.eventId);
          const isAdditionalOrganizer = organizers.some(org => org.userId === userId);
          
          if (isMainOrganizer || isAdditionalOrganizer) {
            console.log('✅ Usuário é organizador do evento - acesso total');
            req.groupPermissions = ['read', 'write', 'payments', 'participants'];
            return next();
          }
        }
      }

      // Verificar se tem pelo menos uma das permissões necessárias
      const managers = await storage.getGroupManagers(groupId);
      const userManager = managers.find(m => m.userId === userId);
      
      if (!userManager) {
        console.log('ERROR: Usuário não é gestor do grupo');
        return res.status(403).json({ error: 'Acesso negado - não é gestor do grupo' });
      }

      const userPermissions = Array.isArray(userManager.permissions) ? userManager.permissions : [];
      console.log('User permissions:', userPermissions);

      const hasAnyPermission = permissions.some(permission => userPermissions.includes(permission));
      
      if (!hasAnyPermission) {
        console.log('ERROR: Usuário não tem nenhuma das permissões necessárias');
        return res.status(403).json({ 
          error: `Acesso negado - uma das permissões necessárias: ${permissions.join(', ')}` 
        });
      }

      console.log('✅ Pelo menos uma permissão verificada com sucesso');
      req.groupPermissions = userPermissions;
      next();
    } catch (error) {
      console.error('Erro ao verificar permissões do grupo:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  };
};
