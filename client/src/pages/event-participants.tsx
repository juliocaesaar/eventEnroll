import React, { useState } from 'react';
import { useParams } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { useEventGroups } from '../hooks/useEventGroups';
import { PaymentInstallments } from '../components/ui/payment-installments';
import { Search, Filter, Download, Eye, DollarSign } from 'lucide-react';

interface Participant {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  groupId?: string;
  groupName?: string;
  paymentStatus: string;
  totalAmount: string;
  paidAmount: string;
  remainingAmount: string;
  createdAt: string;
}

export default function EventParticipants() {
  const params = useParams();
  const eventId = params.eventId;
  const { groups } = useEventGroups(eventId);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<string>('all');
  const [selectedParticipant, setSelectedParticipant] = useState<Participant | null>(null);
  const [showPaymentDetails, setShowPaymentDetails] = useState(false);

  // Mock data - em produção viria da API
  const mockParticipants: Participant[] = [
    {
      id: '1',
      firstName: 'João',
      lastName: 'Silva',
      email: 'joao@email.com',
      groupId: 'group1',
      groupName: 'Desenvolvedores',
      paymentStatus: 'partial',
      totalAmount: '299.90',
      paidAmount: '100.00',
      remainingAmount: '199.90',
      createdAt: '2024-01-15T10:00:00Z',
    },
    {
      id: '2',
      firstName: 'Maria',
      lastName: 'Santos',
      email: 'maria@email.com',
      groupId: 'group2',
      groupName: 'Designers',
      paymentStatus: 'paid',
      totalAmount: '299.90',
      paidAmount: '299.90',
      remainingAmount: '0.00',
      createdAt: '2024-01-16T14:30:00Z',
    },
    {
      id: '3',
      firstName: 'Pedro',
      lastName: 'Costa',
      email: 'pedro@email.com',
      groupId: 'group1',
      groupName: 'Desenvolvedores',
      paymentStatus: 'overdue',
      totalAmount: '299.90',
      paidAmount: '100.00',
      remainingAmount: '199.90',
      createdAt: '2024-01-17T09:15:00Z',
    },
  ];

  const filteredParticipants = mockParticipants.filter((participant) => {
    const matchesSearch = 
      participant.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      participant.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      participant.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesGroup = selectedGroup === 'all' || participant.groupId === selectedGroup;
    
    return matchesSearch && matchesGroup;
  });

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'partial':
        return 'bg-yellow-100 text-yellow-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentStatusText = (status: string) => {
    switch (status) {
      case 'paid':
        return 'Pago';
      case 'partial':
        return 'Parcial';
      case 'overdue':
        return 'Em Atraso';
      case 'pending':
        return 'Pendente';
      default:
        return status;
    }
  };

  const formatCurrency = (value: string) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(parseFloat(value));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  if (!eventId) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6">
            <p className="text-red-600">ID do evento não encontrado</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Participantes
        </h1>
        <p className="text-gray-600">
          Gerencie os participantes e seus pagamentos.
        </p>
      </div>

      {/* Filtros e Busca */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Buscar por nome ou email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="md:w-64">
              <select
                value={selectedGroup}
                onChange={(e) => setSelectedGroup(e.target.value)}
                className="w-full border rounded-lg px-3 py-2"
              >
                <option value="all">Todos os Grupos</option>
                {groups?.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.name}
                  </option>
                ))}
              </select>
            </div>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold text-blue-600">
              {filteredParticipants.length}
            </div>
            <div className="text-sm text-gray-500">Total de Participantes</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold text-green-600">
              {filteredParticipants.filter(p => p.paymentStatus === 'paid').length}
            </div>
            <div className="text-sm text-gray-500">Pagamentos Completos</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold text-yellow-600">
              {filteredParticipants.filter(p => p.paymentStatus === 'partial').length}
            </div>
            <div className="text-sm text-gray-500">Pagamentos Parciais</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold text-red-600">
              {filteredParticipants.filter(p => p.paymentStatus === 'overdue').length}
            </div>
            <div className="text-sm text-gray-500">Em Atraso</div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Participantes */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Participantes</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredParticipants.length > 0 ? (
            <div className="space-y-4">
              {filteredParticipants.map((participant) => (
                <div
                  key={participant.id}
                  className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <div>
                          <h3 className="font-semibold text-lg">
                            {participant.firstName} {participant.lastName}
                          </h3>
                          <p className="text-gray-500">{participant.email}</p>
                        </div>
                        {participant.groupName && (
                          <Badge variant="outline">{participant.groupName}</Badge>
                        )}
                        <Badge className={getPaymentStatusColor(participant.paymentStatus)}>
                          {getPaymentStatusText(participant.paymentStatus)}
                        </Badge>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-500">Total</div>
                      <div className="font-semibold">{formatCurrency(participant.totalAmount)}</div>
                      <div className="text-sm text-gray-500">
                        Pago: {formatCurrency(participant.paidAmount)}
                      </div>
                      <div className="text-sm text-gray-500">
                        Restante: {formatCurrency(participant.remainingAmount)}
                      </div>
                    </div>
                    <div className="ml-4">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedParticipant(participant)}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Ver Parcelas
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl">
                          <DialogHeader>
                            <DialogTitle>
                              Parcelas - {participant.firstName} {participant.lastName}
                            </DialogTitle>
                          </DialogHeader>
                          <PaymentInstallments registrationId={participant.id} />
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                  <div className="mt-3 text-sm text-gray-500">
                    Inscrito em {formatDate(participant.createdAt)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Nenhum participante encontrado</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
