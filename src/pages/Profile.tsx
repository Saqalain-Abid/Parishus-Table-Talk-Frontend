import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Camera, Edit, Save, X } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const Profile = () => {
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    job_title: '',
    location_city: ''
  });
  const { user, signOut } = useAuth();
  const { profile, refetch } = useProfile();

  React.useEffect(() => {
    if (profile) {
      setFormData({
        first_name: profile.first_name || '',
        last_name: profile.last_name || '',
        job_title: profile.job_title || '',
        location_city: profile.location_city || ''
      });
    }
  }, [profile]);

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user || !profile) return;

    setUploading(true);
    
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `profile-photos/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('profile-photos')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('profile-photos')
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ profile_photo_url: publicUrl })
        .eq('id', profile.id);

      if (updateError) throw updateError;

      await refetch();
      
      toast({
        title: "Photo updated!",
        description: "Your profile photo has been updated.",
      });
    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload photo",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!profile) return;

    setLoading(true);
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update(formData)
        .eq('id', profile.id);

      if (error) throw error;

      await refetch();
      setEditing(false);
      
      toast({
        title: "Profile updated!",
        description: "Your profile has been updated successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update profile",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (profile) {
      setFormData({
        first_name: profile.first_name || '',
        last_name: profile.last_name || '',
        job_title: profile.job_title || '',
        location_city: profile.location_city || ''
      });
    }
    setEditing(false);
  };

  if (!profile) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-card rounded w-48 mb-8"></div>
            <div className="h-64 bg-card rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-foreground">Profile</h1>
            <Button onClick={signOut} variant="outline">
              Sign Out
            </Button>
          </div>

          <Card className="shadow-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Personal Information
                {!editing ? (
                  <Button onClick={() => setEditing(true)} variant="outline" size="sm">
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                ) : (
                  <div className="flex space-x-2">
                    <Button onClick={handleSave} disabled={loading} size="sm" className="bg-peach-gold hover:bg-peach-gold/90 text-background">
                      <Save className="h-4 w-4 mr-2" />
                      {loading ? 'Saving...' : 'Save'}
                    </Button>
                    <Button onClick={handleCancel} variant="outline" size="sm">
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                  </div>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center space-x-6">
                <div className="relative">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src={profile.profile_photo_url || ''} />
                    <AvatarFallback className="bg-peach-gold text-background text-xl">
                      {profile.first_name?.[0]}{profile.last_name?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="photo-upload"
                    disabled={uploading}
                  />
                  <label htmlFor="photo-upload">
                    <Button
                      asChild
                      size="sm"
                      className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full p-0 bg-peach-gold hover:bg-peach-gold/90 text-background cursor-pointer"
                      disabled={uploading}
                    >
                      <span>
                        <Camera className="h-4 w-4" />
                      </span>
                    </Button>
                  </label>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-foreground">
                    {profile.first_name} {profile.last_name}
                  </h3>
                  <p className="text-muted-foreground">{profile.email}</p>
                  {profile.job_title && (
                    <p className="text-muted-foreground">{profile.job_title}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="first_name">First Name</Label>
                  {editing ? (
                    <Input
                      id="first_name"
                      value={formData.first_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, first_name: e.target.value }))}
                    />
                  ) : (
                    <p className="text-foreground p-2 bg-muted rounded-md">{profile.first_name || 'Not set'}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="last_name">Last Name</Label>
                  {editing ? (
                    <Input
                      id="last_name"
                      value={formData.last_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, last_name: e.target.value }))}
                    />
                  ) : (
                    <p className="text-foreground p-2 bg-muted rounded-md">{profile.last_name || 'Not set'}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="job_title">Job Title</Label>
                  {editing ? (
                    <Input
                      id="job_title"
                      value={formData.job_title}
                      onChange={(e) => setFormData(prev => ({ ...prev, job_title: e.target.value }))}
                    />
                  ) : (
                    <p className="text-foreground p-2 bg-muted rounded-md">{profile.job_title || 'Not set'}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location_city">Location</Label>
                  {editing ? (
                    <Input
                      id="location_city"
                      value={formData.location_city}
                      onChange={(e) => setFormData(prev => ({ ...prev, location_city: e.target.value }))}
                    />
                  ) : (
                    <p className="text-foreground p-2 bg-muted rounded-md">{profile.location_city || 'Not set'}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card border-border">
            <CardHeader>
              <CardTitle>Preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Dining Style</Label>
                <p className="text-foreground p-2 bg-muted rounded-md mt-1">
                  {profile.dining_style ? profile.dining_style.replace('_', ' ') : 'Not set'}
                </p>
              </div>
              
              <div>
                <Label>Dietary Preferences</Label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {profile.dietary_preferences && profile.dietary_preferences.length > 0 ? (
                    profile.dietary_preferences.map((pref) => (
                      <Badge key={pref} variant="secondary">
                        {pref.replace('_', ' ')}
                      </Badge>
                    ))
                  ) : (
                    <p className="text-muted-foreground">None set</p>
                  )}
                </div>
              </div>

              <div>
                <Label>Gender Identity</Label>
                <p className="text-foreground p-2 bg-muted rounded-md mt-1">
                  {profile.gender_identity ? profile.gender_identity.replace('_', ' ') : 'Not set'}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Profile;