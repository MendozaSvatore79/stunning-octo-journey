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
  IconShieldCheck,
  IconFileText,
  IconPhone,
  IconMail,
} from './icons';
import { DocumentScannerUploader } from './DocumentScannerUploader';
import { PlanSelectionModal } from './PlanSelectionModal';
import type { UserSubscription } from '../types/subscription';

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
    rfc: '',
    cofeprisNotice: '',
    sanitaryResponsible: '',
    professionalLicense: '',
    sanitaryPermitUrl: '',
    permitExpiresAt: '',
    rpbiExpiresAt: '',
    phone: '',
    email: '',
  });

  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const [availableStates, setAvailableStates] = useState<string[]>([]);
  const [availableCities, setAvailableCities] = useState<string[]>([]);
  const [isLoadingStates, setIsLoadingStates] = useState(false);
  const [isLoadingCities, setIsLoadingCities] = useState(false);

  const [customStateMode, setCustomStateMode] = useState(false);
  const [customCityMode, setCustomCityMode] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    api.get<UserSubscription>('/subscription/me')
      .then((res) => setSubscription(res.data))
      .catch((err) => console.warn('No se pudo verificar suscripción:', err));
  }, [isOpen, api]);

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
        // Datos Regulatorios (México / COFEPRIS)
        rfc: formData.rfc?.trim().toUpperCase() || undefined,
        cofeprisNotice: formData.cofeprisNotice?.trim() || undefined,
        sanitaryResponsible: formData.sanitaryResponsible?.trim() || undefined,
        professionalLicense: formData.professionalLicense?.trim() || undefined,
        sanitaryPermitUrl: formData.sanitaryPermitUrl?.trim() || undefined,
        phone: formData.phone?.trim() || undefined,
        email: formData.email?.trim() || undefined,
      };

      const response = await api.post<Laboratory>('/lab', payload);
      setSuccessMsg('¡Sede registrada exitosamente! Se ha remitido a revisión administrativa.');

      setFormData({
        name: '',
        address: '',
        country: 'México',
        state: '',
        city: '',
        logo: '',
        rfc: '',
        cofeprisNotice: '',
        sanitaryResponsible: '',
        professionalLicense: '',
        sanitaryPermitUrl: '',
        phone: '',
        email: '',
      });

      if (onLabCreated) {
        onLabCreated(response.data);
      }

      setTimeout(() => {
        setSuccessMsg(null);
        onClose();
      }, 1400);
    } catch (err: any) {
      console.error('Error al crear laboratorio:', err);
      const serverMessage =
        err?.response?.data?.message ||
        'No se pudo registrar el laboratorio. Verifica los datos e intenta nuevamente.';
      setErrorMsg(
        Array.isArray(serverMessage) ? serverMessage.join(', ') : serverMessage
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <dialog className="modal modal-open backdrop-blur-xs p-2 sm:p-4 z-[9999]">
      <div className="modal-box w-full max-w-[95vw] sm:max-w-2xl border border-base-200 bg-base-100 p-4 sm:p-7 shadow-2xl rounded-3xl max-h-[92vh] overflow-y-auto">
        
        {/* Cabecera del Modal */}
        <div className="flex items-center justify-between border-b border-base-200 pb-4 mb-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-primary/20">
              <IconFlask className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base sm:text-lg text-base-content tracking-tight truncate">
                  Alta de Nueva Sede Clínica
                </h3>
                <span className="badge badge-warning badge-xs font-bold text-[9px] px-2 py-0.5">
                  AUDITORÍA INICIAL
                </span>
              </div>
              <p className="text-xs text-base-content/60 truncate">
                Ingresa los datos del establecimiento y credenciales sanitarias oficiales.
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
          <div className="alert alert-error mb-4 text-xs font-medium shadow-xs py-2.5 rounded-2xl text-white">
            <IconAlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="alert alert-success mb-4 text-xs font-medium shadow-xs py-2.5 rounded-2xl text-white">
            <IconCheckCircle className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {subscription?.usage?.isExceededLabs && (
          <div className="alert alert-warning mb-4 text-xs font-semibold py-2.5 rounded-2xl flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2">
              <IconAlertCircle className="w-4 h-4 shrink-0" />
              <span>
                Has alcanzado el límite de <strong>{subscription.usage.maxLabs} sedes</strong> de tu {subscription.plan.name}.
              </span>
            </div>
            <button
              type="button"
              onClick={() => setShowUpgradeModal(true)}
              className="btn btn-xs btn-primary text-white font-bold rounded-lg"
            >
              Actualizar Plan
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* SECCIÓN 1: IDENTIDAD BÁSICA Y UBICACIÓN */}
          <div className="space-y-3">
            <div className="form-control">
              <label className="label py-1">
                <span className="label-text font-bold text-xs">
                  Nombre Comercial del Laboratorio / Sede <span className="text-error">*</span>
                </span>
              </label>
              <input
                type="text"
                name="name"
                placeholder="Ej. Laboratorio Diagnóstico Clínico - Sede Guadalajara Centro"
                className="input input-bordered input-sm sm:input-md w-full focus:input-primary transition-all rounded-xl font-medium text-xs sm:text-sm"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-control">
              <label className="label py-1">
                <span className="label-text font-bold text-xs flex items-center gap-1.5">
                  <IconMapPin className="w-3.5 h-3.5 text-base-content/60" /> Calle, Número y Colonia
                </span>
              </label>
              <input
                type="text"
                name="address"
                placeholder="Ej. Av. Hidalgo 1450, Col. Americana"
                className="input input-bordered input-sm w-full focus:input-primary transition-all rounded-xl text-xs"
                value={formData.address || ''}
                onChange={handleChange}
              />
            </div>

            {/* Ubicación Geográfica */}
            <div className="bg-base-200/40 p-3.5 rounded-2xl border border-base-200 space-y-3">
              <div className="text-[11px] font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
                <IconBuilding className="w-3.5 h-3.5" /> Ubicación Geográfica
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div className="form-control">
                  <label className="label py-0.5">
                    <span className="label-text text-[11px] font-semibold flex items-center gap-1">
                      <IconGlobe className="w-3 h-3 text-primary" /> País
                    </span>
                  </label>
                  <select
                    name="country"
                    className="select select-bordered select-xs w-full rounded-xl focus:select-primary font-medium h-9 text-xs"
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

                <div className="form-control">
                  <label className="label py-0.5">
                    <span className="label-text text-[11px] font-semibold">Estado / Entidad</span>
                  </label>
                  {isLoadingStates ? (
                    <div className="skeleton h-9 w-full rounded-xl"></div>
                  ) : !customStateMode && availableStates.length > 0 ? (
                    <select
                      name="state"
                      className="select select-bordered select-xs w-full rounded-xl focus:select-primary font-medium h-9 text-xs"
                      value={formData.state}
                      onChange={handleChange}
                    >
                      <option value="">-- Seleccionar --</option>
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
                      placeholder="Estado"
                      className="input input-bordered input-xs w-full rounded-xl focus:input-primary h-9 text-xs"
                      value={formData.state || ''}
                      onChange={handleChange}
                    />
                  )}
                </div>

                <div className="form-control">
                  <label className="label py-0.5">
                    <span className="label-text text-[11px] font-semibold">Municipio / Ciudad</span>
                  </label>
                  {isLoadingCities ? (
                    <div className="skeleton h-9 w-full rounded-xl"></div>
                  ) : !customCityMode && availableCities.length > 0 ? (
                    <select
                      name="city"
                      className="select select-bordered select-xs w-full rounded-xl focus:select-primary font-medium h-9 text-xs"
                      value={formData.city}
                      onChange={handleChange}
                      disabled={!formData.state}
                    >
                      <option value="">
                        {!formData.state ? '-- Elige estado --' : '-- Ciudad --'}
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
                      placeholder="Ciudad"
                      className="input input-bordered input-xs w-full rounded-xl focus:input-primary h-9 text-xs"
                      value={formData.city || ''}
                      onChange={handleChange}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* SECCIÓN 2: CUMPLIMIENTO REGULATORIO Y PERMISOS SANITARIOS (MÉXICO / COFEPRIS) */}
          <div className="bg-primary/5 p-4 rounded-2xl border border-primary/20 space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
                <IconShieldCheck className="w-4 h-4 text-primary" /> Permisos Sanitarios y Legales (COFEPRIS / México)
              </div>
              <span className="badge badge-outline badge-primary text-[10px] font-semibold">
                Norma Oficial
              </span>
            </div>

            <p className="text-[11px] text-base-content/70 leading-relaxed">
              Para cumplir con la legislación sanitaria mexicana y prevenir el ejercicio irregular de análisis clínicos, proporcione las credenciales de este establecimiento. Serán auditadas por el Administrador Global.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="form-control">
                <label className="label py-0.5">
                  <span className="label-text text-[11px] font-semibold flex items-center gap-1">
                    <IconFileText className="w-3 h-3 text-primary" /> RFC (Persona Física o Moral)
                  </span>
                </label>
                <input
                  type="text"
                  name="rfc"
                  maxLength={13}
                  placeholder="Ej. LAB210405XYZ"
                  className="input input-bordered input-xs w-full rounded-xl focus:input-primary uppercase font-mono h-9 text-xs"
                  value={formData.rfc || ''}
                  onChange={handleChange}
                />
              </div>

              <div className="form-control">
                <label className="label py-0.5">
                  <span className="label-text text-[11px] font-semibold flex items-center gap-1">
                    <IconShieldCheck className="w-3 h-3 text-primary" /> Folio Aviso de Funcionamiento COFEPRIS
                  </span>
                </label>
                <input
                  type="text"
                  name="cofeprisNotice"
                  placeholder="Ej. 24-AF-09-012345"
                  className="input input-bordered input-xs w-full rounded-xl focus:input-primary h-9 text-xs font-mono"
                  value={formData.cofeprisNotice || ''}
                  onChange={handleChange}
                />
              </div>

              <div className="form-control">
                <label className="label py-0.5">
                  <span className="label-text text-[11px] font-semibold">
                    Nombre del Responsable Sanitario
                  </span>
                </label>
                <input
                  type="text"
                  name="sanitaryResponsible"
                  placeholder="Ej. Q.F.B. Mariana Morales Ríos"
                  className="input input-bordered input-xs w-full rounded-xl focus:input-primary h-9 text-xs"
                  value={formData.sanitaryResponsible || ''}
                  onChange={handleChange}
                />
              </div>

              <div className="form-control">
                <label className="label py-0.5">
                  <span className="label-text text-[11px] font-semibold">
                    Cédula Profesional del Químico / Responsable
                  </span>
                </label>
                <input
                  type="text"
                  name="professionalLicense"
                  placeholder="Ej. 8492031 (Dirección Gral. Profesiones)"
                  className="input input-bordered input-xs w-full rounded-xl focus:input-primary font-mono h-9 text-xs"
                  value={formData.professionalLicense || ''}
                  onChange={handleChange}
                />
              </div>

              <div className="form-control">
                <label className="label py-0.5">
                  <span className="label-text text-[11px] font-semibold">
                    Vigencia de Licencia / Aviso COFEPRIS (Opcional)
                  </span>
                </label>
                <input
                  type="date"
                  name="permitExpiresAt"
                  className="input input-bordered input-xs w-full rounded-xl focus:input-primary h-9 text-xs"
                  value={formData.permitExpiresAt || ''}
                  onChange={handleChange}
                />
              </div>

              <div className="form-control">
                <label className="label py-0.5">
                  <span className="label-text text-[11px] font-semibold">
                    Vigencia de Contrato RPBI (Opcional)
                  </span>
                </label>
                <input
                  type="date"
                  name="rpbiExpiresAt"
                  className="input input-bordered input-xs w-full rounded-xl focus:input-primary h-9 text-xs"
                  value={formData.rpbiExpiresAt || ''}
                  onChange={handleChange}
                />
              </div>

              <div className="sm:col-span-2 pt-1">
                <DocumentScannerUploader
                  value={formData.sanitaryPermitUrl || ''}
                  onChange={(val) =>
                    setFormData((prev) => ({ ...prev, sanitaryPermitUrl: val }))
                  }
                  disabled={isLoading}
                />
              </div>
            </div>
          </div>

          {/* SECCIÓN 3: CONTACTO Y LOGOTIPO */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="form-control">
              <label className="label py-0.5">
                <span className="label-text text-[11px] font-semibold flex items-center gap-1">
                  <IconPhone className="w-3 h-3 text-base-content/60" /> Teléfono de Contacto
                </span>
              </label>
              <input
                type="tel"
                name="phone"
                placeholder="Ej. +52 33 1234 5678"
                className="input input-bordered input-xs w-full rounded-xl focus:input-primary h-9 text-xs"
                value={formData.phone || ''}
                onChange={handleChange}
              />
            </div>

            <div className="form-control">
              <label className="label py-0.5">
                <span className="label-text text-[11px] font-semibold flex items-center gap-1">
                  <IconMail className="w-3 h-3 text-base-content/60" /> Correo Institucional
                </span>
              </label>
              <input
                type="email"
                name="email"
                placeholder="contacto@laboratorio.com"
                className="input input-bordered input-xs w-full rounded-xl focus:input-primary h-9 text-xs"
                value={formData.email || ''}
                onChange={handleChange}
              />
            </div>

            <div className="form-control sm:col-span-2">
              <label className="label py-0.5">
                <span className="label-text text-[11px] font-semibold">URL del Logotipo Oficial (Opcional)</span>
              </label>
              <input
                type="url"
                name="logo"
                placeholder="Ej. https://ejemplo.com/logo.png"
                className="input input-bordered input-xs w-full rounded-xl focus:input-primary h-9 text-xs"
                value={formData.logo || ''}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Botones de Acción */}
          <div className="modal-action border-t border-base-200 pt-4 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-ghost btn-sm rounded-xl font-semibold"
              disabled={isLoading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn btn-primary text-primary-content font-bold rounded-xl gap-2 min-w-[160px] shadow-xs btn-sm"
              disabled={isLoading || Boolean(subscription?.usage?.isExceededLabs)}
            >
              {isLoading ? (
                <>
                  <span className="loading loading-spinner loading-xs"></span>
                  Procesando Alta...
                </>
              ) : subscription?.usage?.isExceededLabs ? (
                'Límite de Sedes Alcanzado'
              ) : (
                <>
                  <IconPlus className="w-4 h-4" />
                  Registrar Sede
                </>
              )}
            </button>
          </div>
        </form>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button onClick={onClose}>close</button>
      </form>

      {/* Modal para actualizar de plan si se alcanzó el límite */}
      <PlanSelectionModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        onPlanChanged={() => {
          api.get<UserSubscription>('/subscription/me')
            .then((res) => setSubscription(res.data))
            .catch((e) => console.warn(e));
        }}
      />
    </dialog>
  );
}
