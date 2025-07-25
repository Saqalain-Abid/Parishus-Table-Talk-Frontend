import React, { useState, useEffect } from 'react';
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
  Edit,
  Eye,
  Trash2
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { PopoverModal } from '@/components/ui/PopoverModal';

interface RSVP {
  id: string;
  user_id: string;
  event_id: string;
  response_status: string;
  status: string;
  created_at: string;
  events: {
    id: string;
    name: string;
    description: string;
    date_time: string;
    location_name: string;
    location_address: string;
    max_attendees: number;
    creator_id: string;
    status: string;
    cover_photo_url?: string;
    profiles: {
      first_name: string;
      last_name: string;
    };
  };
}

const RSVPs = () => {
  const [rsvps, setRsvps] = useState<RSVP[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();
  const [cancelTarget, setCancelTarget] = useState<{ rsvpId: string; eventId: string } | null>(null);
  const [popoverVisible, setPopoverVisible] = useState(false);
  const [popoverConfig, setPopoverConfig] = useState<{
    message: string;
    type: 'info' | 'success' | 'warning';
  }>({
    message: '',
    type: 'info',
  });

  useEffect(() => {
    if (user) {
      fetchRSVPs();
    }
  }, [user]);

  const fetchRSVPs = async () => {
    if (!user) return;

    try {
      console.log('Fetching RSVPs for user:', user.id);

      // Get user's profile ID first
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (profileError) {
        console.error('Profile error:', profileError);
        throw profileError;
      }

      console.log('Found profile ID:', profile.id);

      const { data, error } = await supabase
        .from('rsvps')
        .select(`
          *,
          events (
            id,
            name,
            description,
            date_time,
            location_name,
            location_address,
            max_attendees,
            creator_id,
            status,
            cover_photo_url,
            profiles!events_creator_id_fkey (
              first_name,
              last_name
            )
          )
        `)
        .eq('user_id', profile.id)
        .eq('status', 'confirmed')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('RSVPs query error:', error);
        throw error;
      }

      console.log('Found RSVPs:', data);
      setRsvps(data || []);
    } catch (error) {
      console.error('Error fetching RSVPs:', error);
      toast({
        title: "Error",
        description: "Failed to load your RSVPs",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancelRSVP = (rsvpId: string, eventId: string) => {
    setCancelTarget({ rsvpId, eventId });
    setPopoverConfig({
      message: "Are you sure you want to cancel your RSVP for this event?",
      type: "warning",
    });
    setPopoverVisible(true);
  };

  const cancelRSVP = async (rsvpId: string, eventId: string) => {
    try {
      // Get user's profile ID first
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user?.id)
        .single();

      if (profileError) throw profileError;

      // Delete RSVP
      const { error: rsvpError } = await supabase
        .from('rsvps')
        .delete()
        .eq('id', rsvpId);

      if (rsvpError) throw rsvpError;

      // Also delete from reservations table if it exists
      const { error: reservationError } = await supabase
        .from('reservations')
        .delete()
        .eq('event_id', eventId)
        .eq('user_id', profile.id);

      if (reservationError) console.log('No reservation found to delete');

      toast({
        title: "RSVP Cancelled",
        description: "Your RSVP has been cancelled successfully.",
      });

      fetchRSVPs();
    } catch (error) {
      console.error('Error cancelling RSVP:', error);
      toast({
        title: "Error",
        description: "Failed to cancel RSVP",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmed': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="h-8 w-8 animate-spin mx-auto border-4 border-peach-gold border-t-transparent rounded-full" />
          <p className="text-muted-foreground">Loading your RSVPs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {popoverVisible && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <PopoverModal
            message={popoverConfig.message}
            type={popoverConfig.type}
            primaryAction={{
              label: cancelTarget ? 'Yes, Cancel RSVP' : 'Okay',
              onClick: () => {
                setPopoverVisible(false);

                // If this was a cancel confirmation, proceed
                if (cancelTarget) {
                  cancelRSVP(cancelTarget.rsvpId, cancelTarget.eventId);
                  setCancelTarget(null);
                }
              },
            }}
            secondaryAction={{
              label: 'No, Go Back',
              onClick: () => {
                setPopoverVisible(false);
                setCancelTarget(null);
              },
            }}
          />
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">My RSVPs</h1>
            <p className="text-muted-foreground mt-1">
              Manage your event reservations and attendance
            </p>
          </div>

          {rsvps.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No RSVPs found</h3>
                <p className="text-muted-foreground mb-4">
                  You haven't RSVP'd to any events yet. Explore events to find something interesting!
                </p>
                <Button onClick={() => navigate('/events')} className="bg-peach-gold hover:bg-peach-gold/90">
                  Browse Events
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Total RSVPs</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-peach-gold">{rsvps.length}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Confirmed</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-green-600">
                      {rsvps.filter(r => r.status === 'confirmed').length}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Pending</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-yellow-600">
                      {rsvps.filter(r => r.status === 'pending').length}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* RSVPs Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {rsvps.map((rsvp) => {
                  const eventDate = new Date(rsvp.events.date_time);
                  const isUpcoming = eventDate > new Date();

                  return (
                    <Card key={rsvp.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                      {/* Event Image */}
                      {rsvp.events.cover_photo_url && (
                        <div className="h-48 overflow-hidden">
                          <img
                            src={rsvp.events.cover_photo_url}
                            alt={rsvp.events.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}

                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <CardTitle className="text-lg leading-tight">{rsvp.events.name}</CardTitle>
                          <div className="flex gap-1 ml-2">
                            <Badge variant={isUpcoming ? "default" : "secondary"} className="text-xs">
                              {isUpcoming ? 'Upcoming' : 'Past'}
                            </Badge>
                            <Badge className={`text-xs ${getStatusColor(rsvp.status)}`}>
                              {rsvp.status}
                            </Badge>
                          </div>
                        </div>

                        <p className="text-sm text-muted-foreground line-clamp-2 mt-2">
                          {rsvp.events.description}
                        </p>
                      </CardHeader>

                      <CardContent className="pt-0 space-y-4">
                        {/* Date & Time */}
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{format(eventDate, 'PPP')}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{format(eventDate, 'p')}</span>
                          </div>
                        </div>

                        {/* Location */}
                        <div className="flex items-center space-x-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm truncate">{rsvp.events.location_name}</span>
                        </div>

                        {/* Host */}
                        <div className="flex items-center space-x-2">
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className="text-xs">
                              {rsvp.events.profiles?.first_name?.[0] || 'H'}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm truncate">
                            {rsvp.events.profiles?.first_name} {rsvp.events.profiles?.last_name}
                          </span>
                        </div>

                        {/* RSVP Date */}
                        <div className="text-xs text-muted-foreground">
                          RSVP'd on {format(new Date(rsvp.created_at), 'PPP')}
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2 pt-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/event/${rsvp.events.id}/details`)}
                            className="flex-1"
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View Event
                          </Button>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCancelRSVP(rsvp.id, rsvp.events.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RSVPs;