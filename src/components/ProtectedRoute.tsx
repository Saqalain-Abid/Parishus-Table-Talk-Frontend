import React, { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { useNavigate, useLocation } from 'react-router-dom';
import AuthPage from '@/components/auth/AuthPage';
import OnboardingFlow from '@/components/onboarding/OnboardingFlow';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading } = useProfile();
  const navigate = useNavigate();
  const location = useLocation();

  // ALL HOOKS MUST BE CALLED FIRST - before any conditional logic or early returns
  useEffect(() => {
    if (user && profile) {
      const currentPath = location.pathname;
      
      // Handle role-based redirects for authenticated users
      if (profile.onboarding_completed || (profile.role === 'admin' || profile.role === 'superadmin')) {
        // Redirect based on role when on root path
        if (currentPath === '/') {
          if (profile.role === 'superadmin') {
            navigate('/admin/dashboard', { replace: true });
          } else if (profile.role === 'admin') {
            navigate('/admin/events', { replace: true });
          }
          // Users stay on dashboard (root path)
          return;
        }
        
        // Prevent regular users from accessing admin routes
        if (profile.role === 'user' && currentPath.startsWith('/admin')) {
          navigate('/', { replace: true });
          return;
        }
      }
      
      // Handle incomplete onboarding for regular users
      if (profile.role === 'user' && !profile.onboarding_completed && !currentPath.startsWith('/auth')) {
        // User needs to complete onboarding - this is handled by the onboarding check below
        return;
      }
    }
  }, [user, profile, navigate, location.pathname]);

  // NOW we can do conditional logic and early returns
  if (authLoading || profileLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-peach-gold" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  if (profile && !profile.onboarding_completed && profile.role === 'user') {
    return <OnboardingFlow />;
  }

  // Show loading for admin users being redirected
  if (profile && !profile.onboarding_completed && (profile.role === 'admin' || profile.role === 'superadmin')) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-peach-gold" />
          <p className="text-muted-foreground">Redirecting to admin panel...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;