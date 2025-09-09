import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from './useAuth';
import { apiRequest } from '../lib/queryClient';

export interface EventGroup {
  id: string;
  eventId: string;
  name: string;
  description?: string;
  capacity?: number;
  currentCount: number;
  color: string;
  status: 'active' | 'inactive';
  whatsappNumber?: string;
  createdAt: string;
  updatedAt: string;
}

export interface GroupManager {
  id: string;
  groupId: string;
  userId: string;
  role: 'manager' | 'assistant' | 'viewer';
  permissions: Record<string, any>;
  assignedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateGroupData {
  eventId: string;
  name: string;
  description?: string;
  capacity?: number;
  color?: string;
}

export interface UpdateGroupData {
  name?: string;
  description?: string;
  capacity?: number;
  color?: string;
  status?: 'active' | 'inactive';
}

export interface AddManagerData {
  userId: string;
  role?: 'manager' | 'assistant' | 'viewer';
  permissions?: Record<string, any>;
}

export const useEventGroups = (eventId: string) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const {
    data: groups,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['/api/events', eventId, 'groups'],
    enabled: !!eventId && !!user,
  });

  const createGroupMutation = useMutation({
    mutationFn: async (groupData: CreateGroupData) => {
      console.log('=== CREATE GROUP MUTATION ===');
      console.log('EventId:', eventId);
      console.log('GroupData:', groupData);
      
      const response = await apiRequest('POST', `/api/events/${eventId}/groups`, groupData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['/api/events', eventId, 'groups'],
      });
    },
  });

  const updateGroupMutation = useMutation({
    mutationFn: async ({ groupId, data }: { groupId: string; data: UpdateGroupData }) => {
      const response = await apiRequest('PUT', `/api/groups/${groupId}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['/api/events', eventId, 'groups'],
      });
    },
  });

  const deleteGroupMutation = useMutation({
    mutationFn: async (groupId: string) => {
      await apiRequest('DELETE', `/api/groups/${groupId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['/api/events', eventId, 'groups'],
      });
    },
  });

  return {
    groups: groups as EventGroup[],
    isLoading,
    error,
    createGroup: createGroupMutation.mutate,
    updateGroup: updateGroupMutation.mutate,
    deleteGroup: deleteGroupMutation.mutate,
    isCreating: createGroupMutation.isPending,
    isUpdating: updateGroupMutation.isPending,
    isDeleting: deleteGroupMutation.isPending,
  };
};

export const useGroupManagers = (groupId: string) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const {
    data: managers,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['/api/groups', groupId, 'managers'],
    enabled: !!groupId && !!user,
  });

  const addManagerMutation = useMutation({
    mutationFn: async (managerData: AddManagerData) => {
      const response = await apiRequest('POST', `/api/groups/${groupId}/managers`, managerData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['/api/groups', groupId, 'managers'],
      });
    },
  });

  const removeManagerMutation = useMutation({
    mutationFn: async (managerId: string) => {
      await apiRequest('DELETE', `/api/groups/${groupId}/managers/${managerId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['/api/groups', groupId, 'managers'],
      });
    },
  });

  return {
    managers: managers as GroupManager[],
    isLoading,
    error,
    addManager: addManagerMutation.mutate,
    removeManager: removeManagerMutation.mutate,
    isAdding: addManagerMutation.isPending,
    isRemoving: removeManagerMutation.isPending,
  };
};

export const useGroupAnalytics = (groupId: string) => {
  const { user } = useAuth();

  const {
    data: analytics,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['/api/groups', groupId, 'analytics'],
    enabled: !!groupId && !!user,
  });

  return {
    analytics,
    isLoading,
    error,
  };
};
