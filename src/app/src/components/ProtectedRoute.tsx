import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useUserStore } from '@app/stores/userStore';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, isLoading } = useUserStore();
  const location = useLocation();

  // Show loading while auth is loading
  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    // Redirect to login while saving the attempted URL
    return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname)}`} replace />;
  }

  // ONBOARDING CHECKS TEMPORARILY DISABLED FOR DEVELOPMENT
  // Just return the protected content if user is authenticated
  return <>{children}</>;
}