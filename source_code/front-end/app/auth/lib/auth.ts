import { jwtDecode } from 'jwt-decode';
import apiClient from '../../api/axios';

interface LoginCredentials {
  company_email: string;
  password: string;
}

interface User {
  user_id: string;
  full_name: string;
  role: string;
}

interface AuthResponse {
  error: boolean;
  message: string;
  token: string;
  user: User;
}

const isBrowser = typeof window !== 'undefined';

export const login = async (credentials: LoginCredentials): Promise<User> => {
  try {
    const response = await apiClient.post<AuthResponse>('/api/user/login', credentials);
    const { token, user } = response.data;
    
    if (isBrowser) {
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
    }
    
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
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/auth/login';
  }
};

export const getCurrentUser = (): User | null => {
  if (!isBrowser) return null;
  
  const userStr = localStorage.getItem('user');
  if (!userStr) return null;
  
  try {
    return JSON.parse(userStr);
  } catch (error) {
    return null;
  }
};

export const isAuthenticated = (): boolean => {
  if (!isBrowser) return false;
  
  const token = localStorage.getItem('token');
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
  return localStorage.getItem('token');
};