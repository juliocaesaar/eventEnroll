import { Calendar, MapPin, Clock, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface EventHeaderProps {
  event: {
    title: string;
    description: string;
    startDate: string;
    endDate: string;
    venueName?: string;
    venueAddress?: string;
    onlineUrl?: string;
    capacity: number;
    imageUrl?: string;
    categoryId: string;
  };
}

export function EventHeader({ event }: EventHeaderProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getCategoryName = (categoryId: string) => {
    const categories: Record<string, string> = {
      'business': 'Negócios',
      'technology': 'Tecnologia',
      'education': 'Educação',
      'health': 'Saúde',
      'entertainment': 'Entretenimento',
      'sports': 'Esportes',
      'religious': 'Acampamento',
      'other': 'Outros',
    };
    return categories[categoryId] || 'Outros';
  };

  return (
    <div className="relative">
      {/* Hero Image with Background */}
      <div 
        className="h-96 w-full overflow-hidden rounded-lg mb-8 relative"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1614850523011-8f49ffc73908?fm=jpg&q=60&w=3000&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8cGFwZWwlMjBkZSUyMHBhcmVkZSUyMGF6dWx8ZW58MHx8MHx8fDA%3D')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        {/* Overlay for better text readability */}
        <div className="absolute inset-0 bg-black bg-opacity-40"></div>
        
        {/* Event title overlay */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-white">
            <h1 className="text-4xl md:text-6xl font-bold mb-4 drop-shadow-lg">
              {event.title}
            </h1>
            <Badge variant="secondary" className="text-lg px-4 py-2 bg-white/20 backdrop-blur-sm border-white/30">
              {getCategoryName(event.categoryId)}
            </Badge>
          </div>
        </div>
      </div>
      
      {/* Event Info */}
      <div className="space-y-6">
        {/* Description */}
        <div className="space-y-4">
          <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed">
            {event.description}
          </p>
        </div>

        {/* Event Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Date */}
          <div className="flex items-center space-x-3 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {formatDate(event.startDate)}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Data do evento
              </p>
            </div>
          </div>

          {/* Location */}
          <div className="flex items-center space-x-3 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
              <MapPin className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                À definir
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Local do evento
              </p>
            </div>
          </div>

          {/* Duration */}
          <div className="flex items-center space-x-3 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
              <Clock className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                Duração
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {Math.ceil((new Date(event.endDate).getTime() - new Date(event.startDate).getTime()) / (1000 * 60 * 60 * 24))} dias
              </p>
            </div>
          </div>

          {/* Capacity */}
          <div className="flex items-center space-x-3 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
              <Users className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                Capacidade
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {event.capacity} participantes
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
