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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
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
  Plus,
  Eye,
  Mail,
  MapPin,
  Clock,
  Filter
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, ResponsiveContainer } from 'recharts';

// Generate stub data for charts
const generateStubData = () => {
  const userGrowthData = [
    { month: 'Jan', users: 120 },
    { month: 'Feb', users: 185 },
    { month: 'Mar', users: 240 },
    { month: 'Apr', users: 320 },
    { month: 'May', users: 410 },
    { month: 'Jun', users: 485 }
  ];

  const eventTrendsData = [
    { month: 'Jan', events: 15 },
    { month: 'Feb', events: 22 },
    { month: 'Mar', events: 28 },
    { month: 'Apr', events: 35 },
    { month: 'May', events: 42 },
    { month: 'Jun', events: 38 }
  ];

  const revenueData = [
    { month: 'Jan', revenue: 4200 },
    { month: 'Feb', revenue: 5800 },
    { month: 'Mar', revenue: 7200 },
    { month: 'Apr', revenue: 8900 },
    { month: 'May', revenue: 10500 },
    { month: 'Jun', revenue: 9800 }
  ];

  const diningStylesData = [
    { name: 'Fine Dining', value: 35, color: '#F4A460' },
    { name: 'Casual', value: 45, color: '#8FBC8F' },
    { name: 'Fast Casual', value: 20, color: '#DDA0DD' }
  ];

  return { userGrowthData, eventTrendsData, revenueData, diningStylesData };
};

const AdminDashboard = () => {
  const { user, signOut } = useAuth();
  const { profile } = useProfile();
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalEvents: 0,
    monthlyRSVPs: 0,
    monthlyRevenue: 8500,
    yearlyRevenue: 47200
  });
  
  const [users, setUsers] = useState([]);
  const [events, setEvents] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [eventSearchTerm, setEventSearchTerm] = useState('');
  const [userStatusFilter, setUserStatusFilter] = useState('all');
  const [eventStatusFilter, setEventStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showUserDetails, setShowUserDetails] = useState(false);
  const [showEventDetails, setShowEventDetails] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailData, setEmailData] = useState({ to: '', subject: '', message: '' });

  const chartData = generateStubData();

  useEffect(() => {
    if (profile && (profile.role === 'admin' || profile.role === 'superadmin')) {
      fetchDashboardData();
    }
  }, [profile]);

  const fetchDashboardData = async () => {
    try {
      // Fetch users with RSVP counts
      const { data: usersData } = await supabase
        .from('profiles')
        .select(`
          *,
          rsvps:rsvps(count),
          created_events:events(count)
        `);

      // Fetch events with RSVP data
      const { data: eventsData } = await supabase
        .from('events')
        .select(`
          *,
          profiles!events_creator_id_fkey(first_name, last_name, email),
          rsvps(*, profiles(first_name, last_name, email))
        `);

      // Calculate RSVPs for the month
      const thisMonth = new Date();
      thisMonth.setDate(1);
      
      const { data: monthlyRSVPs } = await supabase
        .from('rsvps')
        .select('*')
        .gte('created_at', thisMonth.toISOString());

      const activeUsers = usersData?.filter(u => u.onboarding_completed && !u.is_suspended).length || 0;

      setStats({
        totalUsers: usersData?.length || 0,
        activeUsers,
        totalEvents: eventsData?.length || 0,
        monthlyRSVPs: monthlyRSVPs?.length || 0,
        monthlyRevenue: 8500, // Stub data
        yearlyRevenue: 47200 // Stub data
      });

      setUsers(usersData || []);
      setEvents(eventsData || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast({ title: "Error loading dashboard data", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const suspendUser = async (userId: string) => {
    if (!confirm('Are you sure you want to suspend this user?')) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_suspended: true })
        .eq('user_id', userId);

      if (error) throw error;

      // Log audit action
      await supabase.from('audit_logs').insert({
        admin_id: user?.id,
        action: 'suspend_user',
        target_type: 'user',
        target_id: userId,
        notes: 'User suspended via admin panel'
      });

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
        .eq('user_id', userId);

      if (error) throw error;

      // Log audit action
      await supabase.from('audit_logs').insert({
        admin_id: user?.id,
        action: 'reactivate_user',
        target_type: 'user',
        target_id: userId,
        notes: 'User reactivated via admin panel'
      });

      toast({ title: "User reactivated successfully" });
      fetchDashboardData();
    } catch (error) {
      toast({ title: "Error reactivating user", variant: "destructive" });
    }
  };

  const deleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;

    if (profile?.role !== 'superadmin') {
      toast({ title: "Only Super Admins can delete users", variant: "destructive" });
      return;
    }

    try {
      const { error } = await supabase.auth.admin.deleteUser(userId);
      if (error) throw error;

      // Log audit action
      await supabase.from('audit_logs').insert({
        admin_id: user?.id,
        action: 'delete_user',
        target_type: 'user',
        target_id: userId,
        notes: 'User deleted via admin panel'
      });

      toast({ title: "User deleted successfully" });
      fetchDashboardData();
    } catch (error) {
      toast({ title: "Error deleting user", variant: "destructive" });
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

      // Log audit action
      await supabase.from('audit_logs').insert({
        admin_id: user?.id,
        action: 'delete_event',
        target_type: 'event',
        target_id: eventId,
        notes: 'Event deleted via admin panel'
      });

      toast({ title: "Event deleted successfully" });
      fetchDashboardData();
    } catch (error) {
      toast({ title: "Error deleting event", variant: "destructive" });
    }
  };

  const cancelEvent = async (eventId: string) => {
    if (!confirm('Are you sure you want to cancel this event?')) return;

    try {
      const { error } = await supabase
        .from('events')
        .update({ status: 'cancelled' })
        .eq('id', eventId);

      if (error) throw error;

      // Log audit action
      await supabase.from('audit_logs').insert({
        admin_id: user?.id,
        action: 'cancel_event',
        target_type: 'event',
        target_id: eventId,
        notes: 'Event cancelled via admin panel'
      });

      toast({ title: "Event cancelled successfully" });
      fetchDashboardData();
    } catch (error) {
      toast({ title: "Error cancelling event", variant: "destructive" });
    }
  };

  const sendEmail = async () => {
    // This would integrate with your email service
    toast({ title: "Email functionality will be integrated with your email service" });
    setShowEmailModal(false);
    setEmailData({ to: '', subject: '', message: '' });
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = `${user.first_name} ${user.last_name} ${user.email}`.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = userStatusFilter === 'all' || 
      (userStatusFilter === 'active' && !user.is_suspended) ||
      (userStatusFilter === 'suspended' && user.is_suspended);
    return matchesSearch && matchesStatus;
  });

  const filteredEvents = events.filter(event => {
    const matchesSearch = event.name.toLowerCase().includes(eventSearchTerm.toLowerCase());
    const matchesStatus = eventStatusFilter === 'all' || event.status === eventStatusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  if (!profile || (profile.role !== 'admin' && profile.role !== 'superadmin')) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center space-y-4">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto" />
          <h1 className="text-2xl font-bold text-foreground">Access Denied</h1>
          <p className="text-muted-foreground">You don't have permission to access this area.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200 dark:border-blue-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-300">Total Users</CardTitle>
              <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">{stats.totalUsers}</div>
              <p className="text-xs text-blue-600 dark:text-blue-400">{stats.activeUsers} active users</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200 dark:border-green-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-green-700 dark:text-green-300">Total Events</CardTitle>
              <Calendar className="h-4 w-4 text-green-600 dark:text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-900 dark:text-green-100">{stats.totalEvents}</div>
              <p className="text-xs text-green-600 dark:text-green-400">Active events</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 border-purple-200 dark:border-purple-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-purple-700 dark:text-purple-300">RSVPs This Month</CardTitle>
              <UserCheck className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">{stats.monthlyRSVPs}</div>
              <p className="text-xs text-purple-600 dark:text-purple-400">Event registrations</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 border-orange-200 dark:border-orange-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-orange-700 dark:text-orange-300">Monthly Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-orange-600 dark:text-orange-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-900 dark:text-orange-100">${stats.monthlyRevenue.toLocaleString()}</div>
              <p className="text-xs text-orange-600 dark:text-orange-400">Yearly: ${stats.yearlyRevenue.toLocaleString()}</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5" />
                <span>User Growth Trends</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  users: {
                    label: "Users",
                    color: "hsl(var(--chart-1))",
                  },
                }}
                className="h-[300px]"
              >
                <LineChart data={chartData.userGrowthData}>
                  <XAxis dataKey="month" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line type="monotone" dataKey="users" stroke="var(--color-users)" strokeWidth={2} />
                </LineChart>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BarChart3 className="h-5 w-5" />
                <span>Event Creation Trends</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  events: {
                    label: "Events",
                    color: "hsl(var(--chart-2))",
                  },
                }}
                className="h-[300px]"
              >
                <BarChart data={chartData.eventTrendsData}>
                  <XAxis dataKey="month" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="events" fill="var(--color-events)" />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <DollarSign className="h-5 w-5" />
                <span>Revenue Trends</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  revenue: {
                    label: "Revenue",
                    color: "hsl(var(--chart-3))",
                  },
                }}
                className="h-[300px]"
              >
                <LineChart data={chartData.revenueData}>
                  <XAxis dataKey="month" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line type="monotone" dataKey="revenue" stroke="var(--color-revenue)" strokeWidth={2} />
                </LineChart>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Star className="h-5 w-5" />
                <span>Top Dining Styles</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  fineDining: {
                    label: "Fine Dining",
                    color: "#F4A460",
                  },
                  casual: {
                    label: "Casual",
                    color: "#8FBC8F",
                  },
                  fastCasual: {
                    label: "Fast Casual",
                    color: "#DDA0DD",
                  },
                }}
                className="h-[300px]"
              >
                <PieChart>
                  <Pie
                    data={chartData.diningStylesData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                  >
                    {chartData.diningStylesData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                </PieChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>

        {/* Management Tabs */}
        <Tabs defaultValue="users" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="users" className="flex items-center space-x-2">
              <Users className="h-4 w-4" />
              <span>User Management</span>
            </TabsTrigger>
            <TabsTrigger value="events" className="flex items-center space-x-2">
              <Calendar className="h-4 w-4" />
              <span>Event Management</span>
            </TabsTrigger>
          </TabsList>

          {/* User Management Tab */}
          <TabsContent value="users" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
                  <CardTitle>User Management</CardTitle>
                  <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
                    <div className="flex items-center space-x-2">
                      <Search className="h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search users..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full sm:w-64"
                      />
                    </div>
                    <Select value={userStatusFilter} onValueChange={setUserStatusFilter}>
                      <SelectTrigger className="w-full sm:w-40">
                        <SelectValue placeholder="Filter by status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Users</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="suspended">Suspended</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Events Created</TableHead>
                      <TableHead>RSVPs</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.slice(0, 10).map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">
                          {user.first_name} {user.last_name}
                        </TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Badge variant={user.is_suspended ? "destructive" : "default"}>
                            {user.is_suspended ? "Suspended" : "Active"}
                          </Badge>
                        </TableCell>
                        <TableCell>{user.created_events?.[0]?.count || 0}</TableCell>
                        <TableCell>{user.rsvps?.[0]?.count || 0}</TableCell>
                        <TableCell>{new Date(user.created_at).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedUser(user);
                                setShowUserDetails(true);
                              }}
                            >
                              <Eye className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setEmailData({ ...emailData, to: user.email });
                                setShowEmailModal(true);
                              }}
                            >
                              <Mail className="h-3 w-3" />
                            </Button>
                            {user.is_suspended ? (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => reactivateUser(user.user_id)}
                              >
                                <UserCheck className="h-3 w-3" />
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => suspendUser(user.user_id)}
                              >
                                <Ban className="h-3 w-3" />
                              </Button>
                            )}
                            {profile.role === 'superadmin' && (
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => deleteUser(user.user_id)}
                              >
                                <Trash2 className="h-3 w-3" />
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

          {/* Event Management Tab */}
          <TabsContent value="events" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
                  <CardTitle>Event Management</CardTitle>
                  <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
                    <div className="flex items-center space-x-2">
                      <Search className="h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search events..."
                        value={eventSearchTerm}
                        onChange={(e) => setEventSearchTerm(e.target.value)}
                        className="w-full sm:w-64"
                      />
                    </div>
                    <Select value={eventStatusFilter} onValueChange={setEventStatusFilter}>
                      <SelectTrigger className="w-full sm:w-40">
                        <SelectValue placeholder="Filter by status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Events</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Event Name</TableHead>
                      <TableHead>Creator</TableHead>
                      <TableHead>Date & Time</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Seats Remaining</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEvents.slice(0, 10).map((event) => {
                      const confirmedRSVPs = event.rsvps?.filter(rsvp => rsvp.status === 'confirmed').length || 0;
                      const seatsRemaining = (event.max_attendees || 0) - confirmedRSVPs;
                      
                      return (
                        <TableRow key={event.id}>
                          <TableCell className="font-medium">{event.name}</TableCell>
                          <TableCell>
                            {event.profiles?.first_name} {event.profiles?.last_name}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-1">
                              <Clock className="h-3 w-3 text-muted-foreground" />
                              <span>{new Date(event.date_time).toLocaleDateString()}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={event.status === 'active' ? 'default' : 'secondary'}>
                              {event.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <span className={seatsRemaining <= 5 ? 'text-red-600' : 'text-green-600'}>
                              {seatsRemaining}/{event.max_attendees}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedEvent(event);
                                  setShowEventDetails(true);
                                }}
                              >
                                <Eye className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => cancelEvent(event.id)}
                                disabled={event.status === 'cancelled'}
                              >
                                <Ban className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => deleteEvent(event.id)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* User Details Modal */}
      <Dialog open={showUserDetails} onOpenChange={setShowUserDetails}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>User Details: {selectedUser?.first_name} {selectedUser?.last_name}</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Contact Information</Label>
                    <div className="mt-2 space-y-2">
                      <p><strong>Email:</strong> {selectedUser.email}</p>
                      <p><strong>Phone:</strong> {selectedUser.phone || 'Not provided'}</p>
                      <p><strong>Location:</strong> {selectedUser.location_city || 'Not provided'}</p>
                    </div>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Profile Details</Label>
                    <div className="mt-2 space-y-2">
                      <p><strong>Job Title:</strong> {selectedUser.job_title || 'Not provided'}</p>
                      <p><strong>Gender:</strong> {selectedUser.gender_identity || 'Not specified'}</p>
                      <p><strong>Dining Style:</strong> {selectedUser.dining_style || 'Not specified'}</p>
                      <p><strong>Dietary Preferences:</strong> {selectedUser.dietary_preferences?.join(', ') || 'None specified'}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Account Status</Label>
                    <div className="mt-2 space-y-2">
                      <p><strong>Status:</strong> 
                        <Badge className="ml-2" variant={selectedUser.is_suspended ? "destructive" : "default"}>
                          {selectedUser.is_suspended ? "Suspended" : "Active"}
                        </Badge>
                      </p>
                      <p><strong>Role:</strong> 
                        <Badge className="ml-2" variant="outline">{selectedUser.role}</Badge>
                      </p>
                      <p><strong>Onboarding:</strong> {selectedUser.onboarding_completed ? 'Completed' : 'Incomplete'}</p>
                      <p><strong>Joined:</strong> {new Date(selectedUser.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Subscription Info (Stub)</Label>
                    <div className="mt-2 space-y-2">
                      <p><strong>Plan:</strong> Premium Monthly</p>
                      <p><strong>Status:</strong> <Badge variant="default">Active</Badge></p>
                      <p><strong>Start Date:</strong> {new Date(selectedUser.created_at).toLocaleDateString()}</p>
                      <p><strong>Next Billing:</strong> {new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <Label className="text-sm font-medium text-muted-foreground">Activity Summary</Label>
                <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <div className="text-2xl font-bold">{selectedUser.created_events?.[0]?.count || 0}</div>
                        <p className="text-sm text-muted-foreground">Events Created</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <div className="text-2xl font-bold">{selectedUser.rsvps?.[0]?.count || 0}</div>
                        <p className="text-sm text-muted-foreground">Total RSVPs</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <div className="text-2xl font-bold">0</div>
                        <p className="text-sm text-muted-foreground">Crossed Paths</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Event Details Modal */}
      <Dialog open={showEventDetails} onOpenChange={setShowEventDetails}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Event Details: {selectedEvent?.name}</DialogTitle>
          </DialogHeader>
          {selectedEvent && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Event Information</Label>
                    <div className="mt-2 space-y-2">
                      <p><strong>Description:</strong> {selectedEvent.description || 'No description'}</p>
                      <p><strong>Date & Time:</strong> {new Date(selectedEvent.date_time).toLocaleString()}</p>
                      <p><strong>Location:</strong> {selectedEvent.location_name}</p>
                      <p><strong>Address:</strong> {selectedEvent.location_address || 'Not provided'}</p>
                      <p><strong>Max Attendees:</strong> {selectedEvent.max_attendees}</p>
                      <p><strong>Status:</strong> 
                        <Badge className="ml-2" variant={selectedEvent.status === 'active' ? 'default' : 'secondary'}>
                          {selectedEvent.status}
                        </Badge>
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Creator Information</Label>
                    <div className="mt-2 space-y-2">
                      <p><strong>Name:</strong> {selectedEvent.profiles?.first_name} {selectedEvent.profiles?.last_name}</p>
                      <p><strong>Email:</strong> {selectedEvent.profiles?.email}</p>
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Event Details</Label>
                    <div className="mt-2 space-y-2">
                      <p><strong>Dining Style:</strong> {selectedEvent.dining_style || 'Not specified'}</p>
                      <p><strong>Dietary Theme:</strong> {selectedEvent.dietary_theme || 'Not specified'}</p>
                      <p><strong>Mystery Dinner:</strong> {selectedEvent.is_mystery_dinner ? 'Yes' : 'No'}</p>
                      <p><strong>Tags:</strong> {selectedEvent.tags?.join(', ') || 'None'}</p>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <Label className="text-sm font-medium text-muted-foreground">RSVP Guest List</Label>
                <div className="mt-4">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>RSVP Status</TableHead>
                        <TableHead>RSVP Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedEvent.rsvps?.map((rsvp) => (
                        <TableRow key={rsvp.id}>
                          <TableCell>{rsvp.profiles?.first_name} {rsvp.profiles?.last_name}</TableCell>
                          <TableCell>{rsvp.profiles?.email}</TableCell>
                          <TableCell>
                            <Badge variant={rsvp.status === 'confirmed' ? 'default' : 'secondary'}>
                              {rsvp.status}
                            </Badge>
                          </TableCell>
                          <TableCell>{new Date(rsvp.created_at).toLocaleDateString()}</TableCell>
                        </TableRow>
                      )) || []}
                    </TableBody>
                  </Table>
                  {(!selectedEvent.rsvps || selectedEvent.rsvps.length === 0) && (
                    <p className="text-center text-muted-foreground py-4">No RSVPs yet</p>
                  )}
                </div>
              </div>

              {selectedEvent.location_lat && selectedEvent.location_lng && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Location</Label>
                  <div className="mt-2">
                    <Button
                      variant="outline"
                      onClick={() => window.open(`https://maps.google.com/?q=${selectedEvent.location_lat},${selectedEvent.location_lng}`, '_blank')}
                    >
                      <MapPin className="h-4 w-4 mr-2" />
                      View on Google Maps
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Email Modal */}
      <Dialog open={showEmailModal} onOpenChange={setShowEmailModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Send Email</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="email-to">To</Label>
              <Input
                id="email-to"
                value={emailData.to}
                onChange={(e) => setEmailData({ ...emailData, to: e.target.value })}
                placeholder="recipient@example.com"
              />
            </div>
            <div>
              <Label htmlFor="email-subject">Subject</Label>
              <Input
                id="email-subject"
                value={emailData.subject}
                onChange={(e) => setEmailData({ ...emailData, subject: e.target.value })}
                placeholder="Email subject"
              />
            </div>
            <div>
              <Label htmlFor="email-message">Message</Label>
              <Textarea
                id="email-message"
                value={emailData.message}
                onChange={(e) => setEmailData({ ...emailData, message: e.target.value })}
                placeholder="Your message..."
                rows={5}
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowEmailModal(false)}>
                Cancel
              </Button>
              <Button onClick={sendEmail}>
                <Mail className="h-4 w-4 mr-2" />
                Send Email
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDashboard;