import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Camera, Edit, Save, X, CreditCard, Mail, User, Briefcase, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

const Profile = () => {
  const [editing, setEditing] = useState(false);
  const [editingPreferences, setEditingPreferences] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    job_title: '',
    location_city: ''
  });
  const [preferenceData, setPreferenceData] = useState({
    dining_style: '' as 'adventurous' | 'foodie_enthusiast' | 'local_lover' | 'comfort_food' | 'health_conscious' | 'social_butterfly' | '',
    dietary_preferences: [] as ('vegetarian' | 'vegan' | 'gluten_free' | 'dairy_free' | 'keto' | 'paleo' | 'halal' | 'kosher' | 'no_restrictions')[],
    gender_identity: '' as 'male' | 'female' | 'non_binary' | 'prefer_not_to_say' | ''
  });
  const { user, signOut } = useAuth();
  const { profile, refetch } = useProfile();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (profile) {
      setFormData({
        first_name: profile.first_name || '',
        last_name: profile.last_name || '',
        job_title: profile.job_title || '',
        location_city: profile.location_city || ''
      });
      setPreferenceData({
        dining_style: profile.dining_style || '',
        dietary_preferences: profile.dietary_preferences || [],
        gender_identity: profile.gender_identity || ''
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

  const handleSavePreferences = async () => {
    if (!profile) return;

    setLoading(true);
    
    try {
      const updateData: any = {
        dietary_preferences: preferenceData.dietary_preferences
      };
      
      if (preferenceData.dining_style && preferenceData.dining_style.length > 0) {
        updateData.dining_style = preferenceData.dining_style;
      }
      
      if (preferenceData.gender_identity && preferenceData.gender_identity.length > 0) {
        updateData.gender_identity = preferenceData.gender_identity;
      }

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', profile.id);

      if (error) throw error;

      await refetch();
      setEditingPreferences(false);
      
      toast({
        title: "Preferences updated!",
        description: "Your preferences have been updated successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update preferences",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancelPreferences = () => {
    if (profile) {
      setPreferenceData({
        dining_style: profile.dining_style || '',
        dietary_preferences: profile.dietary_preferences || [],
        gender_identity: profile.gender_identity || ''
      });
    }
    setEditingPreferences(false);
  };

  if (!profile) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-card rounded w-48 mb-8" />
            <div className="h-64 bg-card rounded" />
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

          <Card className="border-border shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center justify-between text-lg font-semibold">
                <div className="flex items-center space-x-2">
                  <User className="h-5 w-5 text-muted-foreground" />
                  <span>Personal Information</span>
                </div>
                {!editing ? (
                  <Button 
                    onClick={() => setEditing(true)} 
                    variant="outline" 
                    size="sm"
                    className="border text-white hover:text-black hover:bg-secondary/90"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Profile
                  </Button>
                ) : (
                  <div className="flex space-x-2">
                    <Button 
                      onClick={handleSave} 
                      disabled={loading} 
                      size="sm" 
                      className="bg-primary border-primary border hover:bg-primary/90 hover:text-black shadow-sm"
                    >
                      {loading ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4 mr-2" />
                      )}
                      {loading ? 'Saving...' : 'Save Changes'}
                    </Button>
                    <Button 
                      onClick={handleCancel} 
                      variant="outline" 
                      size="sm"
                      className="border-gray-300 hover:bg-secondary"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                  </div>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                <div className="relative group">
                  <Avatar className="h-28 w-28 border-2 border-peach-gold/30">
                    <AvatarImage src={profile.profile_photo_url || ''} />
                    <AvatarFallback className="bg-peach-gold/90 text-white text-2xl font-medium">
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
                  <label 
                    htmlFor="photo-upload"
                    className={`absolute inset-0 flex items-center justify-center bg-black/30 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer ${uploading ? 'opacity-100' : ''}`}
                  >
                    {uploading ? (
                      <Loader2 className="h-6 w-6 animate-spin text-white" />
                    ) : (
                      <Camera className="h-6 w-6 text-white" />
                    )}
                  </label>
                </div>
                <div className="space-y-1">
                  <h3 className="text-2xl font-bold text-foreground">
                    {profile.first_name} {profile.last_name}
                  </h3>
                  <p className="text-muted-foreground flex items-center">
                    <Mail className="h-4 w-4 mr-2" />
                    {profile.email}
                  </p>
                  {profile.job_title && (
                    <p className="text-muted-foreground flex items-center">
                      <Briefcase className="h-4 w-4 mr-2" />
                      {profile.job_title}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="first_name" className="text-sm font-medium text-muted-foreground">
                    First Name
                  </Label>
                  {editing ? (
                    <Input
                      id="first_name"
                      value={formData.first_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, first_name: e.target.value }))}
                      className="focus-visible:ring-peach-gold"
                    />
                  ) : (
                    <div className="p-3 bg-muted/50 rounded-md border border-transparent">
                      <p className={profile.first_name ? "text-foreground" : "text-muted-foreground"}>
                        {profile.first_name || 'Not provided'}
                      </p>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="last_name" className="text-sm font-medium text-muted-foreground">
                    Last Name
                  </Label>
                  {editing ? (
                    <Input
                      id="last_name"
                      value={formData.last_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, last_name: e.target.value }))}
                      className="focus-visible:ring-peach-gold"
                    />
                  ) : (
                    <div className="p-3 bg-muted/50 rounded-md border border-transparent">
                      <p className={profile.last_name ? "text-foreground" : "text-muted-foreground"}>
                        {profile.last_name || 'Not provided'}
                      </p>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="job_title" className="text-sm font-medium text-muted-foreground">
                    Job Title
                  </Label>
                  {editing ? (
                    <Input
                      id="job_title"
                      value={formData.job_title}
                      onChange={(e) => setFormData(prev => ({ ...prev, job_title: e.target.value }))}
                      className="focus-visible:ring-peach-gold"
                    />
                  ) : (
                    <div className="p-3 bg-muted/50 rounded-md border border-transparent">
                      <p className={profile.job_title ? "text-foreground" : "text-muted-foreground"}>
                        {profile.job_title || 'Not provided'}
                      </p>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location_city" className="text-sm font-medium text-muted-foreground">
                    Location
                  </Label>
                  {editing ? (
                    <Input
                      id="location_city"
                      value={formData.location_city}
                      onChange={(e) => setFormData(prev => ({ ...prev, location_city: e.target.value }))}
                      className="focus-visible:ring-peach-gold"
                    />
                  ) : (
                    <div className="p-3 bg-muted/50 rounded-md border border-transparent">
                      <p className={profile.location_city ? "text-foreground" : "text-muted-foreground"}>
                        {profile.location_city || 'Not provided'}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Preferences
                {!editingPreferences ? (
                  <Button onClick={() => setEditingPreferences(true)} variant="outline" size="sm">
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                ) : (
                  <div className="flex space-x-2">
                    <Button onClick={handleSavePreferences} disabled={loading} size="sm" className="bg-peach-gold hover:bg-peach-gold/90 text-background">
                      <Save className="h-4 w-4 mr-2" />
                      {loading ? 'Saving...' : 'Save Changes'}
                    </Button>
                    <Button onClick={handleCancelPreferences} variant="outline" size="sm">
                      <X className="h-4 w-4 mr-2" />
                      Discard Changes
                    </Button>
                  </div>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">What's Your Dining Style?</h3>
                
                {editingPreferences ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      { value: "adventurous", label: "Adventurous Eater", description: "Always trying new cuisines" },
                      { value: "health_conscious", label: "Healthy Choices", description: "Focus on nutritious options" },
                      { value: "foodie_enthusiast", label: "Foodie Enthusiast", description: "Passionate about culinary experiences" },
                      { value: "local_lover", label: "Local Lover", description: "Prefers authentic local spots" },
                      { value: "comfort_food", label: "Comfort Food", description: "Classic favorites and familiar tastes" }
                    ].map((style) => (
                      <div 
                        key={style.value}
                        onClick={() => setPreferenceData(prev => ({ ...prev, dining_style: style.value } as any))}
                        className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                          preferenceData.dining_style === style.value 
                            ? 'border-peach-gold bg-peach-gold/10' 
                            : 'border-border hover:bg-accent'
                        }`}
                      >
                        <div className="font-medium">{style.label}</div>
                        <div className="text-sm text-muted-foreground">{style.description}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 bg-muted rounded-lg">
                    {profile.dining_style ? (
                      <div className="flex items-center gap-3">
                        <div className="flex-1">
                          <div className="font-medium">
                            {profile.dining_style.split('_').map(word => 
                              word.charAt(0).toUpperCase() + word.slice(1)
                            ).join(' ')}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {(() => {
                              switch(profile.dining_style) {
                                case 'adventurous': return "Always trying new cuisines";
                                case 'health_conscious': return "Focus on nutritious options";
                                case 'foodie_enthusiast': return "Passionate about culinary experiences";
                                case 'local_lover': return "Prefers authentic local spots";
                                case 'comfort_food': return "Classic favorites and familiar tastes";
                                default: return "";
                              }
                            })()}
                          </div>
                        </div>
                        <Badge variant="secondary">
                          Current Selection
                        </Badge>
                      </div>
                    ) : (
                      <div className="text-muted-foreground">No dining style selected</div>
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Dietary Preferences</h3>
                {editingPreferences ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {[
                      { value: "vegetarian", label: "Vegetarian" },
                      { value: "vegan", label: "Vegan" },
                      { value: "gluten_free", label: "Gluten Free" },
                      { value: "dairy_free", label: "Dairy Free" },
                      { value: "keto", label: "Keto" },
                      { value: "paleo", label: "Paleo" },
                      { value: "halal", label: "Halal" },
                      { value: "kosher", label: "Kosher" },
                      { value: "no_restrictions", label: "No Restrictions" }
                    ].map((pref) => (
                      <div 
                        key={pref.value}
                        onClick={() => {
                          const typedPref = pref.value as 'vegetarian' | 'vegan' | 'gluten_free' | 'dairy_free' | 'keto' | 'paleo' | 'halal' | 'kosher' | 'no_restrictions';
                          if (preferenceData.dietary_preferences.includes(typedPref)) {
                            setPreferenceData(prev => ({
                              ...prev,
                              dietary_preferences: prev.dietary_preferences.filter(p => p !== typedPref)
                            }));
                          } else {
                            setPreferenceData(prev => ({
                              ...prev,
                              dietary_preferences: [...prev.dietary_preferences, typedPref]
                            }));
                          }
                        }}
                        className={`p-3 border rounded-md cursor-pointer text-center transition-colors ${
                          preferenceData.dietary_preferences.includes(pref.value as any)
                            ? 'border-peach-gold bg-peach-gold/10' 
                            : 'border-border hover:bg-accent'
                        }`}
                      >
                        {pref.label}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {profile.dietary_preferences && profile.dietary_preferences.length > 0 ? (
                      profile.dietary_preferences.map((pref) => (
                        <Badge key={pref} variant="secondary">
                          {pref.split('_').map(word => 
                            word.charAt(0).toUpperCase() + word.slice(1)
                          ).join(' ')}
                        </Badge>
                      ))
                    ) : (
                      <div className="text-muted-foreground">No dietary preferences selected</div>
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Gender Identity</h3>
                {editingPreferences ? (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { value: "male", label: "Male" },
                      { value: "female", label: "Female" },
                      { value: "non_binary", label: "Non-binary" },
                      { value: "prefer_not_to_say", label: "Prefer not to say" }
                    ].map((gender) => (
                      <div 
                        key={gender.value}
                        onClick={() => setPreferenceData(prev => ({ ...prev, gender_identity: gender.value as any }))}
                        className={`p-3 border rounded-md cursor-pointer text-center transition-colors ${
                          preferenceData.gender_identity === gender.value
                            ? 'border-peach-gold bg-peach-gold/10' 
                            : 'border-border hover:bg-accent'
                        }`}
                      >
                        {gender.label}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-3 bg-muted rounded-md">
                    {profile.gender_identity ? (
                      <div className="flex items-center gap-3">
                        <div className="font-medium">
                          {profile.gender_identity.split('_').map(word => 
                            word.charAt(0).toUpperCase() + word.slice(1)
                          ).join(' ')}
                        </div>
                      </div>
                    ) : (
                      <div className="text-muted-foreground">Not specified</div>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card border-border">
            <CardHeader>
              <CardTitle>Subscription</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Manage Subscription</h3>
                  <p className="text-muted-foreground">View and manage your subscription plan</p>
                </div>
                <Button
                  onClick={() => navigate('/subscription')}
                  variant="outline"
                  className="flex items-center space-x-2"
                >
                  <CreditCard className="h-4 w-4" />
                  <span>Manage</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Profile;