import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MapPin, Clock, Users, Search, Calendar, Utensils } from 'lucide-react';

const ExploreEvents = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');

  const events = [
    {
      id: '1',
      name: 'Mock Taco Tuesday',
      description: 'Enjoy tacos and meet fellow food lovers!',
      date_time: '2025-08-15T18:30:00',
      location_name: 'Food Hall NYC',
      max_attendees: 20,
      rsvp_count: 5,
      dining_style: 'foodie_enthusiast',
      dietary_theme: 'vegan',
      cover_photo_url: 'https://via.placeholder.com/400x200.png?text=Event+Image',
      tags: ['tacos', 'mexican'],
      profiles: {
        first_name: 'Alex',
        last_name: 'Johnson',
        profile_photo_url: '',
      },
    },
    {
      id: '2',
      name: 'Burger Bonanza',
      description: 'Grilled burgers and great company.',
      date_time: '2025-09-01T19:00:00',
      location_name: 'Grill House LA',
      max_attendees: 30,
      rsvp_count: 12,
      dining_style: 'comfort_food',
      dietary_theme: 'no_restrictions',
      cover_photo_url: '',
      tags: ['burger', 'grill'],
      profiles: {
        first_name: 'Jamie',
        last_name: 'Smith',
        profile_photo_url: '',
      },
    }
  ];

  const filteredEvents = events.filter(event =>
    event.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Explore Events</h1>
          <p className="text-muted-foreground">Static preview of event cards</p>
        </div>

        <div className="mb-8">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search mock events..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.map(event => {
            const spotsLeft = event.max_attendees - event.rsvp_count;
            const eventDate = new Date(event.date_time);

            return (
              <Card key={event.id} className="shadow-card border-border">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={event.profiles.profile_photo_url} />
                        <AvatarFallback>
                          {event.profiles.first_name[0]}{event.profiles.last_name[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-lg">{event.name}</CardTitle>
                        <p className="text-sm text-muted-foreground">
                          by {event.profiles.first_name} {event.profiles.last_name}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Badge variant="default">Upcoming</Badge>
                      {spotsLeft > 0 && (
                        <Badge variant="outline" className="text-xs">
                          {spotsLeft} spots left
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {event.cover_photo_url && (
                    <div className="w-full h-48 bg-muted rounded-lg overflow-hidden">
                      <img
                        src={event.cover_photo_url}
                        alt={event.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      <span>{eventDate.toLocaleDateString()} at {eventDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      <span>{event.location_name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      <span>{event.rsvp_count} / {event.max_attendees} attending</span>
                    </div>
                    {event.dining_style && (
                      <div className="flex items-center gap-2">
                        <Utensils className="w-4 h-4" />
                        <span>{event.dining_style.replace('_', ' ')}</span>
                      </div>
                    )}
                  </div>

                  <p className="text-sm text-muted-foreground">
                    {event.description.length > 150 ? event.description.substring(0, 150) + '...' : event.description}
                  </p>

                  <div className="flex flex-wrap gap-1">
                    {event.tags.map((tag, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>

                  <div className="pt-2">
                    <Button className="w-full" onClick={() => navigate(`/event/${event.id}/details`)}>
                      Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ExploreEvents;
