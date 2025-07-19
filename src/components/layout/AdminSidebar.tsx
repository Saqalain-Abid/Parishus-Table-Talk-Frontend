import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useProfile } from '@/hooks/useProfile';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import {
  LayoutDashboard,
  Users,
  Calendar,
  Settings,
  UserCheck,
  BarChart3,
  Shield,
  Crown,
  Bell,
  FileText
} from 'lucide-react';

const AdminSidebar = () => {
  const location = useLocation();
  const { profile } = useProfile();
  const currentPath = location.pathname;

  const isActive = (path: string) => currentPath === path;
  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive ? "bg-muted text-primary font-medium" : "hover:bg-muted/50";

  // Define navigation items based on role
  const getNavigationItems = () => {
    const baseItems = [
      { title: "Dashboard", url: "/admin/dashboard", icon: LayoutDashboard },
      { title: "Events", url: "/admin/events", icon: Calendar },
      { title: "Users", url: "/admin/users", icon: Users },
      { title: "RSVPs", url: "/admin/rsvps", icon: UserCheck },
      { title: "Analytics", url: "/admin/analytics", icon: BarChart3 },
      { title: "Notifications", url: "/admin/notifications", icon: Bell },
      { title: "Reports", url: "/admin/reports", icon: FileText },
    ];

    // Super Admin gets additional items
    if (profile?.role === 'superadmin') {
      baseItems.push(
        { title: "Admin Management", url: "/admin/admin-management", icon: Shield },
        { title: "Global Settings", url: "/admin/settings", icon: Settings }
      );
    }

    return baseItems;
  };

  const navigationItems = getNavigationItems();
  const isExpanded = navigationItems.some((i) => isActive(i.url));

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="flex items-center space-x-2">
            {profile?.role === 'superadmin' ? (
              <Crown className="h-4 w-4" />
            ) : (
              <Shield className="h-4 w-4" />
            )}
            <span>
              {profile?.role === 'superadmin' ? 'Super Admin' : 'Admin'} Panel
            </span>
          </SidebarGroupLabel>

          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} end className={getNavCls}>
                      <item.icon className="mr-2 h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
};

export default AdminSidebar;