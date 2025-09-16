import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import InstallmentManager from '../components/ui/installment-manager';
import { 
  ArrowLeft, 
  Search, 
  Users, 
  DollarSign, 
  Filter,
  CreditCard,
  CheckCircle,
  Clock,
  AlertCircle
} from 'lucide-react';

interface Registration {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  status: string;
  paymentStatus: string;
  totalAmount: string;
  amountPaid: string;
  remainingAmount: string;
  group?: {
    id: string;
    name: string;
  };
  createdAt: string;
}

interface EventGroup {
  id: string;
  name: string;
  description?: string;
  maxParticipants?: number;
  currentParticipants: number;
}

export default function GroupPayments() {
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<string>('all');
  const [selectedRegistration, setSelectedRegistration] = useState<string>('');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>('all');

  // Get URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  const eventId = urlParams.get('eventId') || '';

  // Buscar grupos do evento
  const { data: groups } = useQuery({
    queryKey: [`/api/events/${eventId}/groups`],
    enabled: !!eventId,
  });

  // Buscar inscrições do evento/grupo
  const { data: registrations, isLoading: registrationsLoading } = useQuery({
    queryKey: [`/api/events/${eventId}/registrations`, { groupId: selectedGroup, paymentStatus: paymentStatusFilter }],
    enabled: !!eventId,
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedGroup && selectedGroup !== 'all') params.append('groupId', selectedGroup);
      if (paymentStatusFilter && paymentStatusFilter !== 'all') params.append('paymentStatus', paymentStatusFilter);
      
      const response = await apiRequest('GET', `/api/events/${eventId}/registrations?${params.toString()}`);
      return Array.isArray(response) ? response : (response as any).data || [];
    },
  });

  const formatCurrency = (value: string | number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(parseFloat(value.toString()));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-100 text-green-800 border-green-200"><CheckCircle className="h-3 w-3 mr-1" />Pago</Badge>;
      case 'partial_paid':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200"><Clock className="h-3 w-3 mr-1" />Parcial</Badge>;
      case 'installment_plan':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200"><CreditCard className="h-3 w-3 mr-1" />Parcelado</Badge>;
      case 'pending':
        return <Badge className="bg-red-100 text-red-800 border-red-200"><AlertCircle className="h-3 w-3 mr-1" />Pendente</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getRegistrationStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Confirmado</Badge>;
      case 'pending_payment':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Aguardando Pagamento</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-800 border-red-200">Cancelado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Filtrar registrations baseado na busca
  const filteredRegistrations = registrations?.filter((reg: Registration) => {
    const matchesSearch = !searchTerm || 
      reg.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reg.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reg.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  }) || [];

  const groupsList = groups as EventGroup[] || [];
  const registrationsList = filteredRegistrations as Registration[];

  if (selectedRegistration) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="mb-6">
            <Button
              variant="ghost"
              onClick={() => setSelectedRegistration('')}
              className="mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar para Lista
            </Button>
            <h1 className="text-3xl font-bold text-gray-900">Gerenciar Pagamentos</h1>
          </div>
          
          <InstallmentManager 
            registrationId={selectedRegistration}
            eventId={eventId}
            groupId={selectedGroup}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => setLocation('/dashboard')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar ao Dashboard
          </Button>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Gerenciar Pagamentos
          </h1>
          <p className="text-gray-600">
            Gerencie pagamentos e parcelas dos participantes
          </p>
        </div>

        {/* Filtros */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Filter className="h-5 w-5 mr-2" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="search">Buscar Participante</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="search"
                    placeholder="Nome, sobrenome ou email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="group">Grupo</Label>
                <Select value={selectedGroup} onValueChange={setSelectedGroup}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os grupos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os grupos</SelectItem>
                    {groupsList.map((group) => (
                      <SelectItem key={group.id} value={group.id}>
                        {group.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="paymentStatus">Status do Pagamento</Label>
                <Select value={paymentStatusFilter} onValueChange={setPaymentStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os status</SelectItem>
                    <SelectItem value="pending">Pendente</SelectItem>
                    <SelectItem value="partial_paid">Parcial</SelectItem>
                    <SelectItem value="installment_plan">Parcelado</SelectItem>
                    <SelectItem value="paid">Pago</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedGroup('all');
                    setPaymentStatusFilter('all');
                  }}
                  className="w-full"
                >
                  Limpar Filtros
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Inscrições */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center">
                <Users className="h-5 w-5 mr-2" />
                Inscrições ({registrationsList.length})
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {registrationsLoading ? (
              <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : registrationsList.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Nenhuma inscrição encontrada</p>
              </div>
            ) : (
              <div className="space-y-4">
                {registrationsList.map((registration) => (
                  <div
                    key={registration.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex-1">
                      <div className="flex items-center space-x-4 mb-2">
                        <div>
                          <p className="font-semibold text-lg">
                            {registration.firstName} {registration.lastName}
                          </p>
                          <p className="text-sm text-gray-600">{registration.email}</p>
                        </div>
                        {registration.group && (
                          <Badge variant="outline">{registration.group.name}</Badge>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-6 text-sm text-gray-500">
                        <div className="flex items-center">
                          <DollarSign className="h-4 w-4 mr-1" />
                          <span>Total: {formatCurrency(registration.totalAmount)}</span>
                        </div>
                        <div className="flex items-center">
                          <CheckCircle className="h-4 w-4 mr-1" />
                          <span>Pago: {formatCurrency(registration.amountPaid)}</span>
                        </div>
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-1" />
                          <span>Restante: {formatCurrency(registration.remainingAmount)}</span>
                        </div>
                        <div>
                          <span>Inscrito em: {formatDate(registration.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                        {getRegistrationStatusBadge(registration.status)}
                        {getPaymentStatusBadge(registration.paymentStatus)}
                      </div>
                      <Button
                        size="sm"
                        onClick={() => setSelectedRegistration(registration.id)}
                        className="w-full sm:w-auto"
                      >
                        Gerenciar Pagamentos
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
