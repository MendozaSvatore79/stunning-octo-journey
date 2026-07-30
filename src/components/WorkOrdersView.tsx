// src/components/WorkOrdersView.tsx
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useApi } from '../hooks/useApi';
import type { Patient } from '../types/patient';
import type { Laboratory } from '../types/lab';
import type { ClinicalAnalysis, WorkOrder, CreateOrderDto } from '../types/order';
import CaptureResultsModal from './CaptureResultsModal';
import MedicalReportPDF from './MedicalReportPDF';
import {
  IconClipboardList,
  IconUsers,
  IconUserPlus,
  IconFlask,
  IconBuilding,
  IconPlus,
  IconTrash,
  IconPrinter,
  IconCheckCircle,
  IconAlertCircle,
  IconX,
} from './icons';

interface WorkOrdersViewProps {
  initialTab?: 'create' | 'pending' | 'completed';
}

export default function WorkOrdersView({ initialTab = 'create' }: WorkOrdersViewProps) {
  const api = useApi();
  const [activeTab, setActiveTab] = useState<'create' | 'pending' | 'completed'>(initialTab);

  // Datos cargados de la base de datos
  const [patients, setPatients] = useState<Patient[]>([]);
  const [labs, setLabs] = useState<Laboratory[]>([]);
  const [studies, setStudies] = useState<ClinicalAnalysis[]>([]);
  const [orders, setOrders] = useState<WorkOrder[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  // Selección de Formulario de la Orden
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [selectedLabId, setSelectedLabId] = useState('');
  const [doctorName, setDoctorName] = useState('Dr. Médico A Cargo');
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [selectedStudyId, setSelectedStudyId] = useState('');
  const [selectedStudiesList, setSelectedStudiesList] = useState<ClinicalAnalysis[]>([]);

  // Estados de interfaz y modales
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [createdOrderTicket, setCreatedOrderTicket] = useState<WorkOrder | null>(null);
  const [isQuickPatientOpen, setIsQuickPatientOpen] = useState(false);

  // Estados para modal de Captura de Resultados y PDF Oficial
  const [selectedOrderForCapture, setSelectedOrderForCapture] = useState<WorkOrder | null>(null);
  const [selectedOrderForPDF, setSelectedOrderForPDF] = useState<WorkOrder | null>(null);

  // Formulario rápido para nuevo paciente
  const [quickPatientData, setQuickPatientData] = useState({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    gender: 'M',
    phone: '',
    email: '',
  });

  // Sincronizar pestaña inicial
  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  // Cargar catálogos completos desde el backend
  const loadInitialData = useCallback(async () => {
    setIsLoadingData(true);
    setErrorMsg(null);
    try {
      const [resPatients, resLabs, resStudies, resOrders] = await Promise.allSettled([
        api.get<Patient[]>('/patients'),
        api.get<Laboratory[]>('/lab'),
        api.get<ClinicalAnalysis[]>('/analysis'),
        api.get<WorkOrder[]>('/orders'),
      ]);

      const loadedPatients = resPatients.status === 'fulfilled' ? (resPatients.value.data || []) : [];
      const loadedLabs = resLabs.status === 'fulfilled' ? (resLabs.value.data || []) : [];
      const loadedStudies = resStudies.status === 'fulfilled' ? (resStudies.value.data || []) : [];
      const loadedOrders = resOrders.status === 'fulfilled' ? (resOrders.value.data || []) : [];

      setPatients(loadedPatients);
      setLabs(loadedLabs);
      setStudies(loadedStudies);
      setOrders(loadedOrders);

      if (loadedPatients.length > 0 && !selectedPatientId) {
        setSelectedPatientId(loadedPatients[0].id);
      }
      if (loadedLabs.length > 0 && !selectedLabId) {
        setSelectedLabId(loadedLabs[0].id);
      }
      if (loadedStudies.length > 0 && !selectedStudyId) {
        setSelectedStudyId(loadedStudies[0].id);
      }
    } catch (err) {
      console.error('Error al cargar datos de órdenes:', err);
    } finally {
      setIsLoadingData(false);
    }
  }, [api, selectedPatientId, selectedLabId, selectedStudyId]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // Paciente seleccionado actualmente
  const currentPatient = useMemo(() => {
    return patients.find((p) => p.id === selectedPatientId) || null;
  }, [patients, selectedPatientId]);

  // Edad del paciente seleccionado
  const patientAge = useMemo(() => {
    if (!currentPatient?.dateOfBirth) return 'N/A';
    const dob = new Date(currentPatient.dateOfBirth);
    const diff = Date.now() - dob.getTime();
    return Math.abs(new Date(diff).getUTCFullYear() - 1970);
  }, [currentPatient]);

  // Agregar estudio seleccionado a la lista de la orden
  const handleAddStudy = () => {
    if (!selectedStudyId) return;
    const studyObj = studies.find((s) => s.id === selectedStudyId);
    if (!studyObj) return;

    if (selectedStudiesList.some((s) => s.id === studyObj.id)) {
      alert('Este estudio ya ha sido agregado a la lista.');
      return;
    }

    setSelectedStudiesList((prev) => [...prev, studyObj]);
  };

  // Quitar estudio de la lista
  const handleRemoveStudy = (id: string) => {
    setSelectedStudiesList((prev) => prev.filter((s) => s.id !== id));
  };

  // Cálculos Financieros en Tiempo Real
  const subtotal = useMemo(() => {
    return selectedStudiesList.reduce((sum, item) => sum + (item.price || 0), 0);
  }, [selectedStudiesList]);

  const discountAmount = useMemo(() => {
    return (subtotal * discountPercent) / 100;
  }, [subtotal, discountPercent]);

  const totalAmount = useMemo(() => {
    return Math.max(0, subtotal - discountAmount);
  }, [subtotal, discountAmount]);

  // Crear Orden de Trabajo (POST /orders)
  const handleCreateOrder = async () => {
    if (!selectedPatientId) {
      setErrorMsg('Debes seleccionar un paciente obligatoriamente.');
      return;
    }
    if (!selectedLabId) {
      setErrorMsg('Debes seleccionar una sede o laboratorio.');
      return;
    }
    if (selectedStudiesList.length === 0) {
      setErrorMsg('Debes agregar al menos un estudio clínico a la orden de trabajo.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const payload: CreateOrderDto = {
        patientId: selectedPatientId,
        laboratoryId: selectedLabId,
        doctorName: doctorName.trim() || undefined,
        discountPercent: discountPercent,
        analysisIds: selectedStudiesList.map((s) => s.id),
      };

      const res = await api.post<WorkOrder>('/orders', payload);
      setSuccessMsg(`¡Orden de Trabajo #${res.data.folio || res.data.id.slice(0, 6)} creada exitosamente!`);
      setCreatedOrderTicket(res.data);

      setSelectedStudiesList([]);
      setDiscountPercent(0);

      loadInitialData();
    } catch (err: any) {
      console.error('Error al crear la orden:', err);
      const rawMsg = err?.response?.data?.message || err?.message;
      setErrorMsg(Array.isArray(rawMsg) ? rawMsg.join(', ') : rawMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Crear paciente rápido desde el modal inline
  const handleCreateQuickPatient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickPatientData.firstName || !quickPatientData.lastName || !quickPatientData.dateOfBirth) {
      alert('Nombre, Apellido y Fecha de Nacimiento son obligatorios.');
      return;
    }

    try {
      const res = await api.post<Patient>('/patients', quickPatientData);
      setPatients((prev) => [res.data, ...prev]);
      setSelectedPatientId(res.data.id);
      setIsQuickPatientOpen(false);
      setQuickPatientData({
        firstName: '',
        lastName: '',
        dateOfBirth: '',
        gender: 'M',
        phone: '',
        email: '',
      });
    } catch (err) {
      console.error('Error al registrar paciente rápido:', err);
      alert('No se pudo registrar el paciente. Intenta de nuevo.');
    }
  };

  // Órdenes filtradas por estado
  const pendingOrders = useMemo(() => orders.filter((o) => o.status === 'PENDING'), [orders]);
  const completedOrders = useMemo(() => orders.filter((o) => o.status === 'COMPLETED'), [orders]);

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Barra de Acciones de Impresión Superior (Ficha de Paciente) */}
      <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-base-100 p-5 rounded-3xl border border-base-200 shadow-sm">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-base-content tracking-tight">
            Ficha de Paciente y Hoja de Trabajo
          </h1>
          <p className="text-xs text-base-content/60 mt-0.5">
            Generación de órdenes clínicas, captura de resultados e impresión de PDFs oficiales.
          </p>
        </div>

        {/* Botones de Acción Superiores */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => window.print()}
            className="btn btn-sm btn-slate bg-slate-800 text-white hover:bg-slate-900 border-none font-bold rounded-xl gap-1.5 text-xs"
          >
            <IconPrinter className="w-4 h-4" />
            Imprimir Etiquetas
          </button>

          <button
            onClick={() => {
              if (orders.length > 0) setCreatedOrderTicket(orders[0]);
              else alert('Aún no hay órdenes generadas para reimprimir.');
            }}
            className="btn btn-sm bg-slate-700 text-white hover:bg-slate-800 border-none font-bold rounded-xl gap-1.5 text-xs"
          >
            <IconPrinter className="w-4 h-4" />
            Re-Imprimir Comprobante
          </button>

          <button
            onClick={() => {
              if (completedOrders.length > 0) setSelectedOrderForPDF(completedOrders[0]);
              else alert('No hay órdenes completadas para imprimir resultados.');
            }}
            className="btn btn-sm bg-slate-800 text-white hover:bg-slate-900 border-none font-bold rounded-xl gap-1.5 text-xs"
          >
            <IconPrinter className="w-4 h-4" />
            Imprimir Resultados PDF
          </button>
        </div>
      </section>

      {/* Control de Pestañas */}
      <div className="tabs tabs-boxed bg-base-200 p-1.5 rounded-2xl max-w-md">
        <button
          onClick={() => setActiveTab('create')}
          className={`tab rounded-xl font-bold gap-2 text-xs sm:text-sm ${
            activeTab === 'create' ? 'tab-active bg-primary text-primary-content shadow-sm' : ''
          }`}
        >
          <IconClipboardList className="w-4 h-4" />
          Crear Orden de Trabajo
        </button>

        <button
          onClick={() => setActiveTab('pending')}
          className={`tab rounded-xl font-bold gap-2 text-xs sm:text-sm ${
            activeTab === 'pending' ? 'tab-active bg-primary text-primary-content shadow-sm' : ''
          }`}
        >
          Pendientes ({pendingOrders.length})
        </button>

        <button
          onClick={() => setActiveTab('completed')}
          className={`tab rounded-xl font-bold gap-2 text-xs sm:text-sm ${
            activeTab === 'completed' ? 'tab-active bg-primary text-primary-content shadow-sm' : ''
          }`}
        >
          Completadas ({completedOrders.length})
        </button>
      </div>

      {/* ALERTAS */}
      {successMsg && (
        <div className="alert alert-success text-white shadow-md rounded-2xl py-3 animate-fade-in">
          <IconCheckCircle className="w-6 h-6 shrink-0" />
          <div className="font-semibold text-sm">{successMsg}</div>
        </div>
      )}

      {errorMsg && (
        <div className="alert alert-error text-white shadow-md rounded-2xl py-3 animate-fade-in">
          <IconAlertCircle className="w-6 h-6 shrink-0" />
          <div className="font-semibold text-sm">{errorMsg}</div>
        </div>
      )}

      {/* INDICADOR DE CARGA DE BD */}
      {isLoadingData && (
        <div className="card bg-base-100 border border-base-200 p-12 text-center rounded-3xl flex flex-col items-center justify-center gap-3 shadow-sm">
          <span className="loading loading-spinner loading-lg text-primary"></span>
          <p className="text-sm font-semibold text-base-content/70">
            Cargando catálogos de pacientes, sedes y estudios clínicos desde la base de datos...
          </p>
        </div>
      )}

      {/* PESTAÑA 1: FORMULARIO DE FICHA DE PACIENTE Y CREACIÓN DE ORDEN */}
      {!isLoadingData && activeTab === 'create' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* COLUMNA IZQUIERDA: PACIENTE, MÉDICO Y SEDE (7 Cols) */}
          <div className="lg:col-span-7 space-y-6">
            <div className="card bg-base-100 border border-base-200 shadow-xl rounded-3xl p-6 space-y-5">
              
              <h2 className="text-base font-black text-primary uppercase tracking-wider flex items-center gap-2 border-b border-base-200 pb-3">
                <IconUsers className="w-5 h-5" /> 1. Datos del Paciente y Médico Tratante
              </h2>

              {/* Campo Paciente con Select y Botón Agregar */}
              <div className="space-y-2">
                <label className="label py-0">
                  <span className="label-text font-bold text-sm">
                    Paciente: <span className="text-error">*</span>
                  </span>
                </label>
                <div className="flex gap-2">
                  <select
                    className="select select-bordered w-full rounded-2xl focus:select-primary font-semibold text-sm"
                    value={selectedPatientId}
                    onChange={(e) => setSelectedPatientId(e.target.value)}
                  >
                    <option value="" disabled>-- Selecciona un Paciente de la BD --</option>
                    {patients.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.firstName} {p.lastName}
                      </option>
                    ))}
                  </select>

                  <button
                    onClick={() => setIsQuickPatientOpen(true)}
                    className="btn btn-primary text-white font-bold rounded-2xl gap-1 shrink-0 shadow-md"
                    title="Agregar Nuevo Paciente a la BD"
                  >
                    <IconPlus className="w-4 h-4" />
                    Agregar
                  </button>
                </div>

                {/* Info en Tiempo Real del Paciente Seleccionado */}
                {currentPatient ? (
                  <div className="bg-base-200/60 p-3.5 rounded-2xl border border-base-200 grid grid-cols-3 gap-2 text-xs font-semibold mt-2">
                    <div>
                      <span className="text-base-content/50 block text-[10px] font-bold uppercase">Edad:</span>
                      <span className="text-base-content text-sm">{patientAge} años</span>
                    </div>

                    <div>
                      <span className="text-base-content/50 block text-[10px] font-bold uppercase">Género:</span>
                      <span className="text-base-content text-sm">
                        {currentPatient.gender === 'M' ? 'Masculino' : currentPatient.gender === 'F' ? 'Femenino' : 'Otro'}
                      </span>
                    </div>

                    <div>
                      <span className="text-base-content/50 block text-[10px] font-bold uppercase">No. Telefónico:</span>
                      <span className="text-base-content text-sm">{currentPatient.phone || 'Sin número'}</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-warning font-medium mt-1">
                    No hay paciente seleccionado. Elige uno o crea uno nuevo.
                  </div>
                )}
              </div>

              {/* Campo Médico Tratante con Botón Agregar */}
              <div className="space-y-2">
                <label className="label py-0">
                  <span className="label-text font-bold text-sm">
                    Médico: <span className="text-error">*</span>
                  </span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Escribe el nombre del médico tratante"
                    className="input input-bordered w-full rounded-2xl focus:input-primary transition-all font-medium text-sm"
                    value={doctorName}
                    onChange={(e) => setDoctorName(e.target.value)}
                  />
                  <button
                    onClick={() => setDoctorName('Dr. Sanatorio Particular')}
                    className="btn btn-primary text-white font-bold rounded-2xl gap-1 shrink-0 shadow-md"
                  >
                    <IconPlus className="w-4 h-4" />
                    Agregar
                  </button>
                </div>
              </div>

              {/* Campo Sede / Laboratorio */}
              <div className="space-y-2">
                <label className="label py-0">
                  <span className="label-text font-bold text-sm flex items-center gap-1.5">
                    <IconBuilding className="w-4 h-4 text-blue-600" /> Sede de Atención / Laboratorio:
                  </span>
                </label>
                <select
                  className="select select-bordered w-full rounded-2xl focus:select-primary font-semibold text-sm"
                  value={selectedLabId}
                  onChange={(e) => setSelectedLabId(e.target.value)}
                >
                  <option value="" disabled>-- Seleccionar Sede --</option>
                  {labs.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name} {[l.city, l.country].filter(Boolean).length ? `(${[l.city, l.country].filter(Boolean).join(', ')})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Campo Descuento */}
              <div className="space-y-2">
                <label className="label py-0">
                  <span className="label-text font-bold text-sm">Descuento:</span>
                </label>
                <select
                  className="select select-bordered w-full rounded-2xl focus:select-primary font-semibold text-sm"
                  value={discountPercent}
                  onChange={(e) => setDiscountPercent(Number(e.target.value))}
                >
                  <option value={0}>Selecciona un Descuento (0%)</option>
                  <option value={5}>Descuento Especial (5%)</option>
                  <option value={10}>Convenio Médico (10%)</option>
                  <option value={15}>Adulto Mayor (15%)</option>
                  <option value={20}>Promoción de Salud (20%)</option>
                  <option value={25}>Descuento Institucional (25%)</option>
                  <option value={30}>Campaña Clínica (30%)</option>
                </select>
              </div>

            </div>
          </div>

          {/* COLUMNA DERECHA: ESTUDIOS Y CÁLCULO MONTO (5 Cols) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="card bg-base-100 border border-base-200 shadow-xl rounded-3xl p-6 space-y-5">
              
              <h2 className="text-base font-black text-primary uppercase tracking-wider flex items-center gap-2 border-b border-base-200 pb-3">
                <IconFlask className="w-5 h-5 text-blue-600" /> 2. Selección de Estudios Clínicos
              </h2>

              {/* Campo Estudios con Select de BD + Botón Agregar */}
              <div className="space-y-2">
                <label className="label py-0">
                  <span className="label-text font-bold text-sm">Estudio(s):</span>
                </label>
                <div className="flex gap-2">
                  <select
                    className="select select-bordered w-full rounded-2xl focus:select-primary font-semibold text-sm"
                    value={selectedStudyId}
                    onChange={(e) => setSelectedStudyId(e.target.value)}
                  >
                    <option value="" disabled>-- Selecciona un Estudio del Catálogo --</option>
                    {studies.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} - ${s.price.toFixed(2)}
                      </option>
                    ))}
                  </select>

                  <button
                    onClick={handleAddStudy}
                    className="btn btn-primary text-white font-bold rounded-2xl gap-1 shrink-0 shadow-md"
                  >
                    <IconPlus className="w-4 h-4" />
                    Agregar
                  </button>
                </div>
              </div>

              {/* Tabla de Estudios Seleccionados */}
              <div className="border border-base-200 rounded-2xl overflow-hidden min-h-[160px] bg-base-200/20">
                <table className="table table-compact w-full text-xs">
                  <thead>
                    <tr className="bg-base-200/80 text-base-content/70">
                      <th className="font-bold">Estudio</th>
                      <th className="font-bold text-right">Precio</th>
                      <th className="font-bold text-center">Quitar</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedStudiesList.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="text-center py-8 text-base-content/40 font-medium">
                          No has agregado ningún estudio a la lista.
                        </td>
                      </tr>
                    ) : (
                      selectedStudiesList.map((study) => (
                        <tr key={study.id} className="hover:bg-base-200/50">
                          <td className="font-bold text-base-content">{study.name}</td>
                          <td className="text-right font-mono font-bold text-base-content">
                            ${study.price.toFixed(2)}
                          </td>
                          <td className="text-center">
                            <button
                              onClick={() => handleRemoveStudy(study.id)}
                              className="btn btn-ghost btn-xs text-error hover:bg-error/10 rounded-lg"
                            >
                              <IconTrash className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* RESUMEN FINANCIERO EN TIEMPO REAL */}
              <div className="space-y-2 pt-2 border-t border-base-200 text-right">
                <div className="text-sm font-bold text-base-content/70">
                  IMPORTE: <span className="font-mono text-base text-base-content">${subtotal.toFixed(2)}</span>
                </div>

                <div className="text-sm font-bold text-base-content/70">
                  DESCUENTO ({discountPercent}%): <span className="font-mono text-base text-error">-${discountAmount.toFixed(2)}</span>
                </div>

                <div className="text-3xl font-black text-primary tracking-tight pt-2">
                  TOTAL: <span className="font-mono">${totalAmount.toFixed(2)}</span>
                </div>
              </div>

              {/* Botón Principal: Capturar Monto y Crear Orden */}
              <button
                onClick={handleCreateOrder}
                className="btn btn-primary btn-lg w-full text-white font-black rounded-2xl shadow-xl shadow-primary/25 hover:scale-[1.01] transition-all text-base uppercase tracking-wider"
                disabled={isSubmitting || selectedStudiesList.length === 0}
              >
                {isSubmitting ? (
                  <>
                    <span className="loading loading-spinner loading-md"></span>
                    Procesando Orden...
                  </>
                ) : (
                  'Capturar Monto y Crear Orden'
                )}
              </button>

            </div>
          </div>

        </div>
      )}

      {/* PESTAÑA 2: ÓRDENES PENDIENTES CON BOTÓN DE CAPTURAR RESULTADOS / VERIFICAR */}
      {!isLoadingData && activeTab === 'pending' && (
        <section className="space-y-4">
          <div className="card bg-base-100 border border-base-200 shadow-md p-6 rounded-3xl">
            <h2 className="text-lg font-bold text-base-content mb-4 flex items-center gap-2">
              <IconClipboardList className="w-5 h-5 text-warning" />
              Órdenes de Trabajo Pendientes de Procesamiento
            </h2>

            {pendingOrders.length === 0 ? (
              <div className="p-8 text-center border-2 border-dashed border-base-200 rounded-2xl">
                <p className="text-xs text-base-content/60 font-semibold">No hay órdenes pendientes en este momento.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pendingOrders.map((order) => (
                  <div key={order.id} className="border border-base-200 p-5 rounded-2xl bg-base-100 shadow-sm space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="badge badge-primary font-mono font-bold">Folio #{order.folio || order.id.slice(0, 6)}</span>
                      <span className="badge badge-warning text-xs font-bold">PENDIENTE</span>
                    </div>

                    <div>
                      <div className="font-bold text-base text-base-content">
                        {order.patient?.firstName} {order.patient?.lastName}
                      </div>
                      <div className="text-xs text-base-content/60">
                        Sede: {order.laboratory?.name}
                      </div>
                    </div>

                    <div className="border-t border-base-200 pt-2 text-xs font-semibold text-base-content/70">
                      Estudios ({order.analyses?.length || 0}):
                      <ul className="list-disc list-inside mt-1 font-normal">
                        {order.analyses?.map((a) => (
                          <li key={a.id}>{a.analysis?.name}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 border-t border-base-200 pt-3">
                      <button
                        onClick={() => setCreatedOrderTicket(order)}
                        className="btn btn-xs btn-ghost text-slate-500 font-bold gap-1"
                      >
                        <IconPrinter className="w-3.5 h-3.5" /> Comprobante
                      </button>

                      {/* BOTÓN PRINCIPAL EXIGIDO: Capturar Resultados / Verificar */}
                      <button
                        onClick={() => setSelectedOrderForCapture(order)}
                        className="btn btn-sm btn-primary text-white font-bold rounded-xl gap-1.5 shadow-md hover:scale-[1.02] transition-all"
                      >
                        <IconClipboardList className="w-4 h-4" />
                        Capturar Resultados / Verificar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* PESTAÑA 3: ÓRDENES COMPLETADAS CON BOTÓN IMPRIMIR PDF OFICIAL */}
      {!isLoadingData && activeTab === 'completed' && (
        <section className="space-y-4">
          <div className="card bg-base-100 border border-base-200 shadow-md p-6 rounded-3xl">
            <h2 className="text-lg font-bold text-base-content mb-4 flex items-center gap-2">
              <IconCheckCircle className="w-5 h-5 text-success" />
              Órdenes de Trabajo Completadas y Verificadas
            </h2>

            {completedOrders.length === 0 ? (
              <div className="p-8 text-center border-2 border-dashed border-base-200 rounded-2xl">
                <p className="text-xs text-base-content/60 font-semibold">No hay órdenes completadas registradas aún.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {completedOrders.map((order) => (
                  <div key={order.id} className="border border-base-200 p-5 rounded-2xl bg-base-100 shadow-sm space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="badge badge-success text-white font-mono font-bold">Folio #{order.folio || order.id.slice(0, 6)}</span>
                      <span className="badge badge-success text-white text-xs font-bold">COMPLETADO</span>
                    </div>

                    <div>
                      <div className="font-bold text-base text-base-content">
                        {order.patient?.firstName} {order.patient?.lastName}
                      </div>
                      <div className="text-xs text-base-content/60">
                        Sede: {order.laboratory?.name}
                      </div>
                    </div>

                    <div className="flex items-center justify-between border-t border-base-200 pt-3">
                      <button
                        onClick={() => setCreatedOrderTicket(order)}
                        className="btn btn-xs btn-ghost text-slate-500 font-bold"
                      >
                        Comprobante
                      </button>

                      <button
                        onClick={() => setSelectedOrderForPDF(order)}
                        className="btn btn-sm bg-slate-900 text-white hover:bg-slate-800 border-none font-bold rounded-xl gap-1.5 shadow-md"
                      >
                        <IconPrinter className="w-4 h-4 text-emerald-400" />
                        Imprimir PDF de Resultados
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* MODAL DE CAPTURA DE RESULTADOS (MODAL EXIGIDO) */}
      {selectedOrderForCapture && (
        <CaptureResultsModal
          order={selectedOrderForCapture}
          onClose={() => setSelectedOrderForCapture(null)}
          onSuccess={() => {
            setSelectedOrderForCapture(null);
            loadInitialData();
          }}
          onOpenPDF={(ord) => {
            setSelectedOrderForCapture(null);
            setSelectedOrderForPDF(ord);
          }}
        />
      )}

      {/* MODAL / VISOR DEL PDF OFICIAL CON QR DE AUTENTICIDAD Y LOGO */}
      {selectedOrderForPDF && (
        <MedicalReportPDF
          order={selectedOrderForPDF}
          onClose={() => setSelectedOrderForPDF(null)}
        />
      )}

      {/* MODAL / COMPROBANTE DE TICKET SIMPLE */}
      {createdOrderTicket && (
        <dialog className="modal modal-open backdrop-blur-xs">
          <div className="modal-box max-w-lg rounded-3xl p-6 border border-base-300 shadow-2xl">
            
            <div className="flex items-center justify-between border-b border-base-200 pb-3 mb-4">
              <div className="flex items-center gap-2 text-primary font-black text-lg">
                <IconCheckCircle className="w-6 h-6 text-success" />
                <span>Comprobante de Recepción</span>
              </div>
              <button
                onClick={() => setCreatedOrderTicket(null)}
                className="btn btn-sm btn-circle btn-ghost"
              >
                <IconX className="w-5 h-5" />
              </button>
            </div>

            <div id="printable-ticket" className="bg-base-200/40 p-5 rounded-2xl border border-base-200 space-y-3 text-xs">
              <div className="text-center pb-2 border-b border-base-200">
                <h4 className="font-black text-base text-base-content">{createdOrderTicket.laboratory?.name || 'LabSystem Clinique'}</h4>
                <p className="text-[11px] text-base-content/60">Comprobante de Recepción de Muestras Médicas</p>
                <div className="mt-2 inline-block bg-primary text-white font-mono font-extrabold text-sm px-3 py-1 rounded-full">
                  FOLIO DE ORDEN: #{createdOrderTicket.folio || createdOrderTicket.id.slice(0, 6)}
                </div>
              </div>

              <div>
                <span className="font-bold text-base-content/60 block text-[10px] uppercase">PACIENTE:</span>
                <span className="font-bold text-sm text-base-content">
                  {createdOrderTicket.patient?.firstName} {createdOrderTicket.patient?.lastName}
                </span>
              </div>

              {createdOrderTicket.notes && (
                <div>
                  <span className="font-bold text-base-content/60 block text-[10px] uppercase">DETALLES Y MÉDICO:</span>
                  <span className="font-semibold text-base-content">{createdOrderTicket.notes}</span>
                </div>
              )}

              <div>
                <span className="font-bold text-base-content/60 block text-[10px] uppercase mb-1">ESTUDIOS SOLICITADOS:</span>
                <ul className="list-disc list-inside space-y-1 font-semibold text-base-content">
                  {createdOrderTicket.analyses?.map((a) => (
                    <li key={a.id} className="flex justify-between">
                      <span>{a.analysis?.name}</span>
                      <span className="font-mono">${a.analysis?.price?.toFixed(2)}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-2 border-t border-base-200 text-right text-xs">
                <span className="text-base-content/60 font-bold block">FECHA DE REGISTRO:</span>
                <span className="font-semibold text-base-content">{new Date(createdOrderTicket.createdAt).toLocaleString()}</span>
              </div>
            </div>

            <div className="modal-action pt-4 border-t border-base-200 flex justify-end gap-2">
              <button
                onClick={() => setCreatedOrderTicket(null)}
                className="btn btn-ghost rounded-xl"
              >
                Cerrar
              </button>

              <button
                onClick={() => window.print()}
                className="btn btn-primary text-white font-bold rounded-xl gap-2 shadow-md"
              >
                <IconPrinter className="w-5 h-5" />
                Imprimir Comprobante
              </button>
            </div>
          </div>
          <form method="dialog" className="modal-backdrop">
            <button onClick={() => setCreatedOrderTicket(null)}>close</button>
          </form>
        </dialog>
      )}

      {/* MODAL INLINE DE ALTA RÁPIDA DE PACIENTE */}
      {isQuickPatientOpen && (
        <dialog className="modal modal-open backdrop-blur-xs">
          <div className="modal-box max-w-md rounded-3xl p-6 border border-base-300 shadow-2xl">
            <div className="flex items-center justify-between border-b border-base-200 pb-3 mb-4">
              <h3 className="font-bold text-lg text-base-content flex items-center gap-2">
                <IconUserPlus className="w-5 h-5 text-primary" />
                Alta Rápida de Paciente
              </h3>
              <button
                onClick={() => setIsQuickPatientOpen(false)}
                className="btn btn-sm btn-circle btn-ghost"
              >
                <IconX className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateQuickPatient} className="space-y-3 text-xs">
              <div className="form-control">
                <label className="label py-1"><span className="label-text font-bold">Nombre(s) *</span></label>
                <input
                  type="text"
                  placeholder="Ej. Carmen"
                  className="input input-bordered input-sm rounded-xl font-medium"
                  value={quickPatientData.firstName}
                  onChange={(e) => setQuickPatientData((prev) => ({ ...prev, firstName: e.target.value }))}
                  required
                />
              </div>

              <div className="form-control">
                <label className="label py-1"><span className="label-text font-bold">Apellido(s) *</span></label>
                <input
                  type="text"
                  placeholder="Ej. Morales"
                  className="input input-bordered input-sm rounded-xl font-medium"
                  value={quickPatientData.lastName}
                  onChange={(e) => setQuickPatientData((prev) => ({ ...prev, lastName: e.target.value }))}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="form-control">
                  <label className="label py-1"><span className="label-text font-bold">Nacimiento *</span></label>
                  <input
                    type="date"
                    className="input input-bordered input-sm rounded-xl font-medium"
                    value={quickPatientData.dateOfBirth}
                    onChange={(e) => setQuickPatientData((prev) => ({ ...prev, dateOfBirth: e.target.value }))}
                    required
                  />
                </div>

                <div className="form-control">
                  <label className="label py-1"><span className="label-text font-bold">Género *</span></label>
                  <select
                    className="select select-bordered select-sm rounded-xl font-medium"
                    value={quickPatientData.gender}
                    onChange={(e) => setQuickPatientData((prev) => ({ ...prev, gender: e.target.value }))}
                    required
                  >
                    <option value="M">Masculino</option>
                    <option value="F">Femenino</option>
                    <option value="OTHER">Otro</option>
                  </select>
                </div>
              </div>

              <div className="form-control">
                <label className="label py-1"><span className="label-text font-bold">Teléfono</span></label>
                <input
                  type="tel"
                  placeholder="Ej. +52 33 1234 5678"
                  className="input input-bordered input-sm rounded-xl font-medium"
                  value={quickPatientData.phone}
                  onChange={(e) => setQuickPatientData((prev) => ({ ...prev, phone: e.target.value }))}
                />
              </div>

              <div className="modal-action border-t border-base-200 pt-3 mt-4">
                <button
                  type="button"
                  onClick={() => setIsQuickPatientOpen(false)}
                  className="btn btn-ghost btn-sm rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn-primary btn-sm text-white font-bold rounded-xl"
                >
                  Guardar Paciente
                </button>
              </div>
            </form>
          </div>
          <form method="dialog" className="modal-backdrop">
            <button onClick={() => setIsQuickPatientOpen(false)}>close</button>
          </form>
        </dialog>
      )}

    </div>
  );
}
