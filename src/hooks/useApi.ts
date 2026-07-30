// src/hooks/useApi.ts
import { useAuth } from '@clerk/clerk-react';
import axios from 'axios';
import { useMemo } from 'react';

export const useApi = () => {
  const { getToken } = useAuth();

  // useMemo asegura que la instancia de Axios no se recree en cada renderizado
  const api = useMemo(() => {
    const instance = axios.create({
      baseURL: import.meta.env.VITE_API_URL,
    });

    // Interceptor que se ejecuta ANTES de cada petición
    instance.interceptors.request.use(async (config) => {
      // Pedimos el token actual a Clerk
      const token = await getToken();
      
      if (token) {
        // Si hay token, lo inyectamos en la cabecera de Autorización
        config.headers.Authorization = `Bearer ${token}`;
      }
      
      return config;
    });

    return instance;
  }, [getToken]);

  return api;
};