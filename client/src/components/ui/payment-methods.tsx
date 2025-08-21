import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CreditCard, Smartphone, Receipt } from "lucide-react";

export default function PaymentMethods() {
  const paymentMethods = [
    {
      id: 'pix',
      name: 'PIX',
      description: 'Pagamento instantâneo',
      icon: Smartphone,
      color: 'bg-green-100 text-green-600',
      status: 'Ativo',
    },
    {
      id: 'credit-card',
      name: 'Cartão de Crédito',
      description: 'Até 12x sem juros',
      icon: CreditCard,
      color: 'bg-blue-100 text-blue-600',
      status: 'Ativo',
    },
    {
      id: 'boleto',
      name: 'Boleto',
      description: 'Vencimento em 3 dias',
      icon: Receipt,
      color: 'bg-orange-100 text-orange-600',
      status: 'Ativo',
    },
  ];

  return (
    <Card data-testid="card-payment-methods">
      <CardHeader className="border-b">
        <CardTitle>Métodos de Pagamento</CardTitle>
        <p className="text-sm text-gray-600">Integração completa com o Brasil</p>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-4">
          {paymentMethods.map((method) => {
            const Icon = method.icon;
            return (
              <div 
                key={method.id}
                className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg"
                data-testid={`payment-method-${method.id}`}
              >
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${method.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900" data-testid={`payment-name-${method.id}`}>
                    {method.name}
                  </h4>
                  <p className="text-xs text-gray-500" data-testid={`payment-description-${method.id}`}>
                    {method.description}
                  </p>
                </div>
                <Badge 
                  variant="secondary" 
                  className="text-xs bg-secondary-100 text-secondary-600"
                  data-testid={`payment-status-${method.id}`}
                >
                  {method.status}
                </Badge>
              </div>
            );
          })}
        </div>

        {/* Transaction Info */}
        <div className="mt-6 p-3 bg-gray-50 rounded-lg" data-testid="transaction-info">
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-600">Taxa por transação:</span>
            <span className="font-medium text-gray-900">4,99% + R$ 0,99</span>
          </div>
          <p className="text-xs text-gray-500 mt-1">Sem taxas mensais ou de setup</p>
        </div>

        {/* Integration Note */}
        <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-xs text-blue-700">
            <strong>Integração:</strong> Mercado Pago, PagSeguro, e outros gateways brasileiros serão integrados
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
