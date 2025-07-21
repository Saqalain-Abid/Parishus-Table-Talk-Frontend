import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MapPin, Calendar, Users, Eye, EyeOff, Search, Filter, BarChart3, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface CrossedPathWithUsers {
  id: string;
  matched_at: string;
  location_name: string;
  is_active: boolean;
  user1_id: string;
  user2_id: string;
  location_lat: number;
  location_lng: number;
  user1: {
    id: string;
    first_name: string;
    last_name: string;
    profile_photo_url: string;
    job_title: string;
    location_city: string;
    email: string;
  };
  user2: {
    id: string;
    first_name: string;
    last_name: string;
    profile_photo_url: string;
    job_title: string;
    location_city: string;
    email: string;
  };
}

interface Stats {
  total_matches: number;
  active_matches: number;
  inactive_matches: number;
  recent_matches: number;
}

const AdminCrossedPaths = () => {
  const [crossedPaths, setCrossedPaths] = useState<CrossedPathWithUsers[]>([]);
  const [filteredPaths, setFilteredPaths] = useState<CrossedPathWithUsers[]>([]);
  const [stats, setStats] = useState<Stats>({
    total_matches: 0,
    active_matches: 0,
    inactive_matches: 0,
    recent_matches: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchCrossedPaths();
    fetchStats();
  }, []);

  useEffect(() => {
    filterPaths();
  }, [crossedPaths, searchTerm, statusFilter]);

  const fetchCrossedPaths = async () => {
    try {
      const { data, error } = await supabase
        .from('crossed_paths')
        .select(`
          *,
          user1:profiles!crossed_paths_user1_id_fkey(id, first_name, last_name, profile_photo_url, job_title, location_city, email),
          user2:profiles!crossed_paths_user2_id_fkey(id, first_name, last_name, profile_photo_url, job_title, location_city, email)
        `)
        .order('matched_at', { ascending: false });

      if (error) throw error;
      setCrossedPaths(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load crossed paths data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const { data: allPaths, error } = await supabase
        .from('crossed_paths')
        .select('is_active, matched_at');

      if (error) throw error;

      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      const stats = {
        total_matches: allPaths?.length || 0,
        active_matches: allPaths?.filter(p => p.is_active).length || 0,
        inactive_matches: allPaths?.filter(p => !p.is_active).length || 0,
        recent_matches: allPaths?.filter(p => new Date(p.matched_at) > sevenDaysAgo).length || 0
      };

      setStats(stats);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const filterPaths = () => {
    let filtered = crossedPaths;

    if (searchTerm) {
      filtered = filtered.filter(path =>
        path.user1.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        path.user1.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        path.user2.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        path.user2.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        path.location_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(path => 
        statusFilter === 'active' ? path.is_active : !path.is_active
      );
    }

    setFilteredPaths(filtered);
  };

  const toggleMatchStatus = async (matchId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('crossed_paths')
        .update({ is_active: !currentStatus })
        .eq('id', matchId);

      if (error) throw error;

      setCrossedPaths(prev => 
        prev.map(path => 
          path.id === matchId 
            ? { ...path, is_active: !currentStatus }
            : path
        )
      );

      // Update stats
      setStats(prev => ({
        ...prev,
        active_matches: currentStatus ? prev.active_matches - 1 : prev.active_matches + 1,
        inactive_matches: currentStatus ? prev.inactive_matches + 1 : prev.inactive_matches - 1
      }));

      toast({
        title: "Success",
        description: `Match ${!currentStatus ? 'activated' : 'deactivated'} successfully`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to update match status",
        variant: "destructive"
      });
    }
  };

  const deleteMatch = async (matchId: string) => {
    if (!confirm('Are you sure you want to permanently delete this match? This action cannot be undone.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('crossed_paths')
        .delete()
        .eq('id', matchId);

      if (error) throw error;

      setCrossedPaths(prev => prev.filter(path => path.id !== matchId));
      
      toast({
        title: "Success",
        description: "Match deleted successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to delete match",
        variant: "destructive"
      });
    }
  };

  const UserCard = ({ user }: { user: any }) => (
    <div className="flex items-center space-x-3">
      <Avatar className="h-10 w-10">
        <AvatarImage src={user.profile_photo_url} />
        <AvatarFallback className="bg-primary/10 text-primary">
          {user.first_name?.[0]}{user.last_name?.[0]}
        </AvatarFallback>
      </Avatar>
      <div>
        <p className="font-medium text-sm">{user.first_name} {user.last_name}</p>
        <p className="text-xs text-muted-foreground">{user.email}</p>
        {user.job_title && (
          <p className="text-xs text-muted-foreground">{user.job_title}</p>
        )}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-32 bg-card rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Crossed Paths Moderation</h1>
            <p className="text-muted-foreground mt-1">
              Manage and moderate user connections and matches
            </p>
          </div>

          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="matches">All Matches</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Total Matches</p>
                        <p className="text-2xl font-bold">{stats.total_matches}</p>
                      </div>
                      <Users className="h-8 w-8 text-primary" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Active Matches</p>
                        <p className="text-2xl font-bold text-green-600">{stats.active_matches}</p>
                      </div>
                      <CheckCircle className="h-8 w-8 text-green-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Inactive Matches</p>
                        <p className="text-2xl font-bold text-red-600">{stats.inactive_matches}</p>
                      </div>
                      <XCircle className="h-8 w-8 text-red-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Recent (7 days)</p>
                        <p className="text-2xl font-bold text-blue-600">{stats.recent_matches}</p>
                      </div>
                      <BarChart3 className="h-8 w-8 text-blue-600" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Monitor crossed paths for inappropriate matches and manage user connections effectively.
                  Deactivated matches will not be visible to users but remain in the system for auditing.
                </AlertDescription>
              </Alert>
            </TabsContent>

            <TabsContent value="matches" className="space-y-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search users or locations..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-[200px]">
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Matches</SelectItem>
                    <SelectItem value="active">Active Only</SelectItem>
                    <SelectItem value="inactive">Inactive Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-4">
                {filteredPaths.length === 0 ? (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No matches found</h3>
                      <p className="text-muted-foreground">
                        {searchTerm || statusFilter !== 'all' 
                          ? 'Try adjusting your search or filter criteria'
                          : 'No crossed paths matches exist yet'
                        }
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  filteredPaths.map((path) => (
                    <Card key={path.id} className={`${!path.is_active ? 'opacity-60' : ''}`}>
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center space-x-2">
                            <Badge variant={path.is_active ? "default" : "secondary"}>
                              {path.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                            <div className="flex items-center text-sm text-muted-foreground">
                              <Calendar className="h-4 w-4 mr-1" />
                              {new Date(path.matched_at).toLocaleDateString()}
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => toggleMatchStatus(path.id, path.is_active)}
                            >
                              {path.is_active ? (
                                <>
                                  <EyeOff className="h-4 w-4 mr-1" />
                                  Deactivate
                                </>
                              ) : (
                                <>
                                  <Eye className="h-4 w-4 mr-1" />
                                  Activate
                                </>
                              )}
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => deleteMatch(path.id)}
                            >
                              Delete
                            </Button>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <h4 className="text-sm font-medium text-muted-foreground mb-2">User 1</h4>
                            <UserCard user={path.user1} />
                          </div>
                          <div>
                            <h4 className="text-sm font-medium text-muted-foreground mb-2">User 2</h4>
                            <UserCard user={path.user2} />
                          </div>
                        </div>

                        <div className="mt-4 pt-4 border-t">
                          <div className="flex items-center text-sm text-muted-foreground">
                            <MapPin className="h-4 w-4 mr-1" />
                            <span>{path.location_name || 'Unknown location'}</span>
                            {path.location_lat && path.location_lng && (
                              <span className="ml-2">
                                ({path.location_lat.toFixed(4)}, {path.location_lng.toFixed(4)})
                              </span>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>

            <TabsContent value="analytics" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Match Status Distribution</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Active Matches</span>
                        <div className="flex items-center space-x-2">
                          <div className="w-20 bg-secondary rounded-full h-2">
                            <div 
                              className="bg-green-600 h-2 rounded-full" 
                              style={{ 
                                width: stats.total_matches > 0 
                                  ? `${(stats.active_matches / stats.total_matches) * 100}%` 
                                  : '0%' 
                              }}
                            ></div>
                          </div>
                          <span className="text-sm font-medium">{stats.active_matches}</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Inactive Matches</span>
                        <div className="flex items-center space-x-2">
                          <div className="w-20 bg-secondary rounded-full h-2">
                            <div 
                              className="bg-red-600 h-2 rounded-full" 
                              style={{ 
                                width: stats.total_matches > 0 
                                  ? `${(stats.inactive_matches / stats.total_matches) * 100}%` 
                                  : '0%' 
                              }}
                            ></div>
                          </div>
                          <span className="text-sm font-medium">{stats.inactive_matches}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-primary">{stats.recent_matches}</div>
                        <p className="text-sm text-muted-foreground">matches in the last 7 days</p>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-semibold">
                          {stats.total_matches > 0 
                            ? ((stats.recent_matches / stats.total_matches) * 100).toFixed(1)
                            : 0
                          }%
                        </div>
                        <p className="text-sm text-muted-foreground">of all matches</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default AdminCrossedPaths;