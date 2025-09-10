import { useState, useEffect } from 'react';
import { useParams, useLocation } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Search, Users, DollarSign, Calendar, ArrowLeft, UserPlus, Shield, RefreshCw } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import GroupManagers from '@/components/group/GroupManagers';
import GroupParticipants from '@/components/group/GroupParticipants';
import { useAuth } from '@/hooks/useAuth';
import { useGroupData } from '@/hooks/useGroupData';

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
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [showRegistrationModal, setShowRegistrationModal] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [registrationData, setRegistrationData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    ticketId: '',
    paymentType: 'cash' as 'cash' | 'installments'
  });

  // Usar o hook otimizado para carregar dados
  const { group, event: eventData, tickets, isLoading, isError, error, refetch } = useGroupData(groupId);

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

  useEffect(() => {
    // Verificar autenticação antes de carregar dados
    if (!authLoading && !isAuthenticated) {
      console.log('❌ User not authenticated, redirecting to login');
      setLocation('/login');
      return;
    }
  }, [isAuthenticated, authLoading, setLocation]);

  // Tratar erros de autenticação
  useEffect(() => {
    if (isError && error instanceof Error && error.message.includes('401')) {
      console.log('🔄 Authentication error detected, redirecting to login');
      setLocation('/login');
    }
  }, [isError, error, setLocation]);

  const handleRegistration = async () => {
    try {
      if (!registrationData.firstName || !registrationData.lastName || !registrationData.email || !registrationData.ticketId) {
        toast({
          title: "Dados obrigatórios",
          description: "Por favor, preencha todos os campos obrigatórios.",
          variant: "destructive",
        });
        return;
      }

      const registrationPayload = {
        firstName: registrationData.firstName,
        lastName: registrationData.lastName,
        email: registrationData.email,
        phone: registrationData.phone,
        groupId: groupId,
        tickets: [{ ticketId: registrationData.ticketId, quantity: 1 }],
        paymentType: registrationData.paymentType,
      };

      const response = await apiRequest('POST', `/api/events/${eventData?.id}/register`, registrationPayload);
      const result = await response.json();

      if (result.success) {
        toast({
          title: "Sucesso",
          description: "Participante inscrito com sucesso!",
        });
        
        // Limpar formulário
        setRegistrationData({
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
          ticketId: '',
          paymentType: 'cash'
        });
        
        setShowRegistrationModal(false);
        
        // Forçar refresh imediato dos dados
        setIsRefreshing(true);
        await refetch();
        setIsRefreshing(false);
        
        // Recarregar a página após 1 segundo para garantir que tudo seja atualizado
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        toast({
          title: "Erro na inscrição",
          description: result.message || "Erro ao inscrever participante.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Erro ao inscrever participante:', error);
      toast({
        title: "Erro",
        description: "Erro ao inscrever participante. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  // Mostrar loading enquanto verifica autenticação ou carrega dados
  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">
            {authLoading ? 'Verificando autenticação...' : 'Carregando dados do grupo...'}
          </p>
        </div>
      </div>
    );
  }

  // Se não estiver autenticado, não renderizar nada (já redirecionou)
  if (!isAuthenticated) {
    return null;
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
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex-1">
              <Button 
                variant="ghost" 
                onClick={() => setLocation('/groups/dashboard')}
                className="mb-4"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar ao Dashboard
              </Button>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">{group.name || 'Grupo sem nome'}</h1>
              <p className="text-muted-foreground mt-2 text-sm sm:text-base">
                {group.description || 'Sem descrição'}
                {isRefreshing && (
                  <span className="ml-2 text-xs text-blue-600 dark:text-blue-400">
                    <RefreshCw className="w-3 h-3 inline animate-spin mr-1" />
                    Atualizando...
                  </span>
                )}
              </p>
              <p className="text-sm text-muted-foreground mt-1">Evento: {eventData?.title || 'N/A'}</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
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
              <Dialog open={showRegistrationModal} onOpenChange={setShowRegistrationModal}>
                <DialogTrigger asChild>
                  <Button className="w-full sm:w-auto">
                    <UserPlus className="w-4 h-4 mr-2" />
                    <span className="hidden sm:inline">Adicionar Participante</span>
                    <span className="sm:hidden">Adicionar</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Inscrição de Participante</DialogTitle>
                    <DialogDescription>
                      Preencha os dados do participante para realizar a inscrição no grupo.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="firstName">Nome *</Label>
                        <Input
                          id="firstName"
                          value={registrationData.firstName}
                          onChange={(e) => setRegistrationData(prev => ({ ...prev, firstName: e.target.value }))}
                          placeholder="Nome"
                        />
                      </div>
                      <div>
                        <Label htmlFor="lastName">Sobrenome *</Label>
                        <Input
                          id="lastName"
                          value={registrationData.lastName}
                          onChange={(e) => setRegistrationData(prev => ({ ...prev, lastName: e.target.value }))}
                          placeholder="Sobrenome"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={registrationData.email}
                        onChange={(e) => setRegistrationData(prev => ({ ...prev, email: e.target.value }))}
                        placeholder="email@exemplo.com"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="phone">Telefone</Label>
                      <Input
                        id="phone"
                        value={registrationData.phone}
                        onChange={(e) => setRegistrationData(prev => ({ ...prev, phone: e.target.value }))}
                        placeholder="(11) 99999-9999"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="ticket">Ingresso *</Label>
                      <Select value={registrationData.ticketId} onValueChange={(value) => setRegistrationData(prev => ({ ...prev, ticketId: value }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um ingresso" />
                        </SelectTrigger>
                        <SelectContent>
                          {tickets.map((ticket) => (
                            <SelectItem key={ticket.id} value={ticket.id}>
                              {ticket.name} - R$ {Number(ticket.price || 0).toFixed(2)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="paymentType">Tipo de Pagamento</Label>
                      <Select value={registrationData.paymentType} onValueChange={(value: 'cash' | 'installments') => setRegistrationData(prev => ({ ...prev, paymentType: value }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cash">À vista</SelectItem>
                          <SelectItem value="installments">Parcelado</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="flex gap-2 pt-4">
                      <Button 
                        variant="outline" 
                        onClick={() => setShowRegistrationModal(false)}
                        className="flex-1"
                      >
                        Cancelar
                      </Button>
                      <Button 
                        onClick={handleRegistration}
                        className="flex-1"
                      >
                        Inscrever
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
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
              onUpdate={refetch}
              eventData={eventData ? {
                pixKeyType: eventData.pixKeyType,
                pixKey: eventData.pixKey,
                pixInstallments: eventData.pixInstallments ? 1 : 0
              } : undefined}
            />
          </TabsContent>

          <TabsContent value="managers" className="space-y-6">
            <GroupManagers groupId={groupId || ''} onUpdate={refetch} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
