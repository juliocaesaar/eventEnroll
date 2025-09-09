import { useState, useEffect } from 'react';
import { useParams, useLocation } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Search, Users, DollarSign, Calendar, ArrowLeft, UserPlus, Download, Shield } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import GroupManagers from '@/components/group/GroupManagers';
import GroupParticipants from '@/components/group/GroupParticipants';

interface Group {
  id: string;
  name: string;
  description: string;
  maxParticipants: number;
  currentParticipants: number;
  confirmedParticipants?: number;
  event: {
    id: string;
    name: string;
  };
}

interface Participant {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  registrationDate: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  paymentStatus: 'pending' | 'partial' | 'paid' | 'overdue';
}


export default function GroupManagementPage() {
  const [, setLocation] = useLocation();
  const { groupId } = useParams();
  const [group, setGroup] = useState<Group | null>(null);
  const [eventData, setEventData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (groupId) {
      loadGroupData();
    }
  }, [groupId]);

  const loadGroupData = async () => {
    try {
      setLoading(true);
      
      // Carregar dados do grupo
      const groupResponse = await apiRequest('GET', `/api/groups/${groupId}`);
      const groupData = await groupResponse.json();
      console.log('Group data received:', groupData);
      setGroup(groupData);

      // Carregar dados do evento
      if (groupData.eventId) {
        const eventResponse = await apiRequest('GET', `/api/events/${groupData.eventId}`);
        const eventData = await eventResponse.json();
        setEventData(eventData);
      }


    } catch (error) {
      console.error('Erro ao carregar dados do grupo:', error);
    } finally {
      setLoading(false);
    }
  };



  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando dados do grupo...</p>
        </div>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Grupo não encontrado</h1>
          <Button onClick={() => setLocation('/groups/dashboard')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar ao Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <Button 
                variant="ghost" 
                onClick={() => setLocation('/groups/dashboard')}
                className="mb-4"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar ao Dashboard
              </Button>
              <h1 className="text-3xl font-bold text-foreground">{group.name || 'Grupo sem nome'}</h1>
              <p className="text-muted-foreground mt-2">{group.description || 'Sem descrição'}</p>
              <p className="text-sm text-muted-foreground mt-1">Evento: {group.event?.name || 'N/A'}</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Exportar
              </Button>
              <Button>
                <UserPlus className="w-4 h-4 mr-2" />
                Adicionar Participante
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Participantes</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{group.currentParticipants || 0}</div>
              <p className="text-xs text-muted-foreground">
                de {group.maxParticipants || 0} vagas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Confirmados</CardTitle>
              <Users className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {group.confirmedParticipants || 0}
              </div>
            </CardContent>
          </Card>

        </div>

        {/* Tabs */}
        <Tabs defaultValue="participants" className="space-y-6">
          <TabsList>
            <TabsTrigger value="participants">Participantes</TabsTrigger>
            <TabsTrigger value="managers">Gestores</TabsTrigger>
          </TabsList>

          <TabsContent value="participants" className="space-y-6">
            <GroupParticipants 
              groupId={groupId || ''} 
              onUpdate={loadGroupData}
              eventData={eventData ? {
                pixKeyType: eventData.pixKeyType,
                pixKey: eventData.pixKey,
                pixInstallments: eventData.pixInstallments
              } : undefined}
            />
          </TabsContent>

          <TabsContent value="managers" className="space-y-6">
            <GroupManagers groupId={groupId || ''} onUpdate={loadGroupData} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
