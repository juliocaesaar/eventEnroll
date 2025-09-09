import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Search, Users, Mail, Phone, Calendar, DollarSign, Filter, Download, UserCheck, UserX, Clock, CheckCircle, AlertCircle, Eye, Share2, QrCode, MessageCircle } from 'lucide-react';

interface Participant {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  amountPaid: number;
  totalAmount: number;
  registrationDate: string;
  paymentStatus: 'pending' | 'partial' | 'paid' | 'overdue';
  installments?: {
    id: string;
    amount: number;
    dueDate: string;
    status: 'pending' | 'paid' | 'overdue';
  }[];
}

interface GroupParticipantsProps {
  groupId: string;
  onUpdate?: () => void;
  eventData?: {
    pixKeyType?: string;
    pixKey?: string;
    pixInstallments?: number;
  };
}

export default function GroupParticipants({ groupId, onUpdate, eventData }: GroupParticipantsProps) {
  const [, setLocation] = useLocation();
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [filteredParticipants, setFilteredParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');
  const [selectedParticipant, setSelectedParticipant] = useState<Participant | null>(null);
  const [selectedInstallment, setSelectedInstallment] = useState<any>(null);
  const [showQRCode, setShowQRCode] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [showPaymentConfirmation, setShowPaymentConfirmation] = useState(false);
  const [installmentToConfirm, setInstallmentToConfirm] = useState<any>(null);
  const { toast } = useToast();

  // Função para detectar se é mobile
  const isMobile = () => {
    return window.innerWidth < 768; // md breakpoint
  };

  // Função para abrir detalhes do participante
  const openParticipantDetails = (participant: Participant) => {
    if (isMobile()) {
      // No mobile, navegar para página completa
      setLocation(`/groups/${groupId}/participants/${participant.id}`);
    } else {
      // No desktop, abrir modal
      setSelectedParticipant(participant);
    }
  };

  useEffect(() => {
    loadParticipants();
  }, [groupId]);

  useEffect(() => {
    filterParticipants();
  }, [participants, searchTerm, statusFilter, paymentFilter]);

  const loadParticipants = async () => {
    try {
      setLoading(true);
      const response = await apiRequest('GET', `/api/groups/${groupId}/participants`);
      const data = await response.json();
      setParticipants(data);
    } catch (error) {
      console.error('Erro ao carregar participantes:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os participantes do grupo.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const filterParticipants = () => {
    let filtered = [...participants];

    // Filtro por busca
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(p => 
        p.firstName.toLowerCase().includes(term) ||
        p.lastName.toLowerCase().includes(term) ||
        p.email.toLowerCase().includes(term) ||
        (p.phone && p.phone.includes(term))
      );
    }

    // Filtro por status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(p => p.status === statusFilter);
    }

    // Filtro por pagamento
    if (paymentFilter !== 'all') {
      filtered = filtered.filter(p => p.paymentStatus === paymentFilter);
    }

    setFilteredParticipants(filtered);
  };


  const exportParticipants = () => {
    const csvContent = [
      ['Nome', 'Email', 'Telefone', 'Status', 'Pagamento', 'Valor Pago', 'Valor Total', 'Data Inscrição'],
      ...filteredParticipants.map(p => [
        `${p.firstName} ${p.lastName}`,
        p.email,
        p.phone || '',
        p.status,
        p.paymentStatus,
        p.amountPaid.toString(),
        p.totalAmount.toString(),
        new Date(p.registrationDate).toLocaleDateString('pt-BR')
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `participantes-grupo-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: 'Pendente', variant: 'secondary' as const },
      confirmed: { label: 'Confirmado', variant: 'default' as const },
      cancelled: { label: 'Cancelado', variant: 'destructive' as const }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getPaymentBadge = (status: string) => {
    const paymentConfig = {
      pending: { label: 'Pendente', variant: 'outline' as const },
      in_progress: { label: 'Em Processo', variant: 'outline' as const },
      partial: { label: 'Parcial', variant: 'outline' as const }, // Mantido para compatibilidade
      paid: { label: 'Pago', variant: 'default' as const },
      overdue: { label: 'Em Atraso', variant: 'destructive' as const }
    };
    
    const config = paymentConfig[status as keyof typeof paymentConfig] || paymentConfig.pending;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  // Função para calcular progresso de parcelas PIX
  const getInstallmentProgress = (installments: Participant['installments']) => {
    if (!installments || installments.length === 0) {
      return { paid: 0, total: 0, percentage: 0, overdue: 0 };
    }

    const paid = installments.filter(i => i.status === 'paid').length;
    const total = installments.length;
    const overdue = installments.filter(i => i.status === 'overdue').length;
    const percentage = Math.round((paid / total) * 100);

    return { paid, total, percentage, overdue };
  };

  // Função para obter ícone de status das parcelas
  const getInstallmentStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircle className="w-3 h-3 text-green-500" />;
      case 'overdue':
        return <AlertCircle className="w-3 h-3 text-red-500" />;
      default:
        return <Clock className="w-3 h-3 text-yellow-500" />;
    }
  };

  // Função para calcular status da inscrição baseado nas parcelas
  const calculateRegistrationStatus = (participant: Participant) => {
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

  // Função para calcular se o participante está confirmado baseado na nova regra
  const isParticipantConfirmed = (participant: Participant) => {
    if (!participant.installments || participant.installments.length === 0) {
      // Se não tem parcelas, verificar se tem pagamento à vista confirmado
      return participant.paymentStatus === 'paid' && Number(participant.amountPaid) > 0;
    } else {
      // Se tem parcelas, verificar se pelo menos uma está paga
      const progress = getInstallmentProgress(participant.installments);
      return progress.paid > 0;
    }
  };

  // Função para calcular valores reais baseados nas parcelas
  const calculatePaymentAmounts = (participant: Participant) => {
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
  const getLastPaymentDate = (participant: Participant) => {
    if (!participant.installments || participant.installments.length === 0) {
      return null;
    }

    const paidInstallments = participant.installments
      .filter((installment: any) => installment.status === 'paid' && (installment as any).paidDate)
      .sort((a: any, b: any) => new Date((b as any).paidDate).getTime() - new Date((a as any).paidDate).getTime());

    return paidInstallments.length > 0 ? (paidInstallments[0] as any).paidDate : null;
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
      
      // Recarregar dados primeiro
      if (onUpdate) {
        await onUpdate();
      }
      
      // Fechar modal após recarregar
      setShowPaymentConfirmation(false);
      setInstallmentToConfirm(null);
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
  const generatePixCopyPaste = (installment: any, participant: Participant) => {
    const amount = Number(installment.amount || 0);
    const installmentNumber = installment.installmentNumber || 1;
    
    // Obter dados do evento ou usar valores padrão
    const pixKeyType = eventData?.pixKeyType || 'cpf';
    const pixKey = eventData?.pixKey || '16089577839';
    const merchantName = 'Evento'; // Nome padrão
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
      description: `${merchantName} - Parcela ${installmentNumber} de ${eventData?.pixInstallments || 12}`
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
  const generateInstallmentQRCode = async (installment: any, participant: Participant) => {
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
  const shareInstallmentViaWhatsApp = (installment: any, participant: Participant) => {
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

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Participantes do Grupo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="animate-pulse border rounded-lg p-4">
                <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/4"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Participantes do Grupo ({filteredParticipants.length})
          </CardTitle>
          <Button variant="outline" size="sm" onClick={exportParticipants}>
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Filtros */}
        <div className="flex flex-col gap-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Buscar por nome, email ou telefone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="pending">Pendente</SelectItem>
                <SelectItem value="confirmed">Confirmado</SelectItem>
                <SelectItem value="cancelled">Cancelado</SelectItem>
              </SelectContent>
            </Select>
            <Select value={paymentFilter} onValueChange={setPaymentFilter}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Pagamento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Pagamentos</SelectItem>
                <SelectItem value="pending">Pendente</SelectItem>
                <SelectItem value="in_progress">Em Processo</SelectItem>
                <SelectItem value="partial">Parcial</SelectItem>
                <SelectItem value="paid">Pago</SelectItem>
                <SelectItem value="overdue">Em Atraso</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Lista de Participantes */}
        {filteredParticipants.length === 0 ? (
          <div className="text-center py-8">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">
              {participants.length === 0 
                ? 'Nenhum participante inscrito ainda.' 
                : 'Nenhum participante encontrado com os filtros aplicados.'
              }
            </p>
            {participants.length === 0 && (
              <p className="text-sm text-gray-500">
                Os participantes aparecerão aqui quando se inscreverem no grupo.
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredParticipants.map((participant) => (
              <div key={participant.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                <div className="space-y-4">
                  {/* Header com avatar e nome */}
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-blue-600 font-semibold text-sm">
                        {participant.firstName[0]}{participant.lastName[0]}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-lg text-gray-900 mb-1">
                        {participant.firstName} {participant.lastName}
                      </h3>
                      <div className="space-y-1 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <Mail className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate">{participant.email}</span>
                        </div>
                        {participant.phone && (
                          <div className="flex items-center gap-2">
                            <Phone className="w-3 h-3 flex-shrink-0" />
                            <span className="truncate">{participant.phone}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <Calendar className="w-3 h-3 flex-shrink-0" />
                          <span>Inscrito em {new Date(participant.registrationDate).toLocaleDateString('pt-BR')}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Status e pagamento */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-700">Status:</span>
                        {isParticipantConfirmed(participant) ? (
                          <Badge variant="default" className="bg-green-600">Confirmado</Badge>
                        ) : (
                          <Badge variant="secondary">Pendente</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-700">Pagamento:</span>
                        {getPaymentBadge(calculateRegistrationStatus(participant))}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-3 h-3 text-gray-500" />
                        <span className="text-sm">
                          R$ {calculatePaymentAmounts(participant).amountPaid.toFixed(2)} / R$ {calculatePaymentAmounts(participant).totalAmount.toFixed(2)}
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

                  {/* Botões de ação */}
                  <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-gray-100">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openParticipantDetails(participant)}
                      className="w-full sm:w-auto"
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      Ver Detalhes
                    </Button>
                    {participant.installments && participant.installments.length > 0 && (
                      <div className="flex items-center gap-1 text-xs text-gray-500 justify-center sm:justify-start">
                        <Clock className="w-3 h-3" />
                        <span>Status automático baseado em parcelas</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
      
      {/* Modal de Detalhes do Participante */}
      <Dialog open={!!selectedParticipant} onOpenChange={() => setSelectedParticipant(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full mx-2 sm:mx-0">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <Users className="w-5 h-5" />
              Detalhes do Participante
            </DialogTitle>
          </DialogHeader>
          
          {selectedParticipant && (
            <div className="space-y-6">
              {/* Informações Básicas */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Informações Pessoais</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Nome Completo</label>
                      <p className="text-lg">{selectedParticipant.firstName} {selectedParticipant.lastName}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Email</label>
                      <p className="flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        {selectedParticipant.email}
                      </p>
                    </div>
                    {selectedParticipant.phone && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">Telefone</label>
                        <p className="flex items-center gap-2">
                          <Phone className="w-4 h-4" />
                          {selectedParticipant.phone}
                        </p>
                      </div>
                    )}
                    <div>
                      <label className="text-sm font-medium text-gray-500">Data de Inscrição</label>
                      <p className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        {new Date(selectedParticipant.registrationDate).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Status e Pagamento</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Status da Inscrição</label>
                      <div className="mt-1">
                        {isParticipantConfirmed(selectedParticipant) ? (
                          <Badge variant="default" className="bg-green-600">Confirmado</Badge>
                        ) : (
                          <Badge variant="secondary">Pendente</Badge>
                        )}
                      </div>
                      <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <p className="text-xs text-blue-700 dark:text-blue-300 font-medium mb-1">Como o status é calculado:</p>
                        <ul className="text-xs text-blue-600 dark:text-blue-400 space-y-1">
                          <li>• <strong>Confirmado:</strong> Pelo menos uma parcela foi paga OU pagamento à vista confirmado</li>
                          <li>• <strong>Pendente:</strong> Nenhum pagamento foi confirmado ainda</li>
                        </ul>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Status do Pagamento</label>
                      <div className="mt-1">{getPaymentBadge(calculateRegistrationStatus(selectedParticipant))}</div>
                      {selectedParticipant.installments && selectedParticipant.installments.length > 0 && (
                        <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                          <p className="text-xs text-blue-700 dark:text-blue-300 font-medium mb-1">Como o status é calculado:</p>
                          <ul className="text-xs text-blue-600 dark:text-blue-400 space-y-1">
                            <li>• <strong>Pago:</strong> Todas as parcelas foram pagas</li>
                            <li>• <strong>Em Atraso:</strong> Existe pelo menos uma parcela em atraso</li>
                            <li>• <strong>Em Processo:</strong> Algumas parcelas foram pagas</li>
                            <li>• <strong>Pendente:</strong> Nenhuma parcela foi paga ainda</li>
                          </ul>
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Valor Total</label>
                      <p className="text-lg font-semibold">
                        R$ {Number(selectedParticipant.totalAmount || 0).toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Valor Pago</label>
                      <p className="text-lg font-semibold text-green-600">
                        R$ {Number(selectedParticipant.amountPaid || 0).toFixed(2)}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Detalhes das Parcelas PIX */}
              {selectedParticipant.installments && selectedParticipant.installments.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <DollarSign className="w-5 h-5" />
                      Plano de Pagamento PIX
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {(() => {
                      const progress = getInstallmentProgress(selectedParticipant.installments);
                      return (
                        <div className="space-y-4">
                          {/* Resumo Geral */}
                          <div className="bg-muted/50 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-3">
                              <h3 className="font-semibold text-foreground">Resumo do Progresso</h3>
                              <span className="text-sm text-muted-foreground">
                                {progress.paid}/{progress.total} parcelas ({progress.percentage}%)
                              </span>
                            </div>
                            
                            {/* Barra de Progresso */}
                            <div className="w-full bg-muted rounded-full h-3 mb-3">
                              <div 
                                className={`h-3 rounded-full transition-all duration-300 ${
                                  progress.percentage === 100 ? 'bg-green-500' : 
                                  progress.overdue > 0 ? 'bg-red-500' : 'bg-blue-500'
                                }`}
                                style={{ width: `${progress.percentage}%` }}
                              ></div>
                            </div>
                            
                            {/* Estatísticas */}
                            <div className="grid grid-cols-3 gap-4 text-center">
                              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
                                <CheckCircle className="w-6 h-6 text-green-500 mx-auto mb-1" />
                                <p className="text-lg font-semibold text-green-600 dark:text-green-400">{progress.paid}</p>
                                <p className="text-xs text-green-600 dark:text-green-400">Pagas</p>
                              </div>
                              <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-3">
                                <Clock className="w-6 h-6 text-yellow-500 mx-auto mb-1" />
                                <p className="text-lg font-semibold text-yellow-600 dark:text-yellow-400">
                                  {progress.total - progress.paid - progress.overdue}
                                </p>
                                <p className="text-xs text-yellow-600 dark:text-yellow-400">Pendentes</p>
                              </div>
                              <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3">
                                <AlertCircle className="w-6 h-6 text-red-500 mx-auto mb-1" />
                                <p className="text-lg font-semibold text-red-600 dark:text-red-400">{progress.overdue}</p>
                                <p className="text-xs text-red-600 dark:text-red-400">Em Atraso</p>
                              </div>
                            </div>
                          </div>

                          {/* Lista Detalhada de Parcelas */}
                          <div>
                            <h3 className="font-semibold mb-3">Detalhes das Parcelas</h3>
                            <div className="space-y-3">
                              {selectedParticipant.installments?.map((installment, index) => {
                                const nextInstallment = getNextInstallmentToPay(selectedParticipant.installments || []);
                                const isNextToPay = nextInstallment && nextInstallment.id === installment.id;
                                const isPaid = installment.status === 'paid';
                                
                                return (
                                  <div 
                                    key={installment.id}
                                    className={`p-4 rounded-lg border-l-4 ${
                                      isPaid ? 'bg-green-50 dark:bg-green-900/20 border-green-400' :
                                      installment.status === 'overdue' ? 'bg-red-50 dark:bg-red-900/20 border-red-400' :
                                      isNextToPay ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-400' :
                                      'bg-muted/50 border-muted-foreground'
                                    }`}
                                  >
                                    <div className="flex items-center justify-between mb-3">
                                      <div className="flex items-center gap-3">
                                        {getInstallmentStatusIcon(installment.status)}
                                        <div>
                                          <p className="font-medium">Parcela {(installment as any).installmentNumber}</p>
                                          <p className="text-sm text-gray-600">
                                            Vencimento: {new Date(installment.dueDate).toLocaleDateString('pt-BR')}
                                          </p>
                                          {isPaid && (installment as any).paidDate && (
                                            <p className="text-sm text-green-600">
                                              Pago em: {new Date((installment as any).paidDate).toLocaleDateString('pt-BR')}
                                            </p>
                                          )}
                                        </div>
                                      </div>
                                      <div className="text-right">
                                        <p className="font-semibold">
                                          R$ {Number(installment.amount || 0).toFixed(2)}
                                        </p>
                                        <Badge 
                                          variant={
                                            isPaid ? 'default' :
                                            installment.status === 'overdue' ? 'destructive' : 
                                            isNextToPay ? 'default' : 'outline'
                                          }
                                          className="text-xs"
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
                                          className="flex-1"
                                        >
                                          <MessageCircle className="w-4 h-4 mr-1" />
                                          Compartilhar
                                        </Button>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => generateInstallmentQRCode(installment, selectedParticipant)}
                                          className="flex-1"
                                        >
                                          <QrCode className="w-4 h-4 mr-1" />
                                          QR Code
                                        </Button>
                                        <Button
                                          variant="default"
                                          size="sm"
                                          onClick={() => openPaymentConfirmation(installment)}
                                          className="flex-1"
                                        >
                                          <CheckCircle className="w-4 h-4 mr-1" />
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
                        </div>
                      );
                    })()}
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Modal do QR Code da Parcela */}
      <Dialog open={showQRCode} onOpenChange={setShowQRCode}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <QrCode className="w-5 h-5" />
              QR Code da Parcela
            </DialogTitle>
          </DialogHeader>
          
          {selectedInstallment && (
            <div className="space-y-4">
              {/* Informações da Parcela */}
              <div className="bg-muted/50 rounded-lg p-4">
                <h3 className="font-semibold mb-2 text-foreground">Informações da Parcela</h3>
                <div className="space-y-1 text-sm">
                  <p><strong>Participante:</strong> {selectedParticipant?.firstName} {selectedParticipant?.lastName}</p>
                  <p><strong>Valor:</strong> R$ {Number(selectedInstallment.amount || 0).toFixed(2)}</p>
                  <p><strong>Vencimento:</strong> {new Date(selectedInstallment.dueDate).toLocaleDateString('pt-BR')}</p>
                  <p><strong>Status:</strong> 
                    <Badge 
                      variant={
                        selectedInstallment.status === 'paid' ? 'default' :
                        selectedInstallment.status === 'overdue' ? 'destructive' : 'outline'
                      }
                      className="ml-2"
                    >
                      {selectedInstallment.status === 'paid' ? 'Paga' :
                       selectedInstallment.status === 'overdue' ? 'Em Atraso' : 'Pendente'}
                    </Badge>
                  </p>
                </div>
              </div>
              
              {/* QR Code */}
              <div className="text-center">
                <div className="bg-white p-4 rounded-lg border inline-block">
                  {qrCodeDataUrl && (
                    <img 
                      src={qrCodeDataUrl} 
                      alt="QR Code da Parcela" 
                      className="w-48 h-48 mx-auto"
                    />
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Escaneie o QR code para pagar a parcela via PIX
                </p>
              </div>
              
              {/* PIX Copia e Cola */}
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
                <p className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-1">PIX Copia e Cola:</p>
                <div className="bg-background p-2 rounded border font-mono text-xs break-all">
                  {selectedInstallment.pixCode}
                </div>
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                  Identificador: {selectedInstallment.pixIdentifier}
                </p>
              </div>
              
              {/* Botões de Ação */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => shareInstallmentViaWhatsApp(selectedInstallment, selectedParticipant!)}
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
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 dark:text-blue-200 mb-2">Detalhes da Parcela</h4>
                <div className="space-y-1 text-sm text-blue-800 dark:text-blue-300">
                  <p><strong>Parcela:</strong> {installmentToConfirm.installmentNumber}</p>
                  <p><strong>Valor:</strong> R$ {Number(installmentToConfirm.amount || 0).toFixed(2)}</p>
                  <p><strong>Vencimento:</strong> {new Date(installmentToConfirm.dueDate).toLocaleDateString('pt-BR')}</p>
                </div>
              </div>
              
              <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4">
                <h4 className="font-medium text-yellow-900 dark:text-yellow-200 mb-2">⚠️ Confirmação Necessária</h4>
                <p className="text-sm text-yellow-800 dark:text-yellow-300">
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
    </Card>
  );
}
