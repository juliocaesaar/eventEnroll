import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '../lib/queryClient';

export interface Group {
  id: string;
  name: string;
  description?: string;
  capacity: number;
  currentParticipants: number;
  confirmedParticipants?: number;
  eventId: string;
  eventTitle: string;
  status: 'active' | 'inactive';
  color: string;
  pendingPayments: number;
  totalRevenue: number;
  lastActivity: string;
}

export interface GroupStats {
  totalGroups: number;
  totalParticipants: number;
  totalConfirmed: number;
  pendingPayments: number;
  totalRevenue: number;
  overduePayments: number;
}

export interface GroupDashboardData {
  groups: Group[];
  stats: GroupStats;
}

export function useGroupDashboard() {
  return useQuery<GroupDashboardData>({
    queryKey: ['group-dashboard'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/groups/dashboard');
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 30 * 1000, // 30 seconds
  });
}

export function useGroupManagers(groupId: string) {
  return useQuery({
    queryKey: ['group-managers', groupId],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/groups/${groupId}/managers`);
      return response.json();
    },
    enabled: !!groupId,
  });
}

export function useGroupParticipants(groupId: string) {
  return useQuery({
    queryKey: ['group-participants', groupId],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/groups/${groupId}/participants`);
      return response.json();
    },
    enabled: !!groupId,
  });
}

export function useGroupPayments(groupId: string) {
  return useQuery({
    queryKey: ['group-payments', groupId],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/groups/${groupId}/payments`);
      return response.json();
    },
    enabled: !!groupId,
  });
}
