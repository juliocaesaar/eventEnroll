import { useRoute, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Users, TrendingUp } from "lucide-react";

export default function EventDetails() {
  const [match, params] = useRoute("/events/:eventId");
  const [, setLocation] = useLocation();

  const { data: event, isLoading: eventLoading } = useQuery({
    queryKey: ['/api/events', params?.eventId],
    enabled: !!params?.eventId,
  });

  const { data: registrations, isLoading: registrationsLoading } = useQuery({
    queryKey: ['/api/events', params?.eventId, 'registrations'],
    enabled: !!params?.eventId,
  });

  if (!match) return null;

  if (eventLoading || !event) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="grid md:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-32 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const totalRegistrations = registrations?.length || 0;
  const confirmedRegistrations = registrations?.filter((r: any) => r.status === 'confirmed' || r.status === 'checked_in').length || 0;
  const totalRevenue = registrations?.reduce((sum: number, reg: any) => sum + (parseFloat(reg.amountPaid) || 0), 0) || 0;

  return (
    <div className="min-h-screen bg-gray-50" data-testid="page-event-details">
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                onClick={() => setLocation('/events')}
                data-testid="button-back-to-events"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar para Eventos
              </Button>
              <div>
                <h1 className="text-2xl font-bold" data-testid="text-event-title">{event.title}</h1>
                <p className="text-gray-600" data-testid="text-event-slug">/{event.slug}</p>
              </div>
            </div>
            <div className="flex space-x-2">
              <Button 
                variant="outline" 
                onClick={() => window.open(`/event/${event.slug}`, '_blank')} 
                data-testid="button-open-public"
              >
                🔗 Ver Página Pública
              </Button>
              <Button 
                onClick={() => setLocation(`/editor?eventId=${event.id}`)} 
                data-testid="button-edit-event"
              >
                ✏️ Editar Evento
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6">
        {/* Stats Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total de Inscritos</p>
                  <p className="text-3xl font-bold" data-testid="stat-total-registrations">{totalRegistrations}</p>
                </div>
                <Users className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Confirmados</p>
                  <p className="text-3xl font-bold" data-testid="stat-confirmed-registrations">{confirmedRegistrations}</p>
                </div>
                <Users className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Receita Total</p>
                  <p className="text-3xl font-bold" data-testid="stat-total-revenue">R$ {totalRevenue.toFixed(2)}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Event Info */}
        <Card>
          <CardHeader>
            <CardTitle>Informações do Evento</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p><strong>Descrição:</strong> {event.description || 'Nenhuma descrição disponível.'}</p>
            <p><strong>Local:</strong> {event.location || 'Não informado'}</p>
            <p><strong>Capacidade:</strong> {event.capacity} pessoas</p>
          </CardContent>
        </Card>

        {/* Registrations List */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Lista de Inscrições ({totalRegistrations})</CardTitle>
          </CardHeader>
          <CardContent>
            {registrationsLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="animate-pulse border rounded-lg p-4">
                    <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                  </div>
                ))}
              </div>
            ) : registrations && registrations.length > 0 ? (
              <div className="space-y-4">
                {registrations.map((registration: any) => (
                  <div key={registration.id} className="border rounded-lg p-4" data-testid={`registration-${registration.id}`}>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-semibold">{registration.firstName} {registration.lastName}</h3>
                        <p className="text-sm text-gray-600">{registration.email}</p>
                        {registration.phoneNumber && (
                          <p className="text-sm text-gray-600">{registration.phoneNumber}</p>
                        )}
                        <p className="text-xs text-gray-500 mt-1">
                          Inscrito em: {new Date(registration.createdAt).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                      <div className="text-right space-y-2">
                        <span className={`px-2 py-1 rounded text-xs ${
                          registration.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                          registration.status === 'pending_payment' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {registration.status === 'confirmed' ? 'Confirmado' :
                           registration.status === 'pending_payment' ? 'Pagamento Pendente' :
                           registration.status}
                        </span>
                        {registration.amountPaid && parseFloat(registration.amountPaid) > 0 && (
                          <div className="text-sm text-gray-600">
                            R$ {parseFloat(registration.amountPaid).toFixed(2)}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600">Nenhuma inscrição encontrada.</p>
                <p className="text-sm text-gray-500 mt-2">
                  Compartilhe o link público do evento para receber inscrições.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}