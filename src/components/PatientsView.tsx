// src/components/PatientsView.tsx
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useApi } from '../hooks/useApi';
import type { Patient, CreatePatientDto } from '../types/patient';
import {
  IconUsers,
  IconUserPlus,
  IconFolder,
  IconCheckCircle,
  IconAlertCircle,
  IconTrash,
  IconClipboardList,
  IconFlask,
  IconCalendar,
  IconMail,
  IconPhone,
} from './icons';

interface PatientsViewProps {
  initialTab?: 'directory' | 'register' | 'history';
}

export default function PatientsView({ initialTab = 'directory' }: PatientsViewProps) {
  const api = useApi();
  const [activeTab, setActiveTab] = useState<'directory' | 'register' | 'history'>(initialTab);
  
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isLoadingPatients, setIsLoadingPatients] = useState(true);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  const [searchTerm, setSearchTerm] = useState('');

  // Estado del Formulario de Registro
  const [formData, setFormData] = useState<CreatePatientDto>({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    gender: 'M',
    phone: '',
    email: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Sincronizar pestaña inicial si cambia desde las props del Sidebar
  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  // Cargar lista de pacientes desde GET /patients
  const fetchPatients = useCallback(async () => {
    setIsLoadingPatients(true);
    try {
      const res = await api.get<Patient[]>('/patients');
      const data = res.data || [];
      setPatients(data);
      if (data.length > 0 && !selectedPatient) {
        setSelectedPatient(data[0]);
      }
    } catch (err) {
      console.error('Error al cargar pacientes:', err);
    } finally {
      setIsLoadingPatients(false);
    }
  }, [api, selectedPatient]);

  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

  // Búsqueda filtrada de pacientes
  const filteredPatients = useMemo(() => {
    return patients.filter((p) => {
      const fullName = `${p.firstName} ${p.lastName}`.toLowerCase();
      const query = searchTerm.toLowerCase();
      return (
        fullName.includes(query) ||
        (p.email && p.email.toLowerCase().includes(query)) ||
        (p.phone && p.phone.includes(query)) ||
        (p.id && p.id.toLowerCase().includes(query))
      );
    });
  }, [patients, searchTerm]);

  // Manejo de cambios en el formulario
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Guardar nuevo paciente (POST /patients)
  const handleSubmitPatient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      setErrorMsg('Nombre y Apellido son obligatorios.');
      return;
    }
    if (!formData.dateOfBirth) {
      setErrorMsg('La fecha de nacimiento es obligatoria.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const payload = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        dateOfBirth: formData.dateOfBirth,
        gender: formData.gender,
        phone: formData.phone?.trim() || undefined,
        email: formData.email?.trim() || undefined,
      };

      const res = await api.post<Patient>('/patients', payload);
      setSuccessMsg(`¡Paciente ${res.data.firstName} ${res.data.lastName} registrado con éxito!`);
      
      setFormData({
        firstName: '',
        lastName: '',
        dateOfBirth: '',
        gender: 'M',
        phone: '',
        email: '',
      });

      fetchPatients();
    } catch (err: any) {
      console.error('Error al registrar paciente:', err);
      const rawMsg = err?.response?.data?.message || err?.message;
      setErrorMsg(Array.isArray(rawMsg) ? rawMsg.join(', ') : rawMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Eliminar paciente (DELETE /patients/:id)
  const handleDeletePatient = async (id: string, name: string) => {
    if (!confirm(`¿Estás seguro de eliminar el expediente del paciente "${name}"?`)) return;
    try {
      await api.delete(`/patients/${id}`);
      setPatients((prev) => prev.filter((p) => p.id !== id));
      if (selectedPatient?.id === id) {
        setSelectedPatient(null);
      }
    } catch (err) {
      console.error('Error al eliminar paciente:', err);
      alert('No se pudo eliminar el paciente. Intenta de nuevo.');
    }
  };

  // Calcular edad a partir de la fecha de nacimiento
  const calculateAge = (dobString?: string) => {
    if (!dobString) return 'N/A';
    const dob = new Date(dobString);
    const diffMs = Date.now() - dob.getTime();
    const ageDate = new Date(diffMs);
    return Math.abs(ageDate.getUTCFullYear() - 1970);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Encabezado y Pestañas Navegables */}
      <section className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-base-100 p-6 rounded-3xl border border-base-200 shadow-sm">
        <div>
          <div className="badge badge-primary badge-outline text-xs font-semibold mb-1">
            <IconUsers className="w-3.5 h-3.5 mr-1" />
            Módulo de Expedientes Médicos
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-base-content tracking-tight">
            Gestión de Pacientes
          </h1>
          <p className="text-xs sm:text-sm text-base-content/70 mt-0.5">
            Directorio de historiales clínicos, alta de expedientes y seguimiento de análisis.
          </p>
        </div>

        {/* Control de Pestañas DaisyUI */}
        <div className="tabs tabs-boxed bg-base-200 p-1.5 rounded-2xl">
          <button
            onClick={() => setActiveTab('directory')}
            className={`tab rounded-xl font-bold gap-2 text-xs sm:text-sm ${
              activeTab === 'directory' ? 'tab-active bg-primary text-primary-content shadow-sm' : ''
            }`}
          >
            <IconUsers className="w-4 h-4" />
            Directorio
          </button>

          <button
            onClick={() => setActiveTab('register')}
            className={`tab rounded-xl font-bold gap-2 text-xs sm:text-sm ${
              activeTab === 'register' ? 'tab-active bg-primary text-primary-content shadow-sm' : ''
            }`}
          >
            <IconUserPlus className="w-4 h-4" />
            Registrar Paciente
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`tab rounded-xl font-bold gap-2 text-xs sm:text-sm ${
              activeTab === 'history' ? 'tab-active bg-primary text-primary-content shadow-sm' : ''
            }`}
          >
            <IconFolder className="w-4 h-4" />
            Historial Clínico
          </button>
        </div>
      </section>

      {/* CONTENIDO 1: DIRECTORIO DE PACIENTES */}
      {activeTab === 'directory' && (
        <section className="space-y-6">
          
          {/* Barra de Búsqueda y Estadísticas */}
          <div className="card bg-base-100 border border-base-200 p-4 sm:p-5 rounded-3xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Buscar paciente por nombre, correo, teléfono o folio ID..."
                className="input input-bordered w-full rounded-2xl pl-11 focus:input-primary transition-all text-sm font-medium"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <svg
                className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-base-content/40"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            <button
              onClick={() => setActiveTab('register')}
              className="btn btn-primary text-primary-content font-bold rounded-2xl gap-2 shadow-md hover:scale-[1.02] transition-all shrink-0"
            >
              <IconUserPlus className="w-5 h-5" />
              Nuevo Paciente
            </button>
          </div>

          {/* Tabla de Pacientes */}
          {isLoadingPatients ? (
            <div className="skeleton h-64 w-full rounded-3xl"></div>
          ) : filteredPatients.length === 0 ? (
            <div className="card bg-base-100 border-2 border-dashed border-base-300 p-12 text-center rounded-3xl">
              <div className="mx-auto w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-3">
                <IconUsers className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-base-content mb-1">No se encontraron pacientes</h3>
              <p className="text-xs text-base-content/60 max-w-md mx-auto mb-4">
                {searchTerm
                  ? `No hay coincidencias para "${searchTerm}".`
                  : 'Aún no hay pacientes registrados en la plataforma.'}
              </p>
              <button
                onClick={() => setActiveTab('register')}
                className="btn btn-primary text-primary-content font-bold rounded-xl gap-2 mx-auto"
              >
                <IconUserPlus className="w-4 h-4" />
                Registrar Primer Paciente
              </button>
            </div>
          ) : (
            <div className="card bg-base-100 border border-base-200 shadow-md rounded-3xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="table table-zebra w-full text-sm">
                  <thead>
                    <tr className="bg-base-200/60 text-base-content/70">
                      <th className="font-bold">Paciente</th>
                      <th className="font-bold">Edad / Nacimiento</th>
                      <th className="font-bold">Género</th>
                      <th className="font-bold">Contacto</th>
                      <th className="font-bold text-center">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPatients.map((patient) => (
                      <tr key={patient.id} className="hover:bg-base-200/40">
                        <td>
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-black flex items-center justify-center text-base shadow-sm shrink-0">
                              {patient.firstName.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-bold text-base-content text-base">
                                {patient.firstName} {patient.lastName}
                              </div>
                              <span className="text-[11px] text-base-content/50 font-mono">
                                ID: {patient.id.slice(0, 8)}...
                              </span>
                            </div>
                          </div>
                        </td>

                        <td>
                          <div className="text-xs font-semibold text-base-content">
                            {calculateAge(patient.dateOfBirth)} años
                          </div>
                          <div className="text-[11px] text-base-content/60">
                            {new Date(patient.dateOfBirth).toLocaleDateString()}
                          </div>
                        </td>

                        <td>
                          <span className={`badge text-xs font-semibold rounded-lg ${
                            patient.gender === 'M' ? 'badge-info text-info-content' : patient.gender === 'F' ? 'badge-secondary text-secondary-content' : 'badge-ghost'
                          }`}>
                            {patient.gender === 'M' ? 'Masculino' : patient.gender === 'F' ? 'Femenino' : 'Otro'}
                          </span>
                        </td>

                        <td>
                          <div className="space-y-0.5 text-xs text-base-content/80">
                            {patient.phone && (
                              <div className="flex items-center gap-1">
                                <IconPhone className="w-3.5 h-3.5 text-base-content/50" />
                                {patient.phone}
                              </div>
                            )}
                            {patient.email && (
                              <div className="flex items-center gap-1 text-base-content/70">
                                <IconMail className="w-3.5 h-3.5 text-base-content/50" />
                                {patient.email}
                              </div>
                            )}
                            {!patient.phone && !patient.email && (
                              <span className="text-base-content/40 text-[11px]">Sin contacto</span>
                            )}
                          </div>
                        </td>

                        <td className="text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => {
                                setSelectedPatient(patient);
                                setActiveTab('history');
                              }}
                              className="btn btn-sm btn-outline btn-primary rounded-xl gap-1 text-xs font-bold"
                            >
                              <IconFolder className="w-4 h-4" /> Historial
                            </button>

                            <button
                              onClick={() => handleDeletePatient(patient.id, `${patient.firstName} ${patient.lastName}`)}
                              className="btn btn-sm btn-ghost text-error hover:bg-error/10 rounded-xl"
                              title="Eliminar Expediente"
                            >
                              <IconTrash className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>
      )}

      {/* CONTENIDO 2: REGISTRAR NUEVO PACIENTE */}
      {activeTab === 'register' && (
        <section className="card bg-base-100 border border-base-200 shadow-xl rounded-3xl p-6 sm:p-8 max-w-4xl mx-auto">
          <div className="border-b border-base-200 pb-4 mb-6">
            <h2 className="text-2xl font-black text-base-content flex items-center gap-2">
              <IconUserPlus className="w-6 h-6 text-primary" />
              Alta de Nuevo Expediente de Paciente
            </h2>
            <p className="text-xs text-base-content/60">
              Ingresa los datos personales del paciente para crear su historial clínico en el sistema.
            </p>
          </div>

          {successMsg && (
            <div className="alert alert-success text-white shadow-md rounded-2xl py-3 mb-4 animate-fade-in">
              <IconCheckCircle className="w-6 h-6 shrink-0" />
              <div className="font-semibold text-sm">{successMsg}</div>
            </div>
          )}

          {errorMsg && (
            <div className="alert alert-error text-white shadow-md rounded-2xl py-3 mb-4 animate-fade-in">
              <IconAlertCircle className="w-6 h-6 shrink-0" />
              <div className="font-semibold text-sm">{errorMsg}</div>
            </div>
          )}

          <form onSubmit={handleSubmitPatient} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">Nombre(s) <span className="text-error">*</span></span>
                </label>
                <input
                  type="text"
                  name="firstName"
                  placeholder="Ej. María Fernanda"
                  className="input input-bordered w-full rounded-xl focus:input-primary transition-all"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">Apellido(s) <span className="text-error">*</span></span>
                </label>
                <input
                  type="text"
                  name="lastName"
                  placeholder="Ej. López Gómez"
                  className="input input-bordered w-full rounded-xl focus:input-primary transition-all"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold flex items-center gap-1.5">
                    <IconCalendar className="w-4 h-4 text-base-content/60" /> Fecha de Nacimiento <span className="text-error">*</span>
                  </span>
                </label>
                <input
                  type="date"
                  name="dateOfBirth"
                  className="input input-bordered w-full rounded-xl focus:input-primary transition-all"
                  value={formData.dateOfBirth}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">Género <span className="text-error">*</span></span>
                </label>
                <select
                  name="gender"
                  className="select select-bordered w-full rounded-xl focus:select-primary transition-all font-medium"
                  value={formData.gender}
                  onChange={handleInputChange}
                  required
                >
                  <option value="M">Masculino</option>
                  <option value="F">Femenino</option>
                  <option value="OTHER">Otro / No especificado</option>
                </select>
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold flex items-center gap-1.5">
                    <IconPhone className="w-4 h-4 text-base-content/60" /> Teléfono
                  </span>
                </label>
                <input
                  type="tel"
                  name="phone"
                  placeholder="Ej. +52 55 1234 5678"
                  className="input input-bordered w-full rounded-xl focus:input-primary transition-all"
                  value={formData.phone || ''}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold flex items-center gap-1.5">
                    <IconMail className="w-4 h-4 text-base-content/60" /> Correo Electrónico
                  </span>
                </label>
                <input
                  type="email"
                  name="email"
                  placeholder="ejemplo@paciente.com"
                  className="input input-bordered w-full rounded-xl focus:input-primary transition-all"
                  value={formData.email || ''}
                  onChange={handleInputChange}
                />
              </div>

            </div>

            <div className="pt-4 border-t border-base-200 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setActiveTab('directory')}
                className="btn btn-ghost rounded-xl font-semibold"
                disabled={isSubmitting}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="btn btn-primary text-primary-content font-bold rounded-xl gap-2 min-w-[160px]"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <span className="loading loading-spinner loading-sm"></span>
                    Guardando...
                  </>
                ) : (
                  <>
                    <IconUserPlus className="w-5 h-5" />
                    Registrar Paciente
                  </>
                )}
              </button>
            </div>
          </form>
        </section>
      )}

      {/* CONTENIDO 3: HISTORIAL CLÍNICO */}
      {activeTab === 'history' && (
        <section className="space-y-6">
          
          {/* Selector de Paciente */}
          <div className="card bg-base-100 border border-base-200 p-6 rounded-3xl shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-base-content flex items-center gap-2">
                  <IconFolder className="w-5 h-5 text-primary" />
                  Expediente Clínico Seleccionado
                </h2>
                <p className="text-xs text-base-content/60">
                  Selecciona un paciente de la lista para explorar sus análisis y órdenes clínicas.
                </p>
              </div>

              <select
                className="select select-bordered w-full sm:w-80 rounded-xl focus:select-primary font-semibold text-sm"
                value={selectedPatient?.id || ''}
                onChange={(e) => {
                  const p = patients.find((pat) => pat.id === e.target.value);
                  if (p) setSelectedPatient(p);
                }}
              >
                <option value="" disabled>-- Selecciona un Paciente --</option>
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.firstName} {p.lastName} (ID: {p.id.slice(0, 6)}...)
                  </option>
                ))}
              </select>
            </div>

            {/* Resumen del Paciente Seleccionado */}
            {selectedPatient ? (
              <div className="bg-gradient-to-r from-blue-600/10 via-indigo-500/10 to-base-100 p-6 rounded-2xl border border-blue-200/50 grid grid-cols-1 sm:grid-cols-4 gap-4 mt-2">
                <div>
                  <span className="text-[11px] font-bold text-base-content/50 uppercase">Nombre Completo</span>
                  <div className="font-bold text-base text-base-content">{selectedPatient.firstName} {selectedPatient.lastName}</div>
                </div>

                <div>
                  <span className="text-[11px] font-bold text-base-content/50 uppercase">Edad / Nacimiento</span>
                  <div className="font-semibold text-sm text-base-content">
                    {calculateAge(selectedPatient.dateOfBirth)} años ({new Date(selectedPatient.dateOfBirth).toLocaleDateString()})
                  </div>
                </div>

                <div>
                  <span className="text-[11px] font-bold text-base-content/50 uppercase">Contacto</span>
                  <div className="font-semibold text-sm text-base-content truncate">
                    {selectedPatient.phone || selectedPatient.email || 'Sin contacto'}
                  </div>
                </div>

                <div>
                  <span className="text-[11px] font-bold text-base-content/50 uppercase">Total de Órdenes</span>
                  <div className="font-black text-lg text-primary">
                    {selectedPatient.workOrders?.length || 0} Historiales
                  </div>
                </div>
              </div>
            ) : (
              <div className="alert alert-warning text-xs rounded-xl py-3">
                <IconAlertCircle className="w-5 h-5" />
                <span>Selecciona o registra un paciente para ver su historial clínico.</span>
              </div>
            )}
          </div>

          {/* Historial de Órdenes de Trabajo del Paciente */}
          {selectedPatient && (
            <div className="card bg-base-100 border border-base-200 shadow-md p-6 rounded-3xl space-y-4">
              <h3 className="text-base font-bold text-base-content flex items-center gap-2">
                <IconClipboardList className="w-5 h-5 text-accent" />
                Órdenes de Trabajo y Estudios Analíticos
              </h3>

              {!selectedPatient.workOrders || selectedPatient.workOrders.length === 0 ? (
                <div className="p-8 text-center border-2 border-dashed border-base-200 rounded-2xl">
                  <IconFlask className="w-8 h-8 text-base-content/30 mx-auto mb-2" />
                  <p className="text-xs text-base-content/60 font-semibold">
                    El paciente no cuenta con órdenes de trabajo o estudios analíticos registrados aún.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {selectedPatient.workOrders.map((order: any) => (
                    <div key={order.id} className="border border-base-200 p-4 rounded-2xl bg-base-200/30 flex flex-col sm:flex-row justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="badge badge-primary font-mono text-xs">Folio #{order.folio || order.id.slice(0, 6)}</span>
                          <span className="badge badge-outline text-xs">{order.status || 'PENDIENTE'}</span>
                        </div>
                        <p className="text-xs text-base-content/70 mt-2 font-medium">
                          Sede: <strong>{order.laboratory?.name || 'Sede Central'}</strong>
                        </p>
                        <p className="text-[11px] text-base-content/50 mt-0.5">
                          Fecha: {new Date(order.createdAt).toLocaleString()}
                        </p>
                      </div>

                      <div className="text-right flex flex-col justify-between">
                        <span className="text-xs font-bold text-primary">
                          {order.analyses?.length || 0} Estudios procesados
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </section>
      )}

    </div>
  );
}
