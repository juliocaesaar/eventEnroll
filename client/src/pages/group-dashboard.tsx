import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { useAuth } from '../hooks/useAuth';
import { useGroupDashboard, type Group, type GroupStats } from '../hooks/useGroupDashboard';
import { 
  Users, 
  DollarSign, 
  Calendar, 
  Settings, 
  TrendingUp,
  UserCheck,
  Clock,
  AlertCircle,
  RefreshCw
} from 'lucide-react';

export default function GroupDashboard() {
  const [, setLocation] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const { data: dashboardData, isLoading, error, refetch } = useGroupDashboard();

  // Auto-refresh a cada 30 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      setIsRefreshing(true);
      refetch().finally(() => {
        setIsRefreshing(false);
      });
    }, 30000); // 30 segundos

    return () => clearInterval(interval);
  }, [refetch]);

  const handleGroupClick = (groupId: string) => {
    setSelectedGroup(groupId);
    // Navegar para página de detalhes do grupo
    setLocation(`/groups/${groupId}/manage`);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto p-4 sm:p-6">
        <Card>
          <CardContent className="p-4 sm:p-6">
            <p className="text-red-600 text-sm sm:text-base">Usuário não autenticado. Faça login para continuar.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto p-4 sm:p-6">
        <div className="flex items-center justify-center h-48 sm:h-64">
          <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4 sm:p-6">
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="text-center">
              <AlertCircle className="w-10 h-10 sm:w-12 sm:h-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-base sm:text-lg font-medium text-foreground mb-2">
                Erro ao carregar dados
              </h3>
              <p className="text-sm sm:text-base text-muted-foreground mb-4">
                Não foi possível carregar o dashboard de grupos.
              </p>
              <Button 
                onClick={() => refetch()}
                className="w-full sm:w-auto"
              >
                Tentar novamente
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const groups = dashboardData?.groups || [];
  const stats = dashboardData?.stats || {
    totalGroups: 0,
    totalParticipants: 0,
    totalConfirmed: 0,
    pendingPayments: 0,
    totalRevenue: 0,
    overduePayments: 0
  };

  return (
    <div className="container mx-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Dashboard de Grupos</h1>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">
            Gerencie os grupos que você administra
            {isRefreshing && (
              <span className="ml-2 text-xs text-blue-600 dark:text-blue-400">
                <RefreshCw className="w-3 h-3 inline animate-spin mr-1" />
                Atualizando...
              </span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={() => {
              setIsRefreshing(true);
              refetch().finally(() => setIsRefreshing(false));
            }}
            variant="outline"
            size="sm"
            disabled={isRefreshing}
            className="w-full sm:w-auto"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          {/* Botão "Gerenciar Eventos" apenas para admin e organizer */}
          {(user?.role === 'admin' || user?.role === 'organizer') && (
            <Button 
              onClick={() => setLocation('/events')}
              className="w-full sm:w-auto"
            >
              <Settings className="w-4 h-4 mr-2" />
              Gerenciar Eventos
            </Button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
        <Card className="card-hover">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium text-muted-foreground truncate">Total de Grupos</p>
                <p className="text-xl sm:text-2xl font-bold text-foreground">{stats.totalGroups}</p>
              </div>
              <Users className="h-6 w-6 sm:h-8 sm:w-8 text-primary flex-shrink-0" />
            </div>
          </CardContent>
        </Card>

        <Card className="card-hover">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium text-muted-foreground truncate">Total de Participantes</p>
                <p className="text-xl sm:text-2xl font-bold text-foreground">{stats.totalParticipants}</p>
              </div>
              <Users className="h-6 w-6 sm:h-8 sm:w-8 text-primary flex-shrink-0" />
            </div>
          </CardContent>
        </Card>

        <Card className="card-hover">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium text-muted-foreground truncate">Confirmados</p>
                <p className="text-xl sm:text-2xl font-bold text-green-600 dark:text-green-400">{stats.totalConfirmed}</p>
              </div>
              <UserCheck className="h-6 w-6 sm:h-8 sm:w-8 text-green-600 dark:text-green-400 flex-shrink-0" />
            </div>
          </CardContent>
        </Card>

        <Card className="card-hover">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium text-muted-foreground truncate">Pagamentos Pendentes</p>
                <p className="text-xl sm:text-2xl font-bold text-yellow-600 dark:text-yellow-400">{stats.pendingPayments}</p>
              </div>
              <Clock className="h-6 w-6 sm:h-8 sm:w-8 text-yellow-600 dark:text-yellow-400 flex-shrink-0" />
            </div>
          </CardContent>
        </Card>

        <Card className="card-hover">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium text-muted-foreground truncate">Receita Total</p>
                <p className="text-lg sm:text-xl font-bold text-green-600 dark:text-green-400 truncate">{formatCurrency(stats.totalRevenue)}</p>
              </div>
              <DollarSign className="h-6 w-6 sm:h-8 sm:w-8 text-green-600 dark:text-green-400 flex-shrink-0" />
            </div>
          </CardContent>
        </Card>

        <Card className="card-hover">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium text-muted-foreground truncate">Pagamentos Atrasados</p>
                <p className="text-xl sm:text-2xl font-bold text-red-600 dark:text-red-400">{stats.overduePayments}</p>
              </div>
              <AlertCircle className="h-6 w-6 sm:h-8 sm:w-8 text-red-600 dark:text-red-400 flex-shrink-0" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Groups List */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
        {groups.map((group) => (
          <Card 
            key={group.id} 
            className="cursor-pointer card-hover hover:scale-[1.02]"
            onClick={() => handleGroupClick(group.id)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center space-x-3 min-w-0 flex-1">
                  <div 
                    className="w-4 h-4 rounded-full flex-shrink-0"
                    style={{ backgroundColor: group.color }}
                  />
                  <div className="min-w-0 flex-1">
                    <CardTitle className="text-base sm:text-lg truncate">{group.name}</CardTitle>
                    <p className="text-xs sm:text-sm text-muted-foreground truncate">{group.eventTitle}</p>
                  </div>
                </div>
                <Badge 
                  variant={group.status === 'active' ? 'default' : 'secondary'}
                  className="flex-shrink-0"
                >
                  {group.status === 'active' ? 'Ativo' : 'Inativo'}
                </Badge>
              </div>
              {group.description && (
                <p className="text-xs sm:text-sm text-muted-foreground mt-2 line-clamp-2">{group.description}</p>
              )}
            </CardHeader>
            
            <CardContent className="pt-0">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-4">
                <div className="text-center sm:text-left">
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground">Total</p>
                  <p className="text-base sm:text-lg font-semibold">
                    {group.currentParticipants}/{group.capacity}
                  </p>
                  <div className="w-full bg-muted rounded-full h-1.5 sm:h-2 mt-1">
                    <div 
                      className="bg-primary h-1.5 sm:h-2 rounded-full transition-all duration-300"
                      style={{ 
                        width: `${(group.currentParticipants / group.capacity) * 100}%` 
                      }}
                    />
                  </div>
                </div>
                
                <div className="text-center sm:text-left">
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground">Confirmados</p>
                  <p className="text-base sm:text-lg font-semibold text-green-600 dark:text-green-400">
                    {group.confirmedParticipants || 0}
                  </p>
                  <div className="w-full bg-muted rounded-full h-1.5 sm:h-2 mt-1">
                    <div 
                      className="bg-green-600 dark:bg-green-400 h-1.5 sm:h-2 rounded-full transition-all duration-300"
                      style={{ 
                        width: `${group.currentParticipants > 0 ? ((group.confirmedParticipants || 0) / group.currentParticipants) * 100 : 0}%` 
                      }}
                    />
                  </div>
                </div>
                
                <div className="text-center sm:text-left">
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground">Receita</p>
                  <p className="text-sm sm:text-base font-semibold text-green-600 dark:text-green-400 truncate">
                    {formatCurrency(group.totalRevenue)}
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs sm:text-sm text-muted-foreground">
                <div className="flex items-center">
                  <Clock className="w-3 h-3 sm:w-4 sm:h-4 mr-1 flex-shrink-0" />
                  <span>{group.pendingPayments} pendentes</span>
                </div>
                <span className="truncate">Última atividade: {formatDate(group.lastActivity)}</span>
              </div>

              <div className="mt-4 flex justify-center sm:justify-start">
                <Button 
                  size="sm"
                  className="w-full sm:w-auto"
                  onClick={(e) => {
                    e.stopPropagation();
                    setLocation(`/groups/${group.id}/manage`);
                  }}
                >
                  <Settings className="w-4 h-4 mr-1" />
                  Gerenciar
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {groups.length === 0 && (
        <Card>
          <CardContent className="p-8 sm:p-12 text-center">
            <Users className="w-10 h-10 sm:w-12 sm:h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-base sm:text-lg font-medium text-foreground mb-2">
              Nenhum grupo encontrado
            </h3>
            <p className="text-sm sm:text-base text-muted-foreground mb-4">
              Você ainda não está gerenciando nenhum grupo.
            </p>
            <Button 
              onClick={() => setLocation('/events')}
              className="w-full sm:w-auto"
            >
              Ver Eventos
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
