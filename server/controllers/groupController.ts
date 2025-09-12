import { Request, Response } from 'express';
import { storage } from '../storage';
import { PaymentService } from '../services/paymentService';
import { randomUUID } from 'crypto';

export class GroupController {
  /**
   * Criar um novo grupo para um evento
   */
  static async createGroup(req: Request, res: Response) {
    try {
      console.log('=== CREATE GROUP DEBUG ===');
      console.log('Request body:', req.body);
      console.log('User from session:', (req as any).user);
      console.log('Session:', (req as any).session);
      
      const { eventId, name, description, capacity, color } = req.body;
      const userId = (req as any).user?.userId;

      console.log('Extracted userId:', userId);
      console.log('EventId from body:', eventId);

      if (!userId) {
        console.log('ERROR: Usuário não autenticado');
        return res.status(401).json({ error: 'Usuário não autenticado' });
      }

      // Verificar se o usuário é organizador do evento
      const event = await storage.getEvent(eventId);
      if (!event || event.organizerId !== userId) {
        return res.status(403).json({ error: 'Acesso negado' });
      }

      const group = await storage.createEventGroup({
        eventId,
        name,
        description,
        capacity,
        color: color || '#3b82f6',
        status: 'active',
      });

      res.status(201).json(group);
    } catch (error) {
      console.error('Erro ao criar grupo:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  /**
   * Atualizar um grupo
   */
  static async updateGroup(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { name, description, capacity, color, status } = req.body;
      const userId = (req as any).user?.userId;

      if (!userId) {
        return res.status(401).json({ error: 'Usuário não autenticado' });
      }

      const group = await storage.getEventGroup(id);
      if (!group) {
        return res.status(404).json({ error: 'Grupo não encontrado' });
      }

      // Verificar se o usuário é organizador do evento
      const event = await storage.getEvent(group.eventId);
      if (!event || event.organizerId !== userId) {
        return res.status(403).json({ error: 'Acesso negado' });
      }

      const updatedGroup = await storage.updateEventGroup(id, {
        name,
        description,
        capacity,
        color,
        status,
      });

      res.json(updatedGroup);
    } catch (error) {
      console.error('Erro ao atualizar grupo:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  /**
   * Obter grupos de um evento
   */
  static async getEventGroups(req: Request, res: Response) {
    try {
      console.log('=== GET EVENT GROUPS DEBUG ===');
      const { eventId } = req.params;
      const userId = (req as any).user?.userId;

      console.log('EventId:', eventId);
      console.log('UserId:', userId);

      if (!userId) {
        console.log('ERROR: Usuário não autenticado');
        return res.status(401).json({ error: 'Usuário não autenticado' });
      }

      // Verificar se o usuário tem acesso ao evento
      const event = await storage.getEvent(eventId);
      console.log('Event found:', !!event);
      console.log('Event organizerId:', event?.organizerId);
      
      if (!event) {
        console.log('ERROR: Evento não encontrado');
        return res.status(404).json({ error: 'Evento não encontrado' });
      }

      // Verificar se é organizador principal
      const isMainOrganizer = event.organizerId === userId;
      console.log('Is main organizer:', isMainOrganizer);
      
      // Verificar se é organizador adicional
      const organizers = await storage.getEventOrganizers(eventId);
      const isAdditionalOrganizer = organizers.some(org => org.userId === userId);
      console.log('Is additional organizer:', isAdditionalOrganizer);
      
      // Verificar se é gestor de algum grupo do evento
      const userGroupManagers = await storage.getUserGroupManagers(userId);
      console.log('User group managers:', userGroupManagers.length);
      
      const hasGroupAccess = userGroupManagers.some(gm => {
        // Verificar se o grupo pertence ao evento
        return gm.group?.eventId === eventId;
      });
      console.log('Has group access:', hasGroupAccess);

      if (!isMainOrganizer && !isAdditionalOrganizer && !hasGroupAccess) {
        console.log('ERROR: Acesso negado - não é organizador nem gestor');
        return res.status(403).json({ error: 'Acesso negado' });
      }

      const groups = await storage.getEventGroups(eventId);
      console.log('Groups found:', groups.length);
      res.json(groups);
    } catch (error) {
      console.error('Erro ao obter grupos:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  /**
   * Obter um grupo específico
   */

  /**
   * Deletar um grupo
   */
  static async deleteGroup(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = (req as any).user?.userId;

      if (!userId) {
        return res.status(401).json({ error: 'Usuário não autenticado' });
      }

      const group = await storage.getEventGroup(id);
      if (!group) {
        return res.status(404).json({ error: 'Grupo não encontrado' });
      }

      // Verificar se o usuário é organizador do evento
      const event = await storage.getEvent(group.eventId);
      if (!event || event.organizerId !== userId) {
        return res.status(403).json({ error: 'Acesso negado' });
      }

      // Verificar se há inscrições no grupo
      const registrations = await storage.getEventRegistrations(group.eventId);
      const groupRegistrations = registrations.filter(r => r.groupId === id);
      
      if (groupRegistrations.length > 0) {
        return res.status(400).json({ 
          error: 'Não é possível deletar um grupo que possui inscrições' 
        });
      }

      await storage.deleteEventGroup(id);
      res.status(204).send();
    } catch (error) {
      console.error('Erro ao deletar grupo:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  /**
   * Adicionar gestor a um grupo
   */
  static async addGroupManager(req: Request, res: Response) {
    try {
      const { groupId } = req.params;
      const { userId: managerUserId, role, permissions } = req.body;
      const currentUserId = (req as any).user?.userId;

      if (!currentUserId) {
        return res.status(401).json({ error: 'Usuário não autenticado' });
      }

      const group = await storage.getEventGroup(groupId);
      if (!group) {
        return res.status(404).json({ error: 'Grupo não encontrado' });
      }

      // Verificar se o usuário é organizador do evento
      const event = await storage.getEvent(group.eventId);
      if (!event) {
        return res.status(404).json({ error: 'Evento não encontrado' });
      }

      // Verificar se é organizador principal
      const isMainOrganizer = event.organizerId === currentUserId;
      
      // Verificar se é organizador adicional
      const organizers = await storage.getEventOrganizers(event.id);
      const isAdditionalOrganizer = organizers.some(org => org.userId === currentUserId);
      
      if (!isMainOrganizer && !isAdditionalOrganizer) {
        return res.status(403).json({ error: 'Acesso negado - apenas organizadores podem adicionar gestores' });
      }

      // Verificar se o usuário a ser adicionado existe
      const user = await storage.getUser(managerUserId);
      if (!user) {
        return res.status(404).json({ error: 'Usuário não encontrado' });
      }

      // Verificar se já é gestor do grupo
      const existingManagers = await storage.getGroupManagers(groupId);
      const isAlreadyManager = existingManagers.some(m => m.userId === managerUserId);
      
      if (isAlreadyManager) {
        return res.status(400).json({ error: 'Usuário já é gestor deste grupo' });
      }

      const groupManager = await storage.createGroupManager({
        id: randomUUID(),
        groupId,
        userId: managerUserId,
        role: role || 'manager',
        permissions: permissions || { read: true, write: true, participants: true, payments: true }, // Permissões padrão para gestores
        assignedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      res.status(201).json(groupManager);
    } catch (error) {
      console.error('Erro ao adicionar gestor:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  /**
   * Remover gestor de um grupo
   */

  /**
   * Obter gestores de um grupo
   */

  /**
   * Obter analytics de um grupo
   */
  static async getGroupAnalytics(req: Request, res: Response) {
    try {
      const { groupId } = req.params;
      const userId = (req as any).user?.userId;

      if (!userId) {
        return res.status(401).json({ error: 'Usuário não autenticado' });
      }

      const group = await storage.getEventGroup(groupId);
      if (!group) {
        return res.status(404).json({ error: 'Grupo não encontrado' });
      }

      // Verificar se o usuário tem acesso ao grupo
      const event = await storage.getEvent(group.eventId);
      if (!event) {
        return res.status(404).json({ error: 'Evento não encontrado' });
      }

      const isOrganizer = event.organizerId === userId;
      const userGroupManagers = await storage.getUserGroupManagers(userId);
      const isGroupManager = userGroupManagers.some(gm => gm.groupId === groupId);

      if (!isOrganizer && !isGroupManager) {
        return res.status(403).json({ error: 'Acesso negado' });
      }

      const analytics = await storage.getGroupPaymentAnalytics(groupId);
      res.json(analytics);
    } catch (error) {
      console.error('Erro ao obter analytics do grupo:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  /**
   * Obter um grupo específico com dados otimizados
   */
  static async getGroup(req: Request, res: Response) {
    try {
      const groupId = req.params.id;
      const userId = (req as any).user?.userId;
      const includeEventData = req.query.includeEventData === 'true';

      if (!userId) {
        return res.status(401).json({ error: 'Usuário não autenticado' });
      }

      const group = await storage.getGroupById(groupId);
      
      if (!group) {
        return res.status(404).json({ error: 'Grupo não encontrado' });
      }

      // Verificar se o usuário tem acesso ao grupo
      const hasAccess = await storage.checkUserGroupAccess(userId, groupId);
      if (!hasAccess) {
        return res.status(403).json({ error: 'Acesso negado ao grupo' });
      }

      // Buscar dados adicionais do grupo em paralelo
      const [currentParticipants, confirmedParticipants] = await Promise.all([
        storage.getGroupParticipants(groupId),
        storage.getGroupConfirmedParticipants(groupId)
      ]);

      // Retornar grupo com dados completos
      const groupWithStats = {
        ...group,
        currentParticipants: currentParticipants.length,
        confirmedParticipants,
        maxParticipants: group.capacity
      };

      // Se solicitado, incluir dados do evento e tickets
      if (includeEventData && group.eventId) {
        
        const [event, tickets] = await Promise.all([
          storage.getEventById(group.eventId),
          storage.getEventTickets(group.eventId)
        ]);

        res.json({
          ...groupWithStats,
          event,
          tickets
        });
      } else {
        res.json(groupWithStats);
      }
    } catch (error) {
      console.error('Erro ao buscar grupo:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  /**
   * Obter dashboard de grupos do usuário
   */
  static async getUserGroupDashboard(req: Request, res: Response) {
    try {
      console.log('=== GET USER GROUP DASHBOARD ===');
      const userId = (req as any).user?.userId;
      const userRole = (req as any).userRole;

      console.log('UserId:', userId);
      console.log('UserRole:', userRole);

      if (!userId) {
        console.log('ERROR: Usuário não autenticado');
        return res.status(401).json({ error: 'Usuário não autenticado' });
      }

      if (!userRole) {
        console.log('ERROR: UserRole não definido');
        return res.status(500).json({ error: 'Erro interno: role do usuário não definido' });
      }

      const groups = [];
      let totalParticipants = 0;
      let totalConfirmed = 0;
      let pendingPayments = 0;
      let totalRevenue = 0;
      let overduePayments = 0;

      if (userRole === 'admin') {
        // Admin pode ver todos os grupos de todos os eventos
        console.log('Admin access - loading all groups');
        const allEvents = await storage.getAllEvents();
        
        for (const event of allEvents) {
          const eventGroups = await storage.getEventGroups(event.id);
          
          for (const group of eventGroups) {
            const participants = await storage.getGroupParticipants(group.id);
            const currentParticipants = participants.length;
            totalParticipants += currentParticipants;

            const groupPendingPayments = await storage.getGroupPendingPayments(group.id);
            pendingPayments += groupPendingPayments;

            const groupRevenue = await storage.getGroupTotalRevenue(group.id);
            totalRevenue += groupRevenue;

            const groupOverduePayments = await storage.getGroupOverduePayments(group.id);
            overduePayments += groupOverduePayments;

            const confirmedParticipants = await storage.getGroupConfirmedParticipants(group.id);
            totalConfirmed += confirmedParticipants;

            groups.push({
              id: group.id,
              name: group.name,
              description: group.description,
              capacity: group.capacity,
              currentParticipants,
              confirmedParticipants,
              eventId: group.eventId,
              eventTitle: event.title,
              status: group.status,
              color: group.color,
              pendingPayments: groupPendingPayments,
              totalRevenue: groupRevenue,
              lastActivity: group.updatedAt || group.createdAt
            });
          }
        }
      } else if (userRole === 'organizer') {
        // Organizador pode ver todos os grupos dos seus eventos
        console.log('Organizer access - loading own event groups');
        const userEvents = await storage.getUserEvents(userId);
        
        for (const event of userEvents) {
          const eventGroups = await storage.getEventGroups(event.id);
          for (const group of eventGroups) {
            const participants = await storage.getGroupParticipants(group.id);
            const currentParticipants = participants.length;
            totalParticipants += currentParticipants;

            const groupPendingPayments = await storage.getGroupPendingPayments(group.id);
            pendingPayments += groupPendingPayments;

            const groupRevenue = await storage.getGroupTotalRevenue(group.id);
            totalRevenue += groupRevenue;

            const groupOverduePayments = await storage.getGroupOverduePayments(group.id);
            overduePayments += groupOverduePayments;

            const confirmedParticipants = await storage.getGroupConfirmedParticipants(group.id);
            totalConfirmed += confirmedParticipants;

            groups.push({
              id: group.id,
              name: group.name,
              description: group.description,
              capacity: group.capacity,
              currentParticipants,
              confirmedParticipants,
              eventId: group.eventId,
              eventTitle: event.title,
              status: group.status,
              color: group.color,
              pendingPayments: groupPendingPayments,
              totalRevenue: groupRevenue,
              lastActivity: group.updatedAt || group.createdAt
            });
          }
        }
      } else if (userRole === 'group_manager') {
        // Gestor de grupo pode ver apenas os grupos que gerencia
        console.log('Group manager access - loading managed groups');
        const userGroupManagers = await storage.getUserGroupManagers(userId);
        
        for (const groupManager of userGroupManagers) {
          if (groupManager.group) {
            const group = groupManager.group;
            
            const participants = await storage.getGroupParticipants(group.id);
            const currentParticipants = participants.length;
            totalParticipants += currentParticipants;

            const groupPendingPayments = await storage.getGroupPendingPayments(group.id);
            pendingPayments += groupPendingPayments;

            const groupRevenue = await storage.getGroupTotalRevenue(group.id);
            totalRevenue += groupRevenue;

            const groupOverduePayments = await storage.getGroupOverduePayments(group.id);
            overduePayments += groupOverduePayments;

            const confirmedParticipants = await storage.getGroupConfirmedParticipants(group.id);
            totalConfirmed += confirmedParticipants;

            const event = await storage.getEvent(group.eventId);

            groups.push({
              id: group.id,
              name: group.name,
              description: group.description,
              capacity: group.capacity,
              currentParticipants,
              confirmedParticipants,
              eventId: group.eventId,
              eventTitle: event?.title || 'Evento não encontrado',
              eventStartDate: event?.startDate,
              eventEndDate: event?.endDate,
              status: group.status,
              color: group.color,
              pendingPayments: groupPendingPayments,
              totalRevenue: groupRevenue,
              lastActivity: group.updatedAt || group.createdAt
            });
          }
        }
      }

      const stats = {
        totalGroups: groups.length,
        totalParticipants,
        totalConfirmed,
        pendingPayments,
        totalRevenue,
        overduePayments
      };

      console.log('Dashboard data prepared:', { 
        userRole, 
        groupsCount: groups.length, 
        stats 
      });

      res.json({
        groups,
        stats,
        userRole
      });
    } catch (error) {
      console.error('Erro ao obter dashboard de grupos:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  /**
   * Obter participantes de um grupo
   */
  static async getGroupParticipants(req: Request, res: Response) {
    try {
      console.log('=== GET GROUP PARTICIPANTS ===');
      const { groupId } = req.params;
      const userId = (req as any).user?.userId;

      console.log('GroupId:', groupId);
      console.log('UserId:', userId);

      if (!userId) {
        console.log('ERROR: Usuário não autenticado');
        return res.status(401).json({ error: 'Usuário não autenticado' });
      }

      // Verificar se o usuário tem acesso ao grupo
      const hasAccess = await storage.checkUserGroupAccess(userId, groupId);
      if (!hasAccess) {
        console.log('ERROR: Usuário não tem acesso ao grupo');
        return res.status(403).json({ error: 'Acesso negado' });
      }

      const participants = await storage.getGroupParticipants(groupId);
      console.log('Participants found:', participants.length);

      res.json(participants);
    } catch (error) {
      console.error('Erro ao obter participantes do grupo:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  /**
   * Obter um participante específico de um grupo
   */
  static async getGroupParticipant(req: Request, res: Response) {
    try {
      console.log('=== GET GROUP PARTICIPANT ===');
      const { groupId, participantId } = req.params;
      const userId = (req as any).user?.userId;

      console.log('GroupId:', groupId);
      console.log('ParticipantId:', participantId);
      console.log('UserId:', userId);

      if (!userId) {
        console.log('ERROR: Usuário não autenticado');
        return res.status(401).json({ error: 'Usuário não autenticado' });
      }

      // Verificar se o usuário tem acesso ao grupo
      const hasAccess = await storage.checkUserGroupAccess(userId, groupId);
      if (!hasAccess) {
        console.log('ERROR: Acesso negado ao grupo');
        return res.status(403).json({ error: 'Acesso negado ao grupo' });
      }

      const participant = await storage.getGroupParticipantById(groupId, participantId);
      if (!participant) {
        console.log('ERROR: Participante não encontrado');
        return res.status(404).json({ error: 'Participante não encontrado' });
      }

      console.log('Participant found:', participant.id);
      res.json(participant);
    } catch (error) {
      console.error('Erro ao obter participante do grupo:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  /**
   * Atualizar dados de um participante
   */
  static async updateGroupParticipant(req: Request, res: Response) {
    try {
      console.log('=== UPDATE GROUP PARTICIPANT ===');
      const { groupId, participantId } = req.params;
      const userId = (req as any).user?.userId;
      const { firstName, lastName, email, phone } = req.body;

      console.log('GroupId:', groupId);
      console.log('ParticipantId:', participantId);
      console.log('UserId:', userId);
      console.log('Update data:', { firstName, lastName, email, phone });

      if (!userId) {
        console.log('ERROR: Usuário não autenticado');
        return res.status(401).json({ error: 'Usuário não autenticado' });
      }

      // Verificar se o usuário tem acesso ao grupo
      const hasAccess = await storage.checkUserGroupAccess(userId, groupId);
      if (!hasAccess) {
        console.log('ERROR: Acesso negado ao grupo');
        return res.status(403).json({ error: 'Acesso negado ao grupo' });
      }

      // Verificar se o participante existe
      const participant = await storage.getGroupParticipantById(groupId, participantId);
      if (!participant) {
        console.log('ERROR: Participante não encontrado');
        return res.status(404).json({ error: 'Participante não encontrado' });
      }

      // Atualizar dados do participante
      const updatedParticipant = await storage.updateRegistration(participantId, {
        firstName,
        lastName,
        email,
        phoneNumber: phone
      });

      console.log('Participant updated successfully');
      res.json({ 
        message: 'Participante atualizado com sucesso',
        participant: updatedParticipant 
      });
    } catch (error) {
      console.error('Erro ao atualizar participante do grupo:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  /**
   * Remover inscrição de um participante
   */
  static async removeGroupParticipant(req: Request, res: Response) {
    try {
      console.log('=== REMOVE GROUP PARTICIPANT ===');
      const { groupId, participantId } = req.params;
      const userId = (req as any).user?.userId;

      console.log('GroupId:', groupId);
      console.log('ParticipantId:', participantId);
      console.log('UserId:', userId);

      if (!userId) {
        console.log('ERROR: Usuário não autenticado');
        return res.status(401).json({ error: 'Usuário não autenticado' });
      }

      // Verificar se o usuário tem acesso ao grupo
      const hasAccess = await storage.checkUserGroupAccess(userId, groupId);
      if (!hasAccess) {
        console.log('ERROR: Acesso negado ao grupo');
        return res.status(403).json({ error: 'Acesso negado ao grupo' });
      }

      // Verificar se o participante existe
      const participant = await storage.getGroupParticipantById(groupId, participantId);
      if (!participant) {
        console.log('ERROR: Participante não encontrado');
        return res.status(404).json({ error: 'Participante não encontrado' });
      }

      // Remover inscrição
      await storage.deleteRegistration(participantId);

      console.log('Participant removed successfully');
      res.json({ message: 'Inscrição removida com sucesso' });
    } catch (error) {
      console.error('Erro ao remover participante do grupo:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  /**
   * Obter pagamentos de um grupo
   */
  static async getGroupPayments(req: Request, res: Response) {
    try {
      console.log('=== GET GROUP PAYMENTS ===');
      const { groupId } = req.params;
      const userId = (req as any).user?.userId;

      console.log('GroupId:', groupId);
      console.log('UserId:', userId);

      if (!userId) {
        console.log('ERROR: Usuário não autenticado');
        return res.status(401).json({ error: 'Usuário não autenticado' });
      }

      // Verificar se o usuário tem acesso ao grupo
      const hasAccess = await storage.checkUserGroupAccess(userId, groupId);
      if (!hasAccess) {
        console.log('ERROR: Usuário não tem acesso ao grupo');
        return res.status(403).json({ error: 'Acesso negado' });
      }

      const payments = await storage.getGroupPayments(groupId);
      console.log('Payments found:', payments.length);

      res.json(payments);
    } catch (error) {
      console.error('Erro ao obter pagamentos do grupo:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  // Gestores de grupos
  static async getGroupManagers(req: Request, res: Response) {
    try {
      const groupId = req.params.groupId;
      const userId = (req as any).user?.userId;

      console.log('=== GET GROUP MANAGERS ===');
      console.log('GroupId:', groupId);
      console.log('UserId:', userId);

      if (!userId) {
        return res.status(401).json({ error: 'Usuário não autenticado' });
      }

      // Verificar se o usuário tem acesso ao grupo
      const hasAccess = await storage.checkUserGroupAccess(userId, groupId);
      if (!hasAccess) {
        return res.status(403).json({ error: 'Acesso negado ao grupo' });
      }

      const managers = await storage.getGroupManagers(groupId);
      res.json(managers);
    } catch (error) {
      console.error('Erro ao buscar gestores do grupo:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }


  static async removeGroupManager(req: Request, res: Response) {
    try {
      const { groupId, managerId } = req.params;
      const userId = (req as any).user?.userId;

      console.log('=== REMOVE GROUP MANAGER ===');
      console.log('GroupId:', groupId);
      console.log('ManagerId:', managerId);
      console.log('UserId:', userId);

      if (!userId) {
        return res.status(401).json({ error: 'Usuário não autenticado' });
      }

      // Verificar se o usuário tem acesso ao grupo
      const hasAccess = await storage.checkUserGroupAccess(userId, groupId);
      if (!hasAccess) {
        return res.status(403).json({ error: 'Acesso negado ao grupo' });
      }

      await storage.deleteGroupManager(managerId);
      res.status(200).json({ message: 'Gestor removido com sucesso' });
    } catch (error) {
      console.error('Erro ao remover gestor do grupo:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
}
