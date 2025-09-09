import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../hooks/useAuth';
import { useLocation } from 'wouter';
import { 
  Users, 
  DollarSign, 
  Calendar, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  Eye,
  BarChart3
} from 'lucide-react';

interface GroupData {
  id: string;
  name: string;
  description: string;
  capacity: number;
  currentParticipants: number;
  eventId: string;
  eventTitle: string;
  eventStartDate: string;
  eventEndDate: string;
  status: string;
  color: string;
  pendingPayments: number;
  totalRevenue: number;
  lastActivity: string;
}

interface Participant {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  status: string;
  amountPaid: string;
  totalAmount: string;
  installments: Array<{
    id: string;
    installmentNumber: number;
    amount: string;
    dueDate: string;
    paidDate: string | null;
    status: string;
  }>;
}

export default function ManagerDashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  // Buscar grupos do usuário
  const { data: groupsData, isLoading: groupsLoading } = useQuery({
    queryKey: ['/api/groups/dashboard'],
  }) as { data: { groups: GroupData[] }, isLoading: boolean };

  // Buscar estatísticas gerais
  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['/api/groups/dashboard/stats'],
  }) as { data: any, isLoading: boolean };

  const groups = groupsData?.groups || [];
  const stats = statsData || {};

  if (groupsLoading || statsLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Carregando dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  if (groups.length === 0) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-12 text-center">
            <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              Nenhum Grupo Atribuído
            </h2>
            <p className="text-gray-600 mb-6">
              Você ainda não foi atribuído como gestor de nenhum grupo.
            </p>
            <Button onClick={() => setLocation('/dashboard')}>
              Voltar ao Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Dashboard do Gestor
        </h1>
        <p className="text-gray-600">
          Gerencie os grupos atribuídos a você
        </p>
      </div>

      {/* Estatísticas Gerais */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total de Grupos</p>
                <p className="text-2xl font-bold text-blue-600">{groups.length}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total de Participantes</p>
                <p className="text-2xl font-bold text-green-600">
                  {groups.reduce((sum, group) => sum + group.currentParticipants, 0)}
                </p>
              </div>
              <Users className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pagamentos Completos</p>
                <p className="text-2xl font-bold text-green-600">
                  {stats.completedPayments || 0}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pagamentos Pendentes</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {stats.pendingPayments || 0}
                </p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Grupos */}
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold text-gray-900">Meus Grupos</h2>
        
        {groups.map((group) => (
          <Card key={group.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl">{group.name}</CardTitle>
                  <p className="text-gray-600 mt-1">{group.eventTitle}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="outline">
                    {group.currentParticipants}/{group.capacity} inscritos
                  </Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setLocation(`/groups/${group.id}`)}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Gerenciar
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center space-x-3">
                  <Calendar className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Data do Evento</p>
                    <p className="text-sm text-gray-600">
                      {new Date(group.eventStartDate).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <Users className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Participantes</p>
                    <p className="text-sm text-gray-600">
                      {group.currentParticipants} de {group.capacity}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <BarChart3 className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Taxa de Ocupação</p>
                    <p className="text-sm text-gray-600">
                      {Math.round((group.currentParticipants / group.capacity) * 100)}%
                    </p>
                  </div>
                </div>
              </div>
              
              {group.description && (
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-700">{group.description}</p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
