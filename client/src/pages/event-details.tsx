import { useRoute, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Layout from "@/components/layout/Layout";
import { ArrowLeft, Users, TrendingUp, Settings } from "lucide-react";
import { useEventGroups } from "@/hooks/useEventGroups";
import { useEventRegistrations } from "@/hooks/useEventRegistrations";

export default function EventDetails() {
  const [match, params] = useRoute("/events/:eventId");
  const [, setLocation] = useLocation();

  const { data: event, isLoading: eventLoading } = useQuery({
    queryKey: ['/api/events', params?.eventId],
    enabled: !!params?.eventId,
  }) as { data: any, isLoading: boolean };

  const { groups, isLoading: groupsLoading } = useEventGroups(params?.eventId || '');
  const { registrations, isLoading: registrationsLoading, lastUpdate, isConnected } = useEventRegistrations(params?.eventId || '');

  if (!match) return null;

  if (eventLoading || !event) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded w-1/4 mb-6"></div>
            <div className="grid md:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-32 bg-muted rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const totalRegistrations = Array.isArray(registrations) ? registrations.length : 0;
  const confirmedRegistrations = Array.isArray(registrations) ? registrations.filter((r: any) => r.status === 'confirmed' || r.status === 'checked_in').length : 0;
  
  // Calcular receita total baseada nas parcelas pagas
  const totalRevenue = Array.isArray(registrations) ? registrations.reduce((sum: number, reg: any) => {
    if (reg.installments && reg.installments.length > 0) {
      // Se tem parcelas, soma apenas as parcelas pagas
      const paidAmount = reg.installments
        .filter((installment: any) => installment.status === 'paid')
        .reduce((installmentSum: number, installment: any) => 
          installmentSum + (parseFloat(installment.amount) || 0), 0);
      return sum + paidAmount;
    } else {
      // Fallback para o valor antigo se não tem parcelas
      return sum + (parseFloat(reg.amountPaid) || 0);
    }
  }, 0) : 0;

  return (
    <Layout 
      currentPage="events"
      breadcrumbs={[
        { label: 'Dashboard', href: '/' },
        { label: 'Eventos', href: '/events' },
        { label: event?.title || 'Evento' }
      ]}
    >
      <div data-testid="page-event-details">
        {/* Event Header */}
        <div className="bg-card border rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-3">
                <h1 className="text-2xl font-bold text-card-foreground" data-testid="text-event-title">{event?.title || 'Evento'}</h1>
                {isConnected && (
                  <div className="flex items-center space-x-1 text-green-600 dark:text-green-400">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-xs font-medium">Tempo Real</span>
                  </div>
                )}
              </div>
              <p className="text-muted-foreground" data-testid="text-event-slug">/{event?.slug || 'evento'}</p>
              {lastUpdate && (
                <p className="text-xs text-muted-foreground mt-1">
                  Última atualização: {lastUpdate.toLocaleTimeString('pt-BR')}
                </p>
              )}
            </div>
            <div className="flex space-x-2">
              <Button 
                variant="outline" 
                onClick={() => window.open(`/event/${event?.slug}`, '_blank')} 
                data-testid="button-open-public"
              >
                🔗 Ver Página Pública
              </Button>
              <Button 
                variant="outline"
                onClick={() => setLocation(`/events/${event?.id}/groups`)} 
                data-testid="button-manage-groups"
              >
                👥 Gerenciar Grupos
              </Button>
              <Button 
                variant="outline"
                onClick={() => setLocation(`/events/${event?.id}/payments`)} 
                data-testid="button-manage-payments"
              >
                💰 Pagamentos
              </Button>
              <Button 
                variant="outline"
                onClick={() => setLocation(`/events/${event?.id}/manage`)} 
                data-testid="button-manage-event"
              >
                ⚙️ Gerenciar Evento
              </Button>
              <Button 
                onClick={() => setLocation(`/editor?eventId=${event?.id}`)} 
                data-testid="button-edit-event"
              >
                ✏️ Editar Evento
              </Button>
            </div>
          </div>
        </div>
        {/* Stats Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total de Inscritos</p>
                  <p className="text-3xl font-bold text-card-foreground" data-testid="stat-total-registrations">{totalRegistrations}</p>
                </div>
                <Users className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Confirmados</p>
                  <p className="text-3xl font-bold text-card-foreground" data-testid="stat-confirmed-registrations">{confirmedRegistrations}</p>
                </div>
                <Users className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Receita Total</p>
                  <p className="text-3xl font-bold text-card-foreground" data-testid="stat-total-revenue">R$ {totalRevenue.toFixed(2)}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-purple-600 dark:text-purple-400" />
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
            <p className="text-card-foreground"><strong>Descrição:</strong> {event?.description || 'Nenhuma descrição disponível.'}</p>
            <p className="text-card-foreground"><strong>Local:</strong> {event?.location || 'Não informado'}</p>
            <p className="text-card-foreground"><strong>Capacidade:</strong> {event?.capacity || 0} pessoas</p>
          </CardContent>
        </Card>

        {/* Grupos do Evento */}
        <Card className="mt-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Grupos do Evento ({groups?.length || 0})</CardTitle>
              <div className="flex gap-2">
                <Button 
                  variant="outline"
                  onClick={() => setLocation(`/events/${event?.id}/participants`)}
                >
                  <Users className="h-4 w-4 mr-2" />
                  Sem Grupos
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => setLocation(`/events/${event?.id}/groups`)}
                >
                  <Users className="h-4 w-4 mr-2" />
                  Gerenciar Grupos
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {groupsLoading ? (
              <div className="space-y-4">
                {[1, 2].map(i => (
                  <div key={i} className="animate-pulse border rounded-lg p-4">
                    <div className="h-4 bg-muted rounded w-1/3 mb-2"></div>
                    <div className="h-3 bg-muted rounded w-1/4"></div>
                  </div>
                ))}
              </div>
            ) : groups && groups.length > 0 ? (
              <div className="space-y-4">
                {groups.map((group: any) => (
                  <div key={group.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg text-card-foreground">{group.name}</h3>
                        <p className="text-muted-foreground text-sm mt-1">{group.description || 'Sem descrição'}</p>
                        <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            {group.currentParticipants || 0} / {group.maxParticipants || 0} participantes
                          </span>
                          <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400 font-medium">
                            <Users className="w-4 h-4" />
                            {group.currentCount || 0} inscritos
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setLocation(`/groups/${group.id}/manage`)}
                        >
                          <Settings className="w-4 h-4 mr-1" />
                          Gerenciar
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">Nenhum grupo criado ainda.</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Crie grupos para organizar os participantes e designar gestores.
                </p>
                <div className="flex gap-3 justify-center">
                  <Button 
                    onClick={() => setLocation(`/events/${event?.id}/groups`)}
                    className="mx-auto"
                  >
                    <Users className="h-4 w-4 mr-2" />
                    Criar Primeiro Grupo
                  </Button>
                  <Button
                    onClick={() => setLocation(`/events/${event?.id}/participants`)}
                    variant="outline"
                  >
                    <Users className="h-4 w-4 mr-2" />
                    Gerenciar Sem Grupos
                  </Button>
                </div>
              </div>
            )}
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
                {[1, 2, 3].map((i: number) => (
                  <div key={i} className="animate-pulse border rounded-lg p-4">
                    <div className="h-4 bg-muted rounded w-1/3 mb-2"></div>
                    <div className="h-3 bg-muted rounded w-1/4"></div>
                  </div>
                ))}
              </div>
            ) : Array.isArray(registrations) && registrations.length > 0 ? (
              <div className="space-y-4">
                {registrations.map((registration: any) => (
                  <div key={registration.id} className="border rounded-lg p-4" data-testid={`registration-${registration.id}`}>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-semibold text-card-foreground">{registration.firstName} {registration.lastName}</h3>
                        <p className="text-sm text-muted-foreground">{registration.email}</p>
                        {registration.phoneNumber && (
                          <p className="text-sm text-muted-foreground">{registration.phoneNumber}</p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          Inscrito em: {new Date(registration.createdAt).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                      <div className="text-right space-y-2">
                        <span className={`px-2 py-1 rounded text-xs ${
                          registration.status === 'confirmed' ? 'status-active' :
                          registration.status === 'pending_payment' ? 'status-paused' :
                          'status-completed'
                        }`}>
                          {registration.status === 'confirmed' ? 'Confirmado' :
                           registration.status === 'pending_payment' ? 'Pagamento Pendente' :
                           registration.status}
                        </span>
                        {registration.amountPaid && parseFloat(registration.amountPaid) > 0 && (
                          <div className="text-sm text-muted-foreground">
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
                <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Nenhuma inscrição encontrada.</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Compartilhe o link público do evento para receber inscrições.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}