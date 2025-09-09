import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Star, Users, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CarouselSlide {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  image: string;
  ctaText: string;
  ctaAction: () => void;
}

interface EventCarouselProps {
  slides: CarouselSlide[];
  autoPlay?: boolean;
  autoPlayInterval?: number;
}

export function EventCarousel({ 
  slides, 
  autoPlay = true, 
  autoPlayInterval = 5000 
}: EventCarouselProps) {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    if (!autoPlay || slides.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, autoPlayInterval);

    return () => clearInterval(interval);
  }, [autoPlay, autoPlayInterval, slides.length]);

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  const goToPrevious = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const goToNext = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  if (slides.length === 0) return null;

  const currentSlideData = slides[currentSlide];

  return (
    <div className="relative w-full h-96 overflow-hidden rounded-lg bg-gradient-to-r from-blue-600 to-purple-600">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${currentSlideData.image})` }}
      >
        <div className="absolute inset-0 bg-black bg-opacity-40" />
      </div>

      {/* Content */}
      <div className="relative z-10 h-full flex items-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="max-w-2xl">
            <h2 className="text-4xl font-bold text-white mb-4">
              {currentSlideData.title}
            </h2>
            <h3 className="text-xl text-blue-100 mb-4">
              {currentSlideData.subtitle}
            </h3>
            <p className="text-lg text-gray-100 mb-8">
              {currentSlideData.description}
            </p>
            <Button 
              onClick={currentSlideData.ctaAction}
              size="lg"
              className="bg-white text-blue-600 hover:bg-gray-100 font-semibold"
            >
              {currentSlideData.ctaText}
            </Button>
          </div>
        </div>
      </div>

      {/* Navigation Arrows */}
      {slides.length > 1 && (
        <>
          <button
            onClick={goToPrevious}
            className="absolute left-4 top-1/2 transform -translate-y-1/2 z-20 p-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full transition-all"
          >
            <ChevronLeft className="h-6 w-6 text-white" />
          </button>
          <button
            onClick={goToNext}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 z-20 p-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full transition-all"
          >
            <ChevronRight className="h-6 w-6 text-white" />
          </button>
        </>
      )}

      {/* Dots Indicator */}
      {slides.length > 1 && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-20 flex space-x-2">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-3 h-3 rounded-full transition-all ${
                index === currentSlide
                  ? 'bg-white'
                  : 'bg-white bg-opacity-50 hover:bg-opacity-75'
              }`}
            />
          ))}
        </div>
      )}

      {/* Stats Overlay */}
      <div className="absolute top-4 right-4 z-20 flex space-x-4">
        <div className="flex items-center space-x-1 bg-white bg-opacity-20 px-3 py-1 rounded-full">
          <Star className="h-4 w-4 text-yellow-300" />
          <span className="text-white text-sm font-medium">4.9</span>
        </div>
        <div className="flex items-center space-x-1 bg-white bg-opacity-20 px-3 py-1 rounded-full">
          <Users className="h-4 w-4 text-white" />
          <span className="text-white text-sm font-medium">500+</span>
        </div>
        <div className="flex items-center space-x-1 bg-white bg-opacity-20 px-3 py-1 rounded-full">
          <Calendar className="h-4 w-4 text-white" />
          <span className="text-white text-sm font-medium">2024</span>
        </div>
      </div>
    </div>
  );
}
