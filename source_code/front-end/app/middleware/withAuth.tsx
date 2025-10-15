"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';

export function withAuth(Component: React.ComponentType) {
  return function ProtectedRoute(props: any) {
    const { isLoggedIn, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
      if (!loading && !isLoggedIn) {
        router.push('/auth/login');
      }
    }, [isLoggedIn, loading, router]);

    // Show loading state while checking authentication
    if (loading) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      );
    }

    // Only render the component if authenticated
    return isLoggedIn ? <Component {...props} /> : null;
  };
}