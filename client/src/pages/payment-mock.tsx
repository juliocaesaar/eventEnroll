import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, CreditCard, Smartphone, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function PaymentMock() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [paymentMethod, setPaymentMethod] = useState('pix');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentCompleted, setPaymentCompleted] = useState(false);

  // Get URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  const amount = parseFloat(urlParams.get('amount') || '0');
  const paymentId = urlParams.get('id') || '';
  const eventSlug = urlParams.get('eventSlug') || '';

  // Mock payment completion
  const completeMockPayment = useMutation({
    mutationFn: async () => {
      // Simulate API call to confirm payment
      await new Promise(resolve => setTimeout(resolve, 2000));
      return { success: true, paymentId };
    },
    onSuccess: () => {
      setPaymentCompleted(true);
      toast({
        title: "Pagamento realizado!",
        description: "Sua inscrição foi confirmada com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro no pagamento",
        description: "Tente novamente em alguns minutos.",
        variant: "destructive",
      });
    },
  });

  const handlePayment = () => {
    setIsProcessing(true);
    completeMockPayment.mutate();
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  if (paymentCompleted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Pagamento Confirmado!</h2>
            <p className="text-gray-600 mb-6">
              Sua inscrição foi processada com sucesso. Você receberá um email de confirmação em breve.
            </p>
            <div className="space-y-3">
              <Button 
                className="w-full" 
                onClick={() => setLocation(`/event/${eventSlug}`)}
              >
                Voltar ao Evento
              </Button>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => setLocation('/')}
              >
                Página Inicial
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setLocation(`/event/${eventSlug}`)}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
            <div className="ml-4">
              <h1 className="text-xl font-bold text-gray-900">Finalizar Pagamento</h1>
              <p className="text-sm text-gray-600">Valor: {formatCurrency(amount)}</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid md:grid-cols-2 gap-8">
          {/* Payment Methods */}
          <Card>
            <CardHeader>
              <CardTitle>Escolha a forma de pagamento</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* PIX */}
              <div 
                className={`border rounded-lg p-4 cursor-pointer transition-all ${
                  paymentMethod === 'pix' 
                    ? 'border-primary bg-primary/5' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setPaymentMethod('pix')}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <Smartphone className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-medium">PIX</h3>
                      <p className="text-sm text-gray-600">Aprovação instantânea</p>
                    </div>
                  </div>
                  <Badge variant="secondary">Recomendado</Badge>
                </div>
              </div>

              {/* Credit Card */}
              <div 
                className={`border rounded-lg p-4 cursor-pointer transition-all ${
                  paymentMethod === 'card' 
                    ? 'border-primary bg-primary/5' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setPaymentMethod('card')}
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <CreditCard className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-medium">Cartão de Crédito</h3>
                    <p className="text-sm text-gray-600">Parcele em até 12x sem juros</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Resumo do Pagamento</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center pb-4 border-b">
                  <span className="text-gray-600">Valor Total:</span>
                  <span className="text-2xl font-bold text-primary">{formatCurrency(amount)}</span>
                </div>

                {paymentMethod === 'pix' && (
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h4 className="font-medium text-green-800 mb-2">Pagamento PIX</h4>
                    <p className="text-sm text-green-700">
                      Após confirmar, você receberá um QR Code para realizar o pagamento via PIX. 
                      A confirmação é instantânea!
                    </p>
                  </div>
                )}

                {paymentMethod === 'card' && (
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-medium text-blue-800 mb-2">Cartão de Crédito</h4>
                    <p className="text-sm text-blue-700">
                      Você será redirecionado para inserir os dados do cartão de forma segura. 
                      Aceitamos Visa, Mastercard e Elo.
                    </p>
                  </div>
                )}

                <Button 
                  className="w-full" 
                  size="lg"
                  onClick={handlePayment}
                  disabled={isProcessing || completeMockPayment.isPending}
                  data-testid="button-confirm-payment"
                >
                  {isProcessing || completeMockPayment.isPending ? (
                    <div className="flex items-center">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Processando...
                    </div>
                  ) : (
                    `Pagar ${formatCurrency(amount)} - ${paymentMethod === 'pix' ? 'PIX' : 'Cartão'}`
                  )}
                </Button>

                <p className="text-xs text-gray-600 text-center">
                  🔒 Pagamento 100% seguro e protegido
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Mock Notice */}
        <Card className="mt-8 bg-yellow-50 border-yellow-200">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              <p className="text-sm text-yellow-800">
                <strong>Modo Demonstração:</strong> Este é um pagamento simulado para teste. 
                Em produção, seria integrado com o gateway de pagamento real.
              </p>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}