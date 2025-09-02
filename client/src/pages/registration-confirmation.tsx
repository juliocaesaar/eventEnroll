import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { CheckCircle, Calendar, MapPin, User, Ticket, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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
}

export default function RegistrationConfirmation() {
  const [, setLocation] = useLocation();
  const [registrationData, setRegistrationData] = useState<RegistrationData | null>(null);
  const [eventData, setEventData] = useState<EventData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Get registration data from URL params or localStorage
    const urlParams = new URLSearchParams(window.location.search);
    const eventSlug = urlParams.get('eventSlug');
    const paymentId = urlParams.get('id');
    
    if (eventSlug && paymentId) {
      // Try to get from localStorage first (if coming from registration)
      const storedData = localStorage.getItem(`registration_${paymentId}`);
      if (storedData) {
        const data = JSON.parse(storedData);
        setRegistrationData(data);
        
        // Fetch event data
        fetchEventData(eventSlug);
        
        // Clean up localStorage
        localStorage.removeItem(`registration_${paymentId}`);
      } else {
        // If no stored data, redirect to home
        setLocation('/');
      }
    } else {
      setLocation('/');
    }
  }, [setLocation]);

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
              : 'Complete o pagamento para confirmar sua inscrição.'
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
                <p className="font-medium mb-2">Código QR para Check-in:</p>
                <div className="bg-gray-100 p-3 rounded-lg text-center">
                  <p className="font-mono text-sm">{registration.qrCode}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          {!isFreeEvent && (
            <Button 
              onClick={handlePayment}
              className="flex-1"
              size="lg"
            >
              <CreditCard className="w-4 h-4 mr-2" />
              {registrationData.totalAmount > 0 ? 'Pagar Agora' : 'Confirmar Inscrição'}
            </Button>
          )}
          
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
            Em caso de dúvidas, entre em contato com os organizadores do evento.
          </p>
        </div>
      </div>
    </div>
  );
}
