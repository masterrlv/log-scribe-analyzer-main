
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiService } from '../services/api';

interface AuthContextType {
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is authenticated on app load
    const isAuth = apiService.isAuthenticated();
    setIsAuthenticated(isAuth);
    setLoading(false);
  }, []);

  const login = async (username: string, password: string) => {
    try {
      await apiService.login(username, password);
      setIsAuthenticated(true);
    } catch (error) {
      throw error;
    }
  };

  const register = async (username: string, email: string, password: string) => {
    try {
      await apiService.register(username, email, password);
      // Auto login after registration
      await login(username, password);
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    apiService.logout();
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{
      isAuthenticated,
      login,
      register,
      logout,
      loading
    }}>
      {children}
    </AuthContext.Provider>
  );
};
