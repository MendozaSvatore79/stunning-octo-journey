// src/context/UserContext.tsx
import { createContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { useApi } from '../hooks/useApi';
import type { UserProfile, UserRole } from '../types/user';

export interface UserContextType {
  userProfile: UserProfile | null;
  role: UserRole | null;
  isAdmin: boolean;
  isTech: boolean;
  isLoading: boolean;
  refreshUserProfile: () => Promise<void>;
}

export const UserContext = createContext<UserContextType>({
  userProfile: null,
  role: null,
  isAdmin: false,
  isTech: false,
  isLoading: true,
  refreshUserProfile: async () => {},
});

const CACHE_KEY = 'lab_user_profile_cache';

export function UserProvider({ children }: { children: ReactNode }) {
  const { isSignedIn } = useAuth();
  const api = useApi();

  // Cargar estado inicial optimista desde sessionStorage para renderizado instantáneo (0ms)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(() => {
    try {
      const cached = sessionStorage.getItem(CACHE_KEY);
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });

  const [isLoading, setIsLoading] = useState<boolean>(() => !userProfile);

  const fetchUserProfile = useCallback(async () => {
    if (!isSignedIn) {
      setUserProfile(null);
      setIsLoading(false);
      sessionStorage.removeItem(CACHE_KEY);
      return;
    }

    try {
      const response = await api.get<UserProfile>('/users/me');
      if (response.data) {
        setUserProfile(response.data);
        sessionStorage.setItem(CACHE_KEY, JSON.stringify(response.data));
      }
    } catch (error) {
      console.error('Error al obtener el perfil de usuario (/users/me):', error);
    } finally {
      setIsLoading(false);
    }
  }, [isSignedIn, api]);

  useEffect(() => {
    fetchUserProfile();
  }, [fetchUserProfile]);

  const role = userProfile?.role || null;
  const isAdmin = role === 'ADMIN';
  const isTech = role === 'TECH' || role === 'LAB_TECHNICIAN';

  return (
    <UserContext.Provider
      value={{
        userProfile,
        role,
        isAdmin,
        isTech,
        isLoading,
        refreshUserProfile: fetchUserProfile,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}
