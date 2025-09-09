import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Calendar, MapPin, Clock, Users, CreditCard, Ticket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { EventHeader } from "@/components/event-site/EventHeader";
import { EventFooter } from "@/components/event-site/EventFooter";
import { EventCarousel } from "@/components/event-site/EventCarousel";
import { EventSections } from "@/components/event-site/EventSections";

export default function EventPublic() {
  const params = useParams<{ slug: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [selectedTicket, setSelectedTicket] = useState<string>('');
  const [ticketQuantity, setTicketQuantity] = useState<number>(1);
  const [paymentType, setPaymentType] = useState<'installments' | 'cash'>('installments');
  const [registrationData, setRegistrationData] = useState({
    name: '',
    email: '',
    phone: '',
    groupId: '',
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

  // Fetch groups for the event
  const { data: groups = [] } = useQuery({
    queryKey: [`/api/events/${(event as any)?.id}/groups`],
    enabled: !!event,
  }) as { data: any[] };


  const getSelectedTicketPrice = () => {
    if (!selectedTicket) return 0;
    const ticket = (tickets as any[]).find((t: any) => t.id === selectedTicket);
    if (!ticket) return 0;
    
    const basePrice = parseFloat(ticket.price || 0) * ticketQuantity;
    
    // Aplicar desconto de R$ 20,00 se for pagamento à vista
    if (paymentType === 'cash') {
      return Math.max(0, basePrice - 20); // Não permitir valor negativo
    }
    
    return basePrice;
  };

  const getSelectedTicket = () => {
    if (!selectedTicket) return null;
    return (tickets as any[]).find((t: any) => t.id === selectedTicket);
  };

  const handleTicketChange = (ticketId: string) => {
    setSelectedTicket(ticketId);
    setTicketQuantity(1); // Reset quantity when ticket changes
  };

  const isTicketExpired = (ticket: any) => {
    if (!ticket.salesEnd) return false;
    return new Date(ticket.salesEnd) < new Date();
  };

  const formatTicketExpiration = (ticket: any) => {
    if (!ticket.salesEnd) return null;
    const endDate = new Date(ticket.salesEnd);
    return endDate.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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

    if (!selectedTicket) {
      toast({
        title: "Selecione um ingresso",
        description: "Por favor, selecione um ingresso.",
        variant: "destructive",
      });
      return;
    }

    // Verificar se o ingresso selecionado não está expirado
    const selectedTicketData = (tickets as any[]).find((t: any) => t.id === selectedTicket);
    if (selectedTicketData && isTicketExpired(selectedTicketData)) {
      toast({
        title: "Ingresso indisponível",
        description: "Este ingresso não está mais disponível para venda.",
        variant: "destructive",
      });
      return;
    }

    // Preparar dados da inscrição
    const registrationPayload = {
      ...registrationData,
      groupId: registrationData.groupId === 'none' ? '' : registrationData.groupId,
      tickets: [{ ticketId: selectedTicket, quantity: ticketQuantity }],
      paymentType: paymentType,
    };

    // Salvar dados no localStorage para a página de termos
    localStorage.setItem('pendingRegistration', JSON.stringify(registrationPayload));

    // Redirecionar para página de termos
    setLocation(`/registration/terms/${params.slug}`);
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

  // Preparar dados para o carrossel
  const carouselSlides = [
    {
      id: '1',
      title: eventData.title,
      subtitle: 'Não perca esta oportunidade única!',
      description: eventData.description,
      image: eventData.imageUrl || 'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
      ctaText: 'Inscrever-se Agora',
      ctaAction: () => {
        document.getElementById('registration-section')?.scrollIntoView({ behavior: 'smooth' });
      }
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Carrossel */}
      <EventCarousel slides={carouselSlides} />
      
      {/* Header com informações do evento */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <EventHeader event={eventData} />
      </div>

      {/* Registration Section */}
      <div id="registration-section" className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid md:grid-cols-2 gap-8">
          {/* Ticket Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Ticket className="w-5 h-5" />
                <span>Selecione seu Ingresso</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {(tickets as any[]).length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-600">Nenhum ingresso disponível no momento.</p>
                </div>
              ) : (tickets as any[]).every((ticket: any) => isTicketExpired(ticket)) ? (
                <div className="text-center py-8">
                  <p className="text-gray-600">Todas as vendas de ingressos foram encerradas.</p>
                </div>
              ) : (
                <>
                  <div>
                    <Label htmlFor="ticket-select">Tipo de Ingresso *</Label>
                    <Select
                      value={selectedTicket}
                      onValueChange={handleTicketChange}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um ingresso" />
                      </SelectTrigger>
                      <SelectContent>
                        {(tickets as any[]).map((ticket: any) => {
                          const expired = isTicketExpired(ticket);
                          const expirationDate = formatTicketExpiration(ticket);
                          
                          return (
                            <SelectItem 
                              key={ticket.id} 
                              value={ticket.id}
                              disabled={expired}
                              className={expired ? "opacity-50 cursor-not-allowed" : ""}
                            >
                              <div className="flex justify-between items-center w-full">
                                <div className="flex-1">
                                  <div className={`font-medium ${expired ? 'text-gray-500' : ''}`}>
                                    {ticket.name}
                                  </div>
                                  {ticket.description && (
                                    <div className={`text-sm ${expired ? 'text-gray-400' : 'text-gray-600'}`}>
                                      {ticket.description}
                                    </div>
                                  )}
                                  {expired && expirationDate && (
                                    <div className="text-xs text-red-500 mt-1">
                                      Vendas encerradas em: {expirationDate}
                                    </div>
                                  )}
                                </div>
                                <div className="ml-4 text-right">
                                  <div className={`font-bold ${expired ? 'text-gray-500' : 'text-primary'}`}>
                                    {parseFloat(ticket.price) === 0 ? 'Gratuito' : `R$ ${parseFloat(ticket.price).toFixed(2)}`}
                                  </div>
                                  {expired && (
                                    <div className="text-xs text-red-500">
                                      Indisponível
                                    </div>
                                  )}
                                </div>
                              </div>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {selectedTicket && (
                    <>
                      <div>
                        <Label htmlFor="quantity">Quantidade *</Label>
                        <div className="flex items-center space-x-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setTicketQuantity(Math.max(1, ticketQuantity - 1))}
                            disabled={ticketQuantity <= 1}
                          >
                            -
                          </Button>
                          <Input
                            id="quantity"
                            type="number"
                            min="1"
                            max={getSelectedTicket()?.maxPerOrder || 10}
                            value={ticketQuantity}
                            onChange={(e) => {
                              const value = parseInt(e.target.value) || 1;
                              const max = getSelectedTicket()?.maxPerOrder || 10;
                              setTicketQuantity(Math.min(Math.max(1, value), max));
                            }}
                            className="w-20 text-center"
                            data-testid="input-ticket-quantity"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const max = getSelectedTicket()?.maxPerOrder || 10;
                              setTicketQuantity(Math.min(max, ticketQuantity + 1));
                            }}
                            disabled={ticketQuantity >= (getSelectedTicket()?.maxPerOrder || 10)}
                          >
                            +
                          </Button>
                        </div>
                        {getSelectedTicket()?.maxPerOrder && (
                          <p className="text-xs text-gray-500 mt-1">
                            Máximo: {getSelectedTicket()?.maxPerOrder} por pedido
                          </p>
                        )}
                      </div>
                      
                      <div className="border-t pt-4">
                        <div className="flex justify-between items-center">
                          <span className="text-lg font-semibold">Total:</span>
                          <span className="text-2xl font-bold text-primary" data-testid="text-total-amount">
                            {getSelectedTicketPrice() === 0 ? 'Gratuito' : `R$ ${getSelectedTicketPrice().toFixed(2)}`}
                          </span>
                        </div>
                        {ticketQuantity > 1 && (
                          <div className="text-sm text-gray-600 mt-1">
                            {ticketQuantity} × R$ {getSelectedTicket()?.price ? parseFloat(getSelectedTicket().price).toFixed(2) : '0.00'}
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </>
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

              {/* Group Selection - only show if event has groups */}
              {groups && groups.length > 0 && (
                <div>
                  <Label htmlFor="group">Grupo</Label>
                  <Select
                    value={registrationData.groupId}
                    onValueChange={(value) => setRegistrationData(prev => ({ ...prev, groupId: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um grupo (opcional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sem grupo específico</SelectItem>
                      {groups.map((group: any) => (
                        <SelectItem key={group.id} value={group.id}>
                          {group.name}
                          {group.capacity && (
                            <span className="text-sm text-gray-500 ml-2">
                              ({group.currentCount || 0}/{group.capacity})
                            </span>
                          )}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500 mt-1">
                    Escolha um grupo para se inscrever (opcional)
                  </p>
                </div>
              )}

              {/* Payment Type Selection - only show for paid events */}
              {getSelectedTicketPrice() > 0 && (
                <div>
                  <Label htmlFor="paymentType">Forma de Pagamento</Label>
                  <Select
                    value={paymentType}
                    onValueChange={(value: 'installments' | 'cash') => setPaymentType(value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a forma de pagamento" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="installments">
                        Parcelamento PIX ({(event as any)?.pixInstallments || 12}x)
                      </SelectItem>
                      <SelectItem value="cash">
                        À Vista (Desconto de R$ 20,00)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500 mt-1">
                    {paymentType === 'cash' 
                      ? 'Pagamento à vista com desconto de R$ 20,00'
                      : `Pagamento em ${(event as any)?.pixInstallments || 12} parcelas via PIX`
                    }
                  </p>
                </div>
              )}
              
              <Button 
                className="w-full" 
                size="lg"
                onClick={handleRegister}
                disabled={(tickets as any[]).length === 0 || !selectedTicket}
                data-testid="button-register"
              >
                {getSelectedTicketPrice() > 0 ? `Inscrever-se - R$ ${getSelectedTicketPrice().toFixed(2)}` : 'Inscrever-se Gratuitamente'}
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
            <EventSections sections={eventData.pageComponents} />
          </div>
        </div>
      )}

      {/* Footer */}
      <EventFooter event={eventData} />
    </div>
  );
}