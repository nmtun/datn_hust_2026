/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { login as authLogin, logout as authLogout, getCurrentUser, isAuthenticated } from '../auth/lib/auth';

interface User {
  user_id: string;
  full_name: string;
  role: string;
  hierarchy_role?: string;
  tenant_id?: number | null;
}

interface LoginCredentials {
  company_email: string;
  tenant_code?: string;
  password: string;
  remember_me?: boolean;
}

interface LoginOptions {
  redirect?: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  isLoggedIn: boolean;
  login: (credentials: LoginCredentials, options?: LoginOptions) => Promise<User | null>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const router = useRouter();

  // Check authentication status on mount
  useEffect(() => {
    const checkAuthStatus = () => {
      setLoading(true);
      
      if (isAuthenticated()) {
        const currentUser = getCurrentUser();
        setUser(currentUser);
        setIsLoggedIn(true);
      } else {
        setUser(null);
        setIsLoggedIn(false);
      }
      
      setLoading(false);
    };

    checkAuthStatus();
  }, []);

  // Login function
  const login = async (credentials: LoginCredentials, options: LoginOptions = {}) => {
    setLoading(true);
    setError(null);
    
    try {
      const loggedInUser = await authLogin(credentials);
      setUser(loggedInUser);
      setIsLoggedIn(true);
      if (options.redirect !== false) {
        if (loggedInUser?.role === 'super_admin') {
          router.push('/super-admin/manage-tenant'); // Redirect to super admin dashboard after login
        } else {
          router.push('/dashboard'); // Redirect to another role page after login
        }
      }
      return loggedInUser;
    } catch (err: any) {
      setError(err.message || 'Login failed');
      setIsLoggedIn(false);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = () => {
    authLogout();
    setUser(null);
    setIsLoggedIn(false);
    router.push('/auth/login');
  };

  const value = {
    user,
    loading,
    error,
    isLoggedIn,
    login,
    logout
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}