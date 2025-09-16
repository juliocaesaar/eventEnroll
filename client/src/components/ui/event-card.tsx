import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "lucide-react";
import { type Event } from "@shared/schema";
import { useLocation } from "wouter";

interface EventCardProps {
  event: Event;
}

export default function EventCard({ event }: EventCardProps) {
  const [, setLocation] = useLocation();
  
  const handleCardClick = (e: React.MouseEvent) => {
    // Don't navigate if clicking on buttons
    if ((e.target as HTMLElement).tagName === 'BUTTON' || (e.target as HTMLElement).closest('button')) {
      return;
    }
    setLocation(`/events/${event.id}`);
  };
  
  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'active':
        return 'default';
      case 'draft':
        return 'secondary';
      case 'paused':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'Ativo';
      case 'draft':
        return 'Rascunho';
      case 'paused':
        return 'Pausado';
      case 'completed':
        return 'Finalizado';
      case 'cancelled':
        return 'Cancelado';
      default:
        return status;
    }
  };

  return (
    <div className="p-4 sm:p-6 hover:bg-gray-50 cursor-pointer" data-testid={`card-event-${event.id}`} onClick={handleCardClick}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-start space-x-3 sm:space-x-4 min-w-0 flex-1">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
            {event.imageUrl ? (
              <img 
                src={event.imageUrl} 
                alt={event.title}
                className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg object-cover"
              />
            ) : (
              <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="font-semibold text-gray-900 truncate" data-testid={`text-event-title-${event.id}`}>
              {event.title}
            </h4>
            <p className="text-sm text-gray-600" data-testid={`text-event-date-${event.id}`}>
              {event.startDate 
                ? new Date(event.startDate).toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })
                : 'Data não definida'
              }
            </p>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mt-1">
              <Badge 
                variant={getStatusVariant(event.status || 'draft')}
                data-testid={`badge-event-status-${event.id}`}
                className="w-fit"
              >
                {getStatusText(event.status || 'draft')}
              </Badge>
              <span className="text-sm text-gray-500" data-testid={`text-event-capacity-${event.id}`}>
                {event.capacity ? `0/${event.capacity} inscritos` : 'Capacidade ilimitada'}
              </span>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mt-2">
              <p className="text-xs text-blue-600 truncate" data-testid={`text-public-link-${event.id}`}>
                <span className="font-medium">Link público:</span> /event/{event.slug}
              </p>
              <div className="flex space-x-1 flex-shrink-0">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    window.open(`/event/${event.slug}`, '_blank');
                  }}
                  className="text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 px-2 py-1 rounded font-medium transition-colors whitespace-nowrap"
                  data-testid={`button-open-public-${event.id}`}
                >
                  🔗 Abrir
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigator.clipboard.writeText(`${window.location.origin}/event/${event.slug}`);
                  }}
                  className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 py-1 rounded font-medium transition-colors whitespace-nowrap"
                  data-testid={`button-copy-link-${event.id}`}
                >
                  📋 Copiar
                </button>
              </div>
            </div>
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-sm font-medium text-gray-900">R$ 0</p>
          <p className="text-xs text-gray-500">Receita</p>
        </div>
      </div>
    </div>
  );
}
