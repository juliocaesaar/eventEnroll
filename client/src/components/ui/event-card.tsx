import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "lucide-react";
import { type Event } from "@shared/schema";

interface EventCardProps {
  event: Event;
}

export default function EventCard({ event }: EventCardProps) {
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
    <div className="p-6 hover:bg-gray-50 cursor-pointer" data-testid={`card-event-${event.id}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
            {event.imageUrl ? (
              <img 
                src={event.imageUrl} 
                alt={event.title}
                className="w-12 h-12 rounded-lg object-cover"
              />
            ) : (
              <Calendar className="w-6 h-6 text-primary" />
            )}
          </div>
          <div>
            <h4 className="font-semibold text-gray-900" data-testid={`text-event-title-${event.id}`}>
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
            <div className="flex items-center space-x-4 mt-1">
              <Badge 
                variant={getStatusVariant(event.status || 'draft')}
                data-testid={`badge-event-status-${event.id}`}
              >
                {getStatusText(event.status || 'draft')}
              </Badge>
              <span className="text-sm text-gray-500" data-testid={`text-event-capacity-${event.id}`}>
                {event.capacity ? `0/${event.capacity} inscritos` : 'Capacidade ilimitada'}
              </span>
            </div>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm font-medium text-gray-900">R$ 0</p>
          <p className="text-xs text-gray-500">Receita</p>
        </div>
      </div>
    </div>
  );
}
