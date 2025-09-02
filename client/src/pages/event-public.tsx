import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Calendar, MapPin, Clock, Users, CreditCard, Ticket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

export default function EventPublic() {
  const params = useParams<{ slug: string }>();
  const { toast } = useToast();
  const [selectedTickets, setSelectedTickets] = useState<Record<string, number>>({});
  const [registrationData, setRegistrationData] = useState({
    name: '',
    email: '',
    phone: '',
    document: '',
  });

  // Fetch event by slug
  const { data: event, isLoading: eventLoading } = useQuery({
    queryKey: [`/api/public/events/${params.slug}`],
  });

  // Fetch tickets for the event
  const { data: tickets = [] } = useQuery({
    queryKey: [`/api/public/events/${params.slug}/tickets`],
    enabled: !!event,
  });

  // Registration mutation
  const registerMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', `/api/public/events/${params.slug}/register`, data);
      return response.json(); // Parse the response JSON
    },
    onSuccess: (response: any) => {
      if (response.success) {
        // Store registration data in localStorage for confirmation page
        localStorage.setItem(`registration_${response.paymentId}`, JSON.stringify(response));
        
        // Redirect to confirmation page
        const confirmationUrl = `/registration/confirmation?id=${response.paymentId}&eventSlug=${params.slug}`;
        window.location.href = confirmationUrl;
      } else {
        toast({
          title: "Erro na inscrição",
          description: "Tente novamente em alguns instantes.",
          variant: "destructive"
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Erro na inscrição",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleTicketChange = (ticketId: string, quantity: number) => {
    setSelectedTickets(prev => ({
      ...prev,
      [ticketId]: quantity
    }));
  };

  const calculateTotal = () => {
    let total = 0;
    Object.entries(selectedTickets).forEach(([ticketId, quantity]) => {
      const ticket = (tickets as any[]).find((t: any) => t.id === ticketId);
      if (ticket) {
        total += parseFloat(ticket.price || 0) * quantity;
      }
    });
    return total;
  };

  const handleRegister = () => {
    if (!registrationData.name || !registrationData.email) {
      toast({
        title: "Dados obrigatórios",
        description: "Por favor, preencha nome e email.",
        variant: "destructive",
      });
      return;
    }

    const selectedTicketsList = Object.entries(selectedTickets)
      .filter(([, quantity]) => quantity > 0)
      .map(([ticketId, quantity]) => ({ ticketId, quantity }));

    if (selectedTicketsList.length === 0) {
      toast({
        title: "Selecione ingressos",
        description: "Por favor, selecione pelo menos um ingresso.",
        variant: "destructive",
      });
      return;
    }

    registerMutation.mutate({
      ...registrationData,
      tickets: selectedTicketsList,
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (eventLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Carregando evento...</p>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Evento não encontrado</h1>
          <p className="text-gray-600">O evento que você está procurando não existe ou foi removido.</p>
        </div>
      </div>
    );
  }

  const eventData = event as any;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <Badge className="mb-4">{eventData.category?.name}</Badge>
            <h1 className="text-4xl font-bold text-gray-900 mb-6" data-testid="text-event-title">
              {eventData.title}
            </h1>
            <p className="text-xl text-gray-600 mb-8" data-testid="text-event-description">
              {eventData.description}
            </p>
            
            <div className="grid md:grid-cols-3 gap-6 max-w-2xl mx-auto">
              <div className="flex items-center justify-center space-x-2">
                <Calendar className="w-5 h-5 text-primary" />
                <div className="text-sm">
                  <div className="font-medium">Início</div>
                  <div className="text-gray-600">{formatDate(eventData.startDate)}</div>
                </div>
              </div>
              
              {eventData.endDate && (
                <div className="flex items-center justify-center space-x-2">
                  <Clock className="w-5 h-5 text-primary" />
                  <div className="text-sm">
                    <div className="font-medium">Fim</div>
                    <div className="text-gray-600">{formatDate(eventData.endDate)}</div>
                  </div>
                </div>
              )}
              
              <div className="flex items-center justify-center space-x-2">
                <Users className="w-5 h-5 text-primary" />
                <div className="text-sm">
                  <div className="font-medium">Capacidade</div>
                  <div className="text-gray-600">{eventData.capacity} pessoas</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Registration Section */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid md:grid-cols-2 gap-8">
          {/* Ticket Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Ticket className="w-5 h-5" />
                <span>Selecione seus Ingressos</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {(tickets as any[]).length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-600">Nenhum ingresso disponível no momento.</p>
                </div>
              ) : (
                (tickets as any[]).map((ticket: any) => (
                  <div key={ticket.id} className="border rounded-lg p-4" data-testid={`ticket-option-${ticket.id}`}>
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-semibold">{ticket.name}</h3>
                        <p className="text-2xl font-bold text-primary">
                          {parseFloat(ticket.price) === 0 ? 'Gratuito' : `R$ ${parseFloat(ticket.price).toFixed(2)}`}
                        </p>
                        {ticket.description && (
                          <p className="text-sm text-gray-600 mt-1">{ticket.description}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-600">
                          {ticket.sold || 0} / {ticket.quantity}
                        </div>
                        <div className="text-xs text-gray-500">vendidos</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Quantidade:</span>
                      <Select
                        value={selectedTickets[ticket.id]?.toString() || "0"}
                        onValueChange={(value) => handleTicketChange(ticket.id, parseInt(value))}
                      >
                        <SelectTrigger className="w-20">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: Math.min(ticket.maxPerOrder || 10, ticket.quantity - (ticket.sold || 0)) + 1 }, (_, i) => (
                            <SelectItem key={i} value={i.toString()}>{i}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                ))
              )}
              
              {(tickets as any[]).length > 0 && (
                <div className="border-t pt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold">Total:</span>
                    <span className="text-2xl font-bold text-primary" data-testid="text-total-amount">
                      R$ {calculateTotal().toFixed(2)}
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Registration Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <CreditCard className="w-5 h-5" />
                <span>Dados para Inscrição</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name">Nome Completo *</Label>
                <Input
                  id="name"
                  value={registrationData.name}
                  onChange={(e) => setRegistrationData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Seu nome completo"
                  data-testid="input-registration-name"
                />
              </div>
              
              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={registrationData.email}
                  onChange={(e) => setRegistrationData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="seu@email.com"
                  data-testid="input-registration-email"
                />
              </div>
              
              <div>
                <Label htmlFor="phone">Telefone</Label>
                <Input
                  id="phone"
                  value={registrationData.phone}
                  onChange={(e) => setRegistrationData(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="(11) 99999-9999"
                  data-testid="input-registration-phone"
                />
              </div>
              
              <div>
                <Label htmlFor="document">CPF/CNPJ</Label>
                <Input
                  id="document"
                  value={registrationData.document}
                  onChange={(e) => setRegistrationData(prev => ({ ...prev, document: e.target.value }))}
                  placeholder="000.000.000-00"
                  data-testid="input-registration-document"
                />
              </div>
              
              <Button 
                className="w-full" 
                size="lg"
                onClick={handleRegister}
                disabled={registerMutation.isPending || (tickets as any[]).length === 0}
                data-testid="button-register"
              >
                {registerMutation.isPending ? 'Processando...' : 
                 calculateTotal() > 0 ? `Inscrever-se e Pagar R$ ${calculateTotal().toFixed(2)}` : 'Inscrever-se Gratuitamente'}
              </Button>
              
              <p className="text-xs text-gray-600 text-center">
                Ao se inscrever, você concorda com nossos termos de uso e política de privacidade.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Event Content */}
      {eventData.pageComponents && eventData.pageComponents.length > 0 && (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Card>
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold mb-6">Sobre o Evento</h2>
              <div className="space-y-6">
                {eventData.pageComponents.map((component: any, index: number) => (
                  <div key={index} data-testid={`component-${component.type}-${index}`}>
                    {component.type === 'header' && (
                      <div className="text-center">
                        <h3 className="text-3xl font-bold mb-2">{component.props?.title}</h3>
                        {component.props?.subtitle && (
                          <p className="text-xl text-gray-600">{component.props.subtitle}</p>
                        )}
                      </div>
                    )}
                    {component.type === 'text' && (
                      <div className="prose max-w-none">
                        <p className={component.props?.size === 'large' ? 'text-lg' : component.props?.size === 'small' ? 'text-sm' : 'text-base'}>
                          {component.props?.content}
                        </p>
                      </div>
                    )}
                    {component.type === 'image' && component.props?.src && (
                      <div className="text-center">
                        <img 
                          src={component.props.src} 
                          alt={component.props.alt || 'Imagem do evento'}
                          className="max-w-full h-auto mx-auto rounded-lg shadow-md"
                          style={{ width: component.props.width || '100%' }}
                        />
                      </div>
                    )}
                    {component.type === 'button' && (
                      <div className="text-center">
                        <Button 
                          size="lg" 
                          className={component.props?.variant === 'secondary' ? 'bg-secondary' : ''}
                          onClick={() => component.props?.link && window.open(component.props.link, '_blank')}
                        >
                          {component.props?.text}
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}