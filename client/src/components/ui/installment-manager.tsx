import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from './card';
import { Button } from './button';
import { Badge } from './badge';
import { Input } from './input';
import { Label } from './label';
import { Textarea } from './textarea';
import { 
  Calendar, 
  DollarSign, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  MessageSquare,
  User,
  CreditCard
} from 'lucide-react';

interface InstallmentManagerProps {
  registrationId: string;
  eventId: string;
  groupId?: string;
}

interface PaymentInstallment {
  id: string;
  registrationId: string;
  installmentNumber: number;
  amount: string;
  dueDate: string;
  status: 'pending' | 'paid' | 'overdue';
  paidAt?: string;
  paymentProof?: string;
  amountPaid?: string;
}

interface Registration {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  totalAmount: string;
  amountPaid: string;
  remainingAmount: string;
  paymentStatus: string;
  group?: {
    id: string;
    name: string;
  };
}

export default function InstallmentManager({ registrationId, eventId, groupId }: InstallmentManagerProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedInstallment, setSelectedInstallment] = useState<PaymentInstallment | null>(null);
  const [paymentProof, setPaymentProof] = useState('');
  const [amountPaid, setAmountPaid] = useState('');

  // Buscar dados da inscrição
  const { data: registration, isLoading: registrationLoading } = useQuery({
    queryKey: [`/api/registrations/${registrationId}`],
    enabled: !!registrationId,
  });

  // Buscar parcelas
  const { data: installments, isLoading: installmentsLoading } = useQuery({
    queryKey: [`/api/payments/installments/${registrationId}`],
    enabled: !!registrationId,
  });

  // Mutação para confirmar pagamento de parcela
  const confirmPaymentMutation = useMutation({
    mutationFn: async (data: { installmentId: string; paymentProof?: string; amount?: string }) => {
      return apiRequest('POST', '/api/payments/confirm-manual', {
        registrationId,
        installmentId: data.installmentId,
        paymentProof: data.paymentProof,
        amount: data.amount
      });
    },
    onSuccess: () => {
      toast({
        title: "Pagamento confirmado!",
        description: "A parcela foi marcada como paga com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/registrations/${registrationId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/payments/installments/${registrationId}`] });
      setSelectedInstallment(null);
      setPaymentProof('');
      setAmountPaid('');
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao confirmar pagamento",
        description: error.message,
        variant: "destructive",
      });
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-100 text-green-800 border-green-200"><CheckCircle className="h-3 w-3 mr-1" />Pago</Badge>;
      case 'overdue':
        return <Badge className="bg-red-100 text-red-800 border-red-200"><AlertCircle className="h-3 w-3 mr-1" />Vencido</Badge>;
      default:
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200"><Clock className="h-3 w-3 mr-1" />Pendente</Badge>;
    }
  };

  const handleConfirmPayment = () => {
    if (!selectedInstallment) return;

    confirmPaymentMutation.mutate({
      installmentId: selectedInstallment.id,
      paymentProof: paymentProof || undefined,
      amount: amountPaid || undefined
    });
  };

  if (registrationLoading || installmentsLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!registration || !installments) {
    return (
      <div className="text-center p-8">
        <p className="text-gray-500">Dados não encontrados</p>
      </div>
    );
  }

  const reg = registration as Registration;
  const installmentsList = installments as PaymentInstallment[];

  return (
    <div className="space-y-6">
      {/* Informações da Inscrição */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <User className="h-5 w-5 mr-2" />
            Informações do Participante
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium text-gray-500">Nome</Label>
              <p className="text-lg font-semibold">{reg.firstName} {reg.lastName}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-500">Email</Label>
              <p className="text-lg">{reg.email}</p>
            </div>
            {reg.phoneNumber && (
              <div>
                <Label className="text-sm font-medium text-gray-500">Telefone</Label>
                <p className="text-lg">{reg.phoneNumber}</p>
              </div>
            )}
            {reg.group && (
              <div>
                <Label className="text-sm font-medium text-gray-500">Grupo</Label>
                <p className="text-lg">{reg.group.name}</p>
              </div>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 pt-4 border-t">
            <div>
              <Label className="text-sm font-medium text-gray-500">Valor Total</Label>
              <p className="text-xl font-bold text-primary">{formatCurrency(reg.totalAmount)}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-500">Valor Pago</Label>
              <p className="text-xl font-bold text-green-600">{formatCurrency(reg.amountPaid)}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-500">Restante</Label>
              <p className="text-xl font-bold text-orange-600">{formatCurrency(reg.remainingAmount)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Parcelas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <CreditCard className="h-5 w-5 mr-2" />
            Parcelas do Pagamento
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {installmentsList.map((installment) => (
              <div
                key={installment.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
              >
                <div className="flex items-center space-x-4">
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-500">Parcela</p>
                    <p className="text-lg font-bold">{installment.installmentNumber}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Valor</p>
                    <p className="text-lg font-semibold">{formatCurrency(installment.amount)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Vencimento</p>
                    <p className="text-lg">{formatDate(installment.dueDate)}</p>
                  </div>
                  {installment.paidAt && (
                    <div>
                      <p className="text-sm font-medium text-gray-500">Pago em</p>
                      <p className="text-lg">{formatDate(installment.paidAt)}</p>
                    </div>
                  )}
                </div>
                
                <div className="flex items-center space-x-3">
                  {getStatusBadge(installment.status)}
                  {installment.status === 'pending' && (
                    <Button
                      size="sm"
                      onClick={() => setSelectedInstallment(installment)}
                    >
                      Confirmar Pagamento
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Modal de Confirmação de Pagamento */}
      {selectedInstallment && (
        <Card className="border-2 border-primary">
          <CardHeader>
            <CardTitle className="flex items-center">
              <MessageSquare className="h-5 w-5 mr-2" />
              Confirmar Pagamento - Parcela {selectedInstallment.installmentNumber}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-gray-500">Valor da Parcela</Label>
                <p className="text-lg font-semibold">{formatCurrency(selectedInstallment.amount)}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-500">Vencimento</Label>
                <p className="text-lg">{formatDate(selectedInstallment.dueDate)}</p>
              </div>
            </div>

            <div>
              <Label htmlFor="amountPaid">Valor Pago (opcional)</Label>
              <Input
                id="amountPaid"
                type="number"
                step="0.01"
                placeholder={selectedInstallment.amount}
                value={amountPaid}
                onChange={(e) => setAmountPaid(e.target.value)}
              />
              <p className="text-xs text-gray-500 mt-1">
                Deixe vazio para usar o valor da parcela
              </p>
            </div>

            <div>
              <Label htmlFor="paymentProof">Comprovante de Pagamento (opcional)</Label>
              <Textarea
                id="paymentProof"
                placeholder="Cole aqui o comprovante ou observações sobre o pagamento..."
                value={paymentProof}
                onChange={(e) => setPaymentProof(e.target.value)}
                rows={3}
              />
            </div>

            <div className="flex space-x-3">
              <Button
                onClick={handleConfirmPayment}
                disabled={confirmPaymentMutation.isPending}
                className="flex-1"
              >
                {confirmPaymentMutation.isPending ? 'Confirmando...' : 'Confirmar Pagamento'}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedInstallment(null);
                  setPaymentProof('');
                  setAmountPaid('');
                }}
              >
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
