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

export function UserProvider({ children }: { children: ReactNode }) {
  const { isSignedIn } = useAuth();
  const api = useApi();

  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUserProfile = useCallback(async () => {
    if (!isSignedIn) {
      setUserProfile(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.get<UserProfile>('/users/me');
      setUserProfile(response.data);
    } catch (error) {
      console.error('Error al obtener el perfil de usuario (/users/me):', error);
      setUserProfile(null);
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
