import React, { useState, useEffect } from 'react';
import { useParams, useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { 
  ArrowLeft, 
  Users, 
  Mail, 
  Phone, 
  Calendar, 
  DollarSign, 
  CheckCircle, 
  AlertCircle, 
  Clock,
  Share2,
  QrCode,
  MessageCircle
} from 'lucide-react';

interface Participant {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  amountPaid: number | string;
  totalAmount: number | string;
  registrationDate: string;
  paymentStatus: 'pending' | 'partial' | 'paid' | 'overdue';
  installments?: {
    id: string;
    amount: number;
    dueDate: string;
    status: 'pending' | 'paid' | 'overdue';
  }[];
  group?: {
    id: string;
    name: string;
  };
  event?: {
    id: string;
    title: string;
  };
}

export default function ParticipantDetailsPage() {
  const [, setLocation] = useLocation();
  const { participantId, groupId } = useParams();
  const [participant, setParticipant] = useState<Participant | null>(null);
  const [loading, setLoading] = useState(true);
  const [showQRCode, setShowQRCode] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [showPaymentConfirmation, setShowPaymentConfirmation] = useState(false);
  const [installmentToConfirm, setInstallmentToConfirm] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (participantId && groupId) {
      loadParticipantDetails();
    }
  }, [participantId, groupId]);

  const loadParticipantDetails = async () => {
    try {
      setLoading(true);
      const response = await apiRequest('GET', `/api/groups/${groupId}/participants/${participantId}`);
      const data = await response.json();
      setParticipant(data);
    } catch (error) {
      console.error('Erro ao carregar detalhes do participante:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os detalhes do participante.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: 'Pendente', variant: 'secondary' as const, icon: Clock },
      confirmed: { label: 'Confirmado', variant: 'default' as const, icon: CheckCircle },
      cancelled: { label: 'Cancelado', variant: 'destructive' as const, icon: AlertCircle }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;
    
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  const getPaymentStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: 'Pendente', variant: 'secondary' as const, color: 'text-yellow-600' },
      partial: { label: 'Parcial', variant: 'outline' as const, color: 'text-blue-600' },
      paid: { label: 'Pago', variant: 'default' as const, color: 'text-green-600' },
      overdue: { label: 'Atrasado', variant: 'destructive' as const, color: 'text-red-600' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    
    return (
      <Badge variant={config.variant} className={config.color}>
        {config.label}
      </Badge>
    );
  };

  const getInstallmentProgress = (installments: any[]) => {
    const total = installments.length;
    const paid = installments.filter(i => i.status === 'paid').length;
    const overdue = installments.filter(i => i.status === 'overdue').length;
    const percentage = total > 0 ? Math.round((paid / total) * 100) : 0;
    
    // Encontrar a próxima parcela a ser paga
    const nextInstallment = installments.find(i => i.status === 'pending' || i.status === 'overdue');
    
    return { total, paid, overdue, percentage, nextInstallment };
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const generateQRCode = async (installment: any) => {
    try {
      const response = await apiRequest('POST', '/api/payments/generate-pix-qr', {
        registrationId: participant?.id,
        amount: installment.amount,
        pixUrl: `https://pix.example.com/pay/${installment.id}`
      });
      
      if (response.ok) {
        const data = await response.json();
        setQrCodeDataUrl(data.qrCode?.qrCodeImage);
        setShowQRCode(true);
      }
    } catch (error) {
      console.error('Erro ao gerar QR Code:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível gerar o QR Code.',
        variant: 'destructive',
      });
    }
  };

  const confirmPayment = async (installment: any) => {
    try {
      const response = await apiRequest('POST', '/api/payments/confirm-manual', {
        registrationId: participant?.id,
        installmentId: installment.id,
        amount: installment.amount,
        paymentProof: 'Manual confirmation'
      });
      
      if (response.ok) {
        toast({
          title: 'Sucesso',
          description: 'Pagamento confirmado com sucesso!',
        });
        loadParticipantDetails();
        setShowPaymentConfirmation(false);
        setInstallmentToConfirm(null);
      }
    } catch (error) {
      console.error('Erro ao confirmar pagamento:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível confirmar o pagamento.',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando detalhes do participante...</p>
        </div>
      </div>
    );
  }

  if (!participant) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Participante não encontrado</h1>
          <Button onClick={() => setLocation(`/groups/${groupId}/manage`)}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar ao Grupo
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6">
        {/* Header */}
        <div className="mb-6">
          <Button 
            variant="ghost" 
            onClick={() => setLocation(`/groups/${groupId}/manage`)}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar ao Grupo
          </Button>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
            Detalhes do Participante
          </h1>
          <p className="text-muted-foreground mt-1">
            {participant.firstName} {participant.lastName}
          </p>
        </div>

        <div className="space-y-6">
          {/* Informações Básicas */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Informações Pessoais
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Nome Completo</label>
                  <p className="text-lg font-medium">{participant.firstName} {participant.lastName}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Email</label>
                  <p className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    {participant.email}
                  </p>
                </div>
                {participant.phone && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Telefone</label>
                    <p className="flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      {participant.phone}
                    </p>
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Data de Inscrição</label>
                  <p className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    {formatDate(participant.registrationDate)}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  Informações de Pagamento
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Status da Inscrição</label>
                  <div className="mt-1">
                    {getStatusBadge(participant.status)}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Status do Pagamento</label>
                  <div className="mt-1">
                    {getPaymentStatusBadge(participant.paymentStatus)}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Valor Total</label>
                  <p className="text-lg font-semibold text-green-600 dark:text-green-400">
                    {formatCurrency(calculatePaymentAmounts(participant).totalAmount)}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Valor Pago</label>
                  <p className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                    {formatCurrency(calculatePaymentAmounts(participant).amountPaid)}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Saldo Restante</label>
                  <p className="text-lg font-semibold text-orange-600 dark:text-orange-400">
                    {formatCurrency(calculatePaymentAmounts(participant).totalAmount - calculatePaymentAmounts(participant).amountPaid)}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Detalhes das Parcelas PIX */}
          {participant.installments && participant.installments.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  Plano de Pagamento PIX
                </CardTitle>
              </CardHeader>
              <CardContent>
                {(() => {
                  const progress = getInstallmentProgress(participant.installments || []);
                  return (
                    <div className="space-y-6">
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
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 text-center">
                          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
                            <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-green-500 mx-auto mb-1" />
                            <p className="text-base sm:text-lg font-semibold text-green-600 dark:text-green-400">{progress.paid}</p>
                            <p className="text-xs text-green-600 dark:text-green-400">Pagas</p>
                          </div>
                          <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-3">
                            <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-500 mx-auto mb-1" />
                            <p className="text-base sm:text-lg font-semibold text-yellow-600 dark:text-yellow-400">
                              {progress.total - progress.paid - progress.overdue}
                            </p>
                            <p className="text-xs text-yellow-600 dark:text-yellow-400">Pendentes</p>
                          </div>
                          <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3">
                            <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6 text-red-500 mx-auto mb-1" />
                            <p className="text-base sm:text-lg font-semibold text-red-600 dark:text-red-400">{progress.overdue}</p>
                            <p className="text-xs text-red-600 dark:text-red-400">Em Atraso</p>
                          </div>
                        </div>
                      </div>

                      {/* Lista Detalhada de Parcelas */}
                      <div>
                        <h3 className="font-semibold text-foreground mb-4">Parcelas Detalhadas</h3>
                        <div className="space-y-3">
                          {participant.installments.map((installment, index) => (
                            <div 
                              key={installment.id} 
                              className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg bg-card gap-4"
                            >
                              <div className="flex-1 min-w-0">
                                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
                                  <span className="text-sm font-medium text-muted-foreground">
                                    Parcela {index + 1}
                                  </span>
                                  {getPaymentStatusBadge(installment.status)}
                                </div>
                                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-muted-foreground">
                                  <span className="flex items-center gap-1">
                                    <DollarSign className="w-4 h-4 flex-shrink-0" />
                                    {formatCurrency(installment.amount)}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Calendar className="w-4 h-4 flex-shrink-0" />
                                    <span className="hidden sm:inline">Vencimento: </span>
                                    <span className="sm:hidden">Venc: </span>
                                    {formatDate(installment.dueDate)}
                                  </span>
                                </div>
                              </div>
                              
                              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-2">
                                {(() => {
                                  const progress = getInstallmentProgress(participant.installments || []);
                                  const isNextInstallment = progress.nextInstallment?.id === installment.id;
                                  
                                  if (installment.status === 'paid') {
                                    return (
                                      <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 w-fit">
                                        <CheckCircle className="w-3 h-3 mr-1" />
                                        Pago
                                      </Badge>
                                    );
                                  }
                                  
                                  if (installment.status === 'overdue') {
                                    return (
                                      <Badge variant="destructive" className="w-fit">
                                        <AlertCircle className="w-3 h-3 mr-1" />
                                        Atrasado
                                      </Badge>
                                    );
                                  }
                                  
                                  if (installment.status === 'pending' && isNextInstallment) {
                                    return (
                                      <>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => generateQRCode(installment)}
                                          className="w-full sm:w-auto"
                                        >
                                          <QrCode className="w-4 h-4 mr-1" />
                                          <span className="hidden sm:inline">QR Code</span>
                                          <span className="sm:hidden">QR</span>
                                        </Button>
                                        <Button
                                          size="sm"
                                          onClick={() => {
                                            setInstallmentToConfirm(installment);
                                            setShowPaymentConfirmation(true);
                                          }}
                                          className="w-full sm:w-auto"
                                        >
                                          <CheckCircle className="w-4 h-4 mr-1" />
                                          Confirmar
                                        </Button>
                                      </>
                                    );
                                  }
                                  
                                  if (installment.status === 'pending' && !isNextInstallment) {
                                    return (
                                      <Badge variant="secondary" className="w-fit">
                                        <Clock className="w-3 h-3 mr-1" />
                                        Aguardando
                                      </Badge>
                                    );
                                  }
                                  
                                  return null;
                                })()}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Modal de Confirmação de Pagamento */}
      {showPaymentConfirmation && installmentToConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Confirmar Pagamento</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Tem certeza que deseja confirmar o pagamento da parcela de{' '}
              <strong>{formatCurrency(installmentToConfirm.amount)}</strong>?
            </p>
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setShowPaymentConfirmation(false);
                  setInstallmentToConfirm(null);
                }}
              >
                Cancelar
              </Button>
              <Button
                onClick={() => confirmPayment(installmentToConfirm)}
                className="bg-green-600 hover:bg-green-700"
              >
                Confirmar Pagamento
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de QR Code */}
      {showQRCode && qrCodeDataUrl && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-sm w-full">
            <h3 className="text-lg font-semibold mb-4">QR Code PIX</h3>
            <div className="text-center">
              <img 
                src={qrCodeDataUrl} 
                alt="QR Code PIX" 
                className="mx-auto mb-4 border rounded"
              />
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                Escaneie o QR Code com seu app de pagamento
              </p>
              <Button
                variant="outline"
                onClick={() => {
                  setShowQRCode(false);
                  setQrCodeDataUrl('');
                }}
                className="w-full"
              >
                Fechar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
