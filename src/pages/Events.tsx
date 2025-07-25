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
  rsvps?: {
    id: string;
    status: string;
    user_id: string;
  }[];
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
        return profile?.id || null;
      } else {
        setUserProfileId(null);
        return null;
      }
    };

    getUserProfile().then((profileId) => {
      if (profileId) {
        fetchEvents(profileId);
        fetchMyEvents(profileId);
      }
    });
  }, [user]);

  useEffect(() => {
    if (userProfileId) {
      fetchEvents(userProfileId);
      fetchMyEvents(userProfileId);
    }
  }, [activeTab, userProfileId]);

  const fetchEvents = async (profileId?: string) => {
    const currentProfileId = profileId || userProfileId;
    if (!currentProfileId) return;

    try {
      const { data, error } = await supabase
        .from('events')
        .select(`
          *,
          profiles:creator_id (
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

      // Filter out events that user has already RSVPed to
      const eventsWithCounts = data?.map(event => ({
        ...event,
        rsvp_count: event.rsvps?.filter(r => r.status === 'confirmed').length || 0,
        user_rsvp: event.rsvps?.filter(r => r.user_id === currentProfileId) || []
      })).filter(event => {
        // Show only events that user has NOT RSVPed to
        const hasRSVP = event.rsvps?.some(r => r.user_id === currentProfileId && r.status === 'confirmed');
        return !hasRSVP;
      }) || [];

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

  const fetchMyEvents = async (profileId?: string) => {
    const currentProfileId = profileId || userProfileId;
    if (!user || !currentProfileId) return;

    try {
      console.log('Fetching RSVP events for user:', user.id, 'profile:', currentProfileId);

      // Fetch only events user has RSVP'd to (including events they created if they RSVPed)
      const { data: rsvpEvents, error: rsvpError } = await supabase
        .from('events')
        .select(`
          *,
          profiles:creator_id (
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
        .eq('rsvps.user_id', currentProfileId)
        .eq('rsvps.status', 'confirmed')
        .order('date_time', { ascending: true });

      if (rsvpError) {
        console.error('RSVP events error:', rsvpError);
        throw rsvpError;
      }

      console.log('RSVP events:', rsvpEvents);

      const eventsWithCounts = (rsvpEvents || []).map(event => ({
        ...event,
        rsvp_count: event.rsvps?.filter(r => r.status === 'confirmed').length || 0,
        user_rsvp: event.rsvps?.filter(r => r.user_id === currentProfileId) || []
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
            user_id: userProfileId,
            reservation_type: 'standard',
            reservation_status: 'confirmed'
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

  const EventCards = ({ events, showActions = false }: { events: Event[]; showActions?: boolean }) => {
    if (events.length === 0) {
      return (
        <div className="text-center py-12">
          <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No events found</h3>
          <p className="text-muted-foreground mb-4">
            {showActions ? "You haven't created or joined any events yet" : "No events available at the moment"}
          </p>

          <Button
            onClick={() => navigate('/create-event')}
            className="bg-secondary hover:secondary/90"
          >
            <Plus className="h-4 w-4 mr-2" />
            {showActions ? "Create Your First Event" : "Create Event"}
          </Button>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {events.map((event) => {
          const eventDate = new Date(event.date_time);
          const isCreator = event.creator_id === userProfileId;
          const rsvps = event.rsvps || [];
          const hasRSVP = rsvps.some(rsvp => rsvp.user_id === userProfileId);
          const confirmedRSVPs = rsvps.filter(rsvp => rsvp.status === 'confirmed');
          const spotsLeft = event.max_attendees - confirmedRSVPs.length;
          const isUpcoming = eventDate > new Date();

          return (
            <Card className="flex flex-col h-full border border-secondary rounded-xl overflow-hidden shadow-sm">
              {/* Image with Overlay */}
              <div className="relative h-40 w-full overflow-hidden">
                {/* Image or Fallback */}
                <img
                  src={
                    event.cover_photo_url
                      ? event.cover_photo_url
                      : 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMYAAACUCAMAAAD/A6aTAAAATlBMVEXu7u5mZmbx8fFhYWGsrKypqalaWlrQ0NDq6urg4ODl5eWGhoZ2dnaMjIx/f3/09PS9vb3Y2NhwcHBUVFTJycmgoKDDw8OYmJhra2u1tbWVa4OnAAACPklEQVR4nO3a2XKjMBBAUWhhmV3gbZz//9GRwDhsk1ThmXKTuechDzip0o1oC1cSRQAAAAAAAAAAAAAAAAAAAP+YvOTdqx+kTfKCW/ru9fckq89ms3OV69gPn1Eft7qUijKKzeMR+Yx3B/RCxub7O1W1G/9Rxupq95examcZqYhzK0fdzjIkPSbJJV2seF8Zkl2NtaZq50veU4ZE6dWYOI5tMT8k9pXRnszdZxjbuOlLe8qI5NZthontr71lyOigkCZUhJCrmy5aeYZMjzt/U3UZ9rar3ZD2Nu6Q6NDfVcV8zaozXFvfPyZ3Vb6/N1xxWek/ECXT+6dtPo7L5yrNGW3ZHRLJ5IN2eBpZ/rDeDDnW3Twb8zH/7Uv/ZXRVbYZ7VATJpKOPcNkhc8/rOjPET3dphwoTJ4vtcHnlH0met5fODD8X/oR47oYxh9k8SF741+tsmBqdGY/p/mSS6ffmhe3Oj1ZxhshoLob9GM2Hn4uqv+OeHRoz3KKim4+hQySrzOOiKbLudlOY4eZ31LAf/VusSP6oiP1Du6nT0KEsIzwKtvFKRTgHD92DostqO84rw34oywin3tpePDrCmZcVdnK1mw9tGXJZzsXnipPUzSv6DmUZa9M9WnB8aKvl637OI00ZdbQ63SP309rgmDKvFWVUrfm6IrxhrV215UlPRlGevqv4Y51VlPHtXnzRoSljcwUZfxkZujLqs91MzR+Uo7Q5vKBZ/tHjTX7GP1sAAAAAAAAAAAAAAAAAAICf6zcVZSGYiJ5WLQAAAABJRU5ErkJggg=='
                  }
                  alt={event.name}
                  className="w-full h-full object-cover"
                />

                {/* Black Overlay */}
                <div className="absolute inset-0 bg-black/80 z-10" />

                {/* Text Content */}
                <div className="absolute inset-0 p-4 flex flex-col justify-end z-20">
                  <h3 className="text-secondary text-xl font-bold line-clamp-1">{event.name}</h3>
                  {event.description && (
                    <p className="text-secondary/90 text-sm mt-1 line-clamp-1">{event.description}</p>
                  )}
                </div>
              </div>



              {/* Footer Section */}
              <CardContent className="flex flex-col flex-grow space-y-3 p-4">
                {/* Date & Time */}
                <div className="text-sm flex items-center gap-2">
                  <span>
                    {new Date(event.date_time).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric'
                    })}
                    {' - '}
                    {new Date(event.date_time).toLocaleTimeString('en-US', {
                      hour: 'numeric',
                      minute: '2-digit'
                    })}
                  </span>
                </div>

                {/* RSVP Count */}
                {event.max_attendees && (
                  <div className="text-sm font-medium py-4 border-t-2 border-b-2 border-y-black-900">
                    {event.rsvp_count || 0}/{event.max_attendees} RSVPed
                  </div>
                )}

                <div className='flex items-center'>
                  <MapPin className="w-6 h-6 text-white" />

                  {/* Location */}
                  <div className="text-sm flex flex-col items-center">
                    <span className="">{event.location_name || 'Location not specified'}</span>
                  {/* Address */}
                  {event.location_address && (
                    <span className="text-sm text-gray-500 line-clamp-1">
                      {event.location_address}
                    </span>
                  )}
                  </div>


                </div>


                {/* Spacer and Button */}
                <div className="flex-grow" />

                <div>
                  <Button
                    onClick={() => navigate(`/event/${event.id}/details`)}
                    className="w-full bg-secondary hover:bg-secondary/80 text-black border border-secondary"
                  >
                    See details
                  </Button>
                </div>
              </CardContent>
            </Card>


          );
        })}
      </div>
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
              className="bg-secondary hover:bg-secondary/90 mt-4 sm:mt-0"
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

              <div className="space-y-6">
                <EventCards events={filteredEvents} />
              </div>
            </TabsContent>

            <TabsContent value="my-events" className="space-y-6">
              <div className="space-y-6">
                <EventCards events={myEvents} showActions />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Events;