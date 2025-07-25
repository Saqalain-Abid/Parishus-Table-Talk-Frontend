import React from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, MapPin, Users, ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';

interface Event {
  id: number;
  title: string;
  dateTime: string;
  location: string;
  guests: string;
  description: string;
  image?: string;
}

interface EventCarouselProps {
  events: Event[];
  onViewAll?: () => void;
}

export const EventCarousel: React.FC<EventCarouselProps> = ({ events, onViewAll }) => {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: false,
    align: 'start',
    slidesToScroll: 1,
  });

  const scrollPrev = () => emblaApi && emblaApi.scrollPrev();
  const scrollNext = () => emblaApi && emblaApi.scrollNext();
  const navigate = useNavigate();

  if (events.length === 0) return null;

  return (
    <Card className="shadow-card border-border">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-white mb-1">Featured Events</h2>
            <p className="text-white/80 text-sm">Explore what's happening</p>
          </div>
          <div className="flex gap-1">
            <Button variant="ghost" size="sm" onClick={scrollPrev} className="text-white hover:bg-white/20">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={scrollNext} className="text-white hover:bg-white/20">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="overflow-hidden" ref={emblaRef}>
          <div className="flex gap-4">
            {events.map((event) => (
              <div key={event.id} className="flex-none justify-center w-full min-w-0">
                <Card
                  className="max-w-2xl bg-white/10 border-white/20 backdrop-blur-sm hover:bg-white/15 transition-all duration-300 cursor-pointer hover-scale"
                  onClick={() => navigate(`/event/${event.id}/details`)}
                >
                  <CardContent className="p-4">
                    {event.image && (
                      <div className="mb-3 h-24 bg-cover bg-center rounded-md overflow-hidden">
                        <img
                          src={event.image}
                          alt={event.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="space-y-2">
                      <div className="flex items-start justify-between">
                        <h3 className="font-semibold text-white text-base line-clamp-2 flex-1 mr-2">
                          {event.title}
                        </h3>
                        <Badge className="bg-peach-gold/20 text-peach-gold border-peach-gold/30 text-xs">
                          Featured
                        </Badge>
                      </div>
                      <div className="space-y-1 text-white/80 text-xs">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>{format(new Date(event.dateTime), 'MMM dd, yyyy')}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>{format(new Date(event.dateTime), 'h:mm a')}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          <span className="truncate">{event.location}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          <span>{event.guests}</span>
                        </div>
                      </div>
                      {event.description && (
                        <p className="text-white/70 text-xs line-clamp-2">
                          {event.description}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </div>

        {onViewAll && (
          <div className="mt-4 text-center">
            <Button
              variant="outline"
              className="bg-white/10 text-white border-white/30 hover:bg-white/20 text-sm"
              onClick={onViewAll}
            >
              View All Events
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
