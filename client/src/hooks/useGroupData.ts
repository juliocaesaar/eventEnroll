import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

interface GroupData {
  id: string;
  name: string;
  description: string;
  maxParticipants: number;
  currentParticipants: number;
  confirmedParticipants?: number;
  eventId: string;
  event?: {
    id: string;
    name: string;
  };
}

interface EventData {
  id: string;
  name: string;
  pixKeyType?: string;
  pixKey?: string;
  pixInstallments?: boolean;
}

interface Ticket {
  id: string;
  name: string;
  price: number;
  description?: string;
}

export function useGroupData(groupId: string | undefined) {
  // Query otimizada que busca grupo, evento e tickets em uma única requisição
  const groupQuery = useQuery({
    queryKey: ['/api/groups', groupId, 'with-event-data'],
    queryFn: async () => {
      if (!groupId) throw new Error('Group ID is required');
      const response = await apiRequest('GET', `/api/groups/${groupId}?includeEventData=true`);
      const data = await response.json();
      
      return {
        group: data as GroupData,
        event: data.event as EventData,
        tickets: data.tickets as Ticket[]
      };
    },
    enabled: !!groupId,
    staleTime: 2 * 60 * 1000, // 2 minutos para dados do grupo
  });

  return {
    group: groupQuery.data?.group,
    event: groupQuery.data?.event,
    tickets: groupQuery.data?.tickets || [],
    isLoading: groupQuery.isLoading,
    isError: groupQuery.isError,
    error: groupQuery.error,
    refetch: groupQuery.refetch
  };
}
