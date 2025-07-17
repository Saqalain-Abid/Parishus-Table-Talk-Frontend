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
    // Only run redirection logic when we have both user and profile data
    if (user && profile) {
      const currentPath = location.pathname;
      
      // Skip redirection if we're already on auth pages
      if (currentPath.startsWith('/auth')) {
        return;
      }
      
      console.log('ProtectedRoute: Checking redirects for user role:', profile.role, 'onboarding:', profile.onboarding_completed, 'path:', currentPath);
      
      // Role-based redirection logic
      if (profile.role === 'superadmin') {
        // SuperAdmin should go to /admin/dashboard
        if (currentPath === '/' || currentPath === '/admin') {
          console.log('ProtectedRoute: Redirecting superadmin to /admin/dashboard');
          navigate('/admin/dashboard', { replace: true });
          return;
        }
      } else if (profile.role === 'admin') {
        // Admin should go to /admin/events  
        if (currentPath === '/' || currentPath === '/admin') {
          console.log('ProtectedRoute: Redirecting admin to /admin/events');
          navigate('/admin/events', { replace: true });
          return;
        }
      } else if (profile.role === 'user') {
        // Prevent users from accessing admin routes
        if (currentPath.startsWith('/admin')) {
          console.log('ProtectedRoute: Redirecting user away from admin area to /');
          navigate('/', { replace: true });
          return;
        }
        
        // Handle user onboarding flow - if not completed, show onboarding
        if (!profile.onboarding_completed) {
          console.log('ProtectedRoute: User needs onboarding');
          // The onboarding check below will handle this
          return;
        }
        
        // User is completed and should stay on regular user routes
        console.log('ProtectedRoute: User has completed onboarding, staying on user routes');
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

  // Admin and superadmin users don't need onboarding - they go directly to admin panel
  // The useEffect above handles their redirection

  return <>{children}</>;
};

export default ProtectedRoute;