import { Card, CardContent } from "@/components/ui/card";
import { type EventCategory } from "@shared/schema";

interface TemplateCardProps {
  category: EventCategory;
  templateCount: number;
  onClick: () => void;
}

export default function TemplateCard({ category, templateCount, onClick }: TemplateCardProps) {
  const getImage = (categoryId: string) => {
    const images = {
      religious: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=120',
      corporate: 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=120',
      social: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=120',
      cultural: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=120',
    };
    return images[categoryId as keyof typeof images] || images.corporate;
  };

  return (
    <Card 
      className="group cursor-pointer border hover:border-primary-300 hover:shadow-md transition-all duration-200"
      onClick={onClick}
      data-testid={`card-template-category-${category.id}`}
    >
      <CardContent className="p-4">
        <div className="flex items-center space-x-3 mb-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center`} style={{ backgroundColor: `${category.color || '#3b82f6'}20` }}>
            <i className={`${category.icon} text-lg`} style={{ color: category.color }}></i>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 group-hover:text-primary" data-testid={`text-category-name-${category.id}`}>
              {category.name}
            </h4>
            <p className="text-xs text-gray-500" data-testid={`text-category-count-${category.id}`}>
              {templateCount}+ templates
            </p>
          </div>
        </div>
        <img 
          src={getImage(category.id)} 
          alt={category.name}
          className="w-full h-20 object-cover rounded-lg mb-2"
          data-testid={`img-category-${category.id}`}
        />
        <p className="text-xs text-gray-600" data-testid={`text-category-description-${category.id}`}>
          {category.description}
        </p>
      </CardContent>
    </Card>
  );
}
