/* eslint-disable @typescript-eslint/no-explicit-any */
import { jwtDecode } from 'jwt-decode';
import apiClient from '../../api/axios';

interface LoginCredentials {
  company_email: string;
  password: string;
  remember_me?: boolean;
}

interface User {
  user_id: string;
  full_name: string;
  role: string;
  hierarchy_role?: string;
}

interface AuthResponse {
  error: boolean;
  message: string;
  token: string;
  user: User;
}

const isBrowser = typeof window !== 'undefined';
const TOKEN_KEY = 'token';
const USER_KEY = 'user';

const clearStoredAuth = () => {
  if (!isBrowser) return;

  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(USER_KEY);
};

const getStoredItem = (key: string): string | null => {
  if (!isBrowser) return null;

  return localStorage.getItem(key) ?? sessionStorage.getItem(key);
};

const saveAuthByPreference = (token: string, user: User, rememberMe: boolean) => {
  if (!isBrowser) return;

  const preferredStorage = rememberMe ? localStorage : sessionStorage;
  const fallbackStorage = rememberMe ? sessionStorage : localStorage;

  preferredStorage.setItem(TOKEN_KEY, token);
  preferredStorage.setItem(USER_KEY, JSON.stringify(user));

  fallbackStorage.removeItem(TOKEN_KEY);
  fallbackStorage.removeItem(USER_KEY);
};

export const login = async (credentials: LoginCredentials): Promise<User> => {
  try {
    const { remember_me = false, ...loginPayload } = credentials;
    const response = await apiClient.post<AuthResponse>('/api/user/login', loginPayload);
    const { token, user } = response.data;
    
    saveAuthByPreference(token, user, remember_me);
    
    return user;
  } catch (error: any) {
    if (error.response) {
      throw new Error(error.response.data.message || 'Login failed');
    } else {
      throw new Error('Network error. Please try again later.');
    }
  }
};

export const logout = (): void => {
  if (isBrowser) {
    clearStoredAuth();
    window.location.href = '/auth/login';
  }
};

export const getCurrentUser = (): User | null => {
  if (!isBrowser) return null;
  
  const userStr = getStoredItem(USER_KEY);
  if (!userStr) return null;
  
  try {
    return JSON.parse(userStr);
  } catch (error) {
    return null;
  }
};

export const isAuthenticated = (): boolean => {
  if (!isBrowser) return false;
  
  const token = getStoredItem(TOKEN_KEY);
  if (!token) return false;
  
  try {
    const decoded = jwtDecode(token);
    const currentTime = Date.now() / 1000;
    
    // Check if token has expired
    if (decoded.exp && decoded.exp < currentTime) {
      logout();
      return false;
    }
    
    return true;
  } catch (error) {
    return false;
  }
};

export const getToken = (): string | null => {
  if (!isBrowser) return null;
  return getStoredItem(TOKEN_KEY);
};