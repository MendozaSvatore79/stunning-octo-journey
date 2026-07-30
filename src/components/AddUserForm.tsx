// src/components/AddUserForm.tsx componente user
import { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { useApi } from '../hooks/useApi';
import { useUserContext } from '../hooks/useUserContext';
import type { Laboratory } from '../types/lab';
import {
  IconUserPlus,
  IconFlask,
  IconCheckCircle,
  IconAlertCircle,
  IconBuilding,
  IconUsers,
} from './icons';

interface AddUserFormProps {
  labs: Laboratory[];
  onUserAdded?: () => void;
  onCancel?: () => void;
}

export default function AddUserForm({ labs, onUserAdded, onCancel }: AddUserFormProps) {
  const { user } = useUser();
  const api = useApi();
  const { userProfile, isAdmin } = useUserContext();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    role: 'TECH',
    laboratoryId: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [localLabs, setLocalLabs] = useState<Laboratory[]>(labs || []);
  const [isLoadingLabs, setIsLoadingLabs] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Cargar laboratorios si la lista viene vacía
  useEffect(() => {
    if (!labs || labs.length === 0) {
      setIsLoadingLabs(true);
      api.get<Laboratory[]>('/lab')
        .then((res) => {
          setLocalLabs(res.data || []);
        })
        .catch((err) => console.error('Error al cargar laboratorios:', err))
        .finally(() => setIsLoadingLabs(false));
    } else {
      setLocalLabs(labs);
    }
  }, [labs, api]);

  // Filtrar únicamente los laboratorios creados por el usuario propietario actualmente logueado
  const ownerLabs = localLabs.filter((lab) => {
    // Si la estructura del laboratorio no posee creador aún, mostrarlo por defecto
    if (!lab.createdById && !lab.createdBy) return true;

    const currentUserId = userProfile?.id;
    const currentClerkId = userProfile?.clerkId || user?.id;

    return (
      (lab.createdById && (lab.createdById === currentUserId || lab.createdById === currentClerkId)) ||
      (lab.createdBy?.id && lab.createdBy.id === currentUserId) ||
      (lab.createdBy?.clerkId && lab.createdBy.clerkId === currentClerkId)
    );
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email.trim()) {
      setErrorMsg('El correo electrónico es obligatorio.');
      return;
    }

    if (!formData.password.trim()) {
      setErrorMsg('Debes ingresar una contraseña para la cuenta del usuario.');
      return;
    }

    // Validación de seguridad: restringir la asignación del rol ADMIN a solo administradores
    if (!isAdmin && formData.role === 'ADMIN') {
      setErrorMsg('Solo los usuarios con rol de Administrador pueden asignar el rol de Administrador.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      // Preparar payload para la API POST /users
      const payload = {
        email: formData.email.trim(),
        password: formData.password.trim(),
        firstName: formData.firstName.trim() || undefined,
        lastName: formData.lastName.trim() || undefined,
        role: formData.role,
        laboratoryId: formData.laboratoryId || undefined,
      };

      await api.post('/users', payload);

      setSuccessMsg('¡Usuario registrado exitosamente en Clerk y en la base de datos!');
      
      // Limpiar formulario
      setFormData({
        email: '',
        password: '',
        firstName: '',
        lastName: '',
        role: 'TECH',
        laboratoryId: '',
      });

      if (onUserAdded) {
        onUserAdded();
      }
    } catch (err: any) {
      console.error('Error al registrar usuario:', err);
      const rawMsg = err?.response?.data?.message || err?.response?.data?.error || err?.message;
      let displayMsg = 'Ocurrió un error al registrar el usuario. Revisa los datos e intenta nuevamente.';
      if (typeof rawMsg === 'string') {
        displayMsg = rawMsg;
      } else if (Array.isArray(rawMsg)) {
        displayMsg = rawMsg.map((m) => (typeof m === 'object' ? (m.message || JSON.stringify(m)) : String(m))).join(', ');
      } else if (typeof rawMsg === 'object' && rawMsg !== null) {
        displayMsg = rawMsg.message || JSON.stringify(rawMsg);
      }
      setErrorMsg(displayMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Banner / Encabezado de la Sección */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-blue-600/10 via-indigo-500/10 to-base-100 p-6 rounded-3xl border border-blue-200/50">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-2xl shadow-lg shadow-blue-500/20 shrink-0">
            <IconUserPlus className="w-7 h-7" />
          </div>
          <div>
            <span className="badge badge-primary badge-outline text-xs font-semibold uppercase tracking-wider mb-1">
              Administración de Personal
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-base-content tracking-tight">
              Agregar Usuario al Laboratorio
            </h1>
            <p className="text-xs sm:text-sm text-base-content/70 mt-0.5">
              Crea la cuenta en Clerk y asigna al usuario a una de tus sedes operativas.
            </p>
          </div>
        </div>

        {onCancel && (
          <button onClick={onCancel} className="btn btn-ghost btn-sm rounded-xl font-semibold">
            Volver al Dashboard
          </button>
        )}
      </div>

      {/* Tarjeta del Formulario */}
      <div className="card bg-base-100 border border-base-200 shadow-xl rounded-3xl overflow-hidden">
        <div className="card-body p-6 sm:p-8">

          {/* Alertas de Éxito / Error */}
          {successMsg && (
            <div className="alert alert-success text-white shadow-md rounded-2xl py-3 mb-2 animate-fade-in">
              <IconCheckCircle className="w-6 h-6 shrink-0" />
              <div className="font-semibold text-sm">{successMsg}</div>
            </div>
          )}

          {errorMsg && (
            <div className="alert alert-error text-white shadow-md rounded-2xl py-3 mb-2 animate-fade-in">
              <IconAlertCircle className="w-6 h-6 shrink-0" />
              <div className="font-semibold text-sm">{errorMsg}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Sección 1: Información Personal y Credenciales */}
            <div>
              <h2 className="text-sm font-bold text-primary uppercase tracking-wider mb-4 flex items-center gap-2">
                <IconUsers className="w-4 h-4" /> 1. Credenciales y Datos del Usuario
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold">Correo Electrónico <span className="text-error">*</span></span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    placeholder="ejemplo@laboratorio.com"
                    className="input input-bordered w-full rounded-xl focus:input-primary transition-all"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold">
                      Contraseña <span className="text-error">*</span>
                    </span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      placeholder="Mínimo 8 caracteres"
                      className="input input-bordered w-full rounded-xl focus:input-primary transition-all pr-12"
                      value={formData.password}
                      onChange={handleChange}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-base-content/60 font-semibold hover:text-primary"
                    >
                      {showPassword ? 'Ocultar' : 'Ver'}
                    </button>
                  </div>
                  <span className="text-[11px] text-base-content/60 mt-1">
                    Contraseña inicial de acceso a la plataforma.
                  </span>
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold">Nombre(s)</span>
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    placeholder="Ej. Juan Carlos"
                    className="input input-bordered w-full rounded-xl focus:input-primary transition-all"
                    value={formData.firstName}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold">Apellido(s)</span>
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    placeholder="Ej. Mendoza"
                    className="input input-bordered w-full rounded-xl focus:input-primary transition-all"
                    value={formData.lastName}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>

            <div className="divider my-2"></div>

            {/* Sección 2: Rol y Laboratorio */}
            <div>
              <h2 className="text-sm font-bold text-primary uppercase tracking-wider mb-4 flex items-center gap-2">
                <IconBuilding className="w-4 h-4" /> 2. Rol y Asignación de Sede
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold">Rol del Sistema <span className="text-error">*</span></span>
                  </label>
                  <select
                    name="role"
                    className="select select-bordered w-full rounded-xl focus:select-primary transition-all font-medium"
                    value={formData.role}
                    onChange={handleChange}
                    required
                  >
                    <option value="TECH">Técnico (TECH) - Acceso Operativo Completo</option>
                    <option value="LAB_TECHNICIAN">Técnico de Laboratorio (LAB_TECHNICIAN)</option>
                    <option value="RECEPTIONIST">Recepcionista Clínico (RECEPTIONIST)</option>
                    {isAdmin && (
                      <option value="ADMIN">Administrador General (ADMIN)</option>
                    )}
                  </select>
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold flex items-center gap-1.5">
                      <IconFlask className="w-4 h-4 text-blue-600" /> Laboratorio Asignado
                    </span>
                  </label>
                  {isLoadingLabs ? (
                    <div className="skeleton h-12 w-full rounded-xl"></div>
                  ) : (
                    <select
                      name="laboratoryId"
                      className="select select-bordered w-full rounded-xl focus:select-primary transition-all font-medium"
                      value={formData.laboratoryId}
                      onChange={handleChange}
                    >
                      <option value="">-- Sin Laboratorio Asignado (General) --</option>
                      {ownerLabs.map((lab) => (
                        <option key={lab.id} value={lab.id}>
                          {lab.name} {[lab.city, lab.country].filter(Boolean).length ? `(${[lab.city, lab.country].filter(Boolean).join(', ')})` : ''}
                        </option>
                      ))}
                    </select>
                  )}
                  {ownerLabs.length === 0 && !isLoadingLabs && (
                    <span className="text-[11px] text-warning mt-1">
                      No has creado laboratorios aún. Crea una sede para poder asignarla.
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Acciones del Formulario */}
            <div className="pt-4 flex items-center justify-end gap-3 border-t border-base-200">
              {onCancel && (
                <button
                  type="button"
                  onClick={onCancel}
                  className="btn btn-ghost rounded-xl font-semibold"
                  disabled={isSubmitting}
                >
                  Cancelar
                </button>
              )}

              <button
                type="submit"
                className="btn btn-primary text-primary-content font-bold rounded-xl gap-2 min-w-[160px] shadow-lg shadow-primary/25 hover:scale-[1.02] transition-all"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <span className="loading loading-spinner loading-sm"></span>
                    Creando Usuario...
                  </>
                ) : (
                  <>
                    <IconUserPlus className="w-5 h-5" />
                    Registrar Usuario
                  </>
                )}
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
}
