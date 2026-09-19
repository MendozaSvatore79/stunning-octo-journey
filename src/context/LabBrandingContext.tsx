// src/context/LabBrandingContext.tsx
import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { Laboratory } from '../types/lab';
import { useUserContext } from '../hooks/useUserContext';
import { useApi } from '../hooks/useApi';

export interface LabBrandingConfig {
  labId: string;
  name: string;
  subtitle?: string;
  logo?: string; // Data URL or Image URL
  phone?: string;
  email?: string;
  address?: string;
  rfc?: string;
  sanitaryLicense?: string;
  responsibleName?: string;
}

export interface BrandingSaveResult {
  success: boolean;
  savedToDb: boolean;
  error?: string;
}

interface LabBrandingContextType {
  activeBranding: LabBrandingConfig;
  selectedLabId: string;
  setSelectedLabId: (id: string) => void;
  updateBranding: (labId: string, newConfig: Partial<LabBrandingConfig>) => Promise<BrandingSaveResult>;
  resetToDefault: (labId: string) => void;
  canEditBranding: boolean;
  labs: Laboratory[];
}

const DEFAULT_BRANDING: LabBrandingConfig = {
  labId: 'default',
  name: 'LabSystem',
  subtitle: 'Panel Administrador',
  logo: '',
  phone: '921 123 4567',
  email: 'contacto@labsystem.com',
  address: '',
  sanitaryLicense: 'COFEPRIS-LAB-2026',
  responsibleName: 'Q.F.B. Juan Carlos Mendoza',
};

const STORAGE_PREFIX = 'lab_branding_config_';
const SELECTED_LAB_STORAGE_KEY = 'lab_selected_active_id';

const LabBrandingContext = createContext<LabBrandingContextType | undefined>(undefined);

export function LabBrandingProvider({
  children,
  labs: initialLabs = [],
}: {
  children: ReactNode;
  labs?: Laboratory[];
}) {
  const { userProfile, role, isAdmin } = useUserContext();
  const api = useApi();
  const [labs, setLabs] = useState<Laboratory[]>(initialLabs);

  // Cargar labs automáticamente si no se proporcionaron
  useEffect(() => {
    if (initialLabs.length > 0) {
      setLabs(initialLabs);
      return;
    }
    const loadLabs = async () => {
      try {
        const res = await api.get<Laboratory[]>('/lab');
        if (res.data && res.data.length > 0) {
          setLabs(res.data);
        }
      } catch (e) {
        console.warn('Could not auto-fetch labs in branding:', e);
      }
    };
    loadLabs();
  }, [initialLabs, api]);

  // ID del laboratorio activo seleccionado
  const [selectedLabId, setSelectedLabIdState] = useState<string>(() => {
    const saved = localStorage.getItem(SELECTED_LAB_STORAGE_KEY);
    return saved || (initialLabs.length > 0 ? initialLabs[0].id : 'default');
  });

  // Si cambia la lista de labs y no hay seleccionado válido, fijar el primero de la lista
  useEffect(() => {
    if (labs.length > 0 && (!selectedLabId || selectedLabId === 'default')) {
      const saved = localStorage.getItem(SELECTED_LAB_STORAGE_KEY);
      const targetId = (saved && labs.some((l) => l.id === saved)) ? saved : labs[0].id;
      setSelectedLabIdState(targetId);
      localStorage.setItem(SELECTED_LAB_STORAGE_KEY, targetId);
    }
  }, [labs, selectedLabId]);

  const setSelectedLabId = useCallback((id: string) => {
    setSelectedLabIdState(id);
    localStorage.setItem(SELECTED_LAB_STORAGE_KEY, id);
  }, []);

  // Cargar branding del laboratorio seleccionado
  const [brandingState, setBrandingState] = useState<LabBrandingConfig>(() => {
    try {
      const key = `${STORAGE_PREFIX}${selectedLabId}`;
      const saved = localStorage.getItem(key);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Error reading branding config:', e);
    }
    return DEFAULT_BRANDING;
  });

  // Sincronizar branding cuando cambia el laboratorio seleccionado o la lista de laboratorios
  useEffect(() => {
    if (!selectedLabId) return;

    let savedConfig: LabBrandingConfig | null = null;
    try {
      const key = `${STORAGE_PREFIX}${selectedLabId}`;
      const saved = localStorage.getItem(key);
      if (saved) {
        savedConfig = JSON.parse(saved);
      }
    } catch (e) {
      console.warn('Error loading branding from storage:', e);
    }

    const labEntity = labs.find((l) => l.id === selectedLabId);

    if (savedConfig) {
      // Si el almacenamiento local no tenía logo pero la BD sí tiene uno, preservamos el de BD
      if (!savedConfig.logo && labEntity?.logo) {
        savedConfig.logo = labEntity.logo;
      }
      setBrandingState(savedConfig);
      return;
    }

    // Si no está en storage, tomar datos frescos de la entidad Laboratory
    if (labEntity) {
      const initial: LabBrandingConfig = {
        labId: labEntity.id,
        name: labEntity.name || DEFAULT_BRANDING.name,
        subtitle: labEntity.city ? `Sede ${labEntity.city}` : DEFAULT_BRANDING.subtitle,
        logo: labEntity.logo || '',
        address: [labEntity.address, labEntity.city, labEntity.state].filter(Boolean).join(', '),
        sanitaryLicense: DEFAULT_BRANDING.sanitaryLicense,
        responsibleName: DEFAULT_BRANDING.responsibleName,
      };
      setBrandingState(initial);
    } else {
      setBrandingState(DEFAULT_BRANDING);
    }
  }, [selectedLabId, labs]);

  // Actualizar branding y persistir en la base de datos (Backend) y en almacenamiento local
  const updateBranding = useCallback(
    async (labId: string, newConfig: Partial<LabBrandingConfig>): Promise<BrandingSaveResult> => {
      // Resolver targetLabId real (evitar que quede en 'default' si hay labs en el sistema)
      const targetLabId = (!labId || labId === 'default') && labs.length > 0 ? labs[0].id : labId;

      // 1. Persistencia local inmediata (optimista)
      const updated: LabBrandingConfig = {
        ...brandingState,
        ...newConfig,
        labId: targetLabId,
      };
      setBrandingState(updated);
      try {
        localStorage.setItem(`${STORAGE_PREFIX}${targetLabId}`, JSON.stringify(updated));
        localStorage.setItem(SELECTED_LAB_STORAGE_KEY, targetLabId);
      } catch (storageErr) {
        console.warn('No se pudo guardar en localStorage (cuota o navegación privada):', storageErr);
      }

      // 2. Persistir en la Base de Datos a través de la API (PATCH o PUT /lab/:id)
      if (targetLabId && targetLabId !== 'default') {
        const payload: Record<string, any> = {};
        if (updated.name !== undefined) payload.name = updated.name;
        if (updated.logo !== undefined) payload.logo = updated.logo;
        if (updated.address !== undefined) payload.address = updated.address;

        try {
          const res = await api.patch<Laboratory>(`/lab/${targetLabId}`, payload);
          if (res.data) {
            setLabs((prev) =>
              prev.map((l) => (l.id === targetLabId ? { ...l, ...res.data } : l))
            );
          }
          return { success: true, savedToDb: true };
        } catch (err: any) {
          console.warn('Fallo PATCH /lab/:id, intentando fallback PUT...', err);
          try {
            const res = await api.put<Laboratory>(`/lab/${targetLabId}`, payload);
            if (res.data) {
              setLabs((prev) =>
                prev.map((l) => (l.id === targetLabId ? { ...l, ...res.data } : l))
              );
            }
            return { success: true, savedToDb: true };
          } catch (innerErr: any) {
            console.error('Error al persistir en base de datos:', innerErr);
            const errMsg =
              innerErr?.response?.data?.message ||
              innerErr?.message ||
              'No se pudo conectar con el servidor para guardar en la base de datos';
            return { success: false, savedToDb: false, error: String(errMsg) };
          }
        }
      }

      return { success: true, savedToDb: false };
    },
    [brandingState, labs, api]
  );

  const resetToDefault = useCallback((labId: string) => {
    const targetLabId = (!labId || labId === 'default') && labs.length > 0 ? labs[0].id : labId;
    localStorage.removeItem(`${STORAGE_PREFIX}${targetLabId}`);
    const labEntity = labs.find((l) => l.id === targetLabId);
    if (labEntity) {
      setBrandingState({
        labId: labEntity.id,
        name: labEntity.name,
        subtitle: labEntity.city ? `Sede ${labEntity.city}` : DEFAULT_BRANDING.subtitle,
        logo: labEntity.logo || '',
        address: [labEntity.address, labEntity.city, labEntity.state].filter(Boolean).join(', '),
      });
    } else {
      setBrandingState(DEFAULT_BRANDING);
    }
  }, [labs]);

  // Permisos: Administrador del Laboratorio / Administrador General
  const canEditBranding = Boolean(
    isAdmin ||
    role === 'ADMIN' ||
    role === 'LAB_ADMIN' ||
    (labs.find((l) => l.id === selectedLabId)?.createdById === userProfile?.id)
  );

  return (
    <LabBrandingContext.Provider
      value={{
        activeBranding: brandingState,
        selectedLabId,
        setSelectedLabId,
        updateBranding,
        resetToDefault,
        canEditBranding,
        labs,
      }}
    >
      {children}
    </LabBrandingContext.Provider>
  );
}

export function useLabBranding() {
  const context = useContext(LabBrandingContext);
  if (!context) {
    throw new Error('useLabBranding must be used within a LabBrandingProvider');
  }
  return context;
}
