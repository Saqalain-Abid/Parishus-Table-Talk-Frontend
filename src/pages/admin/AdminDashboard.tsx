import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  Calendar, 
  DollarSign, 
  TrendingUp, 
  Search, 
  UserCheck, 
  UserX, 
  Edit,
  Trash2,
  Ban,
  CheckCircle,
  AlertTriangle,
  Star,
  Shield,
  Crown,
  UserPlus,
  Settings,
  BarChart3,
  Download,
  RefreshCw,
  Plus
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const AdminDashboard = () => {
  const { user, signOut } = useAuth();
  const { profile } = useProfile();
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalEvents: 0,
    monthlyRSVPs: 0,
    flaggedFeedback: 0,
    revenue: 0,
    monthlyRevenue: 0,
    totalAdmins: 0
  });
  
  const [users, setUsers] = useState([]);
  const [events, setEvents] = useState([]);
  const [feedback, setFeedback] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [showCreateAdmin, setShowCreateAdmin] = useState(false);
  const [newAdmin, setNewAdmin] = useState({
    email: '',
    firstName: '',
    lastName: '',
    role: 'moderator' as 'moderator' | 'super_admin'
  });

  useEffect(() => {
    if (profile && (profile.role === 'admin' || profile.role === 'superadmin')) {
      fetchDashboardData();
      setupRealTimeUpdates();
    }
  }, [profile]);

  const fetchDashboardData = async () => {
    try {
      // Fetch stats including admins
      const [usersData, eventsData, feedbackData, paymentsData, adminsData] = await Promise.all([
        supabase.from('profiles').select('*'),
        supabase.from('events').select('*'),
        supabase.from('feedback').select('*'),
        supabase.from('payments').select('*'),
        supabase.from('admins').select('*')
      ]);

      const activeUsers = usersData.data?.filter(u => u.onboarding_completed && !u.is_suspended).length || 0;
      const flaggedFeedback = feedbackData.data?.filter(f => f.flagged_users && f.flagged_users.length > 0).length || 0;
      const revenue = paymentsData.data?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;
      
      // Calculate monthly revenue (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const monthlyRevenue = paymentsData.data?.filter(p => 
        new Date(p.created_at) >= thirtyDaysAgo
      ).reduce((sum, p) => sum + (p.amount || 0), 0) || 0;

      setStats({
        totalUsers: usersData.data?.length || 0,
        activeUsers,
        totalEvents: eventsData.data?.length || 0,
        monthlyRSVPs: 0, // Would need to calculate from RSVPs
        flaggedFeedback,
        revenue: revenue / 100, // Convert from cents
        monthlyRevenue: monthlyRevenue / 100,
        totalAdmins: adminsData.data?.length || 0
      });

      setUsers(usersData.data || []);
      setEvents(eventsData.data || []);
      setFeedback(feedbackData.data || []);
      setAdmins(adminsData.data || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const setupRealTimeUpdates = () => {
    const channel = supabase.channel('admin-dashboard')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
        fetchDashboardData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'events' }, () => {
        fetchDashboardData();
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  };

  const suspendUser = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_suspended: true })
        .eq('id', userId);

      if (error) throw error;

      toast({ title: "User suspended successfully" });
      fetchDashboardData();
    } catch (error) {
      toast({ title: "Error suspending user", variant: "destructive" });
    }
  };

  const reactivateUser = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_suspended: false })
        .eq('id', userId);

      if (error) throw error;

      toast({ title: "User reactivated successfully" });
      fetchDashboardData();
    } catch (error) {
      toast({ title: "Error reactivating user", variant: "destructive" });
    }
  };

  const deleteEvent = async (eventId: string) => {
    if (!confirm('Are you sure you want to delete this event?')) return;

    try {
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', eventId);

      if (error) throw error;

      toast({ title: "Event deleted successfully" });
      fetchDashboardData();
    } catch (error) {
      toast({ title: "Error deleting event", variant: "destructive" });
    }
  };

  const markFeedbackAddressed = async (feedbackId: string) => {
    try {
      const { error } = await supabase
        .from('feedback')
        .update({ is_addressed: true })
        .eq('id', feedbackId);

      if (error) throw error;

      toast({ title: "Feedback marked as addressed" });
      fetchDashboardData();
    } catch (error) {
      toast({ title: "Error updating feedback", variant: "destructive" });
    }
  };

  const createAdmin = async () => {
    if (!newAdmin.email || !newAdmin.firstName || !newAdmin.lastName) {
      toast({ title: "Please fill in all fields", variant: "destructive" });
      return;
    }

    try {
      const { error } = await supabase.from('admins').insert({
        email: newAdmin.email,
        first_name: newAdmin.firstName,
        last_name: newAdmin.lastName,
        role: newAdmin.role as 'moderator' | 'super_admin',
        password_hash: 'temp_hash', // Would need proper password handling
        is_active: true
      });

      if (error) throw error;

      toast({ title: "Admin created successfully" });
      setShowCreateAdmin(false);
      setNewAdmin({ email: '', firstName: '', lastName: '', role: 'moderator' as 'moderator' | 'super_admin' });
      fetchDashboardData();
    } catch (error) {
      toast({ title: "Error creating admin", variant: "destructive" });
    }
  };

  const toggleAdminStatus = async (adminId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('admins')
        .update({ is_active: !isActive })
        .eq('id', adminId);

      if (error) throw error;

      toast({ title: `Admin ${!isActive ? 'activated' : 'deactivated'} successfully` });
      fetchDashboardData();
    } catch (error) {
      toast({ title: "Error updating admin status", variant: "destructive" });
    }
  };

  const promoteUser = async (userId: string, newRole: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole as 'user' | 'admin' | 'superadmin' })
        .eq('id', userId);

      if (error) throw error;

      toast({ title: `User promoted to ${newRole} successfully` });
      fetchDashboardData();
    } catch (error) {
      toast({ title: "Error promoting user", variant: "destructive" });
    }
  };

  const exportData = async (dataType: string) => {
    try {
      let data;
      let filename;
      
      switch (dataType) {
        case 'users':
          data = users;
          filename = 'users_export.json';
          break;
        case 'events':
          data = events;
          filename = 'events_export.json';
          break;
        case 'revenue':
          data = await supabase.from('payments').select('*');
          filename = 'revenue_export.json';
          break;
        default:
          return;
      }

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      
      toast({ title: `${dataType} data exported successfully` });
    } catch (error) {
      toast({ title: "Error exporting data", variant: "destructive" });
    }
  };

  const filteredUsers = users.filter(user => 
    `${user.first_name} ${user.last_name} ${user.email}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!profile || (profile.role !== 'admin' && profile.role !== 'superadmin')) {
    return <div className="flex items-center justify-center min-h-screen">Access denied</div>;
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
            <Badge variant="outline" className="flex items-center space-x-1">
              {profile.role === 'superadmin' ? <Crown className="h-3 w-3" /> : <Shield className="h-3 w-3" />}
              <span>{profile.role === 'superadmin' ? 'Super Admin' : 'Admin'}</span>
            </Badge>
          </div>
          <Button onClick={() => signOut()} variant="outline">Sign Out</Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
              <p className="text-xs text-muted-foreground">{stats.activeUsers} active</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Events</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalEvents}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${stats.monthlyRevenue.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">Total: ${stats.revenue.toFixed(2)}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Admins</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalAdmins}</div>
              <p className="text-xs text-muted-foreground">{stats.flaggedFeedback} flagged items</p>
            </CardContent>
          </Card>
        </div>

        {/* Management Tabs */}
        <Tabs defaultValue="users" className="space-y-4">
          <TabsList>
            <TabsTrigger value="users">User Management</TabsTrigger>
            <TabsTrigger value="events">Event Management</TabsTrigger>
            <TabsTrigger value="feedback">Feedback Moderation</TabsTrigger>
            {profile.role === 'superadmin' && (
              <>
                <TabsTrigger value="admins">Admin Management</TabsTrigger>
                <TabsTrigger value="revenue">Revenue Reports</TabsTrigger>
                <TabsTrigger value="system">System Controls</TabsTrigger>
              </>
            )}
          </TabsList>

          <TabsContent value="users" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
                <div className="flex items-center space-x-2">
                  <Search className="h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="max-w-sm"
                  />
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.slice(0, 10).map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>{user.first_name} {user.last_name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{user.role}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={user.is_suspended ? "destructive" : "default"}>
                            {user.is_suspended ? "Suspended" : "Active"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            {user.is_suspended ? (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => reactivateUser(user.id)}
                              >
                                <UserCheck className="h-3 w-3" />
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => suspendUser(user.id)}
                              >
                                <Ban className="h-3 w-3" />
                              </Button>
                            )}
                            {profile.role === 'superadmin' && user.role === 'user' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => promoteUser(user.id, 'admin')}
                              >
                                <Crown className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="events" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Event Management</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Event Name</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {events.slice(0, 10).map((event) => (
                      <TableRow key={event.id}>
                        <TableCell>{event.name}</TableCell>
                        <TableCell>{new Date(event.date_time).toLocaleDateString()}</TableCell>
                        <TableCell>{event.location_name}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{event.status}</Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => deleteEvent(event.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="feedback" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Feedback Moderation</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Rating</TableHead>
                      <TableHead>Comment</TableHead>
                      <TableHead>Flagged</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {feedback.slice(0, 10).map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div className="flex items-center">
                            {[...Array(item.rating)].map((_, i) => (
                              <Star key={i} className="h-3 w-3 fill-current text-yellow-400" />
                            ))}
                          </div>
                        </TableCell>
                        <TableCell className="max-w-xs truncate">{item.comment}</TableCell>
                        <TableCell>
                          {item.flagged_users && item.flagged_users.length > 0 ? (
                            <Badge variant="destructive">Flagged</Badge>
                          ) : (
                            <Badge variant="outline">Clean</Badge>
                          )}
                        </TableCell>
                        <TableCell>{new Date(item.created_at).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => markFeedbackAddressed(item.id)}
                          >
                            <CheckCircle className="h-3 w-3" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* SuperAdmin Only Tabs */}
          {profile.role === 'superadmin' && (
            <>
              <TabsContent value="admins" className="space-y-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Admin Management</CardTitle>
                    <Dialog open={showCreateAdmin} onOpenChange={setShowCreateAdmin}>
                      <DialogTrigger asChild>
                        <Button>
                          <Plus className="h-4 w-4 mr-2" />
                          Create Admin
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Create New Admin</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="email">Email</Label>
                            <Input
                              id="email"
                              value={newAdmin.email}
                              onChange={(e) => setNewAdmin({...newAdmin, email: e.target.value})}
                              placeholder="admin@example.com"
                            />
                          </div>
                          <div>
                            <Label htmlFor="firstName">First Name</Label>
                            <Input
                              id="firstName"
                              value={newAdmin.firstName}
                              onChange={(e) => setNewAdmin({...newAdmin, firstName: e.target.value})}
                            />
                          </div>
                          <div>
                            <Label htmlFor="lastName">Last Name</Label>
                            <Input
                              id="lastName"
                              value={newAdmin.lastName}
                              onChange={(e) => setNewAdmin({...newAdmin, lastName: e.target.value})}
                            />
                          </div>
                          <div>
                            <Label htmlFor="role">Role</Label>
                            <Select 
                              value={newAdmin.role} 
                              onValueChange={(value: 'moderator' | 'super_admin') => setNewAdmin({...newAdmin, role: value})}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="moderator">Moderator</SelectItem>
                                <SelectItem value="super_admin">Super Admin</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <Button onClick={createAdmin} className="w-full">Create Admin</Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {admins.map((admin) => (
                          <TableRow key={admin.id}>
                            <TableCell>{admin.first_name} {admin.last_name}</TableCell>
                            <TableCell>{admin.email}</TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {admin.role === 'super_admin' ? 'Super Admin' : 'Moderator'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant={admin.is_active ? "default" : "destructive"}>
                                {admin.is_active ? "Active" : "Inactive"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => toggleAdminStatus(admin.id, admin.is_active)}
                              >
                                {admin.is_active ? <Ban className="h-3 w-3" /> : <UserCheck className="h-3 w-3" />}
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="revenue" className="space-y-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Revenue Reports</CardTitle>
                    <div className="flex space-x-2">
                      <Button variant="outline" onClick={() => exportData('revenue')}>
                        <Download className="h-4 w-4 mr-2" />
                        Export
                      </Button>
                      <Button variant="outline" onClick={fetchDashboardData}>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Refresh
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                      <Card>
                        <CardContent className="pt-6">
                          <div className="text-2xl font-bold">${stats.revenue.toFixed(2)}</div>
                          <p className="text-xs text-muted-foreground">Total Revenue</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="pt-6">
                          <div className="text-2xl font-bold">${stats.monthlyRevenue.toFixed(2)}</div>
                          <p className="text-xs text-muted-foreground">This Month</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="pt-6">
                          <div className="text-2xl font-bold">
                            ${((stats.monthlyRevenue / 30) || 0).toFixed(2)}
                          </div>
                          <p className="text-xs text-muted-foreground">Daily Average</p>
                        </CardContent>
                      </Card>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Revenue analytics and detailed reporting would be displayed here with charts and trends.
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="system" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>System-Wide Controls</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Card>
                        <CardContent className="pt-6">
                          <h3 className="font-semibold mb-2">Data Export</h3>
                          <div className="space-y-2">
                            <Button variant="outline" onClick={() => exportData('users')} className="w-full">
                              <Download className="h-4 w-4 mr-2" />
                              Export Users
                            </Button>
                            <Button variant="outline" onClick={() => exportData('events')} className="w-full">
                              <Download className="h-4 w-4 mr-2" />
                              Export Events
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardContent className="pt-6">
                          <h3 className="font-semibold mb-2">System Status</h3>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span>Database:</span>
                              <Badge variant="default">Online</Badge>
                            </div>
                            <div className="flex justify-between">
                              <span>Email Service:</span>
                              <Badge variant="default">Active</Badge>
                            </div>
                            <div className="flex justify-between">
                              <span>Payments:</span>
                              <Badge variant="default">Connected</Badge>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                    
                    <Card>
                      <CardContent className="pt-6">
                        <h3 className="font-semibold mb-2">Quick Actions</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                          <Button variant="outline" onClick={fetchDashboardData}>
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Refresh All Data
                          </Button>
                          <Button variant="outline">
                            <Settings className="h-4 w-4 mr-2" />
                            System Settings
                          </Button>
                          <Button variant="outline">
                            <BarChart3 className="h-4 w-4 mr-2" />
                            View Analytics
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </CardContent>
                </Card>
              </TabsContent>
            </>
          )}
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;