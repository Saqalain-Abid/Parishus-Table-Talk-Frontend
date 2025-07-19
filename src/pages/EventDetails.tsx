import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  ArrowLeft,
  Heart,
  UserCheck,
  Edit,
  Share2
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';

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
  status: string;
  created_at: string;
  profiles: {
    first_name: string;
    last_name: string;
    profile_photo_url: string;
    email: string;
  };
  rsvps: Array<{
    id: string;
    user_id: string;
    status: string;
    created_at: string;
    profiles: {
      first_name: string;
      last_name: string;
      profile_photo_url: string;
    };
  }>;
}

const EventDetails = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [userProfileId, setUserProfileId] = useState<string | null>(null);

  useEffect(() => {
    const getUserProfile = async () => {
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('user_id', user.id)
          .single();
        setUserProfileId(profile?.id || null);
      }
    };
    
    getUserProfile().then(() => {
      if (eventId) {
        fetchEvent();
      }
    });
  }, [eventId, user]);

  const fetchEvent = async () => {
    if (!eventId) return;

    try {
      const { data, error } = await supabase
        .from('events')
        .select(`
          *,
          profiles!events_creator_id_fkey (
            first_name,
            last_name,
            profile_photo_url,
            email
          ),
          rsvps (
            id,
            user_id,
            status,
            created_at,
            profiles!rsvps_user_id_fkey (
              first_name,
              last_name,
              profile_photo_url
            )
          )
        `)
        .eq('id', eventId)
        .single();

      if (error) throw error;
      setEvent(data);
    } catch (error) {
      console.error('Error fetching event:', error);
      toast({
        title: "Error",
        description: "Failed to load event details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRSVP = async () => {
    if (!user || !userProfileId || !event) return;

    const hasRSVP = event.rsvps.some(rsvp => rsvp.user_id === userProfileId);
    const confirmed = window.confirm(
      hasRSVP 
        ? "Are you sure you want to cancel your RSVP?"
        : "Are you sure you want to RSVP to this event?"
    );

    if (!confirmed) return;

    try {
      if (hasRSVP) {
        // Remove RSVP
        const { error } = await supabase
          .from('rsvps')
          .delete()
          .eq('event_id', eventId)
          .eq('user_id', userProfileId);

        if (error) throw error;

        // Also remove from reservations
        const { error: reservationError } = await supabase
          .from('reservations')
          .delete()
          .eq('event_id', eventId)
          .eq('user_id', user.id);

        if (reservationError) console.log('No reservation found');

        toast({
          title: "RSVP Cancelled",
          description: "You're no longer attending this event.",
        });
      } else {
        // Add RSVP
        const { error: rsvpError } = await supabase
          .from('rsvps')
          .insert({
            event_id: eventId,
            user_id: userProfileId,
            status: 'confirmed'
          });

        if (rsvpError) throw rsvpError;

        // Create reservation
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
          title: "RSVP Confirmed!",
          description: "You're now attending this event. Your reservation is pending confirmation.",
        });
      }

      fetchEvent();
    } catch (error) {
      console.error('Error handling RSVP:', error);
      toast({
        title: "Error",
        description: "Failed to update RSVP",
        variant: "destructive",
      });
    }
  };

  const shareEvent = async () => {
    try {
      await navigator.share({
        title: event?.name,
        text: event?.description,
        url: window.location.href,
      });
    } catch (error) {
      // Fallback to copying URL
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Link copied!",
        description: "Event link copied to clipboard",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="h-8 w-8 animate-spin mx-auto border-4 border-peach-gold border-t-transparent rounded-full" />
          <p className="text-muted-foreground">Loading event details...</p>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-foreground">Event Not Found</h1>
          <p className="text-muted-foreground">The event you're looking for doesn't exist or has been removed.</p>
          <Button onClick={() => navigate('/events')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Events
          </Button>
        </div>
      </div>
    );
  }

  const eventDate = new Date(event.date_time);
  const isCreator = event.creator_id === userProfileId;
  const hasRSVP = event.rsvps.some(rsvp => rsvp.user_id === userProfileId);
  const confirmedRSVPs = event.rsvps.filter(rsvp => rsvp.status === 'confirmed');
  const spotsLeft = event.max_attendees - confirmedRSVPs.length;
  const isUpcoming = eventDate > new Date();

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/events')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Events
          </Button>
        </div>

        {/* Event Cover Image */}
        {event.cover_photo_url && (
          <div className="relative h-64 mb-8 rounded-lg overflow-hidden">
            <img
              src={event.cover_photo_url}
              alt={event.name}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Event Header */}
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <CardTitle className="text-2xl">{event.name}</CardTitle>
                    <div className="flex items-center space-x-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={event.profiles.profile_photo_url} />
                        <AvatarFallback>
                          {event.profiles.first_name[0]}{event.profiles.last_name[0]}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm text-muted-foreground">
                        Hosted by {event.profiles.first_name} {event.profiles.last_name}
                      </span>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm" onClick={shareEvent}>
                      <Share2 className="h-4 w-4" />
                    </Button>
                    {isCreator && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => navigate(`/event/${event.id}/edit`)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">{event.description}</p>
                
                {event.tags && event.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {event.tags.map((tag) => (
                      <Badge key={tag} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Event Details */}
            <Card>
              <CardHeader>
                <CardTitle>Event Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-3">
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{format(eventDate, 'EEEE, MMMM d, yyyy')}</p>
                      <p className="text-sm text-muted-foreground">Date</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Clock className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{format(eventDate, 'h:mm a')}</p>
                      <p className="text-sm text-muted-foreground">Time</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <MapPin className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{event.location_name}</p>
                      {event.location_address && (
                        <p className="text-sm text-muted-foreground">{event.location_address}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Users className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{confirmedRSVPs.length} / {event.max_attendees} attending</p>
                      <p className="text-sm text-muted-foreground">
                        {spotsLeft > 0 ? `${spotsLeft} spots left` : 'Event full'}
                      </p>
                    </div>
                  </div>
                </div>

                {event.dining_style && (
                  <div>
                    <h4 className="font-medium mb-2">Dining Style</h4>
                    <Badge variant="outline">{event.dining_style.replace('_', ' ')}</Badge>
                  </div>
                )}

                {event.dietary_theme && (
                  <div>
                    <h4 className="font-medium mb-2">Dietary Theme</h4>
                    <Badge variant="outline">{event.dietary_theme.replace('_', ' ')}</Badge>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* RSVP Card */}
            <Card>
              <CardHeader>
                <CardTitle>Join Event</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <p className="text-2xl font-bold">{confirmedRSVPs.length}</p>
                  <p className="text-sm text-muted-foreground">People attending</p>
                </div>

                {!isCreator && isUpcoming && spotsLeft > 0 && (
                  <Button
                    onClick={handleRSVP}
                    className={`w-full ${
                      hasRSVP 
                        ? "bg-sage-green hover:bg-sage-green/90" 
                        : "bg-peach-gold hover:bg-peach-gold/90"
                    }`}
                  >
                    {hasRSVP ? (
                      <>
                        <UserCheck className="h-4 w-4 mr-2" />
                        Going - Cancel RSVP
                      </>
                    ) : (
                      <>
                        <Heart className="h-4 w-4 mr-2" />
                        RSVP to Event
                      </>
                    )}
                  </Button>
                )}

                {isCreator && (
                  <div className="text-center">
                    <Badge variant="outline" className="px-3 py-1">
                      You're the host
                    </Badge>
                  </div>
                )}

                {spotsLeft === 0 && !isCreator && (
                  <div className="text-center">
                    <Badge variant="secondary" className="px-3 py-1">
                      Event Full
                    </Badge>
                  </div>
                )}

                {!isUpcoming && (
                  <div className="text-center">
                    <Badge variant="secondary" className="px-3 py-1">
                      Event Ended
                    </Badge>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Attendees */}
            {confirmedRSVPs.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Attendees ({confirmedRSVPs.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {confirmedRSVPs.slice(0, 5).map((rsvp) => (
                      <div key={rsvp.id} className="flex items-center space-x-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={rsvp.profiles.profile_photo_url} />
                          <AvatarFallback>
                            {rsvp.profiles.first_name[0]}{rsvp.profiles.last_name[0]}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm">
                          {rsvp.profiles.first_name} {rsvp.profiles.last_name}
                        </span>
                      </div>
                    ))}
                    {confirmedRSVPs.length > 5 && (
                      <p className="text-sm text-muted-foreground">
                        And {confirmedRSVPs.length - 5} more...
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventDetails;