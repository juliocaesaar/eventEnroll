import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  MapPin, 
  Clock, 
  Star, 
  Award, 
  Heart,
  MessageCircle,
  Share2,
  Download,
  ExternalLink
} from 'lucide-react';

interface SectionProps {
  type: string;
  props: Record<string, any>;
}

interface EventSectionsProps {
  sections: SectionProps[];
}

export function EventSections({ sections }: EventSectionsProps) {
  const renderSection = (section: SectionProps, index: number) => {
    const { type, props } = section;

    switch (type) {
      case 'header':
        return (
          <div key={index} className="text-center py-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              {props.title}
            </h2>
            {props.subtitle && (
              <p className="text-lg text-gray-600 dark:text-gray-300">
                {props.subtitle}
              </p>
            )}
          </div>
        );

      case 'text':
        return (
          <div key={index} className="prose prose-lg max-w-none">
            <div 
              className="text-gray-700 dark:text-gray-300 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: props.content }}
            />
          </div>
        );

      case 'image':
        return (
          <div key={index} className="text-center">
            <img
              src={props.src}
              alt={props.alt || 'Imagem do evento'}
              className="mx-auto rounded-lg shadow-lg max-w-full h-auto"
              style={{ width: props.width || '100%' }}
            />
            {props.caption && (
              <p className="mt-4 text-sm text-gray-500 dark:text-gray-400 italic">
                {props.caption}
              </p>
            )}
          </div>
        );

      case 'button':
        return (
          <div key={index} className="text-center">
            <Button
              variant={props.variant || 'default'}
              size={props.size || 'default'}
              className={props.className}
              onClick={() => {
                if (props.link) {
                  if (props.link.startsWith('http')) {
                    window.open(props.link, '_blank');
                  } else {
                    window.location.href = props.link;
                  }
                }
              }}
            >
              {props.text}
            </Button>
          </div>
        );

      case 'features':
        return (
          <div key={index} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {props.features?.map((feature: any, featureIndex: number) => (
              <Card key={featureIndex} className="text-center p-6">
                <CardContent className="space-y-4">
                  <div className="mx-auto w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                    {feature.icon === 'users' && <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />}
                    {feature.icon === 'map' && <MapPin className="h-6 w-6 text-blue-600 dark:text-blue-400" />}
                    {feature.icon === 'clock' && <Clock className="h-6 w-6 text-blue-600 dark:text-blue-400" />}
                    {feature.icon === 'star' && <Star className="h-6 w-6 text-blue-600 dark:text-blue-400" />}
                    {feature.icon === 'award' && <Award className="h-6 w-6 text-blue-600 dark:text-blue-400" />}
                    {feature.icon === 'heart' && <Heart className="h-6 w-6 text-blue-600 dark:text-blue-400" />}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        );

      case 'testimonials':
        return (
          <div key={index} className="space-y-6">
            <h3 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-8">
              {props.title || 'Depoimentos'}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {props.testimonials?.map((testimonial: any, testimonialIndex: number) => (
                <Card key={testimonialIndex} className="p-6">
                  <CardContent className="space-y-4">
                    <div className="flex items-center space-x-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${
                            i < (testimonial.rating || 5)
                              ? 'text-yellow-400 fill-current'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-gray-600 dark:text-gray-300 italic">
                      "{testimonial.text}"
                    </p>
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                          {testimonial.author?.charAt(0) || 'A'}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {testimonial.author}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {testimonial.role}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );

      case 'stats':
        return (
          <div key={index} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {props.stats?.map((stat: any, statIndex: number) => (
                <div key={statIndex} className="text-center">
                  <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                    {stat.value}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-300">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'social':
        return (
          <div key={index} className="text-center space-y-4">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              {props.title || 'Siga-nos'}
            </h3>
            <div className="flex justify-center space-x-4">
              {props.links?.map((link: any, linkIndex: number) => (
                <Button
                  key={linkIndex}
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(link.url, '_blank')}
                  className="flex items-center space-x-2"
                >
                  {link.platform === 'whatsapp' && <MessageCircle className="h-4 w-4" />}
                  {link.platform === 'instagram' && <Share2 className="h-4 w-4" />}
                  {link.platform === 'facebook' && <Share2 className="h-4 w-4" />}
                  <span>{link.label}</span>
                </Button>
              ))}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-12">
      {sections.map((section, index) => renderSection(section, index))}
    </div>
  );
}
