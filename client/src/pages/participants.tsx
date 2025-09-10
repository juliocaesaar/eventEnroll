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
  AlertCircle,
  MoreHorizontal,
  QrCode,
  DollarSign,
  Eye,
  Share2,
  MessageCircle,
  Calendar
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export default function Participants() {
  const { user } = useAuth();
  const params = useParams<{ eventId: string }>();
  const { toast } = useToast();
  
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [ticketFilter, setTicketFilter] = useState('all');
  const [selectedParticipant, setSelectedParticipant] = useState<any>(null);
  const [selectedInstallment, setSelectedInstallment] = useState<any>(null);
  const [showQRCode, setShowQRCode] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [showPaymentConfirmation, setShowPaymentConfirmation] = useState(false);
  const [installmentToConfirm, setInstallmentToConfirm] = useState<any>(null);

  // Fetch event details
  const { data: event } = useQuery({
    queryKey: [`/api/events/${params.eventId}`],
  });

  // Fetch registrations with installments
  const { data: registrations = [], refetch: refetchRegistrations } = useQuery({
    queryKey: [`/api/events/${params.eventId}/participants-with-installments`],
  }) as { data: any[], refetch: () => void };


  // Fetch tickets for filter
  const { data: tickets = [] } = useQuery({
    queryKey: [`/api/events/${params.eventId}/tickets`],
  }) as { data: any[] };

  // Export participants mutation
  const exportMutation = useMutation({
    mutationFn: async (format: 'csv' | 'pdf') => {
      return apiRequest('GET', `/api/events/${params.eventId}/export/${format}`);
    },
    onSuccess: async (response, format) => {
      // Create download link
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
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

  // Função para calcular progresso das parcelas
  const getInstallmentProgress = (installments: any[]) => {
    if (!installments || installments.length === 0) {
      return { paid: 0, pending: 0, overdue: 0, total: 0, percentage: 0 };
    }

    const now = new Date();
    const paid = installments.filter(i => i.status === 'paid').length;
    const overdue = installments.filter(i => i.status === 'overdue' || (i.status === 'pending' && new Date(i.dueDate) < now)).length;
    const pending = installments.length - paid - overdue;
    const percentage = Math.round((paid / installments.length) * 100);

    return { paid, pending, overdue, total: installments.length, percentage };
  };

  // Função para obter ícone do status da parcela
  const getInstallmentStatusIcon = (status: string) => {
    switch (status) {
      case 'paid': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'overdue': return <XCircle className="w-4 h-4 text-red-600" />;
      default: return <Clock className="w-4 h-4 text-yellow-600" />;
    }
  };

  // Função para calcular status da inscrição baseado nas parcelas
  const calculateRegistrationStatus = (participant: any) => {
    if (!participant.installments || participant.installments.length === 0) {
      return participant.paymentStatus; // Fallback para o status original
    }

    const progress = getInstallmentProgress(participant.installments);

    if (progress.percentage === 100) {
      return 'paid'; // Todas as parcelas pagas
    } else if (progress.overdue > 0) {
      return 'overdue'; // Tem parcelas em atraso
    } else if (progress.paid > 0) {
      return 'in_progress'; // Algumas parcelas pagas - em processo
    } else {
      return 'pending'; // Nenhuma parcela paga - pendente
    }
  };

  // Função para calcular valores reais baseados nas parcelas
  const calculatePaymentAmounts = (participant: any) => {
    if (!participant.installments || participant.installments.length === 0) {
      return {
        amountPaid: Number(participant.amountPaid || 0),
        totalAmount: Number(participant.totalAmount || 0)
      };
    }

    const totalAmount = participant.installments.reduce((sum: number, installment: any) => 
      sum + Number(installment.amount || 0), 0
    );
    
    const amountPaid = participant.installments
      .filter((installment: any) => installment.status === 'paid')
      .reduce((sum: number, installment: any) => 
        sum + Number(installment.amount || 0), 0
      );

    return { amountPaid, totalAmount };
  };

  // Função para obter a data do último pagamento
  const getLastPaymentDate = (participant: any) => {
    if (!participant.installments || participant.installments.length === 0) {
      return null;
    }

    const paidInstallments = participant.installments
      .filter((installment: any) => installment.status === 'paid' && installment.paidDate)
      .sort((a: any, b: any) => new Date(b.paidDate).getTime() - new Date(a.paidDate).getTime());

    return paidInstallments.length > 0 ? paidInstallments[0].paidDate : null;
  };

  // Função para encontrar a próxima parcela a ser paga
  const getNextInstallmentToPay = (installments: any[]) => {
    if (!installments || installments.length === 0) return null;
    
    // Ordenar por número da parcela
    const sortedInstallments = [...installments].sort((a, b) => a.installmentNumber - b.installmentNumber);
    
    // Encontrar a primeira parcela não paga
    return sortedInstallments.find(installment => installment.status !== 'paid') || null;
  };

  // Função para abrir modal de confirmação de pagamento
  const openPaymentConfirmation = (installment: any) => {
    setInstallmentToConfirm(installment);
    setShowPaymentConfirmation(true);
  };

  // Função para marcar parcela como paga
  const markInstallmentAsPaid = async () => {
    if (!installmentToConfirm) return;
    
    try {
      console.log('🔍 Debug - Tentando marcar parcela como paga:', installmentToConfirm.id);
      console.log('🔍 Debug - Token no localStorage:', localStorage.getItem('eventflow_token') ? 'Presente' : 'Ausente');
      
      const response = await apiRequest('PUT', `/api/installments/${installmentToConfirm.id}/mark-as-paid`);
      const result = await response.json();
      
      toast({
        title: 'Parcela marcada como paga',
        description: result.message || 'A parcela foi confirmada como paga com sucesso.',
      });
      
      // Fechar modal primeiro
      setShowPaymentConfirmation(false);
      setInstallmentToConfirm(null);
      
      // Recarregar a página para atualizar todos os valores
      setTimeout(() => {
        window.location.reload();
      }, 1000); // Aguarda 1 segundo para o toast aparecer
      
    } catch (error) {
      console.error('Erro ao marcar parcela como paga:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível marcar a parcela como paga.',
        variant: 'destructive',
      });
    }
  };

  // Função para calcular CRC16-CCITT padrão PIX
  const crc16 = (str: string): string => {
    function charCodeAt(str: string, i: number): number {
      return str.charCodeAt(i);
    }
    
    let crc = 0xFFFF;
    let j: number, i: number;
    
    for (i = 0; i < str.length; i++) {
      crc = crc ^ (charCodeAt(str, i) << 8);
      for (j = 0; j < 8; j++) {
        if ((crc & 0x8000) !== 0) {
          crc = (crc << 1) ^ 0x1021;
        } else {
          crc = crc << 1;
        }
      }
    }
    
    return (crc & 0xFFFF).toString(16).toUpperCase().padStart(4, '0');
  };

  // Função para formatar campos EMV QR Code
  const formatField = (id: string, value: string): string => {
    const length = value.length.toString().padStart(2, '0');
    return id + length + value;
  };

  // Função principal para gerar PIX
  const gerarPixCopiaECola = (dados: {
    pixKey: string;
    merchantName: string;
    merchantCity: string;
    amount: number;
    txId: string;
    description?: string;
  }): string => {
    const {
      pixKey,
      merchantName,
      merchantCity, 
      amount,
      txId,
      description
    } = dados;
    
    let payload = '';
    
    // 00 - Payload Format Indicator
    payload += formatField('00', '01');
    
    // 01 - Point of Initiation Method
    payload += formatField('01', '12');
    
    // 26 - PIX
    let pix = '';
    pix += formatField('00', 'br.gov.bcb.pix');
    pix += formatField('01', pixKey);
    if (description) {
      pix += formatField('02', description);
    }
    payload += formatField('26', pix);
    
    // 52 - Merchant Category Code
    payload += formatField('52', '0000');
    
    // 53 - Transaction Currency (986 = BRL)
    payload += formatField('53', '986');
    
    // 54 - Transaction Amount (opcional)
    if (amount && amount > 0) {
      payload += formatField('54', amount.toFixed(2));
    }
    
    // 58 - Country Code
    payload += formatField('58', 'BR');
    
    // 59 - Merchant Name
    payload += formatField('59', merchantName);
    
    // 60 - Merchant City  
    payload += formatField('60', merchantCity);
    
    // 62 - Additional Data Field Template
    if (txId) {
      let additionalData = '';
      additionalData += formatField('05', txId); // Reference Label
      payload += formatField('62', additionalData);
    }
    
    // 63 - CRC16
    payload += '6304';
    const crc = crc16(payload);
    payload += crc;
    
    return payload;
  };

  // Função para gerar PIX copia e cola válido
  const generatePixCopyPaste = (installment: any, participant: any) => {
    const amount = Number(installment.amount || 0);
    const installmentNumber = installment.installmentNumber || 1;
    
    // Obter dados do evento ou usar valores padrão
    const pixKeyType = (event as any)?.pixKeyType || 'cpf';
    const pixKey = (event as any)?.pixKey || '16089577839';
    const merchantName = (event as any)?.title || 'Evento';
    const merchantCity = 'Brasilia'; // Cidade padrão
    
    // Formatar chave PIX baseada no tipo
    let formattedPixKey = pixKey;
    if (pixKeyType === 'cpf' || pixKeyType === 'cnpj') {
      formattedPixKey = pixKey.replace(/\D/g, '');
    } else if (pixKeyType === 'phone') {
      formattedPixKey = pixKey.replace(/\D/g, '');
    }
    
    // Criar identificador da parcela
    const pixIdentifier = `ParcelamentoPix${installmentNumber.toString().padStart(2, '0')}`;
    
    // Dados para o PIX
    const dadosPIX = {
      pixKey: formattedPixKey,
      merchantName: merchantName,
      merchantCity: merchantCity,
      amount: amount,
      txId: pixIdentifier,
      description: `${merchantName} - Parcela ${installmentNumber} de ${(event as any)?.pixInstallments || 12}`
    };
    
    const pixCode = gerarPixCopiaECola(dadosPIX);
    
    return {
      pixCode,
      pixIdentifier,
      amount: amount.toFixed(2),
      pixKeyType,
      pixKey: formattedPixKey,
      merchantName: merchantName,
      merchantCity: merchantCity
    };
  };

  // Função para gerar QR code da parcela
  const generateInstallmentQRCode = async (installment: any, participant: any) => {
    try {
      const QRCode = (await import('qrcode')).default;
      
      // Gerar PIX copia e cola
      const pixData = generatePixCopyPaste(installment, participant);
      
      // Gerar QR code com o PIX copia e cola
      const qrCodeDataUrl = await QRCode.toDataURL(pixData.pixCode, {
        width: 200,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      
      setQrCodeDataUrl(qrCodeDataUrl);
      setSelectedInstallment({ 
        ...installment, 
        pixCode: pixData.pixCode,
        pixIdentifier: pixData.pixIdentifier,
        amount: pixData.amount
      });
      setShowQRCode(true);
    } catch (error) {
      console.error('Erro ao gerar QR code:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível gerar o QR code da parcela.',
        variant: 'destructive',
      });
    }
  };

  // Função para compartilhar parcela via WhatsApp
  const shareInstallmentViaWhatsApp = (installment: any, participant: any) => {
    const pixData = generatePixCopyPaste(installment, participant);
    const message = `💰 *PIX - Parcela ${installment.installmentNumber}*\n\n` +
                   `👤 Participante: ${participant.firstName} ${participant.lastName}\n` +
                   `💰 Valor: R$ ${pixData.amount}\n` +
                   `📅 Vencimento: ${new Date(installment.dueDate).toLocaleDateString('pt-BR')}\n` +
                   `🔑 Identificador: ${pixData.pixIdentifier}\n\n` +
                   `📋 *PIX Copia e Cola:*\n` +
                   `${pixData.pixCode}\n\n` +
                   `💡 *Instruções:*\n` +
                   `1. Copie o código PIX acima\n` +
                   `2. Cole no seu app de pagamento\n` +
                   `3. Confirme o valor e identifique a parcela\n` +
                   `4. Realize o pagamento`;
    
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const getPaymentBadge = (status: string) => {
    const paymentConfig = {
      pending: { label: 'Pendente', variant: 'outline' as const },
      in_progress: { label: 'Em Processo', variant: 'outline' as const },
      partial: { label: 'Parcial', variant: 'outline' as const },
      paid: { label: 'Pago', variant: 'default' as const },
      overdue: { label: 'Em Atraso', variant: 'destructive' as const }
    };
    
    const config = paymentConfig[status as keyof typeof paymentConfig] || paymentConfig.pending;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      confirmed: { variant: "default" as const, icon: CheckCircle, text: "Confirmado", color: "text-green-600" },
      pending_payment: { variant: "secondary" as const, icon: Clock, text: "Pagamento Pendente", color: "text-yellow-600" },
      cancelled: { variant: "destructive" as const, icon: XCircle, text: "Cancelado", color: "text-red-600" },
      checked_in: { variant: "default" as const, icon: CheckCircle, text: "Check-in Realizado", color: "text-blue-600" },
      pending: { variant: "secondary" as const, icon: Clock, text: "Pendente", color: "text-yellow-600" },
      in_progress: { variant: "outline" as const, icon: Clock, text: "Em Processo", color: "text-blue-600" },
      paid: { variant: "default" as const, icon: CheckCircle, text: "Pago", color: "text-green-600" },
      overdue: { variant: "destructive" as const, icon: XCircle, text: "Em Atraso", color: "text-red-600" },
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
    // Filtrar apenas participantes SEM grupo (groupId é null ou undefined)
    if (registration.groupId) {
      return false;
    }
    
    const name = registration.firstName || registration.attendeeName || '';
    const email = registration.email || registration.attendeeEmail || '';
    const qrCode = registration.qrCode || '';
    
    const matchesSearch = 
      name.toLowerCase().includes(search.toLowerCase()) ||
      email.toLowerCase().includes(search.toLowerCase()) ||
      qrCode.toLowerCase().includes(search.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || registration.status === statusFilter;
    const matchesTicket = ticketFilter === 'all' || registration.ticketId === ticketFilter;
    
    return matchesSearch && matchesStatus && matchesTicket;
  });

  // Filtrar apenas participantes sem grupo para as estatísticas
  const participantsWithoutGroups = registrations.filter((r: any) => !r.groupId);
  
  const stats = {
    total: participantsWithoutGroups.length,
    confirmed: participantsWithoutGroups.filter((r: any) => calculateRegistrationStatus(r) === 'paid').length,
    pending: participantsWithoutGroups.filter((r: any) => calculateRegistrationStatus(r) === 'pending').length,
    inProgress: participantsWithoutGroups.filter((r: any) => calculateRegistrationStatus(r) === 'in_progress').length,
    overdue: participantsWithoutGroups.filter((r: any) => calculateRegistrationStatus(r) === 'overdue').length,
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
                Participantes Sem Grupo
              </h1>
              <p className="text-gray-600 mt-1">
                {(event as any)?.title || 'Evento'} - {stats.total} inscrições sem grupo
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
                  <p className="text-sm font-medium text-gray-600">Pagamentos Completos</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.confirmed}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Clock className="w-8 h-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Em Processo</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.inProgress}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <AlertCircle className="w-8 h-8 text-red-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Pendentes</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
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

        {/* Participants Cards */}
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
              <div className="grid gap-4">
                {filteredRegistrations.map((participant: any) => (
                  <Card key={participant.id} className="p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      {/* Informações do Participante */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-gray-900 truncate">
                              {participant.firstName || participant.attendeeName} {participant.lastName}
                            </h3>
                            <p className="text-sm text-gray-600 truncate">{participant.email || participant.attendeeEmail}</p>
                            {(participant.phoneNumber || participant.attendeePhone) && (
                              <p className="text-sm text-gray-500 truncate">{participant.phoneNumber || participant.attendeePhone}</p>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-500">Status:</span>
                            {getStatusBadge(participant.status)}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-500">Pagamento:</span>
                            {getPaymentBadge(calculateRegistrationStatus(participant))}
                          </div>
                          <div className="flex items-center gap-2">
                            <DollarSign className="w-3 h-3 text-gray-500" />
                            <span className="text-sm">
                              R$ {calculatePaymentAmounts(participant).amountPaid.toFixed(2)} / R$ {calculatePaymentAmounts(participant).totalAmount.toFixed(2)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-3 h-3 text-gray-500" />
                            <span className="text-sm text-gray-600">
                              {new Date(participant.createdAt).toLocaleDateString('pt-BR')}
                            </span>
                          </div>
                          {getLastPaymentDate(participant) && (
                            <div className="flex items-center gap-2">
                              <CheckCircle className="w-3 h-3 text-green-500" />
                              <span className="text-sm text-green-600">
                                Último pagamento: {new Date(getLastPaymentDate(participant)!).toLocaleDateString('pt-BR')}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Ações */}
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedParticipant(participant)}
                            className="flex items-center gap-1"
                          >
                            <Eye className="w-4 h-4" />
                            Detalhes
                          </Button>
                        </div>
                        {participant.installments && participant.installments.length > 0 && (
                          <div className="flex items-center gap-1 text-xs text-gray-500 justify-center sm:justify-start">
                            <Clock className="w-3 h-3" />
                            <span>Status automático</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Modal de Detalhes do Participante */}
        <Dialog open={!!selectedParticipant} onOpenChange={() => setSelectedParticipant(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                Detalhes do Participante - {selectedParticipant?.firstName} {selectedParticipant?.lastName}
              </DialogTitle>
            </DialogHeader>
            
            {selectedParticipant && (
              <div className="space-y-6">
                {/* Informações Básicas */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Informações Pessoais</h4>
                    <div className="space-y-1 text-sm">
                      <p><span className="font-medium">Nome:</span> {selectedParticipant.firstName} {selectedParticipant.lastName}</p>
                      <p><span className="font-medium">Email:</span> {selectedParticipant.email}</p>
                      {selectedParticipant.phoneNumber && (
                        <p><span className="font-medium">Telefone:</span> {selectedParticipant.phoneNumber}</p>
                      )}
                      <p><span className="font-medium">QR Code:</span> <code className="bg-gray-100 px-2 py-1 rounded text-xs">{selectedParticipant.qrCode}</code></p>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Informações de Pagamento</h4>
                    <div className="space-y-1 text-sm">
                      <p><span className="font-medium">Status:</span> {getStatusBadge(calculateRegistrationStatus(selectedParticipant))}</p>
                      <p><span className="font-medium">Valor Pago:</span> R$ {Number(selectedParticipant.amountPaid || 0).toFixed(2)}</p>
                      <p><span className="font-medium">Valor Total:</span> R$ {Number(selectedParticipant.totalAmount || 0).toFixed(2)}</p>
                      <p><span className="font-medium">Data Inscrição:</span> {new Date(selectedParticipant.createdAt).toLocaleDateString('pt-BR')}</p>
                    </div>
                  </div>
                </div>

                {/* Plano de Pagamento PIX */}
                {selectedParticipant.installments && selectedParticipant.installments.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-4">Plano de Pagamento PIX</h4>
                    
                    {/* Resumo do Progresso */}
                    <div className="bg-gray-50 rounded-lg p-4 mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">Progresso do Pagamento</span>
                        <span className="text-sm text-gray-600">
                          {(() => {
                            const progress = getInstallmentProgress(selectedParticipant.installments);
                            return `${progress.paid}/${progress.total} parcelas pagas (${progress.percentage}%)`;
                          })()}
                        </span>
                      </div>
                      
                      <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                        <div 
                          className="bg-green-600 h-2 rounded-full transition-all duration-300"
                          style={{ 
                            width: `${(() => {
                              const progress = getInstallmentProgress(selectedParticipant.installments);
                              return progress.percentage;
                            })()}%` 
                          }}
                        ></div>
                      </div>
                      
                      <div className="flex justify-between text-xs text-gray-600">
                        <span>Pendente: {(() => {
                          const progress = getInstallmentProgress(selectedParticipant.installments);
                          return progress.pending;
                        })()}</span>
                        <span>Pago: {(() => {
                          const progress = getInstallmentProgress(selectedParticipant.installments);
                          return progress.paid;
                        })()}</span>
                        <span>Em Atraso: {(() => {
                          const progress = getInstallmentProgress(selectedParticipant.installments);
                          return progress.overdue;
                        })()}</span>
                      </div>
                    </div>

                    {/* Lista de Parcelas */}
                    <div className="space-y-3">
                      <h5 className="font-medium text-gray-800">Parcelas Detalhadas</h5>
                      {selectedParticipant.installments.map((installment: any, index: number) => {
                        const nextInstallment = getNextInstallmentToPay(selectedParticipant.installments);
                        const isNextToPay = nextInstallment && nextInstallment.id === installment.id;
                        const isPaid = installment.status === 'paid';
                        
                        return (
                          <div 
                            key={installment.id} 
                            className={`border rounded-lg p-3 ${
                              isPaid ? 'bg-green-50 border-green-200' :
                              isNextToPay ? 'bg-blue-50 border-blue-200' :
                              'bg-gray-50 border-gray-200'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                {getInstallmentStatusIcon(installment.status)}
                                <span className="font-medium">Parcela {installment.installmentNumber}</span>
                                {isPaid && installment.paidDate && (
                                  <span className="text-xs text-green-600">
                                    (Pago em {new Date(installment.paidDate).toLocaleDateString('pt-BR')})
                                  </span>
                                )}
                              </div>
                              <div className="text-right">
                                <p className="font-medium">R$ {Number(installment.amount || 0).toFixed(2)}</p>
                                <p className="text-xs text-gray-600">
                                  Vence: {new Date(installment.dueDate).toLocaleDateString('pt-BR')}
                                </p>
                                <Badge 
                                  variant={
                                    isPaid ? 'default' :
                                    installment.status === 'overdue' ? 'destructive' : 
                                    isNextToPay ? 'default' : 'outline'
                                  }
                                  className="text-xs mt-1"
                                >
                                  {isPaid ? 'Paga' :
                                   installment.status === 'overdue' ? 'Em Atraso' : 
                                   isNextToPay ? 'Próxima a Pagar' : 'Aguardando'}
                                </Badge>
                              </div>
                            </div>
                            
                            {/* Botões de Ação - apenas para a próxima parcela a ser paga */}
                            {isNextToPay && !isPaid && (
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => shareInstallmentViaWhatsApp(installment, selectedParticipant)}
                                  className="flex items-center gap-1"
                                >
                                  <MessageCircle className="w-4 h-4" />
                                  Compartilhar
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => generateInstallmentQRCode(installment, selectedParticipant)}
                                  className="flex items-center gap-1"
                                >
                                  <QrCode className="w-4 h-4" />
                                  QR Code
                                </Button>
                                <Button
                                  variant="default"
                                  size="sm"
                                  onClick={() => openPaymentConfirmation(installment)}
                                  className="flex items-center gap-1"
                                >
                                  <CheckCircle className="w-4 h-4" />
                                  Marcar como Pago
                                </Button>
                              </div>
                            )}
                          
                          {/* PIX Copia e Cola */}
                          <div className="mt-3 p-2 bg-gray-100 rounded text-xs">
                            <p className="font-medium text-gray-700 mb-1">PIX Copia e Cola:</p>
                            <div className="bg-white p-2 rounded border font-mono text-xs break-all">
                              {(() => {
                                const pixData = generatePixCopyPaste(installment, selectedParticipant);
                                return pixData.pixCode;
                              })()}
                            </div>
                            <p className="text-gray-500 mt-1">
                              Identificador: {(() => {
                                const pixData = generatePixCopyPaste(installment, selectedParticipant);
                                return pixData.pixIdentifier;
                              })()}
                            </p>
                          </div>
                        </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Explicação do Status */}
                <div className="bg-blue-50 rounded-lg p-4">
                  <h5 className="font-medium text-blue-900 mb-2">Como funciona o status de pagamento:</h5>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• <strong>Pendente:</strong> Nenhuma parcela foi paga ainda</li>
                    <li>• <strong>Em Processo:</strong> Algumas parcelas foram pagas, mas não todas</li>
                    <li>• <strong>Pago:</strong> Todas as parcelas foram pagas</li>
                    <li>• <strong>Em Atraso:</strong> Existem parcelas em atraso</li>
                  </ul>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Modal do QR Code */}
        <Dialog open={showQRCode} onOpenChange={setShowQRCode}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>QR Code da Parcela</DialogTitle>
            </DialogHeader>
            
            {selectedInstallment && (
              <div className="space-y-4">
                {/* QR Code */}
                <div className="flex justify-center">
                  {qrCodeDataUrl && (
                    <img 
                      src={qrCodeDataUrl} 
                      alt="QR Code da Parcela" 
                      className="w-48 h-48 mx-auto"
                    />
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-2 text-center">
                  Escaneie o QR code para pagar a parcela via PIX
                </p>
                
                {/* PIX Copia e Cola */}
                <div className="bg-blue-50 rounded-lg p-3">
                  <p className="text-sm font-medium text-blue-800 mb-1">PIX Copia e Cola:</p>
                  <div className="bg-white p-2 rounded border font-mono text-xs break-all">
                    {selectedInstallment.pixCode}
                  </div>
                  <p className="text-xs text-blue-600 mt-2">
                    Identificador: {selectedInstallment.pixIdentifier}
                  </p>
                </div>
                
                {/* Botões de Ação */}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => shareInstallmentViaWhatsApp(selectedInstallment, selectedParticipant)}
                    className="flex-1"
                  >
                    <MessageCircle className="w-4 h-4 mr-1" />
                    Compartilhar via WhatsApp
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      navigator.clipboard.writeText(selectedInstallment.pixCode);
                      toast({
                        title: 'Copiado!',
                        description: 'PIX copia e cola copiado para a área de transferência.',
                      });
                    }}
                    className="flex-1"
                  >
                    <Share2 className="w-4 h-4 mr-1" />
                    Copiar PIX
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Modal de Confirmação de Pagamento */}
        <Dialog open={showPaymentConfirmation} onOpenChange={setShowPaymentConfirmation}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Confirmar Pagamento</DialogTitle>
            </DialogHeader>
            
            {installmentToConfirm && (
              <div className="space-y-4">
                <div className="bg-blue-50 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 mb-2">Detalhes da Parcela</h4>
                  <div className="space-y-1 text-sm text-blue-800">
                    <p><strong>Parcela:</strong> {installmentToConfirm.installmentNumber}</p>
                    <p><strong>Valor:</strong> R$ {Number(installmentToConfirm.amount || 0).toFixed(2)}</p>
                    <p><strong>Vencimento:</strong> {new Date(installmentToConfirm.dueDate).toLocaleDateString('pt-BR')}</p>
                  </div>
                </div>
                
                <div className="bg-yellow-50 rounded-lg p-4">
                  <h4 className="font-medium text-yellow-900 mb-2">⚠️ Confirmação Necessária</h4>
                  <p className="text-sm text-yellow-800">
                    Você recebeu o comprovante de pagamento desta parcela do participante? 
                    Confirme apenas após verificar o comprovante.
                  </p>
                </div>
                
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowPaymentConfirmation(false)}
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                  <Button
                    variant="default"
                    onClick={markInstallmentAsPaid}
                    className="flex-1"
                  >
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Confirmar Pagamento
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}