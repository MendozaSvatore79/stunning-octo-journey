// src/context/UserContext.tsx
import { createContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { useAuth, useUser } from '@clerk/clerk-react';
import { useApi } from '../hooks/useApi';
import type { UserProfile, UserRole } from '../types/user';

export interface UserContextType {
  userProfile: UserProfile | null;
  role: UserRole;
  isAdmin: boolean;
  isTech: boolean;
  isLoading: boolean;
  refreshUserProfile: () => Promise<void>;
}

export const UserContext = createContext<UserContextType>({
  userProfile: null,
  role: 'TECH',
  isAdmin: false,
  isTech: true,
  isLoading: false,
  refreshUserProfile: async () => {},
});

const CACHE_KEY = 'lab_user_profile_cache';

export function UserProvider({ children }: { children: ReactNode }) {
  const { isSignedIn } = useAuth();
  const { user } = useUser();
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

  // NUNCA bloquear la interfaz en estado "Cargando..."
  const [isLoading, setIsLoading] = useState<boolean>(false);

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
      console.warn('Backend despertando o usando metadatos de Clerk...', error);
    } finally {
      setIsLoading(false);
    }
  }, [isSignedIn, api]);

  // Si cambia el usuario autenticado (o se cierra sesión), invalidar cache ajeno
  useEffect(() => {
    if (!isSignedIn) {
      setUserProfile(null);
      sessionStorage.removeItem(CACHE_KEY);
      return;
    }

    if (user?.id) {
      const cached = sessionStorage.getItem(CACHE_KEY);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          const currentEmail = user.primaryEmailAddress?.emailAddress;
          // Si el cache almacenado pertenece a otro usuario o correo, limpiarlo inmediatamente
          if (
            (parsed.clerkId && parsed.clerkId !== user.id) ||
            (parsed.email && currentEmail && parsed.email !== currentEmail)
          ) {
            sessionStorage.removeItem(CACHE_KEY);
            setUserProfile(null);
          }
        } catch {
          sessionStorage.removeItem(CACHE_KEY);
          setUserProfile(null);
        }
      }
    }

    fetchUserProfile();
  }, [user?.id, isSignedIn, fetchUserProfile]);

  // Extraer el rol validando que el perfil corresponda al usuario actual
  const currentEmail = user?.primaryEmailAddress?.emailAddress;
  const isProfileValid = userProfile && (!userProfile.email || !currentEmail || userProfile.email === currentEmail);
  const activeProfile = isProfileValid ? userProfile : null;

  const clerkRole = (user?.publicMetadata?.role as UserRole) || (user?.unsafeMetadata?.role as UserRole);
  const role: UserRole = activeProfile?.role || clerkRole || 'LAB_TECHNICIAN';
  const isAdmin = role === 'ADMIN';
  const isTech = role === 'TECH' || role === 'LAB_TECHNICIAN' || role === 'RECEPTIONIST';

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
