import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  Users, 
  Download, 
  Mail, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Search,
  Filter,
  MoreHorizontal,
  QrCode
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function Participants() {
  const { user } = useAuth();
  const params = useParams<{ eventId: string }>();
  const { toast } = useToast();
  
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [ticketFilter, setTicketFilter] = useState('all');

  // Fetch event details
  const { data: event } = useQuery({
    queryKey: [`/api/events/${params.eventId}`],
  });

  // Fetch registrations
  const { data: registrations = [], refetch: refetchRegistrations } = useQuery({
    queryKey: [`/api/events/${params.eventId}/registrations`],
  });

  // Fetch tickets for filter
  const { data: tickets = [] } = useQuery({
    queryKey: [`/api/events/${params.eventId}/tickets`],
  });

  // Export participants mutation
  const exportMutation = useMutation({
    mutationFn: async (format: 'csv' | 'pdf') => {
      return apiRequest('GET', `/api/events/${params.eventId}/export/${format}`);
    },
    onSuccess: (response, format) => {
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `participants.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast({
        title: "Exportação concluída",
        description: `Lista de participantes exportada em ${format.toUpperCase()}.`,
      });
    },
    onError: (error) => {
      toast({
        title: "Erro na exportação",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Send reminder email mutation
  const reminderMutation = useMutation({
    mutationFn: async (registrationId: string) => {
      return apiRequest('POST', `/api/registrations/${registrationId}/remind`);
    },
    onSuccess: () => {
      toast({
        title: "Lembrete enviado",
        description: "Email de lembrete enviado com sucesso!",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao enviar lembrete",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Check-in mutation
  const checkinMutation = useMutation({
    mutationFn: async (registrationId: string) => {
      return apiRequest('POST', `/api/registrations/${registrationId}/checkin`);
    },
    onSuccess: () => {
      toast({
        title: "Check-in realizado",
        description: "Participante confirmado com sucesso!",
      });
      refetchRegistrations();
    },
    onError: (error) => {
      toast({
        title: "Erro no check-in",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      confirmed: { variant: "default" as const, icon: CheckCircle, text: "Confirmado", color: "text-green-600" },
      pending_payment: { variant: "secondary" as const, icon: Clock, text: "Pagamento Pendente", color: "text-yellow-600" },
      cancelled: { variant: "destructive" as const, icon: XCircle, text: "Cancelado", color: "text-red-600" },
      checked_in: { variant: "default" as const, icon: CheckCircle, text: "Check-in Realizado", color: "text-blue-600" },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.confirmed;
    const Icon = config.icon;
    
    return (
      <Badge variant={config.variant} className="flex items-center space-x-1">
        <Icon className="w-3 h-3" />
        <span>{config.text}</span>
      </Badge>
    );
  };

  const filteredRegistrations = registrations.filter((registration: any) => {
    const matchesSearch = 
      registration.attendeeName?.toLowerCase().includes(search.toLowerCase()) ||
      registration.attendeeEmail?.toLowerCase().includes(search.toLowerCase()) ||
      registration.qrCode?.toLowerCase().includes(search.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || registration.status === statusFilter;
    const matchesTicket = ticketFilter === 'all' || registration.ticketId === ticketFilter;
    
    return matchesSearch && matchesStatus && matchesTicket;
  });

  const stats = {
    total: registrations.length,
    confirmed: registrations.filter((r: any) => r.status === 'confirmed').length,
    pending: registrations.filter((r: any) => r.status === 'pending_payment').length,
    checkedIn: registrations.filter((r: any) => r.status === 'checked_in').length,
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p>Carregando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900" data-testid="text-participants-title">
                Participantes
              </h1>
              <p className="text-gray-600 mt-1">
                {event?.title} - {stats.total} inscrições
              </p>
            </div>
            
            <div className="flex items-center space-x-3">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" data-testid="button-export">
                    <Download className="w-4 h-4 mr-2" />
                    Exportar
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => exportMutation.mutate('csv')}>
                    Exportar CSV
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => exportMutation.mutate('pdf')}>
                    Exportar PDF
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Users className="w-8 h-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <CheckCircle className="w-8 h-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Confirmados</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.confirmed}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Clock className="w-8 h-8 text-yellow-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Pendentes</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <QrCode className="w-8 h-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Check-in</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.checkedIn}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Buscar por nome, email ou código QR..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10"
                    data-testid="input-search-participants"
                  />
                </div>
              </div>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Status</SelectItem>
                  <SelectItem value="confirmed">Confirmado</SelectItem>
                  <SelectItem value="pending_payment">Pagamento Pendente</SelectItem>
                  <SelectItem value="checked_in">Check-in Realizado</SelectItem>
                  <SelectItem value="cancelled">Cancelado</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={ticketFilter} onValueChange={setTicketFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Tipo de Ingresso" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Ingressos</SelectItem>
                  {tickets.map((ticket: any) => (
                    <SelectItem key={ticket.id} value={ticket.id}>
                      {ticket.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Participants Table */}
        <Card>
          <CardHeader>
            <CardTitle>Lista de Participantes ({filteredRegistrations.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredRegistrations.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {registrations.length === 0 ? 'Nenhuma inscrição ainda' : 'Nenhum resultado encontrado'}
                </h3>
                <p className="text-gray-600">
                  {registrations.length === 0 
                    ? 'Quando alguém se inscrever no seu evento, aparecerá aqui.'
                    : 'Tente ajustar os filtros para encontrar o que procura.'
                  }
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Participante</TableHead>
                    <TableHead>Ingresso</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>QR Code</TableHead>
                    <TableHead>Data Inscrição</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRegistrations.map((registration: any) => (
                    <TableRow key={registration.id} data-testid={`row-participant-${registration.id}`}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{registration.attendeeName}</div>
                          <div className="text-sm text-gray-600">{registration.attendeeEmail}</div>
                          {registration.attendeePhone && (
                            <div className="text-sm text-gray-600">{registration.attendeePhone}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{registration.ticket?.name}</div>
                          <div className="text-sm text-gray-600">
                            R$ {parseFloat(registration.amount || 0).toFixed(2)}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(registration.status)}
                      </TableCell>
                      <TableCell>
                        <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                          {registration.qrCode}
                        </code>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {new Date(registration.createdAt).toLocaleDateString('pt-BR')}
                        </div>
                        <div className="text-xs text-gray-600">
                          {new Date(registration.createdAt).toLocaleTimeString('pt-BR')}
                        </div>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            {registration.status === 'confirmed' && (
                              <DropdownMenuItem 
                                onClick={() => checkinMutation.mutate(registration.id)}
                              >
                                <QrCode className="w-4 h-4 mr-2" />
                                Fazer Check-in
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem 
                              onClick={() => reminderMutation.mutate(registration.id)}
                            >
                              <Mail className="w-4 h-4 mr-2" />
                              Enviar Lembrete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}