import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { useToast } from '../hooks/use-toast';
import { usePIXPayments, PIXPayment } from '../hooks/usePIXPayments';
import { 
  CreditCard, 
  Copy, 
  Check, 
  RefreshCw, 
  QrCode, 
  Clock, 
  DollarSign,
  AlertCircle,
  CheckCircle,
  XCircle
} from 'lucide-react';

interface PIXTestPageProps {}

export default function PIXTestPage({}: PIXTestPageProps) {
  const [currentPayment, setCurrentPayment] = useState<PIXPayment | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const { toast } = useToast();
  
  const {
    payments,
    isLoading,
    isCreating,
    createTestPayment,
    checkPaymentStatus,
    cancelPayment,
    useAutoRefresh
  } = usePIXPayments();

  // Auto-refresh para pagamentos pendentes
  const { isAutoRefreshing, startAutoRefresh, stopAutoRefresh, toggleAutoRefresh } = useAutoRefresh(
    currentPayment?.id || null,
    5000 // 5 segundos
  );

  const handleCreatePayment = async () => {
    try {
      const newPayment = await createTestPayment();
      if (newPayment) {
        setCurrentPayment(newPayment);
        startAutoRefresh();
      }
    } catch (error) {
      console.error('❌ Erro ao criar pagamento:', error);
    }
  };

  const handleCheckStatus = async (paymentId: string) => {
    try {
      const updatedPayment = await checkPaymentStatus(paymentId);
      if (updatedPayment && currentPayment?.id === paymentId) {
        setCurrentPayment(updatedPayment);
      }
    } catch (error) {
      console.error('❌ Erro ao verificar status:', error);
    }
  };

  const handleCancelPayment = async (paymentId: string) => {
    try {
      await cancelPayment(paymentId);
      if (currentPayment?.id === paymentId) {
        setCurrentPayment(prev => prev ? { ...prev, status: 'cancelled' } : null);
        stopAutoRefresh();
      }
    } catch (error) {
      console.error('❌ Erro ao cancelar pagamento:', error);
    }
  };

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedCode(type);
      toast({
        title: "Copiado!",
        description: `${type} copiado para a área de transferência`,
      });
      
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (error) {
      console.error('❌ Erro ao copiar:', error);
      toast({
        title: "Erro",
        description: "Falha ao copiar para a área de transferência",
        variant: "destructive"
      });
    }
  };


  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'expired':
        return <AlertCircle className="h-4 w-4 text-orange-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      paid: 'default',
      pending: 'secondary',
      cancelled: 'destructive',
      expired: 'outline',
      failed: 'destructive'
    } as const;

    const labels = {
      paid: 'Pago',
      pending: 'Pendente',
      cancelled: 'Cancelado',
      expired: 'Expirado',
      failed: 'Falhou'
    };

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'secondary'}>
        {labels[status as keyof typeof labels] || status}
      </Badge>
    );
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Teste PIX API</h1>
          <p className="text-muted-foreground">
            Teste a integração com a API PIX criando pagamentos de R$ 1,00
          </p>
          <div className="mt-2 p-3 bg-orange-50 border border-orange-200 rounded-lg">
            <p className="text-sm text-orange-800">
              ⚠️ <strong>Modo Simulação:</strong> Como não há API key configurada, os pagamentos são simulados para demonstração.
            </p>
          </div>
        </div>
        <Button 
          onClick={handleCreatePayment} 
          disabled={isCreating}
          className="flex items-center gap-2"
        >
          {isCreating ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <CreditCard className="h-4 w-4" />
          )}
          {isCreating ? 'Criando...' : 'Criar Pagamento Teste'}
        </Button>
      </div>

      {/* Pagamento Atual */}
      {currentPayment && (
        <Card className="border-2 border-primary">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Pagamento Atual - R$ {currentPayment.amount.toFixed(2)}
                </CardTitle>
                <CardDescription>
                  ID: {currentPayment.id} • {currentPayment.external_id}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                {getStatusIcon(currentPayment.status)}
                {getStatusBadge(currentPayment.status)}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* QR Code */}
            {currentPayment.qr_code && (
              <div className="space-y-2">
                <Label>QR Code PIX</Label>
                <div className="flex items-center gap-2">
                  <div className="p-4 bg-white rounded-lg border">
                    <img 
                      src={`data:image/png;base64,${currentPayment.qr_code}`} 
                      alt="QR Code PIX"
                      className="w-32 h-32"
                    />
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(currentPayment.qr_code_text, 'QR Code')}
                  >
                    {copiedCode === 'QR Code' ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            )}

            {/* Código Copia e Cola */}
            {currentPayment.copy_paste_code && (
              <div className="space-y-2">
                <Label>Código Copia e Cola</Label>
                <div className="flex items-center gap-2">
                  <Input
                    value={currentPayment.copy_paste_code}
                    readOnly
                    className="font-mono text-sm"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(currentPayment.copy_paste_code, 'Código PIX')}
                  >
                    {copiedCode === 'Código PIX' ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            )}

            {/* Informações do Pagamento */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <Label className="text-muted-foreground">Status</Label>
                <div className="flex items-center gap-2">
                  {getStatusIcon(currentPayment.status)}
                  {getStatusBadge(currentPayment.status)}
                </div>
              </div>
              <div>
                <Label className="text-muted-foreground">Expira em</Label>
                <p>{new Date(currentPayment.expires_at).toLocaleString()}</p>
              </div>
              {currentPayment.paid_at && (
                <div>
                  <Label className="text-muted-foreground">Pago em</Label>
                  <p>{new Date(currentPayment.paid_at).toLocaleString()}</p>
                </div>
              )}
            </div>

            {/* Controles */}
            <div className="flex items-center gap-2 pt-4 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleCheckStatus(currentPayment.id)}
                disabled={isLoading}
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                Verificar Status
              </Button>
              
              {currentPayment.status === 'pending' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleAutoRefresh}
                  className={isAutoRefreshing ? 'bg-green-50 border-green-200' : ''}
                >
                  {isAutoRefreshing ? 'Parar Auto-refresh' : 'Ativar Auto-refresh'}
                </Button>
              )}
              
              {currentPayment.status === 'pending' && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleCancelPayment(currentPayment.id)}
                >
                  Cancelar Pagamento
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lista de Pagamentos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Histórico de Pagamentos
          </CardTitle>
          <CardDescription>
            Todos os pagamentos PIX de teste criados
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin" />
              <span className="ml-2">Carregando pagamentos...</span>
            </div>
          ) : payments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum pagamento PIX criado ainda</p>
              <p className="text-sm">Clique em "Criar Pagamento Teste" para começar</p>
            </div>
          ) : (
            <div className="space-y-3">
              {payments.map((payment) => (
                <div
                  key={payment.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    currentPayment?.id === payment.id 
                      ? 'border-primary bg-primary/5' 
                      : 'hover:bg-muted/50'
                  }`}
                  onClick={() => setCurrentPayment(payment)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(payment.status)}
                      <div>
                        <p className="font-medium">R$ {payment.amount.toFixed(2)}</p>
                        <p className="text-sm text-muted-foreground">
                          {payment.external_id}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(payment.status)}
                      <p className="text-sm text-muted-foreground">
                        {new Date(payment.expires_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
