import React, { useState } from 'react';
import { useLocation, useParams } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Checkbox } from '../components/ui/checkbox';
import { AlertTriangle, Shield, Users, CreditCard } from 'lucide-react';
import { useToast } from '../hooks/use-toast';

interface RegistrationData {
  name: string;
  email: string;
  phone?: string;
  groupId?: string;
  tickets: Array<{ ticketId: string; quantity: number }>;
  paymentType: 'installments' | 'cash';
}

export default function RegistrationTerms() {
  const [, setLocation] = useLocation();
  const params = useParams<{ slug: string }>();
  const { toast } = useToast();
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedNoRefund, setAcceptedNoRefund] = useState(false);
  const [acceptedGroupRestriction, setAcceptedGroupRestriction] = useState(false);

  // Recuperar dados da inscrição do localStorage ou URL params
  const [registrationData, setRegistrationData] = useState<RegistrationData | null>(null);

  React.useEffect(() => {
    // Tentar recuperar dados do localStorage
    const storedData = localStorage.getItem('pendingRegistration');
    if (storedData) {
      try {
        setRegistrationData(JSON.parse(storedData));
      } catch (error) {
        console.error('Erro ao recuperar dados de inscrição:', error);
        toast({
          title: "Erro",
          description: "Não foi possível recuperar os dados da inscrição. Tente novamente.",
          variant: "destructive",
        });
        setLocation(`/event/${params.slug}`);
      }
    } else {
      // Se não há dados, redirecionar para o evento
      setLocation(`/event/${params.slug}`);
    }
  }, [params.slug, setLocation, toast]);

  const handleConfirmRegistration = () => {
    if (!acceptedTerms || !acceptedNoRefund || !acceptedGroupRestriction) {
      toast({
        title: "Aceite obrigatório",
        description: "Você deve aceitar todos os termos para continuar.",
        variant: "destructive",
      });
      return;
    }

    if (!registrationData) {
      toast({
        title: "Erro",
        description: "Dados de inscrição não encontrados.",
        variant: "destructive",
      });
      return;
    }

    // Fazer a inscrição via API
    handleSubmitRegistration();
  };

  const handleSubmitRegistration = async () => {
    try {
      const response = await fetch(`/api/public/events/${params.slug}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(registrationData),
      });

      const result = await response.json();

      if (result.success) {
        // Limpar dados temporários
        localStorage.removeItem('pendingRegistration');
        
        // Redirecionar para confirmação
        const registrationId = result.registrations?.[0]?.id || result.registrationId;
        const confirmationUrl = `/registration/confirmation?eventSlug=${params.slug}&id=${registrationId}`;
        window.location.href = confirmationUrl;
      } else {
        toast({
          title: "Erro na inscrição",
          description: result.message || "Tente novamente em alguns instantes.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Erro ao processar inscrição:', error);
      toast({
        title: "Erro",
        description: "Erro de conexão. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const handleGoBack = () => {
    setLocation(`/event/${params.slug}`);
  };

  if (!registrationData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Carregando dados da inscrição...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Termos de Serviço
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Confirme sua inscrição lendo e aceitando os termos abaixo
          </p>
        </div>

        <div className="space-y-6">
          {/* Resumo da Inscrição */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <CreditCard className="w-5 h-5" />
                <span>Resumo da Inscrição</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Nome:</p>
                  <p className="text-gray-900 dark:text-white">{registrationData.name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Email:</p>
                  <p className="text-gray-900 dark:text-white">{registrationData.email}</p>
                </div>
                {registrationData.phone && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Telefone:</p>
                    <p className="text-gray-900 dark:text-white">{registrationData.phone}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Forma de Pagamento:</p>
                  <p className="text-gray-900 dark:text-white">
                    {registrationData.paymentType === 'cash' ? 'À Vista' : 'Parcelado'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Avisos Importantes */}
          <Card className="border-orange-200 dark:border-orange-800">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-orange-700 dark:text-orange-400">
                <AlertTriangle className="w-5 h-5" />
                <span>Avisos Importantes</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Aviso sobre Reembolso */}
              <div className="flex items-start space-x-3 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                <Shield className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="font-semibold text-red-800 dark:text-red-300 mb-2">
                    Política de Reembolso
                  </h3>
                  <p className="text-red-700 dark:text-red-400 text-sm">
                    <strong>ATENÇÃO:</strong> Ao confirmar sua inscrição, você concorda que não haverá opção de reembolso. 
                    Uma vez confirmada a inscrição, o pagamento não poderá ser estornado, exceto em casos de cancelamento 
                    do evento por parte da organização.
                  </p>
                </div>
              </div>

              {/* Aviso sobre Troca de Grupo */}
              <div className="flex items-start space-x-3 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                <Users className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="font-semibold text-yellow-800 dark:text-yellow-300 mb-2">
                    Restrição de Troca de Grupo
                  </h3>
                  <p className="text-yellow-700 dark:text-yellow-400 text-sm">
                    <strong>IMPORTANTE:</strong> Após a escolha do grupo, não será possível alterar sua participação 
                    para outro grupo. Certifique-se de que selecionou o grupo correto antes de confirmar sua inscrição.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Termos de Aceite */}
          <Card>
            <CardHeader>
              <CardTitle>Confirmação de Aceite</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="terms"
                  checked={acceptedTerms}
                  onCheckedChange={(checked) => setAcceptedTerms(checked as boolean)}
                />
                <label htmlFor="terms" className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
                  Li e aceito os <strong>Termos de Uso</strong> e <strong>Política de Privacidade</strong> da plataforma.
                </label>
              </div>

              <div className="flex items-start space-x-3">
                <Checkbox
                  id="no-refund"
                  checked={acceptedNoRefund}
                  onCheckedChange={(checked) => setAcceptedNoRefund(checked as boolean)}
                />
                <label htmlFor="no-refund" className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
                  Entendo e aceito que <strong>não haverá opção de reembolso</strong> após a confirmação da inscrição.
                </label>
              </div>

              <div className="flex items-start space-x-3">
                <Checkbox
                  id="group-restriction"
                  checked={acceptedGroupRestriction}
                  onCheckedChange={(checked) => setAcceptedGroupRestriction(checked as boolean)}
                />
                <label htmlFor="group-restriction" className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
                  Entendo que <strong>não será possível trocar de grupo</strong> após a confirmação da inscrição.
                </label>
              </div>
            </CardContent>
          </Card>

          {/* Botões de Ação */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              variant="outline"
              onClick={handleGoBack}
              className="w-full sm:w-auto"
            >
              Voltar e Revisar
            </Button>
            <Button
              onClick={handleConfirmRegistration}
              disabled={!acceptedTerms || !acceptedNoRefund || !acceptedGroupRestriction}
              className="w-full sm:w-auto"
            >
              Confirmar Inscrição
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
