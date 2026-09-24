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
  name: 'Synova Lab',
  subtitle: 'Sistema de Diagnóstico Clínico & LIS',
  logo: '',
  phone: '921 123 4567',
  email: 'contacto@synovalab.com',
  address: '',
  sanitaryLicense: 'COFEPRIS-LAB-2026',
  responsibleName: 'Q.F.B. Juan Carlos Mendoza',
};

const STORAGE_PREFIX = 'lab_branding_config_';
const LEGACY_STORAGE_KEY = 'lab_selected_active_id';

const getSelectedLabKey = (userId?: string) => (userId ? `lab_selected_active_id_${userId}` : null);

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

  // Limpiar clave legada no aislada si existe para evitar filtraciones
  useEffect(() => {
    try {
      localStorage.removeItem(LEGACY_STORAGE_KEY);
    } catch {
      // Ignorar errores en entornos con storage restringido
    }
  }, []);

  // Cargar labs automáticamente solo cuando el usuario está autenticado
  useEffect(() => {
    if (!userProfile?.id) {
      setLabs(initialLabs);
      return;
    }

    if (initialLabs.length > 0) {
      setLabs(initialLabs);
      return;
    }

    const loadLabs = async () => {
      try {
        const res = await api.get<Laboratory[]>('/lab');
        if (res.data && Array.isArray(res.data)) {
          setLabs(res.data);
        }
      } catch (e) {
        console.warn('Could not auto-fetch labs in branding:', e);
      }
    };
    loadLabs();
  }, [userProfile?.id, initialLabs, api]);

  // ID del laboratorio activo seleccionado (aislado por usuario)
  const [selectedLabId, setSelectedLabIdState] = useState<string>(() => {
    if (!userProfile?.id) return 'default';
    const userKey = getSelectedLabKey(userProfile.id);
    const saved = userKey ? localStorage.getItem(userKey) : null;
    return saved || (initialLabs.length > 0 ? initialLabs[0].id : 'default');
  });

  // Reaccionar al cambio o inicio de sesión del usuario
  useEffect(() => {
    if (!userProfile?.id) {
      setSelectedLabIdState('default');
      setLabs([]);
      return;
    }

    const userKey = getSelectedLabKey(userProfile.id);
    const saved = userKey ? localStorage.getItem(userKey) : null;
    if (saved && labs.some((l) => l.id === saved)) {
      setSelectedLabIdState(saved);
    } else if (labs.length > 0) {
      setSelectedLabIdState(labs[0].id);
      if (userKey) localStorage.setItem(userKey, labs[0].id);
    } else {
      setSelectedLabIdState('default');
    }
  }, [userProfile?.id, labs]);

  const setSelectedLabId = useCallback((id: string) => {
    setSelectedLabIdState(id);
    const userKey = getSelectedLabKey(userProfile?.id);
    if (userKey) {
      localStorage.setItem(userKey, id);
    }
  }, [userProfile?.id]);

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
      // Resolver targetLabId real (evitar que quede en 'default' o apunte a un ID inexistente si hay labs en el sistema)
      const isTargetInLabs = labs.some((l) => l.id === labId);
      const targetLabId = (!labId || labId === 'default' || !isTargetInLabs) && labs.length > 0 ? labs[0].id : labId;

      // 1. Persistencia local inmediata (optimista)
      const updatedLogo =
        newConfig.logo !== undefined ? (newConfig.logo || '') : (brandingState.logo || '');

      const updated: LabBrandingConfig = {
        ...brandingState,
        ...newConfig,
        logo: updatedLogo,
        labId: targetLabId,
      };
      setBrandingState(updated);
      try {
        localStorage.setItem(`${STORAGE_PREFIX}${targetLabId}`, JSON.stringify(updated));
        const userKey = getSelectedLabKey(userProfile?.id);
        if (userKey) localStorage.setItem(userKey, targetLabId);
      } catch (storageErr) {
        console.warn('No se pudo guardar en localStorage (cuota o navegación privada):', storageErr);
      }

      // 2. Persistir en la Base de Datos a través de la API (PATCH o PUT /lab/:id)
      if (targetLabId && targetLabId !== 'default') {
        const payload: Record<string, any> = {};
        if (updated.name !== undefined) payload.name = updated.name;
        // Si se definió explícitamente el logo: si es vacío (''), enviar null para que la BD lo elimine
        if (newConfig.logo !== undefined) {
          payload.logo = newConfig.logo ? newConfig.logo : null;
        }
        if (updated.address !== undefined) payload.address = updated.address;

        try {
          const res = await api.patch<Laboratory>(`/lab/${targetLabId}`, payload);
          if (res.data) {
            const returnedLab = res.data;
            setLabs((prev) => {
              const exists = prev.some((l) => l.id === returnedLab.id);
              if (exists) {
                return prev.map((l) =>
                  l.id === returnedLab.id ? { ...l, ...returnedLab, logo: returnedLab.logo || '' } : l
                );
              }
              return [...prev, { ...returnedLab, logo: returnedLab.logo || '' }];
            });
            if (targetLabId !== returnedLab.id) {
              setSelectedLabIdState(returnedLab.id);
              const userKey = getSelectedLabKey(userProfile?.id);
              if (userKey) localStorage.setItem(userKey, returnedLab.id);
            }
          }
          return { success: true, savedToDb: true };
        } catch (err: any) {
          console.warn('Fallo PATCH /lab/:id, intentando fallback PUT...', err);
          try {
            const res = await api.put<Laboratory>(`/lab/${targetLabId}`, payload);
            if (res.data) {
              const returnedLab = res.data;
              setLabs((prev) => {
                const exists = prev.some((l) => l.id === returnedLab.id);
                if (exists) {
                  return prev.map((l) =>
                    l.id === returnedLab.id ? { ...l, ...returnedLab, logo: returnedLab.logo || '' } : l
                  );
                }
                return [...prev, { ...returnedLab, logo: returnedLab.logo || '' }];
              });
              if (targetLabId !== returnedLab.id) {
                setSelectedLabIdState(returnedLab.id);
                const userKey = getSelectedLabKey(userProfile?.id);
                if (userKey) localStorage.setItem(userKey, returnedLab.id);
              }
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
    [brandingState, labs, api, userProfile?.id]
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

  // Permisos: Administrador General y Encargados/Responsables del Laboratorio (LAB_TECHNICIAN).
  // Los roles operativos como TECH (Analista) y RECEPTIONIST permanecen en modo de solo lectura.
  const canEditBranding = Boolean(
    isAdmin ||
    role === 'ADMIN' ||
    role === 'LAB_ADMIN' ||
    role === 'LAB_TECHNICIAN' ||
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
