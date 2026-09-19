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

interface LabBrandingContextType {
  activeBranding: LabBrandingConfig;
  selectedLabId: string;
  setSelectedLabId: (id: string) => void;
  updateBranding: (labId: string, newConfig: Partial<LabBrandingConfig>) => void;
  resetToDefault: (labId: string) => void;
  canEditBranding: boolean;
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
  const { userProfile, role } = useUserContext();
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

  // Si cambia la lista de labs y no hay seleccionado, fijar el primero
  useEffect(() => {
    if (labs.length > 0 && (!selectedLabId || selectedLabId === 'default')) {
      const saved = localStorage.getItem(SELECTED_LAB_STORAGE_KEY);
      const targetId = (saved && labs.some((l) => l.id === saved)) ? saved : labs[0].id;
      setSelectedLabIdState(targetId);
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

    try {
      const key = `${STORAGE_PREFIX}${selectedLabId}`;
      const saved = localStorage.getItem(key);
      if (saved) {
        setBrandingState(JSON.parse(saved));
        return;
      }
    } catch (e) {
      console.warn('Error loading branding:', e);
    }

    // Si no está en storage, tomar datos de la entidad Laboratory
    const labEntity = labs.find((l) => l.id === selectedLabId);
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

  // Actualizar branding
  const updateBranding = useCallback((labId: string, newConfig: Partial<LabBrandingConfig>) => {
    setBrandingState((prev) => {
      const updated: LabBrandingConfig = {
        ...prev,
        ...newConfig,
        labId,
      };
      localStorage.setItem(`${STORAGE_PREFIX}${labId}`, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const resetToDefault = useCallback((labId: string) => {
    localStorage.removeItem(`${STORAGE_PREFIX}${labId}`);
    const labEntity = labs.find((l) => l.id === labId);
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

  // Permisos: Administrador del Laboratorio / Administrador de la Sede
  // Regla: Solo el administrador del laboratorio puede editar el logo y nombre de la sede
  const canEditBranding = Boolean(
    role === 'ADMIN' ||
    role === 'LAB_ADMIN' ||
    // Si es creador/dueño de la sede
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
