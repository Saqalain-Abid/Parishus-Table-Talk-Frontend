import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
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

interface Reservation {
  id: string;
  user_id: string;
  event_id: string;
  reservation_type: string;
  reservation_status: string;
  created_at: string;
  updated_at: string;
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
    profiles: {
      first_name: string;
      last_name: string;
    };
  };
}

const RSVPs = () => {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      fetchReservations();
    }
  }, [user]);

  const fetchReservations = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('reservations')
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
            profiles!events_creator_id_fkey (
              first_name,
              last_name
            )
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setReservations(data || []);
    } catch (error) {
      console.error('Error fetching reservations:', error);
      toast({
        title: "Error",
        description: "Failed to load your RSVPs",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const cancelReservation = async (reservationId: string, eventId: string) => {
    const confirmed = window.confirm("Are you sure you want to cancel this RSVP?");
    if (!confirmed) return;

    try {
      // Delete reservation
      const { error: reservationError } = await supabase
        .from('reservations')
        .delete()
        .eq('id', reservationId);

      if (reservationError) throw reservationError;

      // Also delete from rsvps table
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user?.id)
        .single();

      if (profile) {
        const { error: rsvpError } = await supabase
          .from('rsvps')
          .delete()
          .eq('event_id', eventId)
          .eq('user_id', profile.id);

        if (rsvpError) console.log('No RSVP found to delete');
      }

      toast({
        title: "RSVP Cancelled",
        description: "Your reservation has been cancelled successfully.",
      });

      fetchReservations();
    } catch (error) {
      console.error('Error cancelling reservation:', error);
      toast({
        title: "Error",
        description: "Failed to cancel reservation",
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">My RSVPs</h1>
            <p className="text-muted-foreground mt-1">
              Manage your event reservations and attendance
            </p>
          </div>

          {reservations.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No RSVPs found</h3>
                <p className="text-muted-foreground mb-4">
                  You haven't RSVP'd to any events yet. Explore events to find something interesting!
                </p>
                <Button onClick={() => navigate('/explore')} className="bg-peach-gold hover:bg-peach-gold/90">
                  Explore Events
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
                    <div className="text-3xl font-bold text-peach-gold">{reservations.length}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Confirmed</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-green-600">
                      {reservations.filter(r => r.reservation_status === 'confirmed').length}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Pending</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-yellow-600">
                      {reservations.filter(r => r.reservation_status === 'pending').length}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Reservations Table */}
              <Card>
                <CardHeader>
                  <CardTitle>Your Reservations</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="border rounded-lg">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Event</TableHead>
                          <TableHead>Date & Time</TableHead>
                          <TableHead>Location</TableHead>
                          <TableHead>Host</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {reservations.map((reservation) => (
                          <TableRow key={reservation.id}>
                            <TableCell>
                              <div>
                                <div className="font-medium">{reservation.events.name}</div>
                                <div className="text-sm text-muted-foreground">
                                  {reservation.events.description?.substring(0, 60)}...
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1">
                                <div className="flex items-center space-x-2">
                                  <Calendar className="h-4 w-4 text-muted-foreground" />
                                  <span className="text-sm">{format(new Date(reservation.events.date_time), 'PPP')}</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Clock className="h-4 w-4 text-muted-foreground" />
                                  <span className="text-sm">{format(new Date(reservation.events.date_time), 'p')}</span>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-2">
                                <MapPin className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm">{reservation.events.location_name}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <span className="text-sm">
                                {reservation.events.profiles?.first_name} {reservation.events.profiles?.last_name}
                              </span>
                            </TableCell>
                            <TableCell>
                              <Badge className={getStatusColor(reservation.reservation_status)}>
                                {reservation.reservation_status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex space-x-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => navigate(`/event/${reservation.events.id}/details`)}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => cancelReservation(reservation.id, reservation.events.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RSVPs;