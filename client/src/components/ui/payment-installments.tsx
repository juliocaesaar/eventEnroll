import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './card';
import { Badge } from './badge';
import { Button } from './button';
import { Input } from './input';
import { Label } from './label';
import { Textarea } from './textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './dialog';
import { usePaymentInstallments } from '../../hooks/usePayments';
import { PaymentInstallment } from '../../hooks/usePayments';
import { Calendar, DollarSign, AlertTriangle, CheckCircle, Clock } from 'lucide-react';

interface PaymentInstallmentsProps {
  registrationId: string;
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'paid':
      return <CheckCircle className="h-4 w-4 text-green-600" />;
    case 'overdue':
      return <AlertTriangle className="h-4 w-4 text-red-600" />;
    case 'pending':
      return <Clock className="h-4 w-4 text-yellow-600" />;
    default:
      return <Clock className="h-4 w-4 text-gray-600" />;
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'paid':
      return 'bg-green-100 text-green-800';
    case 'overdue':
      return 'bg-red-100 text-red-800';
    case 'pending':
      return 'bg-yellow-100 text-yellow-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const getStatusText = (status: string) => {
  switch (status) {
    case 'paid':
      return 'Paga';
    case 'overdue':
      return 'Em Atraso';
    case 'pending':
      return 'Pendente';
    case 'waived':
      return 'Isenta';
    case 'cancelled':
      return 'Cancelada';
    default:
      return status;
  }
};

export const PaymentInstallments: React.FC<PaymentInstallmentsProps> = ({
  registrationId,
}) => {
  const {
    installments,
    isLoading,
    error,
    processPayment,
    applyDiscount,
    applyLateFee,
    isProcessing,
    isApplyingDiscount,
    isApplyingLateFee,
  } = usePaymentInstallments(registrationId);

  const [selectedInstallment, setSelectedInstallment] = useState<PaymentInstallment | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [discountAmount, setDiscountAmount] = useState('');
  const [discountNotes, setDiscountNotes] = useState('');
  const [lateFeeAmount, setLateFeeAmount] = useState('');
  const [lateFeeNotes, setLateFeeNotes] = useState('');

  const handleProcessPayment = () => {
    if (!selectedInstallment || !paymentAmount || !paymentMethod) return;

    processPayment({
      installmentId: selectedInstallment.id,
      data: {
        amount: parseFloat(paymentAmount),
        paymentMethod,
        notes: paymentNotes,
      },
    });

    // Reset form
    setSelectedInstallment(null);
    setPaymentAmount('');
    setPaymentMethod('');
    setPaymentNotes('');
  };

  const handleApplyDiscount = () => {
    if (!selectedInstallment || !discountAmount) return;

    applyDiscount({
      installmentId: selectedInstallment.id,
      data: {
        discountAmount: parseFloat(discountAmount),
        notes: discountNotes,
      },
    });

    // Reset form
    setSelectedInstallment(null);
    setDiscountAmount('');
    setDiscountNotes('');
  };

  const handleApplyLateFee = () => {
    if (!selectedInstallment || !lateFeeAmount) return;

    applyLateFee({
      installmentId: selectedInstallment.id,
      data: {
        lateFeeAmount: parseFloat(lateFeeAmount),
        notes: lateFeeNotes,
      },
    });

    // Reset form
    setSelectedInstallment(null);
    setLateFeeAmount('');
    setLateFeeNotes('');
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

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-red-600">Erro ao carregar parcelas</p>
        </CardContent>
      </Card>
    );
  }

  if (!installments || installments.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Nenhuma parcela encontrada
          </h3>
          <p className="text-gray-500">
            As parcelas serão criadas automaticamente quando um plano de pagamento for aplicado.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {installments.map((installment) => (
        <Card key={installment.id} className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {getStatusIcon(installment.status)}
                <CardTitle className="text-lg">
                  Parcela {installment.installmentNumber}
                </CardTitle>
                <Badge className={getStatusColor(installment.status)}>
                  {getStatusText(installment.status)}
                </Badge>
              </div>
              <div className="text-right">
                <div className="text-lg font-semibold">
                  {formatCurrency(installment.remainingAmount)}
                </div>
                <div className="text-sm text-gray-500">
                  de {formatCurrency(installment.originalAmount)}
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <Label className="text-sm text-gray-500">Vencimento</Label>
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span>{formatDate(installment.dueDate)}</span>
                </div>
              </div>
              <div>
                <Label className="text-sm text-gray-500">Valor Pago</Label>
                <div className="font-medium">
                  {formatCurrency(installment.paidAmount)}
                </div>
              </div>
            </div>

            {(parseFloat(installment.discountAmount) > 0 || parseFloat(installment.lateFeeAmount) > 0) && (
              <div className="grid grid-cols-2 gap-4 mb-4 p-3 bg-gray-50 rounded-lg">
                {parseFloat(installment.discountAmount) > 0 && (
                  <div>
                    <Label className="text-sm text-green-600">Desconto</Label>
                    <div className="text-green-600 font-medium">
                      -{formatCurrency(installment.discountAmount)}
                    </div>
                  </div>
                )}
                {parseFloat(installment.lateFeeAmount) > 0 && (
                  <div>
                    <Label className="text-sm text-red-600">Multa</Label>
                    <div className="text-red-600 font-medium">
                      +{formatCurrency(installment.lateFeeAmount)}
                    </div>
                  </div>
                )}
              </div>
            )}

            {installment.notes && (
              <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                <Label className="text-sm text-blue-600">Observações</Label>
                <p className="text-blue-800 text-sm">{installment.notes}</p>
              </div>
            )}

            <div className="flex space-x-2">
              <Dialog>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedInstallment(installment)}
                  >
                    Registrar Pagamento
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Registrar Pagamento</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="paymentAmount">Valor Pago</Label>
                      <Input
                        id="paymentAmount"
                        type="number"
                        step="0.01"
                        value={paymentAmount}
                        onChange={(e) => setPaymentAmount(e.target.value)}
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <Label htmlFor="paymentMethod">Método de Pagamento</Label>
                      <Input
                        id="paymentMethod"
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        placeholder="PIX, Cartão, Boleto, etc."
                      />
                    </div>
                    <div>
                      <Label htmlFor="paymentNotes">Observações</Label>
                      <Textarea
                        id="paymentNotes"
                        value={paymentNotes}
                        onChange={(e) => setPaymentNotes(e.target.value)}
                        placeholder="Observações opcionais"
                        rows={3}
                      />
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="outline"
                        onClick={() => setSelectedInstallment(null)}
                      >
                        Cancelar
                      </Button>
                      <Button
                        onClick={handleProcessPayment}
                        disabled={isProcessing || !paymentAmount || !paymentMethod}
                      >
                        {isProcessing ? 'Processando...' : 'Registrar'}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              <Dialog>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedInstallment(installment)}
                  >
                    Aplicar Desconto
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Aplicar Desconto</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="discountAmount">Valor do Desconto</Label>
                      <Input
                        id="discountAmount"
                        type="number"
                        step="0.01"
                        value={discountAmount}
                        onChange={(e) => setDiscountAmount(e.target.value)}
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <Label htmlFor="discountNotes">Motivo do Desconto</Label>
                      <Textarea
                        id="discountNotes"
                        value={discountNotes}
                        onChange={(e) => setDiscountNotes(e.target.value)}
                        placeholder="Ex: Desconto por pagamento antecipado"
                        rows={3}
                      />
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="outline"
                        onClick={() => setSelectedInstallment(null)}
                      >
                        Cancelar
                      </Button>
                      <Button
                        onClick={handleApplyDiscount}
                        disabled={isApplyingDiscount || !discountAmount}
                      >
                        {isApplyingDiscount ? 'Aplicando...' : 'Aplicar'}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              <Dialog>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedInstallment(installment)}
                  >
                    Aplicar Multa
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Aplicar Multa por Atraso</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="lateFeeAmount">Valor da Multa</Label>
                      <Input
                        id="lateFeeAmount"
                        type="number"
                        step="0.01"
                        value={lateFeeAmount}
                        onChange={(e) => setLateFeeAmount(e.target.value)}
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <Label htmlFor="lateFeeNotes">Motivo da Multa</Label>
                      <Textarea
                        id="lateFeeNotes"
                        value={lateFeeNotes}
                        onChange={(e) => setLateFeeNotes(e.target.value)}
                        placeholder="Ex: Multa por atraso no pagamento"
                        rows={3}
                      />
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="outline"
                        onClick={() => setSelectedInstallment(null)}
                      >
                        Cancelar
                      </Button>
                      <Button
                        onClick={handleApplyLateFee}
                        disabled={isApplyingLateFee || !lateFeeAmount}
                      >
                        {isApplyingLateFee ? 'Aplicando...' : 'Aplicar'}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
