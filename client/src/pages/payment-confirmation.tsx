import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, QrCode, Smartphone, ArrowLeft, MessageCircle, Copy, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function PaymentConfirmation() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [paymentCompleted, setPaymentCompleted] = useState(false);
  const [copiedPix, setCopiedPix] = useState(false);

  // Get URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  const registrationId = urlParams.get('registrationId') || '';
  const eventSlug = urlParams.get('eventSlug') || '';

  // Fetch registration and event data
  const { data: registration, isLoading: registrationLoading } = useQuery({
    queryKey: [`/api/registrations/${registrationId}`],
    enabled: !!registrationId,
  });

  const { data: event } = useQuery({
    queryKey: [`/api/public/events/${eventSlug}`],
    enabled: !!eventSlug,
  });

  // Generate PIX QR Code
  const generatePixQrMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('POST', `/api/payments/generate-pix-qr`, {
        registrationId,
        amount: registration?.totalAmount || 0,
        pixUrl: event?.pixUrl
      });
    },
    onSuccess: (data) => {
      toast({
        title: "QR Code gerado!",
        description: "Escaneie o código ou copie o PIX para pagar.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao gerar QR Code",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Manual payment confirmation
  const confirmPaymentMutation = useMutation({
    mutationFn: async (data: { registrationId: string; paymentProof?: string }) => {
      return apiRequest('POST', `/api/payments/confirm-manual`, data);
    },
    onSuccess: () => {
      setPaymentCompleted(true);
      toast({
        title: "Pagamento confirmado!",
        description: "Sua inscrição foi confirmada com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao confirmar pagamento",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const copyPixToClipboard = async () => {
    if (event?.pixUrl) {
      try {
        await navigator.clipboard.writeText(event.pixUrl);
        setCopiedPix(true);
        toast({
          title: "PIX copiado!",
          description: "Cole no seu app de pagamento.",
        });
        setTimeout(() => setCopiedPix(false), 2000);
      } catch (error) {
        toast({
          title: "Erro ao copiar",
          description: "Tente copiar manualmente.",
          variant: "destructive",
        });
      }
    }
  };

  const generateWhatsAppMessage = () => {
    if (!registration || !event) return '';
    
    const groupInfo = registration.groupId && registration.group ? 
      `- Grupo: ${registration.group.name}\n` : '';
    
    const message = `Olá! Me inscrevi no evento "${event.title}"${registration.group ? ` no grupo "${registration.group.name}"` : ''} e gostaria de solicitar o pagamento da parcela de entrada.

Meus dados:
- Nome: ${registration.firstName} ${registration.lastName}
- Email: ${registration.email}
- ID da inscrição: ${registration.id}${groupInfo}
- Valor total: ${formatCurrency(registration.totalAmount || 0)}

Por favor, me envie os dados para pagamento da parcela de entrada.`;
    
    return message;
  };

  const getWhatsAppUrl = () => {
    // Priorizar WhatsApp do grupo se disponível, senão usar do evento
    const whatsappNumber = registration?.groupId ? 
      (registration.group?.whatsappNumber || event?.whatsappNumber) : 
      event?.whatsappNumber;
    
    if (!whatsappNumber) return '';
    const cleanNumber = whatsappNumber.replace(/\D/g, '');
    return `https://wa.me/${cleanNumber}?text=${encodeURIComponent(generateWhatsAppMessage())}`;
  };

  if (registrationLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando informações do pagamento...</p>
        </div>
      </div>
    );
  }

  if (paymentCompleted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Pagamento Confirmado!
              </h2>
              <p className="text-gray-600 mb-6">
                Sua inscrição foi confirmada com sucesso.
              </p>
              <Button 
                onClick={() => setLocation(`/registration/confirmation?eventSlug=${eventSlug}&id=${registrationId}`)}
                className="w-full"
              >
                Ver Confirmação
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!registration || !event) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                Inscrição não encontrada
              </h2>
              <p className="text-gray-600 mb-4">
                Não foi possível encontrar os dados da inscrição.
              </p>
              <Button onClick={() => setLocation('/')} variant="outline">
                Voltar ao início
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <Button
            variant="ghost"
            onClick={() => setLocation(`/events/${eventSlug}`)}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar ao evento
          </Button>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Confirmação de Pagamento
          </h1>
          <p className="text-gray-600">
            Complete seu pagamento para confirmar a inscrição
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Payment Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Smartphone className="h-5 w-5 mr-2" />
                Detalhes do Pagamento
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-gray-500">Evento</Label>
                <p className="text-lg font-semibold">{event.title}</p>
              </div>
              
              <div>
                <Label className="text-sm font-medium text-gray-500">Participante</Label>
                <p className="text-lg">{registration.firstName} {registration.lastName}</p>
                <p className="text-sm text-gray-600">{registration.email}</p>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-500">Valor Total</Label>
                <p className="text-2xl font-bold text-primary">
                  {formatCurrency(registration.totalAmount || 0)}
                </p>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-500">Status</Label>
                <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                  Aguardando Pagamento
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* PIX Payment */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <QrCode className="h-5 w-5 mr-2" />
                Pagamento PIX
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {event.pixUrl ? (
                <>
                  <div className="text-center">
                    <div className="bg-white p-4 rounded-lg border-2 border-dashed border-gray-300 mb-4">
                      <QrCode className="h-24 w-24 mx-auto text-gray-400" />
                      <p className="text-sm text-gray-500 mt-2">
                        QR Code será gerado aqui
                      </p>
                    </div>
                    
                    <Button
                      onClick={() => generatePixQrMutation.mutate()}
                      disabled={generatePixQrMutation.isPending}
                      className="w-full mb-4"
                    >
                      {generatePixQrMutation.isPending ? 'Gerando...' : 'Gerar QR Code PIX'}
                    </Button>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-gray-500">PIX Copia e Cola</Label>
                    <div className="flex gap-2">
                      <Input
                        value={event.pixUrl}
                        readOnly
                        className="text-xs"
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={copyPixToClipboard}
                        disabled={copiedPix}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    {copiedPix && (
                      <p className="text-xs text-green-600 mt-1">PIX copiado!</p>
                    )}
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">
                    PIX não configurado para este evento
                  </p>
                  <p className="text-sm text-gray-400">
                    Entre em contato com o organizador
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* WhatsApp Contact */}
        {(event.whatsappNumber || (registration?.groupId && registration?.group?.whatsappNumber)) && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center">
                <MessageCircle className="h-5 w-5 mr-2" />
                Contato via WhatsApp
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Após realizar o pagamento, entre em contato com {registration?.groupId && registration?.group ? 'o gestor do grupo' : 'o organizador'} para confirmar:
              </p>
              
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <p className="text-sm text-gray-700 mb-2">
                  <strong>Mensagem pré-formatada:</strong>
                </p>
                <Textarea
                  value={generateWhatsAppMessage()}
                  readOnly
                  className="text-xs bg-white"
                  rows={6}
                />
              </div>

              <Button
                onClick={() => window.open(getWhatsAppUrl(), '_blank')}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                Enviar WhatsApp
                <ExternalLink className="h-4 w-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Manual Confirmation (for organizers) */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Confirmação Manual</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              Se você é o organizador e recebeu o pagamento, pode confirmar manualmente:
            </p>
            
            <Button
              onClick={() => confirmPaymentMutation.mutate({ registrationId })}
              disabled={confirmPaymentMutation.isPending}
              variant="outline"
              className="w-full"
            >
              {confirmPaymentMutation.isPending ? 'Confirmando...' : 'Confirmar Pagamento'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
