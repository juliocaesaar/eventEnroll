import { useEffect, useState, useRef } from "react";
import { useLocation } from "wouter";
import { CheckCircle, Calendar, MapPin, User, Ticket, CreditCard, ArrowLeft, QrCode, MessageCircle, Copy, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface RegistrationData {
  success: boolean;
  paymentUrl: string;
  paymentId: string;
  totalAmount: number;
  registrations: Array<{
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string;
    status: string;
    amountPaid: string;
    qrCode: string;
    createdAt: string;
  }>;
}

interface EventData {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  venueName: string;
  venueAddress: string;
  imageUrl: string;
  pixUrl?: string;
  whatsappNumber?: string;
}

export default function RegistrationConfirmation() {
  const [, setLocation] = useLocation();
  const [registrationData, setRegistrationData] = useState<RegistrationData | null>(null);
  const [eventData, setEventData] = useState<EventData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [pixQrCodeDataUrl, setPixQrCodeDataUrl] = useState<string>('');
  const [copiedPix, setCopiedPix] = useState(false);
  const qrCodeRef = useRef<HTMLCanvasElement>(null);
  const pixQrCodeRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    // Get registration data from URL params or localStorage
    const urlParams = new URLSearchParams(window.location.search);
    const eventSlug = urlParams.get('eventSlug');
    const sessionId = urlParams.get('session_id'); // Stripe session ID
    const registrationId = urlParams.get('id'); // Registration ID
    
    console.log('URL params:', { eventSlug, sessionId, registrationId });
    
    if (sessionId || registrationId) {
      // Try to get from localStorage first (if coming from registration)
      const storedData = localStorage.getItem(`registration_${registrationId || sessionId}`);
      if (storedData) {
        const data = JSON.parse(storedData);
        setRegistrationData(data);
        
        // Fetch event data if we have eventSlug
        if (eventSlug) {
          fetchEventData(eventSlug);
        }
        
        // Clean up localStorage
        localStorage.removeItem(`registration_${registrationId || sessionId}`);
      } else if (sessionId) {
        // If we have a Stripe session ID, fetch the session data
        fetchStripeSessionData(sessionId, eventSlug);
      } else if (registrationId) {
        // If we have a registration ID, fetch registration data
        fetchRegistrationData(registrationId, eventSlug || '');
      } else {
        // If no stored data, redirect to home
        setLocation('/');
      }
    } else {
      setLocation('/');
    }
  }, [setLocation]);

  // Gerar QR Code quando os dados da inscrição estiverem disponíveis
  useEffect(() => {
    console.log('🔍 Verificando dados para QR Code:', registrationData);
    if (registrationData?.registrations?.[0]?.qrCode) {
      console.log('📱 QR Code encontrado:', registrationData.registrations[0].qrCode);
      // Aguardar um pouco para garantir que o canvas foi renderizado
      setTimeout(() => {
        generateQRCode(registrationData.registrations[0].qrCode);
      }, 100);
    } else {
      console.log('❌ QR Code não encontrado nos dados');
    }
  }, [registrationData]);

  // Gerar QR Code PIX quando os dados do evento estiverem disponíveis
  useEffect(() => {
    if (eventData?.pixUrl && registrationData && registrationData.totalAmount > 0) {
      console.log('💰 Gerando QR Code PIX para:', eventData.pixUrl);
      setTimeout(() => {
        generatePixQRCode(eventData.pixUrl);
      }, 200);
    }
  }, [eventData, registrationData]);

  const fetchStripeSessionData = async (sessionId: string, eventSlug?: string | null) => {
    try {
      console.log('🔄 Confirmando pagamento para session:', sessionId);
      
      // Primeiro, confirmar o pagamento e atualizar a inscrição
      const confirmResponse = await fetch('/api/stripe/confirm-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sessionId }),
      });

      if (confirmResponse.ok) {
        const confirmData = await confirmResponse.json();
        console.log('✅ Pagamento confirmado:', confirmData);
      } else {
        console.error('❌ Erro ao confirmar pagamento:', await confirmResponse.text());
      }

      // Depois, buscar dados da sessão para exibir
      const response = await fetch(`/api/stripe/session/${sessionId}`);
      if (response.ok) {
        const sessionData = await response.json();
        
        // Create registration data from Stripe session
        const stripeRegistrationData = {
          success: true,
          paymentUrl: '',
          paymentId: sessionId,
          totalAmount: sessionData.amount_total / 100, // Convert from cents
          registrations: [{
            id: `stripe_${sessionId}`,
            firstName: sessionData.customer_details?.name?.split(' ')[0] || 'N/A',
            lastName: sessionData.customer_details?.name?.split(' ').slice(1).join(' ') || 'N/A',
            email: sessionData.customer_details?.email || 'N/A',
            phoneNumber: sessionData.customer_details?.phone || null,
            status: sessionData.payment_status === 'paid' ? 'confirmed' : 'pending',
            amountPaid: (sessionData.amount_total / 100).toFixed(2),
            qrCode: `QR_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            createdAt: new Date().toISOString(),
          }]
        };
        
        setRegistrationData(stripeRegistrationData);
        
        // Buscar dados do evento - priorizar eventSlug da URL, depois dos metadados
        const finalEventSlug = eventSlug || sessionData.metadata?.eventSlug;
        if (finalEventSlug) {
          console.log('🎯 Buscando dados do evento com slug:', finalEventSlug);
          fetchEventData(finalEventSlug);
        } else {
          console.warn('⚠️ EventSlug não encontrado na URL nem nos metadados da sessão');
          setIsLoading(false);
        }
      } else {
        console.error('Erro ao buscar dados da sessão Stripe');
        setLocation('/');
      }
    } catch (error) {
      console.error('Erro ao buscar dados da sessão Stripe:', error);
      setLocation('/');
    }
  };

  const fetchRegistrationData = async (registrationId: string, eventSlug: string) => {
    try {
      console.log('🔄 Buscando dados da inscrição:', registrationId);
      
      // Buscar dados reais da inscrição
      const response = await fetch(`/api/registrations/${registrationId}`);
      if (response.ok) {
        const registrationData = await response.json();
        console.log('✅ Dados da inscrição recebidos:', registrationData);
        setRegistrationData(registrationData);
      } else {
        console.error('❌ Erro ao buscar dados da inscrição:', response.status);
        // Fallback para dados mockados se a API falhar
        const mockRegistrationData = {
          success: true,
          paymentUrl: '',
          paymentId: registrationId,
          totalAmount: 0,
          registrations: [{
            id: registrationId,
            firstName: 'Dados não encontrados',
            lastName: '',
            email: 'dados@nao.encontrados',
            phoneNumber: '',
            status: 'confirmed',
            amountPaid: '0.00',
            qrCode: `QR_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            createdAt: new Date().toISOString(),
          }]
        };
        setRegistrationData(mockRegistrationData);
      }
      
      fetchEventData(eventSlug);
    } catch (error) {
      console.error('Erro ao buscar dados da inscrição:', error);
      setLocation('/');
    }
  };

  const generateQRCode = async (qrCodeString: string) => {
    try {
      console.log('🔄 Gerando QR Code para:', qrCodeString);
      
      // Aguardar um pouco mais se o canvas ainda não estiver disponível
      let canvas = qrCodeRef.current;
      let attempts = 0;
      const maxAttempts = 10;
      
      while (!canvas && attempts < maxAttempts) {
        console.log(`⏳ Aguardando canvas... tentativa ${attempts + 1}/${maxAttempts}`);
        await new Promise(resolve => setTimeout(resolve, 50));
        canvas = qrCodeRef.current;
        attempts++;
      }
      
      if (canvas) {
        console.log('✅ Canvas encontrado, gerando QR Code...');
        const QRCode = await import('qrcode');
        await QRCode.toCanvas(canvas, qrCodeString, {
          width: 200,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        });
        const dataUrl = canvas.toDataURL();
        console.log('✅ QR Code gerado com sucesso');
        setQrCodeDataUrl(dataUrl);
      } else {
        console.error('❌ Canvas não encontrado após', maxAttempts, 'tentativas');
      }
    } catch (error) {
      console.error('❌ Erro ao gerar QR Code:', error);
    }
  };

  const generatePixQRCode = async (pixUrl: string | undefined) => {
    if (!pixUrl) return;
    try {
      console.log('🔄 Gerando QR Code PIX para:', pixUrl);
      
      let canvas = pixQrCodeRef.current;
      let attempts = 0;
      const maxAttempts = 10;
      
      while (!canvas && attempts < maxAttempts) {
        console.log(`⏳ Aguardando canvas PIX... tentativa ${attempts + 1}/${maxAttempts}`);
        await new Promise(resolve => setTimeout(resolve, 50));
        canvas = pixQrCodeRef.current;
        attempts++;
      }
      
      if (canvas) {
        console.log('✅ Canvas PIX encontrado, gerando QR Code...');
        const QRCode = await import('qrcode');
        await QRCode.toCanvas(canvas, pixUrl, {
          width: 200,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        });
        const dataUrl = canvas.toDataURL();
        console.log('✅ QR Code PIX gerado com sucesso');
        setPixQrCodeDataUrl(dataUrl);
      } else {
        console.error('❌ Canvas PIX não encontrado após', maxAttempts, 'tentativas');
      }
    } catch (error) {
      console.error('❌ Erro ao gerar QR Code PIX:', error);
    }
  };

  const copyPixToClipboard = async () => {
    if (eventData?.pixUrl) {
      try {
        await navigator.clipboard.writeText(eventData.pixUrl);
        setCopiedPix(true);
        setTimeout(() => setCopiedPix(false), 2000);
      } catch (error) {
        console.error('Erro ao copiar PIX:', error);
      }
    }
  };

  const generateWhatsAppMessage = () => {
    if (!registrationData || !eventData) return '';
    
    const registration = registrationData.registrations[0];
    const message = `Olá! Me inscrevi no evento "${eventData.title}" e gostaria de solicitar o pagamento da parcela de entrada.

Meus dados:
- Nome: ${registration.firstName} ${registration.lastName}
- Email: ${registration.email}
- ID da inscrição: ${registration.id}
- Valor total: R$ ${registrationData.totalAmount.toFixed(2)}

Por favor, me envie os dados para pagamento da parcela de entrada.`;
    
    return message;
  };

  const getWhatsAppUrl = () => {
    if (!eventData?.whatsappNumber) return '';
    const cleanNumber = eventData.whatsappNumber.replace(/\D/g, '');
    return `https://wa.me/${cleanNumber}?text=${encodeURIComponent(generateWhatsAppMessage())}`;
  };

  const fetchEventData = async (eventSlug: string) => {
    try {
      const response = await fetch(`/api/public/events/${eventSlug}`);
      if (response.ok) {
        const event = await response.json();
        setEventData(event);
      }
    } catch (error) {
      console.error('Error fetching event data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePayment = () => {
    if (registrationData?.paymentUrl) {
      window.location.href = registrationData.paymentUrl;
    }
  };

  const handleBackToEvent = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const eventSlug = urlParams.get('eventSlug');
    if (eventSlug) {
      setLocation(`/event/${eventSlug}`);
    } else {
      setLocation('/');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando confirmação...</p>
        </div>
      </div>
    );
  }

  if (!registrationData || !eventData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Dados de inscrição não encontrados</p>
          <Button onClick={() => setLocation('/')} className="mt-4">
            Voltar ao Início
          </Button>
        </div>
      </div>
    );
  }

  const registration = registrationData.registrations[0];
  const isFreeEvent = registrationData.totalAmount === 0;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        {/* Success Header */}
        <div className="text-center mb-8">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {isFreeEvent ? 'Inscrição Confirmada!' : 'Inscrição Realizada!'}
          </h1>
          <p className="text-gray-600">
            {isFreeEvent 
              ? 'Sua inscrição foi confirmada com sucesso.'
              : 'Sua inscrição foi realizada! Complete o pagamento e entre em contato via WhatsApp para confirmar.'
            }
          </p>
        </div>

        {/* Event Information */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Informações do Evento
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold text-lg">{eventData.title}</h3>
              <p className="text-gray-600">{eventData.description}</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-500" />
                <div>
                  <p className="font-medium">Data de Início</p>
                  <p className="text-sm text-gray-600">
                    {new Date(eventData.startDate).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </div>
              
              {eventData.endDate && (
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <div>
                    <p className="font-medium">Data de Fim</p>
                    <p className="text-sm text-gray-600">
                      {new Date(eventData.endDate).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {eventData.venueName && (
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-gray-500" />
                <div>
                  <p className="font-medium">Local</p>
                  <p className="text-sm text-gray-600">
                    {eventData.venueName}
                    {eventData.venueAddress && ` - ${eventData.venueAddress}`}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Registration Details */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Sua Inscrição
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="font-medium">Nome</p>
                <p className="text-gray-600">
                  {registration.firstName} {registration.lastName}
                </p>
              </div>
              
              <div>
                <p className="font-medium">Email</p>
                <p className="text-gray-600">{registration.email}</p>
              </div>
              
              {registration.phoneNumber && (
                <div>
                  <p className="font-medium">Telefone</p>
                  <p className="text-gray-600">{registration.phoneNumber}</p>
                </div>
              )}
              
              <div>
                <p className="font-medium">Status</p>
                <Badge 
                  variant={registration.status === 'confirmed' ? 'default' : 'secondary'}
                  className="mt-1"
                >
                  {registration.status === 'confirmed' ? 'Confirmado' : 'Pendente'}
                </Badge>
              </div>
            </div>

            <div className="border-t pt-4">
              <div className="flex items-center justify-between">
                <span className="font-medium">Valor Total:</span>
                <span className="text-lg font-bold text-primary">
                  R$ {registrationData.totalAmount.toFixed(2)}
                </span>
              </div>
            </div>

            {registration.qrCode && (
              <div className="border-t pt-4">
                <p className="font-medium mb-4 text-center">Código QR para Check-in:</p>
                <div className="flex flex-col items-center">
                  <div className="bg-white p-6 rounded-lg border-2 border-gray-200 shadow-sm">
                    {qrCodeDataUrl ? (
                      <div className="flex flex-col items-center">
                        <img 
                          src={qrCodeDataUrl} 
                          alt="QR Code" 
                          className="w-48 h-48"
                        />
                        <p className="font-mono text-xs mt-3 text-gray-600 text-center">
                          {registration.qrCode}
                        </p>
                      </div>
                    ) : (
                      <div className="w-48 h-48 bg-gray-100 rounded-lg flex items-center justify-center">
                        <div className="text-center">
                          <div className="w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                          <p className="text-gray-500 text-sm">Gerando QR Code...</p>
                        </div>
                      </div>
                    )}
                  </div>
                  <canvas 
                    ref={qrCodeRef}
                    style={{ display: 'none' }}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* PIX Payment Section - only show for paid events */}
        {!isFreeEvent && eventData?.pixUrl && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <QrCode className="w-5 h-5" />
                Pagamento PIX
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <div className="bg-white p-6 rounded-lg border-2 border-dashed border-gray-300 mb-4">
                  {pixQrCodeDataUrl ? (
                    <div className="flex flex-col items-center">
                      <img 
                        src={pixQrCodeDataUrl} 
                        alt="QR Code PIX" 
                        className="w-48 h-48"
                      />
                      <p className="text-sm text-gray-600 mt-3">
                        Escaneie o QR Code com seu app de pagamento
                      </p>
                    </div>
                  ) : (
                    <div className="w-48 h-48 bg-gray-100 rounded-lg flex items-center justify-center mx-auto">
                      <div className="text-center">
                        <div className="w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                        <p className="text-gray-500 text-sm">Gerando QR Code PIX...</p>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="max-w-md mx-auto">
                  <Label className="text-sm font-medium text-gray-500">PIX Copia e Cola</Label>
                  <div className="flex gap-2 mt-2">
                    <Input
                      value={eventData.pixUrl}
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
              </div>
              <canvas 
                ref={pixQrCodeRef}
                style={{ display: 'none' }}
              />
            </CardContent>
          </Card>
        )}

        {/* WhatsApp Contact Section */}
        {eventData?.whatsappNumber && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5" />
                Contato via WhatsApp
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Após realizar o pagamento, entre em contato com o organizador para confirmar:
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

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Button 
            variant="outline" 
            onClick={handleBackToEvent}
            className="flex-1"
            size="lg"
          >
            <Ticket className="w-4 h-4 mr-2" />
            Voltar ao Evento
          </Button>
        </div>

        {/* Additional Information */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>Um email de confirmação foi enviado para {registration.email}</p>
          <p className="mt-1">
            {isFreeEvent 
              ? 'Em caso de dúvidas, entre em contato com os organizadores do evento.'
              : 'Após o pagamento, entre em contato via WhatsApp para confirmar sua inscrição.'
            }
          </p>
        </div>
      </div>
    </div>
  );
}
