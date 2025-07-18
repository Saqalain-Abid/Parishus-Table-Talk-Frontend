import React, { useEffect, useState } from 'react';
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
  const [redirecting, setRedirecting] = useState(true);

  useEffect(() => {
    if (!user || !profile || authLoading || profileLoading) {
      setRedirecting(true);
      return;
    }

    const currentPath = location.pathname;

    if (currentPath.startsWith('/auth')) {
      setRedirecting(false);
      return;
    }

    if (profile.role === 'superadmin' || profile.role === 'admin') {
      if (!currentPath.startsWith('/admin')) {
        navigate('/admin/dashboard', { replace: true });
        return;
      }
    }

    if (profile.role === 'user') {
      if (currentPath.startsWith('/admin')) {
        navigate('/', { replace: true });
        return;
      }
    }

    setRedirecting(false);
  }, [user, profile, authLoading, profileLoading, location.pathname, navigate]);

  if (authLoading || profileLoading || redirecting) {
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

  if (profile.role === 'user' && !profile.onboarding_completed) {
    return <OnboardingFlow />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
