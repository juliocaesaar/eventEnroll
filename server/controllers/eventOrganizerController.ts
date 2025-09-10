import { Request, Response } from 'express';
import { storage } from '../storage';
import { randomUUID } from 'crypto';

export class EventOrganizerController {
  /**
   * Obter organizadores de um evento
   */
  static async getEventOrganizers(req: Request, res: Response) {
    try {
      const { eventId } = req.params;
      const userId = (req as any).user?.userId;

      if (!userId) {
        return res.status(401).json({ error: 'Usuário não autenticado' });
      }

      // Verificar se o usuário tem acesso ao evento
      const event = await storage.getEvent(eventId);
      if (!event) {
        return res.status(404).json({ error: 'Evento não encontrado' });
      }

      // Verificar se é admin ou organizador principal do evento
      const currentUser = await storage.getUser(userId);
      if (!currentUser || (currentUser.role !== 'admin' && event.organizerId !== userId)) {
        return res.status(403).json({ error: 'Acesso negado' });
      }

      const organizers = await storage.getEventOrganizers(eventId);
      
      // Buscar informações dos usuários
      const organizersWithUsers = await Promise.all(
        organizers.map(async (organizer) => {
          const user = await storage.getUser(organizer.userId);
          return {
            ...organizer,
            user: user ? {
              id: user.id,
              email: user.email,
              firstName: user.firstName,
              lastName: user.lastName,
              role: user.role
            } : null
          };
        })
      );

      res.json(organizersWithUsers);
    } catch (error) {
      console.error('Erro ao obter organizadores:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  /**
   * Adicionar organizador a um evento
   */
  static async addEventOrganizer(req: Request, res: Response) {
    try {
      const { eventId } = req.params;
      const { userId: organizerUserId, role, permissions } = req.body;
      const currentUserId = (req as any).user?.userId;

      if (!currentUserId) {
        return res.status(401).json({ error: 'Usuário não autenticado' });
      }

      // Verificar se o usuário tem permissão para adicionar organizadores
      const event = await storage.getEvent(eventId);
      if (!event) {
        return res.status(404).json({ error: 'Evento não encontrado' });
      }

      const currentUser = await storage.getUser(currentUserId);
      if (!currentUser || (currentUser.role !== 'admin' && event.organizerId !== currentUserId)) {
        return res.status(403).json({ error: 'Acesso negado' });
      }

      // Verificar se o usuário a ser adicionado existe
      const user = await storage.getUser(organizerUserId);
      if (!user) {
        return res.status(404).json({ error: 'Usuário não encontrado' });
      }

      // Verificar se já é organizador do evento
      const existingOrganizers = await storage.getEventOrganizers(eventId);
      const isAlreadyOrganizer = existingOrganizers.some(o => o.userId === organizerUserId);
      
      if (isAlreadyOrganizer) {
        return res.status(400).json({ error: 'Usuário já é organizador deste evento' });
      }

      const eventOrganizer = await storage.createEventOrganizer({
        id: randomUUID(),
        eventId,
        userId: organizerUserId,
        role: role || 'organizer',
        permissions: permissions || ['read', 'write', 'participants', 'payments'],
        assignedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Buscar informações do usuário adicionado
      const userInfo = await storage.getUser(organizerUserId);
      const response = {
        ...eventOrganizer,
        user: userInfo ? {
          id: userInfo.id,
          email: userInfo.email,
          firstName: userInfo.firstName,
          lastName: userInfo.lastName,
          role: userInfo.role
        } : null
      };

      res.status(201).json(response);
    } catch (error) {
      console.error('Erro ao adicionar organizador:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  /**
   * Atualizar organizador de um evento
   */
  static async updateEventOrganizer(req: Request, res: Response) {
    try {
      const { organizerId } = req.params;
      const { role, permissions } = req.body;
      const currentUserId = (req as any).user?.userId;

      if (!currentUserId) {
        return res.status(401).json({ error: 'Usuário não autenticado' });
      }

      // Verificar se o organizador existe
      const organizer = await storage.getEventOrganizer(organizerId);
      if (!organizer) {
        return res.status(404).json({ error: 'Organizador não encontrado' });
      }

      // Verificar se o usuário tem permissão para atualizar
      const event = await storage.getEvent(organizer.eventId);
      if (!event) {
        return res.status(404).json({ error: 'Evento não encontrado' });
      }

      const currentUser = await storage.getUser(currentUserId);
      if (!currentUser || (currentUser.role !== 'admin' && event.organizerId !== currentUserId)) {
        return res.status(403).json({ error: 'Acesso negado' });
      }

      const updatedOrganizer = await storage.updateEventOrganizer(organizerId, {
        role,
        permissions,
      });

      // Buscar informações do usuário
      const userInfo = await storage.getUser(updatedOrganizer.userId);
      const response = {
        ...updatedOrganizer,
        user: userInfo ? {
          id: userInfo.id,
          email: userInfo.email,
          firstName: userInfo.firstName,
          lastName: userInfo.lastName,
          role: userInfo.role
        } : null
      };

      res.json(response);
    } catch (error) {
      console.error('Erro ao atualizar organizador:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  /**
   * Remover organizador de um evento
   */
  static async removeEventOrganizer(req: Request, res: Response) {
    try {
      const { organizerId } = req.params;
      const currentUserId = (req as any).user?.userId;

      if (!currentUserId) {
        return res.status(401).json({ error: 'Usuário não autenticado' });
      }

      // Verificar se o organizador existe
      const organizer = await storage.getEventOrganizer(organizerId);
      if (!organizer) {
        return res.status(404).json({ error: 'Organizador não encontrado' });
      }

      // Verificar se o usuário tem permissão para remover
      const event = await storage.getEvent(organizer.eventId);
      if (!event) {
        return res.status(404).json({ error: 'Evento não encontrado' });
      }

      const currentUser = await storage.getUser(currentUserId);
      if (!currentUser || (currentUser.role !== 'admin' && event.organizerId !== currentUserId)) {
        return res.status(403).json({ error: 'Acesso negado' });
      }

      // Não permitir remover o organizador principal
      if (event.organizerId === organizer.userId) {
        return res.status(400).json({ error: 'Não é possível remover o organizador principal do evento' });
      }

      await storage.deleteEventOrganizer(organizerId);

      res.json({ message: 'Organizador removido com sucesso' });
    } catch (error) {
      console.error('Erro ao remover organizador:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
}
