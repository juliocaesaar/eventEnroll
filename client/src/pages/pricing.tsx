import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Calendar, Check, CreditCard, Smartphone, Crown, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";

interface Plan {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  interval: 'monthly' | 'yearly';
  features: string[];
  limits: {
    events: number;
    participants: number;
    templates: number;
    storage: number;
    emailsPerMonth: number;
  };
  isPopular?: boolean;
}

export default function Pricing() {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  const { data: plans = [] } = useQuery<Plan[]>({
    queryKey: ["/api/plans"],
  });

  const { data: currentSubscription } = useQuery({
    queryKey: ["/api/subscription"],
    enabled: isAuthenticated,
  });

  const subscribeMutation = useMutation({
    mutationFn: async (planData: { planId: string; paymentMethod: string }) => {
      return apiRequest('POST', '/api/subscription', planData);
    },
    onSuccess: (data) => {
      toast({
        title: "Sucesso!",
        description: data.message || "Plano ativado com sucesso!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/subscription"] });
      
      if (data.paymentUrl) {
        window.open(data.paymentUrl, '_blank');
      }
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao contratar plano",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubscribe = (planId: string) => {
    if (!isAuthenticated) {
      window.location.href = '/api/login';
      return;
    }

    setSelectedPlan(planId);
    
    if (planId === 'free') {
      subscribeMutation.mutate({
        planId,
        paymentMethod: 'free'
      });
    } else {
      // For paid plans, default to PIX for simplicity
      subscribeMutation.mutate({
        planId,
        paymentMethod: 'pix'
      });
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  const formatLimit = (limit: number) => {
    return limit === -1 ? 'Ilimitado' : limit.toLocaleString();
  };

  const getCardClassName = (plan: Plan) => {
    const baseClass = "h-full transition-all duration-300 hover:shadow-lg";
    if (plan.isPopular) {
      return `${baseClass} border-2 border-primary shadow-lg scale-105`;
    }
    if (currentSubscription?.planId === plan.id) {
      return `${baseClass} border-2 border-secondary`;
    }
    return `${baseClass} border border-gray-200`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/">
            <div className="flex items-center space-x-2 cursor-pointer">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Calendar className="w-4 h-4 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">EventFlow</span>
            </div>
          </Link>
          
          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <Link href="/">
                <Button variant="outline">Dashboard</Button>
              </Link>
            ) : (
              <Button 
                onClick={() => window.location.href = '/api/login'}
                data-testid="button-login"
              >
                Entrar
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6" data-testid="text-pricing-title">
            Escolha o plano ideal para seu negócio
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Comece grátis e evolua conforme seu negócio cresce. 
            Todos os planos incluem nosso editor visual e pagamentos brasileiros.
          </p>
          
          {/* Trust Badge */}
          <div className="flex items-center justify-center space-x-8 text-sm text-gray-500 mb-8">
            <div className="flex items-center space-x-2">
              <Check className="w-4 h-4 text-green-500" />
              <span>Teste grátis 14 dias</span>
            </div>
            <div className="flex items-center space-x-2">
              <Check className="w-4 h-4 text-green-500" />
              <span>Cancele quando quiser</span>
            </div>
            <div className="flex items-center space-x-2">
              <Check className="w-4 h-4 text-green-500" />
              <span>Suporte brasileiro</span>
            </div>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          {plans.map((plan) => (
            <Card key={plan.id} className={getCardClassName(plan)} data-testid={`card-plan-${plan.id}`}>
              {plan.isPopular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-gradient-to-r from-primary to-secondary text-white px-4 py-1">
                    <Star className="w-3 h-3 mr-1" />
                    Mais Popular
                  </Badge>
                </div>
              )}
              
              <CardHeader className="text-center pb-4">
                <div className="mb-4">
                  {plan.id === 'free' && <Smartphone className="w-8 h-8 mx-auto text-blue-500" />}
                  {plan.id === 'starter' && <Calendar className="w-8 h-8 mx-auto text-green-500" />}
                  {plan.id === 'professional' && <Crown className="w-8 h-8 mx-auto text-purple-500" />}
                  {plan.id === 'enterprise' && <Star className="w-8 h-8 mx-auto text-orange-500" />}
                </div>
                
                <CardTitle className="text-xl font-bold" data-testid={`text-plan-name-${plan.id}`}>
                  {plan.name}
                </CardTitle>
                <p className="text-gray-600 text-sm mt-2">{plan.description}</p>
                
                <div className="mt-4">
                  <div className="text-3xl font-bold text-gray-900" data-testid={`text-plan-price-${plan.id}`}>
                    {plan.price === 0 ? 'Grátis' : formatPrice(plan.price)}
                  </div>
                  {plan.price > 0 && (
                    <div className="text-sm text-gray-500">por mês</div>
                  )}
                </div>
                
                {currentSubscription?.planId === plan.id && (
                  <Badge variant="secondary" className="mt-2">Plano Atual</Badge>
                )}
              </CardHeader>
              
              <CardContent className="flex-1 flex flex-col">
                <ul className="space-y-3 flex-1 mb-6">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start space-x-2">
                      <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-600">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                {/* Limits */}
                <div className="bg-gray-50 rounded-lg p-3 mb-6 text-xs">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="font-medium text-gray-700">Eventos:</span>
                      <span className="text-gray-600 ml-1">{formatLimit(plan.limits.events)}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Participantes:</span>
                      <span className="text-gray-600 ml-1">{formatLimit(plan.limits.participants)}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Storage:</span>
                      <span className="text-gray-600 ml-1">{plan.limits.storage}MB</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Emails:</span>
                      <span className="text-gray-600 ml-1">{formatLimit(plan.limits.emailsPerMonth)}</span>
                    </div>
                  </div>
                </div>
                
                <Button
                  onClick={() => handleSubscribe(plan.id)}
                  disabled={subscribeMutation.isPending && selectedPlan === plan.id}
                  className={`w-full ${plan.isPopular ? 'bg-gradient-to-r from-primary to-secondary hover:from-primary-600 hover:to-secondary-600' : ''}`}
                  variant={plan.isPopular ? 'default' : currentSubscription?.planId === plan.id ? 'secondary' : 'outline'}
                  data-testid={`button-subscribe-${plan.id}`}
                >
                  {subscribeMutation.isPending && selectedPlan === plan.id ? (
                    "Processando..."
                  ) : currentSubscription?.planId === plan.id ? (
                    "Plano Atual"
                  ) : plan.price === 0 ? (
                    "Começar Grátis"
                  ) : (
                    `Assinar ${plan.name}`
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Payment Methods */}
        <div className="bg-white rounded-xl shadow-sm border p-8 mb-16">
          <h3 className="text-2xl font-bold text-center mb-8">Métodos de Pagamento Aceitos</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Smartphone className="w-8 h-8 text-green-600" />
              </div>
              <h4 className="font-semibold mb-2">PIX Instantâneo</h4>
              <p className="text-sm text-gray-600">Pagamento aprovado na hora via PIX</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <CreditCard className="w-8 h-8 text-blue-600" />
              </div>
              <h4 className="font-semibold mb-2">Cartão de Crédito</h4>
              <p className="text-sm text-gray-600">Parcelamento em até 12x sem juros</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-8 h-8 text-orange-600" />
              </div>
              <h4 className="font-semibold mb-2">Boleto Bancário</h4>
              <p className="text-sm text-gray-600">Vencimento em até 3 dias úteis</p>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div className="text-center">
          <h3 className="text-2xl font-bold mb-8">Perguntas Frequentes</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="text-left">
              <h4 className="font-semibold mb-2">Posso cancelar a qualquer momento?</h4>
              <p className="text-gray-600 text-sm">Sim, você pode cancelar sua assinatura a qualquer momento. Não há multas ou taxas de cancelamento.</p>
            </div>
            <div className="text-left">
              <h4 className="font-semibold mb-2">Como funciona o teste grátis?</h4>
              <p className="text-gray-600 text-sm">O teste grátis dura 14 dias e inclui todas as funcionalidades do plano Professional, sem limitações.</p>
            </div>
            <div className="text-left">
              <h4 className="font-semibold mb-2">Qual a taxa por transação?</h4>
              <p className="text-gray-600 text-sm">Cobramos 4,99% + R$ 0,99 por transação paga processada, sem taxas mensais ou de setup.</p>
            </div>
            <div className="text-left">
              <h4 className="font-semibold mb-2">Posso mudar de plano depois?</h4>
              <p className="text-gray-600 text-sm">Sim, você pode fazer upgrade ou downgrade do seu plano a qualquer momento conforme suas necessidades.</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}