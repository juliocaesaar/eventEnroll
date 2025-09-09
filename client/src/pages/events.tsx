import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Calendar, Plus, Search, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import EventCard from "@/components/ui/event-card";
import Layout from "@/components/layout/Layout";
import { useState } from "react";

export default function Events() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");

  const { data: events, isLoading } = useQuery({
    queryKey: ["/api/events"],
    enabled: !!user,
  }) as { data: any[], isLoading: boolean };

  const filteredEvents = Array.isArray(events) ? events.filter((event: any) => 
    event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    event.description?.toLowerCase().includes(searchTerm.toLowerCase())
  ) : [];

  return (
    <Layout currentPage="events">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground mb-4" data-testid="text-page-title">
            Meus Eventos
          </h1>
          
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar eventos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                data-testid="input-search-events"
              />
            </div>
            <Button variant="outline" data-testid="button-filter-events">
              <Filter className="w-4 h-4 mr-2" />
              Filtros
            </Button>
          </div>
        </div>

        {/* Events Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="animate-pulse">
                <div className="h-48 bg-muted rounded-t-lg"></div>
                <CardHeader>
                  <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="h-3 bg-muted rounded"></div>
                    <div className="h-3 bg-muted rounded w-2/3"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredEvents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map((event: any) => (
              <Card 
                key={event.id} 
                className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => setLocation(`/events/${event.id}`)}
                data-testid={`card-event-${event.id}`}
              >
                <div className="h-48 bg-gradient-to-br from-primary-100 to-secondary-100 flex items-center justify-center">
                  {event.imageUrl ? (
                    <img 
                      src={event.imageUrl} 
                      alt={event.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Calendar className="w-12 h-12 text-primary" />
                  )}
                </div>
                <CardHeader>
                  <CardTitle className="line-clamp-2" data-testid={`text-event-title-${event.id}`}>
                    {event.title}
                  </CardTitle>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground" data-testid={`text-event-date-${event.id}`}>
                      {event.startDate ? new Date(event.startDate).toLocaleDateString('pt-BR') : 'Data não definida'}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      event.status === 'active' ? 'status-active' :
                      event.status === 'draft' ? 'status-draft' :
                      event.status === 'paused' ? 'status-paused' :
                      'status-completed'
                    }`} data-testid={`badge-event-status-${event.id}`}>
                      {event.status === 'active' ? 'Ativo' :
                       event.status === 'draft' ? 'Rascunho' :
                       event.status === 'paused' ? 'Pausado' : 'Finalizado'}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-4" data-testid={`text-event-description-${event.id}`}>
                    {event.description || 'Sem descrição'}
                  </p>
                  <div className="flex justify-between items-center">
                    <div className="text-sm text-muted-foreground">
                      <span data-testid={`text-event-capacity-${event.id}`}>
                        {event.capacity ? `0/${event.capacity} inscritos` : 'Capacidade ilimitada'}
                      </span>
                    </div>
                    <div className="space-x-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          setLocation(`/events/${event.id}/edit`);
                        }}
                        data-testid={`button-edit-event-${event.id}`}
                      >
                        Editar
                      </Button>
                      <Button 
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setLocation(`/events/${event.id}`);
                        }}
                        data-testid={`button-view-event-${event.id}`}
                      >
                        Ver
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Calendar className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold text-foreground mb-2" data-testid="text-no-events-title">
              {searchTerm ? 'Nenhum evento encontrado' : 'Nenhum evento criado ainda'}
            </h3>
            <p className="text-muted-foreground mb-6" data-testid="text-no-events-description">
              {searchTerm 
                ? `Não encontramos eventos com o termo "${searchTerm}". Tente outro termo de busca.`
                : 'Comece criando seu primeiro evento com nossos templates profissionais.'
              }
            </p>
            {!searchTerm && (
              <Button 
                onClick={() => setLocation('/editor')}
                data-testid="button-create-first-event"
              >
                <Plus className="w-4 h-4 mr-2" />
                Criar Primeiro Evento
              </Button>
            )}
          </div>
        )}
    </Layout>
  );
}
