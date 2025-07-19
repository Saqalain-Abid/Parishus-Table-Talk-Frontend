import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  Search, 
  Plus,
  Heart,
  UserCheck,
  Edit,
  Trash2,
  Eye
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

interface Event {
  id: string;
  name: string;
  description: string;
  date_time: string;
  location_name: string;
  location_address?: string;
  cover_photo_url?: string;
  tags?: string[];
  max_attendees: number;
  creator_id: string;
  is_mystery_dinner: boolean;
  profiles?: {
    first_name?: string;
    last_name?: string;
    profile_photo_url?: string;
  };
  rsvp_count?: number;
  user_rsvp?: {
    id: string;
    status: string;
  }[];
}

const Events = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [myEvents, setMyEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('upcoming');
  const [userProfileId, setUserProfileId] = useState<string | null>(null);
  
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const getUserProfile = async () => {
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('user_id', user.id)
          .single();
        setUserProfileId(profile?.id || null);
      } else {
        setUserProfileId(null);
      }
    };
    
    getUserProfile().then(() => {
      fetchEvents();
      fetchMyEvents();
    });
  }, [user]);

  const fetchEvents = async () => {
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
            status,
            user_id
          )
        `)
        .eq('status', 'active')
        .order('date_time', { ascending: true });

      if (error) throw error;

      const eventsWithCounts = data?.map(event => ({
        ...event,
        rsvp_count: event.rsvps?.filter(r => r.status === 'confirmed').length || 0,
        user_rsvp: event.rsvps?.filter(r => r.user_id === userProfileId) || []
      })) || [];

      setEvents(eventsWithCounts);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch events",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchMyEvents = async () => {
    if (!user || !userProfileId) return;

    try {
      // Fetch events created by user
      const { data: createdEvents, error: createdError } = await supabase
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
            status,
            user_id
          )
        `)
        .eq('creator_id', userProfileId)
        .order('date_time', { ascending: true });

      if (createdError) throw createdError;

      // Fetch events user has RSVP'd to
      const { data: rsvpEvents, error: rsvpError } = await supabase
        .from('events')
        .select(`
          *,
          profiles!events_creator_id_fkey (
            first_name,
            last_name,
            profile_photo_url
          ),
          rsvps!inner (
            id,
            status,
            user_id
          )
        `)
        .eq('rsvps.user_id', userProfileId)
        .order('date_time', { ascending: true });

      if (rsvpError) throw rsvpError;

      // Combine and deduplicate events
      const allEvents = [...(createdEvents || []), ...(rsvpEvents || [])];
      const uniqueEvents = allEvents.filter((event, index, self) => 
        index === self.findIndex(e => e.id === event.id)
      );

      const eventsWithCounts = uniqueEvents.map(event => ({
        ...event,
        rsvp_count: event.rsvps?.filter(r => r.status === 'confirmed').length || 0,
        user_rsvp: event.rsvps?.filter(r => r.user_id === userProfileId) || []
      }));

      setMyEvents(eventsWithCounts);
    } catch (error: any) {
      console.error('Error fetching my events:', error);
    }
  };

  const handleRSVP = async (eventId: string) => {
    if (!user) return;

    const confirmed = window.confirm("Are you sure you want to RSVP to this event?");
    if (!confirmed) return;

    try {
      if (!userProfileId) {
        throw new Error('Profile not found');
      }

      const event = events.find(e => e.id === eventId);
      const hasRSVP = event?.user_rsvp && event.user_rsvp.length > 0;

      if (hasRSVP) {
        // Remove RSVP
        const { error } = await supabase
          .from('rsvps')
          .delete()
          .eq('event_id', eventId)
          .eq('user_id', userProfileId);

        if (error) throw error;

        toast({
          title: "RSVP removed",
          description: "You're no longer attending this event",
        });
      } else {
        // Add RSVP with reservation
        const { error: rsvpError } = await supabase
          .from('rsvps')
          .insert({
            event_id: eventId,
            user_id: userProfileId,
            status: 'confirmed'
          });

        if (rsvpError) throw rsvpError;

        // Create reservation entry
        const { error: reservationError } = await supabase
          .from('reservations')
          .insert({
            event_id: eventId,
            user_id: user.id,
            reservation_type: 'standard',
            reservation_status: 'pending'
          });

        if (reservationError) throw reservationError;

        toast({
          title: "RSVP confirmed!",
          description: "You're now attending this event. Your reservation is pending confirmation.",
        });
      }

      fetchEvents();
      fetchMyEvents();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update RSVP",
        variant: "destructive"
      });
    }
  };

  const deleteEvent = async (eventId: string) => {
    try {
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', eventId)
        .eq('creator_id', userProfileId);

      if (error) throw error;

      toast({
        title: "Event deleted",
        description: "Your event has been deleted successfully",
      });

      fetchEvents();
      fetchMyEvents();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete event",
        variant: "destructive"
      });
    }
  };

  const filteredEvents = events.filter(event =>
    event.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    event.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    event.location_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const EventCard = ({ event, showActions = false }: { event: Event; showActions?: boolean }) => {
    const hasRSVP = event.user_rsvp && event.user_rsvp.length > 0;
    const isCreator = event.creator_id === userProfileId;
    const spotsLeft = event.max_attendees - (event.rsvp_count || 0);

    return (
      <Card className="shadow-card border-border hover:shadow-glow transition-shadow">
        {event.cover_photo_url && (
          <div className="relative h-48 overflow-hidden rounded-t-lg">
            <img
              src={event.cover_photo_url}
              alt={event.name}
              className="w-full h-full object-cover"
            />
            {event.is_mystery_dinner && (
              <Badge className="absolute top-2 left-2 bg-mystery-purple">
                Mystery Dinner
              </Badge>
            )}
          </div>
        )}
        
        <CardHeader>
          <div className="flex items-start justify-between">
            <CardTitle className="text-lg">{event.name}</CardTitle>
            {showActions && isCreator && (
              <div className="flex space-x-2">
                <Button variant="outline" size="sm">
                  <Edit className="h-4 w-4" />
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => deleteEvent(event.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <p className="text-muted-foreground text-sm line-clamp-3">
            {event.description}
          </p>

          <div className="space-y-2 text-sm">
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>{new Date(event.date_time).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span>{new Date(event.date_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
            <div className="flex items-center space-x-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span>{event.location_name}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span>{event.rsvp_count}/{event.max_attendees} attending</span>
              {spotsLeft > 0 && spotsLeft <= 3 && (
                <Badge variant="outline" className="text-xs">
                  {spotsLeft} spots left
                </Badge>
              )}
            </div>
          </div>

          {event.tags && event.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {event.tags.slice(0, 3).map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
              {event.tags.length > 3 && (
                <Badge variant="secondary" className="text-xs">
                  +{event.tags.length - 3}
                </Badge>
              )}
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center space-x-2">
              <Avatar className="h-6 w-6">
                <AvatarImage src={event.profiles?.profile_photo_url} />
                <AvatarFallback className="text-xs">
                  {event.profiles?.first_name?.[0] || 'U'}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm text-muted-foreground">
                {event.profiles?.first_name} {event.profiles?.last_name}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 mt-4">
            {/* Details Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/event/${event.id}/details`)}
              className="flex-1"
            >
              <Eye className="h-4 w-4 mr-1" />
              Details
            </Button>

            {/* Edit Button (only for creators) */}
            {isCreator && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(`/event/${event.id}/edit`)}
                className="flex-1"
              >
                <Edit className="h-4 w-4 mr-1" />
                Edit
              </Button>
            )}

            {/* RSVP Button (only for non-creators) */}
            {!isCreator && spotsLeft > 0 && (
              <Button
                onClick={() => handleRSVP(event.id)}
                variant={hasRSVP ? "default" : "outline"}
                size="sm"
                className={`flex-1 ${hasRSVP ? "bg-sage-green hover:bg-sage-green/90" : ""}`}
              >
                {hasRSVP ? (
                  <>
                    <UserCheck className="h-4 w-4 mr-1" />
                    Going
                  </>
                ) : (
                  <>
                    <Heart className="h-4 w-4 mr-1" />
                    RSVP
                  </>
                )}
              </Button>
            )}

            {/* Delete Button (only for creators and only in My Events) */}
            {showActions && isCreator && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => deleteEvent(event.id)}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}

            {/* Status Badges */}
            {isCreator && (
              <Badge variant="outline" className="px-2 py-1">
                Creator
              </Badge>
            )}
            
            {spotsLeft === 0 && !isCreator && (
              <Badge variant="secondary" className="px-2 py-1">
                Full
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="h-8 w-8 animate-spin mx-auto border-4 border-peach-gold border-t-transparent rounded-full" />
          <p className="text-muted-foreground">Loading events...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Events</h1>
              <p className="text-muted-foreground mt-1">
                Discover and join dining experiences
              </p>
            </div>
            <Button 
              onClick={() => navigate('/create-event')}
              className="bg-peach-gold hover:bg-peach-gold/90 mt-4 sm:mt-0"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Event
            </Button>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="upcoming">Discover Events</TabsTrigger>
              <TabsTrigger value="my-events">My Events</TabsTrigger>
            </TabsList>
            
            <TabsContent value="upcoming" className="space-y-6">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search events..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredEvents.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>

              {filteredEvents.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">No events found</p>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="my-events" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {myEvents.map((event) => (
                  <EventCard key={event.id} event={event} showActions />
                ))}
              </div>

              {myEvents.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">You haven't created or joined any events yet</p>
                  <Button 
                    onClick={() => navigate('/create-event')}
                    className="bg-peach-gold hover:bg-peach-gold/90 mt-4"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Event
                  </Button>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Events;