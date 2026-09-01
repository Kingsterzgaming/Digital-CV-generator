import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User, FullProfileData } from '../types/index.ts';
import { api } from '../lib/api.ts';

interface AuthContextType {
  user: User | null;
  fullProfile: FullProfileData | null;
  isLoading: boolean;
  hasProfile: boolean;
  login: (email: string, pass: string) => Promise<void>;
  register: (data: { email: string; name: string; username: string; password: string }) => Promise<void>;
  logout: () => void;
  switchUser: (userId: string) => Promise<void>;
  refreshProfile: () => Promise<void>;
  resetAllData: () => Promise<void>;
  setLocalFullProfile: React.Dispatch<React.SetStateAction<FullProfileData | null>>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [fullProfile, setFullProfile] = useState<FullProfileData | null>(null);
  const [hasProfile, setHasProfile] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const initAuth = async () => {
    try {
      setIsLoading(true);
      let token = localStorage.getItem('digitalcv_token');
      if (!token || token.includes('alex_chen') || token.includes('elena') || token.includes('marcus')) {
        token = 'usr_user';
        localStorage.setItem('digitalcv_token', token);
      }

      const me = await api.getMe();
      setUser(me.user);
      setHasProfile(me.hasProfile);

      if (me.hasProfile) {
        const profileData = await api.getProfile();
        setFullProfile(profileData);
      } else {
        setFullProfile(null);
      }
    } catch (err) {
      console.warn('Auth init failed:', err);
      setUser(null);
      setFullProfile(null);
      setHasProfile(false);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    initAuth();
  }, []);

  const login = async (email: string, pass: string) => {
    const res = await api.login(email, pass);
    localStorage.setItem('digitalcv_token', res.token);
    setUser(res.user);
    await refreshProfile();
  };

  const register = async (data: { email: string; name: string; username: string; password: string }) => {
    const res = await api.register(data);
    localStorage.setItem('digitalcv_token', res.token);
    setUser(res.user);
    setHasProfile(false);
    setFullProfile(null);
  };

  const logout = () => {
    localStorage.removeItem('digitalcv_token');
    setUser(null);
    setFullProfile(null);
    setHasProfile(false);
  };

  const switchUser = async (userId: string) => {
    localStorage.setItem('digitalcv_token', userId);
    await initAuth();
  };

  const resetAllData = async () => {
    try {
      setIsLoading(true);
      await api.resetAllData();
      localStorage.setItem('digitalcv_token', 'usr_user');
      await initAuth();
    } catch (err) {
      console.error('Reset error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshProfile = async () => {
    try {
      const me = await api.getMe();
      setHasProfile(me.hasProfile);
      if (me.hasProfile) {
        const p = await api.getProfile();
        setFullProfile(p);
      } else {
        setFullProfile(null);
      }
    } catch {
      setFullProfile(null);
      setHasProfile(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        fullProfile,
        isLoading,
        hasProfile,
        login,
        register,
        logout,
        switchUser,
        refreshProfile,
        resetAllData,
        setLocalFullProfile: setFullProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
