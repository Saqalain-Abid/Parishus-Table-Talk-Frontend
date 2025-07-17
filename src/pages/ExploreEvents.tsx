import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MapPin, Clock, Users, Search, Filter, Calendar, Utensils } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

interface Event {
  id: string;
  name: string;
  description: string;
  date_time: string;
  location_name: string;
  location_address: string;
  max_attendees: number;
  dining_style: string;
  dietary_theme: string;
  tags: string[];
  cover_photo_url: string;
  creator_id: string;
  rsvp_count: number;
  user_rsvp: any[];
  profiles: {
    first_name: string;
    last_name: string;
    profile_photo_url: string;
  };
}

const ExploreEvents = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [diningStyleFilter, setDiningStyleFilter] = useState('');
  const [dietaryFilter, setDietaryFilter] = useState('');
  const [userProfileId, setUserProfileId] = useState<string | null>(null);
  
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    console.log('🔍 ExploreEvents component mounted!', { user: !!user });
    
    // Always proceed, even if no user is present
    // This allows admins or logged-out users to see public events

    const initializeComponent = async () => {
      try {
        if (user) {
          console.log('👤 Getting user profile...');
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('id')
            .eq('user_id', user.id)
            .maybeSingle();
          
          console.log('👤 Profile result:', { profile, profileError });
          
          if (profileError) {
            console.error('❌ Profile error:', profileError);
            setUserProfileId(null);
          } else {
            setUserProfileId(profile?.id || null);
            console.log('✅ User profile ID set:', profile?.id);
          }
        } else {
          console.log('👤 No user, skipping profile fetch');
          setUserProfileId(null);
        }

        console.log('📅 Now fetching events...');
        await fetchEvents();
        
      } catch (error) {
        console.error('❌ Error in initialization:', error);
        setLoading(false);
      }
    };
    
    initializeComponent();
  }, [user]);

  const fetchEvents = async () => {
    console.log('fetchEvents called');
    try {
      const { data, error } = await supabase
        .from('events')
        .select(`
          *,
          profiles!events_creator_id_fkey (
            first_name,
            last_name,
            profile_photo_url
          ),
          rsvps (
            id,
            user_id,
            status
          )
        `)
        .eq('status', 'active')
        .order('date_time', { ascending: true });

      console.log('Events data:', data, 'Error:', error);

      if (error) throw error;

      const eventsWithCounts = data?.map(event => ({
        ...event,
        rsvp_count: event.rsvps?.filter(r => r.status === 'confirmed').length || 0,
        user_rsvp: event.rsvps?.filter(r => r.user_id === userProfileId) || []
      })) || [];

      console.log('Events with counts:', eventsWithCounts);
      setEvents(eventsWithCounts);
    } catch (error) {
      console.error('Error fetching events:', error);
      toast({
        title: "Error",
        description: "Failed to load events",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRSVP = async (eventId: string) => {
    if (!user || !userProfileId) return;

    try {
      const event = events.find(e => e.id === eventId);
      const hasRSVP = event?.user_rsvp && event.user_rsvp.length > 0;

      if (hasRSVP) {
        const { error } = await supabase
          .from('rsvps')
          .delete()
          .eq('event_id', eventId)
          .eq('user_id', userProfileId);

        if (error) throw error;
        toast({
          title: "RSVP Cancelled",
          description: "You have cancelled your RSVP for this event.",
        });
      } else {
        const { error } = await supabase
          .from('rsvps')
          .insert({
            event_id: eventId,
            user_id: userProfileId,
            status: 'confirmed'
          });

        if (error) throw error;
        toast({
          title: "RSVP Confirmed",
          description: "You have successfully RSVP'd to this event!",
        });
      }

      fetchEvents();
    } catch (error) {
      console.error('Error handling RSVP:', error);
      toast({
        title: "Error",
        description: "Failed to update RSVP",
        variant: "destructive",
      });
    }
  };

  const filteredEvents = events.filter(event => {
    const matchesSearch = event.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.location_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesLocation = !locationFilter || event.location_name?.toLowerCase().includes(locationFilter.toLowerCase());
    const matchesDiningStyle = !diningStyleFilter || event.dining_style === diningStyleFilter;
    const matchesDietary = !dietaryFilter || event.dietary_theme === dietaryFilter;
    
    return matchesSearch && matchesLocation && matchesDiningStyle && matchesDietary;
  });

  const EventCard = ({ event }: { event: Event }) => {
    const hasRSVP = event.user_rsvp && event.user_rsvp.length > 0;
    const isCreator = event.creator_id === userProfileId;
    const spotsLeft = event.max_attendees - (event.rsvp_count || 0);
    const eventDate = new Date(event.date_time);
    const isUpcoming = eventDate > new Date();

    return (
      <Card className="shadow-card border-border hover:shadow-glow transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="w-10 h-10">
                <AvatarImage src={event.profiles?.profile_photo_url} />
                <AvatarFallback>
                  {event.profiles?.first_name?.[0]}{event.profiles?.last_name?.[0]}
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-lg">{event.name}</CardTitle>
                <p className="text-sm text-muted-foreground">
                  by {event.profiles?.first_name} {event.profiles?.last_name}
                </p>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1">
              <Badge variant={isUpcoming ? "default" : "secondary"}>
                {isUpcoming ? 'Upcoming' : 'Past'}
              </Badge>
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
          
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span>{eventDate.toLocaleDateString()} at {eventDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
            
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="w-4 h-4" />
              <span>{event.location_name}</span>
            </div>
            
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="w-4 h-4" />
              <span>{event.rsvp_count || 0} / {event.max_attendees} attending</span>
            </div>
            
            {event.dining_style && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Utensils className="w-4 h-4" />
                <span>{event.dining_style.replace('_', ' ')}</span>
              </div>
            )}
          </div>

          {event.description && (
            <p className="text-sm text-muted-foreground">
              {event.description.length > 150 ? event.description.substring(0, 150) + '...' : event.description}
            </p>
          )}

          {event.tags && event.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {event.tags.map((tag, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          <div className="flex gap-2 pt-2">
            {!isCreator && isUpcoming && spotsLeft > 0 && (
              <Button
                onClick={() => handleRSVP(event.id)}
                variant={hasRSVP ? "outline" : "default"}
                className="flex-1"
              >
                {hasRSVP ? 'Cancel RSVP' : 'Join Event'}
              </Button>
            )}
            {isCreator && (
              <Badge variant="outline" className="px-3 py-1">
                Your Event
              </Badge>
            )}
            {spotsLeft === 0 && !isCreator && (
              <Badge variant="secondary" className="px-3 py-1">
                Event Full
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  console.log('Component render:', { loading, events, filteredEvents: filteredEvents.length });

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">Loading events...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Explore Events</h1>
          <p className="text-muted-foreground">Discover dining experiences and connect with food lovers</p>
        </div>

        {/* Search and Filters */}
        <div className="mb-8 space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search events, locations, or descriptions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <Button
              variant="outline"
              onClick={() => navigate('/create-event')}
              className="gap-2"
            >
              <Calendar className="w-4 h-4" />
              Create Event
            </Button>
          </div>

          <div className="flex gap-4 flex-wrap">
            <Input
              placeholder="Filter by location..."
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className="max-w-xs"
            />
            
            <Select value={diningStyleFilter} onValueChange={setDiningStyleFilter}>
              <SelectTrigger className="max-w-xs">
                <SelectValue placeholder="Dining Style" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Styles</SelectItem>
                <SelectItem value="adventurous">Adventurous</SelectItem>
                <SelectItem value="foodie_enthusiast">Foodie Enthusiast</SelectItem>
                <SelectItem value="local_lover">Local Lover</SelectItem>
                <SelectItem value="comfort_food">Comfort Food</SelectItem>
                <SelectItem value="health_conscious">Health Conscious</SelectItem>
                <SelectItem value="social_butterfly">Social Butterfly</SelectItem>
              </SelectContent>
            </Select>

            <Select value={dietaryFilter} onValueChange={setDietaryFilter}>
              <SelectTrigger className="max-w-xs">
                <SelectValue placeholder="Dietary Preferences" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Diets</SelectItem>
                <SelectItem value="vegetarian">Vegetarian</SelectItem>
                <SelectItem value="vegan">Vegan</SelectItem>
                <SelectItem value="gluten_free">Gluten Free</SelectItem>
                <SelectItem value="dairy_free">Dairy Free</SelectItem>
                <SelectItem value="keto">Keto</SelectItem>
                <SelectItem value="paleo">Paleo</SelectItem>
                <SelectItem value="halal">Halal</SelectItem>
                <SelectItem value="kosher">Kosher</SelectItem>
                <SelectItem value="no_restrictions">No Restrictions</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Events Grid */}
        {filteredEvents.length === 0 ? (
          <div className="text-center py-12">
            <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No events found</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm || locationFilter || diningStyleFilter || dietaryFilter
                ? "Try adjusting your search or filters"
                : "No events are available at the moment"
              }
            </p>
            <Button onClick={() => navigate('/create-event')} className="gap-2">
              <Calendar className="w-4 h-4" />
              Create the first event
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ExploreEvents;