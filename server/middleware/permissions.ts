import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth';
import { storage } from '../storage';

export interface PermissionRequest extends AuthenticatedRequest {
  userRole?: string;
  isEventOrganizer?: boolean;
  isGroupManager?: boolean;
}

/**
 * Middleware para verificar se o usuário é admin
 */
export const requireAdmin = (req: PermissionRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Usuário não autenticado' });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Acesso negado. Apenas administradores podem acessar esta funcionalidade.' });
  }

  next();
};

/**
 * Middleware para restringir gestores de criar eventos
 */
export const restrictManagersFromCreatingEvents = (req: PermissionRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Usuário não autenticado' });
  }

  // Gestores não podem criar eventos
  if (req.user.role === 'manager') {
    return res.status(403).json({ 
      error: 'Acesso negado. Gestores não podem criar eventos. Apenas administradores e organizadores podem criar eventos.' 
    });
  }

  next();
};

/**
 * Middleware para verificar se o usuário é organizador do evento
 */
export const requireEventOrganizer = (req: PermissionRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Usuário não autenticado' });
  }

  // Admin pode acessar tudo
  if (req.user.role === 'admin') {
    return next();
  }

  // Verificar se é organizador do evento específico
  const eventId = req.params.eventId;
  if (!eventId) {
    return res.status(400).json({ error: 'ID do evento não fornecido' });
  }

  // Verificar se o usuário é organizador do evento
  storage.getEvent(eventId).then(async event => {
    if (!event) {
      return res.status(404).json({ error: 'Evento não encontrado' });
    }

    // Verificar se é organizador principal
    const isMainOrganizer = event.organizerId === req.user?.userId;
    
    // Verificar se é organizador adicional
    const organizers = await storage.getEventOrganizers(eventId);
    const isAdditionalOrganizer = organizers.some(org => org.userId === req.user?.userId);

    if (!isMainOrganizer && !isAdditionalOrganizer) {
      return res.status(403).json({ error: 'Acesso negado. Apenas organizadores do evento podem acessar esta funcionalidade.' });
    }

    req.isEventOrganizer = true;
    next();
  }).catch(error => {
    console.error('Erro ao verificar organizador do evento:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  });
};

/**
 * Middleware para verificar se o usuário é gestor do grupo
 */
export const requireGroupManager = (req: PermissionRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Usuário não autenticado' });
  }

  // Admin pode acessar tudo
  if (req.user.role === 'admin') {
    return next();
  }

  const groupId = req.params.groupId || req.params.id;
  if (!groupId) {
    return res.status(400).json({ error: 'ID do grupo não fornecido' });
  }

  // Verificar se o usuário é gestor do grupo
  storage.checkUserGroupAccess(req.user.userId, groupId).then(hasAccess => {
    if (!hasAccess) {
      return res.status(403).json({ error: 'Acesso negado. Apenas gestores do grupo podem acessar esta funcionalidade.' });
    }

    req.isGroupManager = true;
    next();
  }).catch(error => {
    console.error('Erro ao verificar gestor do grupo:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  });
};

/**
 * Middleware para verificar permissões de dashboard de grupos
 */
export const requireGroupDashboardAccess = async (req: PermissionRequest, res: Response, next: NextFunction) => {
  console.log('🔍 PERMISSIONS MIDDLEWARE - Starting');
  console.log('User:', req.user);
  
  if (!req.user) {
    console.log('❌ No user found');
    return res.status(401).json({ error: 'Usuário não autenticado' });
  }

  try {
    console.log('🔍 User role from token:', req.user.role);
    
    // Admin pode ver todos os grupos
    if (req.user.role === 'admin') {
      console.log('✅ Admin access granted');
      req.userRole = 'admin';
      return next();
    }

    // Verificar se é organizador de algum evento
    console.log('🔍 Checking user events...');
    const userEvents = await storage.getUserEvents(req.user.userId);
    console.log('User events found:', userEvents.length);
    
    if (userEvents.length > 0) {
      console.log('✅ Organizer access granted');
      req.userRole = 'organizer';
      return next();
    }

    // Verificar se é gestor de algum grupo
    console.log('🔍 Checking group managers...');
    const userGroupManagers = await storage.getUserGroupManagers(req.user.userId);
    console.log('User group managers found:', userGroupManagers.length);
    
    if (userGroupManagers.length > 0) {
      console.log('✅ Group manager access granted');
      req.userRole = 'group_manager';
      return next();
    }

    // Se não tem nenhuma permissão, retornar erro
    console.log('❌ No permissions found');
    return res.status(403).json({ 
      error: 'Acesso negado. Você não tem permissão para acessar o dashboard de grupos.' 
    });

  } catch (error) {
    console.error('❌ Erro ao verificar permissões do dashboard:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};
