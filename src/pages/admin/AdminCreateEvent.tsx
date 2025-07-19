import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar as CalendarIcon, MapPin, Users, ArrowLeft, Save } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import AdminLayout from '@/components/layout/AdminLayout';

const AdminCreateEvent = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { profile } = useProfile();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    date: '',
    time: '',
    location_name: '',
    location_address: '',
    max_attendees: 10,
    dining_style: '',
    dietary_theme: '',
    rsvp_deadline_date: '',
    rsvp_deadline_time: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Combine date and time
      const dateTime = new Date(`${formData.date}T${formData.time}`);
      const rsvpDeadline = formData.rsvp_deadline_date && formData.rsvp_deadline_time 
        ? new Date(`${formData.rsvp_deadline_date}T${formData.rsvp_deadline_time}`)
        : null;

      const eventData = {
        name: formData.name,
        description: formData.description,
        date_time: dateTime.toISOString(),
        location_name: formData.location_name,
        location_address: formData.location_address,
        max_attendees: formData.max_attendees,
        dining_style: formData.dining_style as any || null,
        dietary_theme: formData.dietary_theme as any || null,
        rsvp_deadline: rsvpDeadline?.toISOString() || null,
        creator_id: user?.id,
        status: 'active' as any
      };

      const { data, error } = await supabase
        .from('events')
        .insert(eventData)
        .select()
        .single();

      if (error) throw error;

      toast({ title: "Event created successfully!" });
      navigate('/admin/events');
    } catch (error: any) {
      console.error('Error creating event:', error);
      toast({ 
        title: "Error creating event", 
        description: error.message,
        variant: "destructive" 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (!profile || (profile.role !== 'admin' && profile.role !== 'superadmin')) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center space-y-4">
            <h1 className="text-2xl font-bold text-foreground">Access Denied</h1>
            <p className="text-muted-foreground">You don't have permission to create events.</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-4">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/admin/events')}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Events</span>
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Create New Event</h1>
            <p className="text-muted-foreground">Fill out the details to create a new event</p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <CalendarIcon className="h-5 w-5" />
                <span>Event Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Event Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Enter event name"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="max_attendees">Max Attendees *</Label>
                  <Input
                    id="max_attendees"
                    type="number"
                    value={formData.max_attendees}
                    onChange={(e) => handleInputChange('max_attendees', parseInt(e.target.value))}
                    min="1"
                    required
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Describe your event..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Date & Time */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <CalendarIcon className="h-5 w-5" />
                <span>Date & Time</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="date">Event Date *</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => handleInputChange('date', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="time">Event Time *</Label>
                  <Input
                    id="time"
                    type="time"
                    value={formData.time}
                    onChange={(e) => handleInputChange('time', e.target.value)}
                    required
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="rsvp_deadline_date">RSVP Deadline Date</Label>
                  <Input
                    id="rsvp_deadline_date"
                    type="date"
                    value={formData.rsvp_deadline_date}
                    onChange={(e) => handleInputChange('rsvp_deadline_date', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="rsvp_deadline_time">RSVP Deadline Time</Label>
                  <Input
                    id="rsvp_deadline_time"
                    type="time"
                    value={formData.rsvp_deadline_time}
                    onChange={(e) => handleInputChange('rsvp_deadline_time', e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Location */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MapPin className="h-5 w-5" />
                <span>Location</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="location_name">Venue Name *</Label>
                <Input
                  id="location_name"
                  value={formData.location_name}
                  onChange={(e) => handleInputChange('location_name', e.target.value)}
                  placeholder="e.g., The Grand Restaurant"
                  required
                />
              </div>
              <div>
                <Label htmlFor="location_address">Address</Label>
                <Input
                  id="location_address"
                  value={formData.location_address}
                  onChange={(e) => handleInputChange('location_address', e.target.value)}
                  placeholder="Full address including city, state"
                />
              </div>
            </CardContent>
          </Card>

          {/* Event Type */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5" />
                <span>Event Preferences</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="dining_style">Dining Style</Label>
                  <Select value={formData.dining_style} onValueChange={(value) => handleInputChange('dining_style', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select dining style" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="adventurous">Adventurous</SelectItem>
                      <SelectItem value="foodie_enthusiast">Foodie Enthusiast</SelectItem>
                      <SelectItem value="local_lover">Local Lover</SelectItem>
                      <SelectItem value="comfort_food">Comfort Food</SelectItem>
                      <SelectItem value="health_conscious">Health Conscious</SelectItem>
                      <SelectItem value="social_butterfly">Social Butterfly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="dietary_theme">Dietary Theme</Label>
                  <Select value={formData.dietary_theme} onValueChange={(value) => handleInputChange('dietary_theme', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select dietary theme" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="omnivore">Omnivore</SelectItem>
                      <SelectItem value="vegetarian">Vegetarian</SelectItem>
                      <SelectItem value="vegan">Vegan</SelectItem>
                      <SelectItem value="gluten_free">Gluten Free</SelectItem>
                      <SelectItem value="keto">Keto</SelectItem>
                      <SelectItem value="paleo">Paleo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Submit */}
          <div className="flex justify-end space-x-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => navigate('/admin/events')}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={loading}
              className="flex items-center space-x-2"
            >
              <Save className="h-4 w-4" />
              <span>{loading ? 'Creating...' : 'Create Event'}</span>
            </Button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
};

export default AdminCreateEvent;