// src/components/CreateLabModal.tsx
import { useState, useEffect } from 'react';
import { useApi } from '../hooks/useApi';
import type { CreateLabDto, Laboratory } from '../types/lab';
import {
  getStatesByCountry,
  getCitiesByState,
  POPULAR_COUNTRIES,
} from '../utils/locationService';
import {
  IconFlask,
  IconX,
  IconPlus,
  IconMapPin,
  IconGlobe,
  IconCheckCircle,
  IconAlertCircle,
  IconBuilding,
} from './icons';

interface CreateLabModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLabCreated?: (lab: Laboratory) => void;
}

export default function CreateLabModal({
  isOpen,
  onClose,
  onLabCreated,
}: CreateLabModalProps) {
  const api = useApi();

  const [formData, setFormData] = useState<CreateLabDto>({
    name: '',
    address: '',
    country: 'México',
    state: '',
    city: '',
    logo: '',
  });

  const [availableStates, setAvailableStates] = useState<string[]>([]);
  const [availableCities, setAvailableCities] = useState<string[]>([]);
  const [isLoadingStates, setIsLoadingStates] = useState(false);
  const [isLoadingCities, setIsLoadingCities] = useState(false);

  const [customStateMode, setCustomStateMode] = useState(false);
  const [customCityMode, setCustomCityMode] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Cargar estados automáticamente cuando cambia el país
  useEffect(() => {
    if (!isOpen || !formData.country) return;

    let isMounted = true;
    setIsLoadingStates(true);

    getStatesByCountry(formData.country)
      .then((states) => {
        if (isMounted) {
          setAvailableStates(states);
          if (states.length === 0) {
            setCustomStateMode(true);
          } else {
            setCustomStateMode(false);
          }
        }
      })
      .catch((err) => console.error('Error al cargar estados:', err))
      .finally(() => {
        if (isMounted) setIsLoadingStates(false);
      });

    return () => {
      isMounted = false;
    };
  }, [formData.country, isOpen]);

  // Cargar ciudades automáticamente cuando cambia el estado
  useEffect(() => {
    if (!isOpen || !formData.country || !formData.state) {
      setAvailableCities([]);
      return;
    }

    let isMounted = true;
    setIsLoadingCities(true);

    getCitiesByState(formData.country, formData.state)
      .then((cities) => {
        if (isMounted) {
          setAvailableCities(cities);
          if (cities.length === 0) {
            setCustomCityMode(true);
          } else {
            setCustomCityMode(false);
          }
        }
      })
      .catch((err) => console.error('Error al cargar ciudades:', err))
      .finally(() => {
        if (isMounted) setIsLoadingCities(false);
      });

    return () => {
      isMounted = false;
    };
  }, [formData.country, formData.state, isOpen]);

  if (!isOpen) return null;

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    setFormData((prev) => {
      const updated = { ...prev, [name]: value };

      // Si cambia el país, reiniciar estado y ciudad
      if (name === 'country') {
        updated.state = '';
        updated.city = '';
      }

      // Si cambia el estado, reiniciar ciudad
      if (name === 'state') {
        updated.city = '';
      }

      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setErrorMsg('El nombre del laboratorio es obligatorio.');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const payload: CreateLabDto = {
        name: formData.name.trim(),
        address: formData.address?.trim() || undefined,
        country: formData.country?.trim() || undefined,
        state: formData.state?.trim() || undefined,
        city: formData.city?.trim() || undefined,
        logo: formData.logo?.trim() || undefined,
      };

      const response = await api.post<Laboratory>('/lab', payload);
      setSuccessMsg('¡Laboratorio registrado exitosamente!');

      setFormData({
        name: '',
        address: '',
        country: 'México',
        state: '',
        city: '',
        logo: '',
      });

      if (onLabCreated) {
        onLabCreated(response.data);
      }

      setTimeout(() => {
        setSuccessMsg(null);
        onClose();
      }, 1200);
    } catch (err: any) {
      console.error('Error al crear laboratorio:', err);
      const serverMessage =
        err?.response?.data?.message ||
        'No se pudo registrar el laboratorio. Verifica tu conexión e intenta nuevamente.';
      setErrorMsg(
        Array.isArray(serverMessage) ? serverMessage.join(', ') : serverMessage
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <dialog className="modal modal-open backdrop-blur-xs">
      <div className="modal-box max-w-xl border border-base-300 bg-base-100 p-6 sm:p-8 shadow-2xl rounded-3xl">
        
        {/* Cabecera del Modal */}
        <div className="flex items-center justify-between border-b border-base-200 pb-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-tr from-blue-600 to-indigo-600 text-white rounded-2xl shadow-md shadow-blue-500/20">
              <IconFlask className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-black text-xl text-base-content tracking-tight">
                Crear Nueva Sede de Laboratorio
              </h3>
              <p className="text-xs text-base-content/60">
                Selecciona país, estado y ciudad para dar de alta la sucursal.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="btn btn-sm btn-circle btn-ghost text-base-content/70 hover:bg-base-200"
            disabled={isLoading}
          >
            <IconX className="w-5 h-5" />
          </button>
        </div>

        {/* Mensajes de Alerta */}
        {errorMsg && (
          <div className="alert alert-error mb-4 text-sm shadow-sm py-2.5 rounded-2xl text-white">
            <IconAlertCircle className="w-5 h-5 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="alert alert-success mb-4 text-sm shadow-sm py-2.5 rounded-2xl text-white">
            <IconCheckCircle className="w-5 h-5 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Formulario con desplegables dependientes de País -> Estado -> Ciudad */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          <div className="form-control">
            <label className="label">
              <span className="label-text font-semibold">
                Nombre de la Sede / Laboratorio <span className="text-error">*</span>
              </span>
            </label>
            <input
              type="text"
              name="name"
              placeholder="Ej. Laboratorio Central - Sede Guadalajara"
              className="input input-bordered w-full focus:input-primary transition-all rounded-xl font-medium"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text font-semibold flex items-center gap-1.5">
                <IconMapPin className="w-4 h-4 text-base-content/60" /> Calle y Número (Dirección)
              </span>
            </label>
            <input
              type="text"
              name="address"
              placeholder="Ej. Av. Vallarta #2440, Col. Arcos Vallarta"
              className="input input-bordered w-full focus:input-primary transition-all rounded-xl text-sm"
              value={formData.address || ''}
              onChange={handleChange}
            />
          </div>

          {/* Sección de Selección Geográfica Dependiente */}
          <div className="bg-base-200/50 p-4 rounded-2xl border border-base-200 space-y-4">
            <div className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
              <IconBuilding className="w-3.5 h-3.5" /> Ubicación de la Sede
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              
              {/* Selector de País */}
              <div className="form-control">
                <label className="label py-1">
                  <span className="label-text text-xs font-bold flex items-center gap-1">
                    <IconGlobe className="w-3.5 h-3.5 text-blue-600" /> País
                  </span>
                </label>
                <select
                  name="country"
                  className="select select-bordered select-sm w-full rounded-xl focus:select-primary font-medium text-xs h-10"
                  value={formData.country}
                  onChange={handleChange}
                >
                  {POPULAR_COUNTRIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              {/* Selector de Estado / Provincia */}
              <div className="form-control">
                <label className="label py-1">
                  <span className="label-text text-xs font-bold">Estado / Provincia</span>
                </label>
                {isLoadingStates ? (
                  <div className="skeleton h-10 w-full rounded-xl"></div>
                ) : !customStateMode && availableStates.length > 0 ? (
                  <select
                    name="state"
                    className="select select-bordered select-sm w-full rounded-xl focus:select-primary font-medium text-xs h-10"
                    value={formData.state}
                    onChange={handleChange}
                  >
                    <option value="">-- Seleccionar Estado --</option>
                    {availableStates.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    name="state"
                    placeholder="Escribe el estado"
                    className="input input-bordered input-sm w-full rounded-xl focus:input-primary text-xs h-10"
                    value={formData.state || ''}
                    onChange={handleChange}
                  />
                )}
              </div>

              {/* Selector de Ciudad / Municipio */}
              <div className="form-control">
                <label className="label py-1">
                  <span className="label-text text-xs font-bold">Ciudad / Municipio</span>
                </label>
                {isLoadingCities ? (
                  <div className="skeleton h-10 w-full rounded-xl"></div>
                ) : !customCityMode && availableCities.length > 0 ? (
                  <select
                    name="city"
                    className="select select-bordered select-sm w-full rounded-xl focus:select-primary font-medium text-xs h-10"
                    value={formData.city}
                    onChange={handleChange}
                    disabled={!formData.state}
                  >
                    <option value="">
                      {!formData.state ? '-- Primero elige estado --' : '-- Seleccionar Ciudad --'}
                    </option>
                    {availableCities.map((ct) => (
                      <option key={ct} value={ct}>
                        {ct}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    name="city"
                    placeholder="Escribe la ciudad"
                    className="input input-bordered input-sm w-full rounded-xl focus:input-primary text-xs h-10"
                    value={formData.city || ''}
                    onChange={handleChange}
                  />
                )}
              </div>

            </div>
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text font-semibold">URL del Logo (Opcional)</span>
            </label>
            <input
              type="url"
              name="logo"
              placeholder="Ej. https://ejemplo.com/logo.png"
              className="input input-bordered w-full focus:input-primary transition-all rounded-xl text-xs"
              value={formData.logo || ''}
              onChange={handleChange}
            />
          </div>

          {/* Botones de Acción */}
          <div className="modal-action border-t border-base-200 pt-4 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-ghost rounded-xl font-semibold"
              disabled={isLoading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn btn-primary text-primary-content font-bold rounded-xl gap-2 min-w-[150px] shadow-lg shadow-primary/20"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span className="loading loading-spinner loading-sm"></span>
                  Guardando...
                </>
              ) : (
                <>
                  <IconPlus className="w-5 h-5" />
                  Crear Laboratorio
                </>
              )}
            </button>
          </div>
        </form>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button onClick={onClose}>close</button>
      </form>
    </dialog>
  );
}
