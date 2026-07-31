// src/context/MaintenanceContext.tsx
import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { useApi } from '../hooks/useApi';

export interface MaintenanceModules {
  patients: boolean;
  catalog: boolean;
  workOrders: boolean;
  qualityControl: boolean;
  labsDirectory: boolean;
  supportChat: boolean;
}

export interface MaintenanceConfig {
  globalMaintenance: boolean;
  vipAccessKey: string;
  estimatedTime: string;
  reason: string;
  modules: MaintenanceModules;
}

const DEFAULT_MAINTENANCE_CONFIG: MaintenanceConfig = {
  globalMaintenance: false,
  vipAccessKey: 'SECURE_VIP_PASS_2026',
  estimatedTime: '30 a 45 minutos',
  reason: 'Mantenimiento preventivo y optimización de servidores de datos clínicos.',
  modules: {
    patients: false,
    catalog: false,
    workOrders: false,
    qualityControl: false,
    labsDirectory: false,
    supportChat: false,
  },
};

const SESSION_VIP_KEY = 'lab_active_vip_pass_session_v2';

interface MaintenanceContextType {
  config: MaintenanceConfig;
  isVipPassed: boolean;
  isPreviewingMaintenance: boolean;
  setIsPreviewingMaintenance: (preview: boolean) => void;
  updateConfig: (newConfig: Partial<MaintenanceConfig>) => Promise<void>;
  toggleGlobalMaintenance: (enabled: boolean) => Promise<void>;
  toggleModuleMaintenance: (moduleKey: keyof MaintenanceModules, enabled: boolean) => Promise<void>;
  validateVipKey: (enteredKey: string) => boolean;
  clearVipPass: () => void;
  getVipUrl: () => string;
}

const MaintenanceContext = createContext<MaintenanceContextType | undefined>(undefined);

export function MaintenanceProvider({ children }: { children: ReactNode }) {
  const api = useApi();

  const [config, setConfig] = useState<MaintenanceConfig>(DEFAULT_MAINTENANCE_CONFIG);

  // Mantener la autorizacion VIP durante la sesion activa del navegador sin interferir con la BD PostgreSQL
  const [isVipPassed, setIsVipPassed] = useState<boolean>(() => {
    try {
      const saved = sessionStorage.getItem(SESSION_VIP_KEY);
      return Boolean(saved);
    } catch {
      return false;
    }
  });

  const [isPreviewingMaintenance, setIsPreviewingMaintenance] = useState<boolean>(false);

  // 1. Sincronización en TIEMPO REAL desde el Backend NestJS y la BD PostgreSQL
  const fetchBackendMaintenanceConfig = useCallback(async () => {
    try {
      const res = await api.get<MaintenanceConfig>('/support/maintenance');
      if (res.data) {
        setConfig(res.data);
      }
    } catch (err) {
      console.warn('Fallback de mantenimiento:', err);
    }
  }, [api]);

  useEffect(() => {
    fetchBackendMaintenanceConfig();
    const interval = setInterval(fetchBackendMaintenanceConfig, 1000); // Polling activo de 1s
    return () => clearInterval(interval);
  }, [fetchBackendMaintenanceConfig]);

  // Verificar parametros VIP en la URL (?vip_pass=SECURE_VIP_PASS_2026 o ?maintenance_pass=...)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const passFromUrl = params.get('vip_pass') || params.get('maintenance_pass') || params.get('key');
    if (passFromUrl && passFromUrl === config.vipAccessKey) {
      try {
        sessionStorage.setItem(SESSION_VIP_KEY, passFromUrl);
      } catch {}
      setIsVipPassed(true);
    }
  }, [config.vipAccessKey]);

  const updateConfig = async (newConfig: Partial<MaintenanceConfig>) => {
    const nextConfig = {
      ...config,
      ...newConfig,
      modules: {
        ...config.modules,
        ...(newConfig.modules || {}),
      },
    };

    // Actualización inmediata en estado local
    setConfig(nextConfig);

    // Enviar directamente a la Base de Datos PostgreSQL
    try {
      await api.post('/support/maintenance', nextConfig);
      await fetchBackendMaintenanceConfig();
    } catch (err) {
      console.warn('Error guardando mantenimiento en servidor:', err);
    }
  };

  const clearVipPass = () => {
    try {
      sessionStorage.removeItem(SESSION_VIP_KEY);
    } catch {}
    setIsVipPassed(false);
  };

  const toggleGlobalMaintenance = async (enabled: boolean) => {
    await updateConfig({ globalMaintenance: enabled });
    if (!enabled) {
      clearVipPass();
      setIsPreviewingMaintenance(false);
    }
  };

  const toggleModuleMaintenance = async (moduleKey: keyof MaintenanceModules, enabled: boolean) => {
    const updatedModules = {
      ...config.modules,
      [moduleKey]: enabled,
    };
    await updateConfig({ modules: updatedModules });
  };

  const validateVipKey = (enteredKey: string): boolean => {
    if (enteredKey.trim() === config.vipAccessKey) {
      try {
        sessionStorage.setItem(SESSION_VIP_KEY, enteredKey.trim());
      } catch {}
      setIsVipPassed(true);
      setIsPreviewingMaintenance(false);
      return true;
    }
    return false;
  };

  const getVipUrl = () => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/dashboard?vip_pass=${encodeURIComponent(config.vipAccessKey)}`;
  };

  return (
    <MaintenanceContext.Provider
      value={{
        config,
        isVipPassed,
        isPreviewingMaintenance,
        setIsPreviewingMaintenance,
        updateConfig,
        toggleGlobalMaintenance,
        toggleModuleMaintenance,
        validateVipKey,
        clearVipPass,
        getVipUrl,
      }}
    >
      {children}
    </MaintenanceContext.Provider>
  );
}

export function useMaintenance() {
  const context = useContext(MaintenanceContext);
  if (!context) {
    throw new Error('useMaintenance debe ser utilizado dentro de un MaintenanceProvider');
  }
  return context;
}
