'use client';

import { ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';

interface ProtectedRouteProps {
  allowedRoles?: string[];
  children: ReactNode;
}

export default function ProtectedRoute({ allowedRoles, children }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.replace('/login');
      } else if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
        router.replace('/dashboard');
      }
    }
  }, [loading, user, allowedRoles, router]);

  if (loading || !user) {
    return <div>Loading...</div>;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <div>Access denied.</div>;
  }

  return <>{children}</>;
}
