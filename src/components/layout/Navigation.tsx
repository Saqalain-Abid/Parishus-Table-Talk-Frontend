import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  Home,
  Calendar,
  Search,
  User,
  LogOut,
  Settings,
  Heart,
  Star,
  CreditCard,
  MessageSquare
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import NotificationCenter from '@/components/notifications/NotificationCenter';
import { useProfile } from '@/hooks/useProfile';
import './Navigation.css'; // Custom CSS for responsive logic
import ParishUsLogo from '../ui/logo';

const Navigation = () => {
  const { user, signOut } = useAuth();
  const { profile } = useProfile();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const navItems = [
    { icon: Home, label: 'Home', path: '/' },
    { icon: Calendar, label: 'My Events', path: '/events' },
    { icon: Search, label: 'Explore', path: '/explore' },
    { icon: Heart, label: 'RSVPs', path: '/rsvps' },
    { icon: MessageSquare, label: 'Feedback', path: '/feedback' },
    { icon: Star, label: 'Crossed Paths', path: '/crossed-paths' },
    { icon: CreditCard, label: 'Subscription', path: '/subscription' },
  ];

  return (
    <nav className="bg-dark-surface border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center cursor-pointer" onClick={() => navigate('/')}>
            <ParishUsLogo />
            <h1  className="text-2xl font-playfair font-extrabold text-sage-green">
              ParishUs
            </h1>
          </div>

          <div className="nav-items hidden items-center space-x-4">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;

              return (
                <Button
                  key={item.path}
                  variant="ghost"
                  className={`flex items-center gap-1 ${
                    isActive
                      ? 'text-peach-gold bg-peach-gold/10'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                  onClick={() => navigate(item.path)}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </Button>
              );
            })}
          </div>

          <div className="flex items-center space-x-4">
            <NotificationCenter />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={profile?.profile_photo_url || ''} />
                    <AvatarFallback className="bg-peach-gold/20 text-peach-gold">
                      {profile?.first_name?.[0]}{profile?.last_name?.[0]}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuItem className='cursor-pointer' onClick={() => navigate('/profile')}>
                  <User className="mr-2 h-4 w-4" /> Profile
                </DropdownMenuItem>
                <DropdownMenuItem className='cursor-pointer' onClick={() => navigate('/profile')}>
                  <Settings className="mr-2 h-4 w-4" /> Settings
                </DropdownMenuItem>
                <DropdownMenuItem className='cursor-pointer' onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" /> Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <div className="hamburger-toggle hidden">
              <Button variant="ghost" onClick={() => setMobileMenuOpen(!isMobileMenuOpen)}>
                <span className="sr-only">Toggle menu</span>
                <svg
                  className="h-6 w-6"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  {isMobileMenuOpen ? (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  ) : (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  )}
                </svg>
              </Button>
            </div>
          </div>
        </div>

        {isMobileMenuOpen && (
          <div className="hamburger-toggle mt-4 space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;

              return (
                <Button
                  key={item.path}
                  variant="ghost"
                  className={`w-full justify-start flex items-center gap-2 ${
                    isActive
                      ? 'text-peach-gold bg-peach-gold/10'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                  onClick={() => {
                    setMobileMenuOpen(false);
                    navigate(item.path);
                  }}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </Button>
              );
            })}
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;