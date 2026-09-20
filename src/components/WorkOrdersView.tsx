// src/components/WorkOrdersView.tsx
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useApi } from '../hooks/useApi';
import type { Patient } from '../types/patient';
import type { Laboratory } from '../types/lab';
import type { ClinicalAnalysis, WorkOrder, CreateOrderDto } from '../types/order';
import CaptureResultsModal from './CaptureResultsModal';
import MedicalReportPDF from './MedicalReportPDF';
import BarcodeThermalLabelModal from './BarcodeThermalLabelModal';
import QRCodeSVG from './QRCodeSVG';
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
  IconClock,
  IconPhone,
  IconSearch,
  IconFilter,
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

  // Estados para modal de Captura de Resultados, PDF Oficial y Etiquetas Térmicas
  const [selectedOrderForCapture, setSelectedOrderForCapture] = useState<WorkOrder | null>(null);
  const [selectedOrderForPDF, setSelectedOrderForPDF] = useState<WorkOrder | null>(null);
  const [selectedOrderForLabels, setSelectedOrderForLabels] = useState<WorkOrder | null>(null);
  const [selectedReprintOrderId, setSelectedReprintOrderId] = useState<string>('');
  const [completedSearchTerm, setCompletedSearchTerm] = useState('');
  const [completedLabFilter, setCompletedLabFilter] = useState('');

  const activeReprintOrder = useMemo(() => {
    if (selectedReprintOrderId) {
      const found = orders.find((o) => o.id === selectedReprintOrderId);
      if (found) return found;
    }
    return orders.length > 0 ? orders[0] : null;
  }, [orders, selectedReprintOrderId]);

  // Generador de enlace WhatsApp con informe clínico (Respaldo manual)
  const getWhatsAppShareUrl = (ord: WorkOrder) => {
    const phone = (ord.patient?.phone || '').trim() || '9211234567';
    const rawDigits = phone.replace(/[^\d]/g, '');
    const cleanPhone = rawDigits.length === 10 ? `52${rawDigits}` : rawDigits;
    const folioNumber = ord.folio || ord.id.slice(0, 6);
    const origin = window.location.origin.includes('localhost')
      ? window.location.origin.replace('https://', 'http://')
      : window.location.origin;
    const reportUrl = `${origin}/results/${ord.id}`;
    const labName = (ord.laboratory?.name || 'Laboratorio Clínico').toUpperCase();
    const text = `🏥 *${labName}*\n\nEstimado(a) *${ord.patient?.firstName || 'Paciente'} ${ord.patient?.lastName || ''}*:\nLe informamos que los resultados de sus análisis clínicos correspondientes a la Orden *#${folioNumber}* han sido debidamente procesados y avalados.\n\n📄 Puede consultar o descargar su informe oficial aquí:\n${reportUrl}\n\nAgradecemos su confianza en nuestro servicio.`;
    return `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(text)}`;
  };

  const [sendingWhatsAppOrderId, setSendingWhatsAppOrderId] = useState<string | null>(null);

  // Sistema de Notificaciones Flotantes Tipo Toastify
  interface ToastNotification {
    id: number;
    type: 'success' | 'error' | 'info';
    title: string;
    message: string;
  }
  const [toasts, setToasts] = useState<ToastNotification[]>([]);

  const addToast = (message: string, type: 'success' | 'error' | 'info' = 'success', title?: string) => {
    const id = Date.now() + Math.random();
    const defaultTitle = type === 'success' ? 'Despacho UltraMsg' : type === 'error' ? 'Aviso del Sistema' : 'Información';
    const newToast: ToastNotification = { id, type, title: title || defaultTitle, message };
    setToasts((prev) => [...prev, newToast]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  const removeToast = (id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Despacho 100% Automático de WhatsApp en Segundo Plano (UltraMsg)
  const handleSendAutomatedWhatsApp = async (ord: WorkOrder) => {
    if (!ord.patient?.phone) {
      addToast('El paciente no cuenta con un número de celular registrado.', 'error', '⚠️ Sin Teléfono');
      return;
    }
    setSendingWhatsAppOrderId(ord.id);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const res = await api.post<{ success: boolean; phone: string; folio: string | number; message: string }>(
        `/orders/${ord.id}/whatsapp`
      );
      // Formateo higiénico de teléfono sin duplicar '+'
      const rawDigits = (res.data?.phone || ord.patient.phone || '').replace(/[^\d]/g, '');
      const cleanFormattedPhone = rawDigits.startsWith('52') ? `+${rawDigits}` : `+52${rawDigits}`;
      const folioNumber = ord.folio || ord.id.slice(0, 6);

      addToast(
        `WhatsApp automático enviado con éxito al paciente ${cleanFormattedPhone} (Folio #${folioNumber}) vía UltraMsg.`,
        'success',
        '✅ Despacho Automático UltraMsg'
      );
    } catch (err: any) {
      console.error('Error al enviar WhatsApp automático:', err);
      const msg = err?.response?.data?.message || err?.message || 'Error de conexión con el servicio UltraMsg';
      addToast(
        `No se pudo enviar WhatsApp automático: ${msg}.`,
        'error',
        '⚠️ Error UltraMsg'
      );
      const fallbackUrl = getWhatsAppShareUrl(ord);
      if (confirm(`El servicio automático UltraMsg no respondió (${msg}). ¿Deseas abrir WhatsApp Web manualmente como respaldo?`)) {
        window.open(fallbackUrl, '_blank');
      }
    } finally {
      setSendingWhatsAppOrderId(null);
    }
  };

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

  // Convertir automáticamente mensajes de éxito en Toasts flotantes
  useEffect(() => {
    if (successMsg) {
      addToast(successMsg, 'success', '✅ Notificación del Sistema');
      setSuccessMsg(null);
    }
  }, [successMsg]);

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
      if (loadedOrders.length > 0 && !selectedReprintOrderId) {
        setSelectedReprintOrderId(loadedOrders[0].id);
      }
    } catch (err) {
      console.error('Error al cargar datos de órdenes:', err);
    } finally {
      setIsLoadingData(false);
    }
  }, [api, selectedPatientId, selectedLabId, selectedStudyId, selectedReprintOrderId]);

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
      setSelectedReprintOrderId(res.data.id);
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

  const filteredCompletedOrders = useMemo(() => {
    return completedOrders.filter((ord) => {
      const term = completedSearchTerm.toLowerCase().trim();
      const matchesSearch = !term || (
        String(ord.folio || '').toLowerCase().includes(term) ||
        (ord.id || '').toLowerCase().includes(term) ||
        `${ord.patient?.firstName || ''} ${ord.patient?.lastName || ''}`.toLowerCase().includes(term) ||
        (ord.patient?.phone || '').includes(term) ||
        ord.analyses?.some((a) => a.analysis?.name.toLowerCase().includes(term))
      );

      const matchesLab = !completedLabFilter || ord.laboratoryId === completedLabFilter;

      return matchesSearch && matchesLab;
    });
  }, [completedOrders, completedSearchTerm, completedLabFilter]);

  return (
    <div className="space-y-6 animate-fade-in relative">
      {/* NOTIFICACIONES FLOTANTES TIPO TOASTIFY CON COLORES DAISYUI / CLINICAL THEME */}
      <div className="fixed top-5 right-5 z-[350] flex flex-col gap-3 max-w-sm sm:max-w-md w-full pointer-events-none px-4 sm:px-0">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto shadow-2xl rounded-2xl p-4 border flex items-start gap-3.5 backdrop-blur-md transition-all duration-300 transform translate-y-0 opacity-100 animate-in fade-in slide-in-from-top-4 ${
              toast.type === 'success'
                ? 'bg-base-100/95 text-base-content border-success/40 shadow-success/15'
                : toast.type === 'error'
                ? 'bg-base-100/95 text-base-content border-error/40 shadow-error/15'
                : 'bg-base-100/95 text-base-content border-primary/40 shadow-primary/15'
            }`}
          >
            <div
              className={`p-2 rounded-xl shrink-0 mt-0.5 ${
                toast.type === 'success'
                  ? 'bg-success/15 text-success'
                  : toast.type === 'error'
                  ? 'bg-error/15 text-error'
                  : 'bg-primary/15 text-primary'
              }`}
            >
              {toast.type === 'success' ? (
                <IconCheckCircle className="w-5 h-5" />
              ) : (
                <IconAlertCircle className="w-5 h-5" />
              )}
            </div>

            <div className="flex-1 min-w-0 pr-1">
              <div className="flex items-center justify-between gap-2">
                <span
                  className={`font-black text-xs uppercase tracking-wider ${
                    toast.type === 'success' ? 'text-success' : toast.type === 'error' ? 'text-error' : 'text-primary'
                  }`}
                >
                  {toast.title}
                </span>
                <span className="text-[10px] text-base-content/50 font-mono">ahora</span>
              </div>
              <p className="text-xs font-semibold text-base-content/90 leading-relaxed mt-1 break-words">
                {toast.message}
              </p>
            </div>

            <button
              type="button"
              onClick={() => removeToast(toast.id)}
              className="btn btn-xs btn-circle btn-ghost text-base-content/50 hover:text-base-content hover:bg-base-200 shrink-0"
              title="Cerrar notificación"
            >
              <IconX className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
      
      {/* Barra de Acciones de Impresión Superior (Ficha de Paciente) */}
      <section className="card bg-base-100 border border-base-200 rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="badge badge-primary badge-outline text-xs font-semibold mb-1.5 gap-1">
            <IconClipboardList className="w-3.5 h-3.5" />
            Módulo de Recepción y Control
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-base-content tracking-tight">
            Ficha de Paciente y Hoja de Trabajo
          </h1>
          <p className="text-xs text-base-content/60 mt-0.5">
            Generación de órdenes clínicas, captura de resultados e impresión de comprobantes oficiales.
          </p>
        </div>

        {/* Barra de Reimpresión con Selector Dinámico de Paciente / Folio */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 bg-base-200/60 p-2.5 rounded-2xl border border-base-300/60">
          <div className="flex items-center gap-1.5 px-2">
            <IconUsers className="w-4 h-4 text-primary shrink-0" />
            <select
              value={activeReprintOrder?.id || ''}
              onChange={(e) => {
                setSelectedReprintOrderId(e.target.value);
                const found = orders.find((o) => o.id === e.target.value);
                if (found) {
                  if (selectedOrderForLabels) setSelectedOrderForLabels(found);
                  if (createdOrderTicket) setCreatedOrderTicket(found);
                  if (selectedOrderForPDF) setSelectedOrderForPDF(found);
                }
              }}
              className="select select-xs select-bordered rounded-xl font-bold text-xs text-primary focus:select-primary max-w-[200px] sm:max-w-[240px] truncate bg-base-100"
              title="Seleccionar paciente o folio para reimprimir"
            >
              {orders.length === 0 && <option value="">Sin órdenes aún</option>}
              {orders.map((ord) => (
                <option key={ord.id} value={ord.id}>
                  Folio #{ord.folio || ord.id.slice(0, 6)} - {ord.patient?.firstName} {ord.patient?.lastName} ({ord.status})
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => {
                if (activeReprintOrder) {
                  setSelectedOrderForLabels(activeReprintOrder);
                } else if (orders.length > 0) {
                  setSelectedOrderForLabels(orders[0]);
                } else {
                  alert('Aún no hay órdenes registradas para imprimir etiquetas.');
                }
              }}
              className="btn btn-xs btn-outline rounded-xl font-bold gap-1 text-[11px]"
              title="Imprimir etiquetas de código de barras para tubos Vacutainer"
            >
              <IconPrinter className="w-3.5 h-3.5" />
              Imprimir Etiquetas
            </button>

            <button
              onClick={() => {
                if (activeReprintOrder) {
                  setCreatedOrderTicket(activeReprintOrder);
                } else if (orders.length > 0) {
                  setCreatedOrderTicket(orders[0]);
                } else {
                  alert('Aún no hay órdenes generadas para reimprimir comprobante.');
                }
              }}
              className="btn btn-xs btn-outline rounded-xl font-bold gap-1 text-[11px]"
              title="Re-imprimir comprobante de recepción para el paciente"
            >
              <IconPrinter className="w-3.5 h-3.5" />
              Re-Imprimir Comprobante
            </button>

            <button
              onClick={() => {
                if (activeReprintOrder) {
                  setSelectedOrderForPDF(activeReprintOrder);
                } else if (completedOrders.length > 0) {
                  setSelectedOrderForPDF(completedOrders[0]);
                } else if (orders.length > 0) {
                  setSelectedOrderForPDF(orders[0]);
                } else {
                  alert('No hay órdenes para imprimir resultados.');
                }
              }}
              className="btn btn-xs btn-primary text-primary-content rounded-xl font-bold gap-1 text-[11px] shadow-xs"
              title="Imprimir reporte oficial de resultados clínicos en PDF"
            >
              <IconPrinter className="w-3.5 h-3.5" />
              Imprimir Resultados PDF
            </button>
          </div>
        </div>
      </section>

      {/* Control de Pestañas Responsivo sin Desbordamiento */}
      <div className="tabs tabs-boxed bg-base-200/80 p-1 rounded-2xl w-full sm:max-w-lg grid grid-cols-3 gap-1 border border-base-300/50 shadow-xs">
        <button
          onClick={() => setActiveTab('create')}
          className={`tab h-auto py-2.5 px-1 sm:px-3 rounded-xl font-bold gap-1 sm:gap-2 text-xs sm:text-sm w-full flex items-center justify-center transition-all ${
            activeTab === 'create'
              ? 'tab-active bg-primary text-primary-content shadow-xs'
              : 'text-base-content/70 hover:text-base-content hover:bg-base-100/50'
          }`}
        >
          <IconClipboardList className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
          <span className="whitespace-nowrap">
            Crear <span className="hidden sm:inline">Orden</span>
          </span>
        </button>

        <button
          onClick={() => setActiveTab('pending')}
          className={`tab h-auto py-2.5 px-1 sm:px-3 rounded-xl font-bold gap-1 sm:gap-2 text-xs sm:text-sm w-full flex items-center justify-center transition-all ${
            activeTab === 'pending'
              ? 'tab-active bg-primary text-primary-content shadow-xs'
              : 'text-base-content/70 hover:text-base-content hover:bg-base-100/50'
          }`}
        >
          <IconClock className={`w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 ${activeTab === 'pending' ? 'text-primary-content' : 'text-warning'}`} />
          <span className="whitespace-nowrap inline-flex items-center gap-0.5 sm:gap-1">
            <span>Pendientes</span>
            <span className="text-[10px] sm:text-xs font-semibold opacity-90">
              ({pendingOrders.length})
            </span>
          </span>
        </button>

        <button
          onClick={() => setActiveTab('completed')}
          className={`tab h-auto py-2.5 px-1 sm:px-3 rounded-xl font-bold gap-1 sm:gap-2 text-xs sm:text-sm w-full flex items-center justify-center transition-all ${
            activeTab === 'completed'
              ? 'tab-active bg-primary text-primary-content shadow-xs'
              : 'text-base-content/70 hover:text-base-content hover:bg-base-100/50'
          }`}
        >
          <IconCheckCircle className={`w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 ${activeTab === 'completed' ? 'text-primary-content' : 'text-success'}`} />
          <span className="whitespace-nowrap inline-flex items-center gap-0.5 sm:gap-1">
            <span className="inline sm:hidden">Completas</span>
            <span className="hidden sm:inline">Completadas</span>
            <span className="text-[10px] sm:text-xs font-semibold opacity-90">
              ({completedOrders.length})
            </span>
          </span>
        </button>
      </div>

      {/* ALERTAS ESTÁTICAS DE FORMULARIO */}
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
            <div className="card bg-base-100 border border-base-200 shadow-xs rounded-2xl p-5 sm:p-6 space-y-5">
              
              <h2 className="text-xs sm:text-sm font-bold text-primary uppercase tracking-wider flex items-center gap-2 border-b border-base-200 pb-3">
                <IconUsers className="w-4 h-4" /> 1. Datos del Paciente y Médico Tratante
              </h2>

              {/* Campo Paciente con Select y Botón Agregar */}
              <div className="space-y-1.5">
                <label className="label py-0">
                  <span className="label-text font-bold text-xs sm:text-sm">
                    Paciente: <span className="text-error">*</span>
                  </span>
                </label>
                <div className="flex gap-2">
                  <select
                    className="select select-bordered w-full rounded-xl focus:select-primary font-semibold text-sm"
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
                    className="btn btn-primary text-primary-content font-bold rounded-xl gap-1 shrink-0"
                    title="Agregar Nuevo Paciente a la BD"
                  >
                    <IconPlus className="w-4 h-4" />
                    Agregar
                  </button>
                </div>

                {/* Info en Tiempo Real del Paciente Seleccionado */}
                {currentPatient ? (
                  <div className="bg-base-200/50 p-3.5 rounded-xl border border-base-200 grid grid-cols-3 gap-2 text-xs font-semibold mt-2">
                    <div>
                      <span className="text-base-content/50 block text-[10px] font-bold uppercase">Edad:</span>
                      <span className="text-base-content text-xs sm:text-sm">{patientAge} años</span>
                    </div>

                    <div>
                      <span className="text-base-content/50 block text-[10px] font-bold uppercase">Género:</span>
                      <span className="text-base-content text-xs sm:text-sm">
                        {currentPatient.gender === 'M' ? 'Masculino' : currentPatient.gender === 'F' ? 'Femenino' : 'Otro'}
                      </span>
                    </div>

                    <div>
                      <span className="text-base-content/50 block text-[10px] font-bold uppercase">Teléfono:</span>
                      <span className="text-base-content text-xs sm:text-sm truncate block">{currentPatient.phone || 'Sin número'}</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-warning font-medium mt-1">
                    No hay paciente seleccionado. Elige uno o crea uno nuevo.
                  </div>
                )}
              </div>

              {/* Campo Médico Tratante con Botón Agregar */}
              <div className="space-y-1.5">
                <label className="label py-0">
                  <span className="label-text font-bold text-xs sm:text-sm">
                    Médico: <span className="text-error">*</span>
                  </span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Escribe el nombre del médico tratante"
                    className="input input-bordered w-full rounded-xl focus:input-primary transition-all font-medium text-sm"
                    value={doctorName}
                    onChange={(e) => setDoctorName(e.target.value)}
                  />
                  <button
                    onClick={() => setDoctorName('Dr. Sanatorio Particular')}
                    className="btn btn-outline rounded-xl font-bold gap-1 shrink-0 px-2 sm:px-4 text-xs sm:text-sm"
                  >
                    <IconPlus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">Predeterminado</span>
                    <span className="sm:hidden">Defecto</span>
                  </button>
                </div>
              </div>

              {/* Campo Sede / Laboratorio */}
              <div className="space-y-1.5">
                <label className="label py-0">
                  <span className="label-text font-bold text-xs sm:text-sm flex items-center gap-1.5">
                    <IconBuilding className="w-4 h-4 text-primary" /> Sede de Atención / Laboratorio:
                  </span>
                </label>
                <select
                  className="select select-bordered w-full rounded-xl focus:select-primary font-semibold text-sm"
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
              <div className="space-y-1.5">
                <label className="label py-0">
                  <span className="label-text font-bold text-xs sm:text-sm">Descuento:</span>
                </label>
                <select
                  className="select select-bordered w-full rounded-xl focus:select-primary font-semibold text-sm"
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
            <div className="card bg-base-100 border border-base-200 shadow-xs rounded-2xl p-5 sm:p-6 space-y-5">
              
              <h2 className="text-xs sm:text-sm font-bold text-primary uppercase tracking-wider flex items-center gap-2 border-b border-base-200 pb-3">
                <IconFlask className="w-4 h-4 text-primary" /> 2. Selección de Estudios Clínicos
              </h2>

              {/* Campo Estudios con Select de BD + Botón Agregar */}
              <div className="space-y-1.5">
                <label className="label py-0">
                  <span className="label-text font-bold text-xs sm:text-sm">Estudio(s):</span>
                </label>
                <div className="flex gap-2">
                  <select
                    className="select select-bordered w-full rounded-xl focus:select-primary font-semibold text-sm"
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
                    className="btn btn-primary text-primary-content font-bold rounded-xl gap-1 shrink-0"
                  >
                    <IconPlus className="w-4 h-4" />
                    Agregar
                  </button>
                </div>
              </div>

              {/* Tabla de Estudios Seleccionados */}
              <div className="border border-base-200 rounded-xl overflow-hidden min-h-[150px] bg-base-200/20">
                <table className="table table-sm w-full text-xs">
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
              <div className="space-y-1.5 pt-2 border-t border-base-200 text-right">
                <div className="text-xs font-bold text-base-content/70">
                  IMPORTE: <span className="font-mono text-sm text-base-content">${subtotal.toFixed(2)}</span>
                </div>

                <div className="text-xs font-bold text-base-content/70">
                  DESCUENTO ({discountPercent}%): <span className="font-mono text-sm text-error">-${discountAmount.toFixed(2)}</span>
                </div>

                <div className="text-2xl sm:text-3xl font-black text-primary tracking-tight pt-2">
                  TOTAL: <span className="font-mono">${totalAmount.toFixed(2)}</span>
                </div>
              </div>

              {/* Botón Principal: Capturar Monto y Crear Orden */}
              <button
                onClick={handleCreateOrder}
                className="btn btn-primary btn-md sm:btn-lg w-full text-primary-content font-bold rounded-xl shadow-xs text-sm sm:text-base uppercase tracking-wider"
                disabled={isSubmitting || selectedStudiesList.length === 0}
              >
                {isSubmitting ? (
                  <>
                    <span className="loading loading-spinner loading-sm"></span>
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
          <div className="card bg-base-100 border border-base-200 shadow-xs p-5 sm:p-6 rounded-2xl">
            <h2 className="text-base font-bold text-base-content mb-4 flex items-center gap-2">
              <IconClipboardList className="w-5 h-5 text-warning" />
              Órdenes de Trabajo Pendientes de Procesamiento
            </h2>

            {pendingOrders.length === 0 ? (
              <div className="p-8 text-center border-2 border-dashed border-base-200 rounded-xl">
                <p className="text-xs text-base-content/60 font-semibold">No hay órdenes pendientes en este momento.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pendingOrders.map((order) => (
                  <div key={order.id} className="border border-base-200 p-4 sm:p-5 rounded-xl bg-base-100 shadow-xs space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="badge badge-primary badge-sm font-mono font-bold">Folio #{order.folio || order.id.slice(0, 6)}</span>
                      <span className="badge badge-warning badge-sm text-xs font-bold">PENDIENTE</span>
                    </div>

                    <div>
                      <div className="font-bold text-sm sm:text-base text-base-content">
                        {order.patient?.firstName} {order.patient?.lastName}
                      </div>
                      <div className="text-xs text-base-content/60">
                        Sede: {order.laboratory?.name}
                      </div>
                    </div>

                    <div className="border-t border-base-200 pt-2 text-xs font-semibold text-base-content/70">
                      Estudios ({order.analyses?.length || 0}):
                      <ul className="list-disc list-inside mt-1 font-normal text-base-content/80">
                        {order.analyses?.map((a) => (
                          <li key={a.id}>{a.analysis?.name}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 border-t border-base-200 pt-3">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setCreatedOrderTicket(order)}
                          className="btn btn-xs btn-ghost text-base-content/60 font-bold gap-1"
                        >
                          <IconPrinter className="w-3.5 h-3.5" /> Comprobante
                        </button>
                        <button
                          onClick={() => setSelectedOrderForLabels(order)}
                          className="btn btn-xs btn-outline btn-secondary font-bold rounded-lg gap-1"
                          title="Imprimir etiquetas térmicas para tubos de toma de muestra"
                        >
                          <IconFlask className="w-3.5 h-3.5" /> Tubos Vacutainer
                        </button>
                      </div>

                      {/* BOTÓN PRINCIPAL: Capturar Resultados / Verificar */}
                      <button
                        onClick={() => setSelectedOrderForCapture(order)}
                        className="btn btn-sm btn-primary text-primary-content font-bold rounded-xl gap-1.5"
                      >
                        <IconClipboardList className="w-4 h-4" />
                        Capturar Resultados
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* PESTAÑA 3: ÓRDENES COMPLETADAS CON BOTÓN IMPRIMIR PDF OFICIAL Y WHATSAPP */}
      {!isLoadingData && activeTab === 'completed' && (
        <section className="space-y-4 animate-fade-in">
          {/* Tarjeta Principal de Órdenes Verificadas */}
          <div className="card bg-base-100 border border-base-200 shadow-xs p-5 sm:p-6 rounded-2xl space-y-5">
            {/* Cabecera con Métricas y Estado */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-base-200 pb-4">
              <div>
                <div className="badge badge-success badge-outline text-xs font-semibold mb-1 gap-1">
                  <IconCheckCircle className="w-3.5 h-3.5 text-success" />
                  Archivo Clínico de Resultados
                </div>
                <h2 className="text-lg sm:text-xl font-black text-base-content tracking-tight flex items-center gap-2">
                  Órdenes de Trabajo Completadas y Verificadas
                </h2>
                <p className="text-xs text-base-content/60 mt-0.5">
                  Expedientes procesados con validación analítica listos para entrega, despacho WhatsApp y reimpresión oficial.
                </p>
              </div>

              {/* Estadísticas Rápidas DaisyUI */}
              <div className="flex items-center gap-2 self-start sm:self-auto">
                <div className="bg-success/10 border border-success/30 px-3.5 py-1.5 rounded-xl text-center">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-success block">Completadas</span>
                  <span className="text-base font-black text-success font-mono">{completedOrders.length}</span>
                </div>
                {completedOrders.length > 0 && (
                  <div className="bg-primary/10 border border-primary/30 px-3.5 py-1.5 rounded-xl text-center">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-primary block">Filtradas</span>
                    <span className="text-base font-black text-primary font-mono">{filteredCompletedOrders.length}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Barra de Filtros y Búsqueda Interactiva */}
            {completedOrders.length > 0 && (
              <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-base-200/50 p-3 rounded-xl border border-base-200">
                <div className="relative flex-1">
                  <IconSearch className="w-4 h-4 text-base-content/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Buscar por folio, paciente, teléfono o estudio..."
                    className="input input-sm input-bordered rounded-xl pl-9 w-full bg-base-100 text-xs font-medium focus:input-primary"
                    value={completedSearchTerm}
                    onChange={(e) => setCompletedSearchTerm(e.target.value)}
                  />
                  {completedSearchTerm && (
                    <button
                      type="button"
                      onClick={() => setCompletedSearchTerm('')}
                      className="btn btn-ghost btn-xs btn-circle absolute right-2 top-1/2 -translate-y-1/2 text-base-content/40 hover:text-base-content"
                    >
                      <IconX className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 shrink-0">
                    <IconFilter className="w-3.5 h-3.5 text-base-content/50" />
                    <select
                      className="select select-sm select-bordered rounded-xl text-xs font-semibold bg-base-100 focus:select-primary"
                      value={completedLabFilter}
                      onChange={(e) => setCompletedLabFilter(e.target.value)}
                    >
                      <option value="">Todas las Sedes</option>
                      {labs.map((lab) => (
                        <option key={lab.id} value={lab.id}>
                          {lab.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {(completedSearchTerm || completedLabFilter) && (
                    <button
                      type="button"
                      onClick={() => {
                        setCompletedSearchTerm('');
                        setCompletedLabFilter('');
                      }}
                      className="btn btn-sm btn-ghost text-xs text-base-content/60 font-semibold rounded-xl"
                    >
                      Limpiar
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Listado de Tarjetas de Órdenes */}
            {completedOrders.length === 0 ? (
              <div className="p-12 text-center border-2 border-dashed border-base-200 rounded-2xl bg-base-200/20 space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-base-200 flex items-center justify-center mx-auto text-base-content/40">
                  <IconCheckCircle className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-sm text-base-content">No hay órdenes completadas aún</h3>
                <p className="text-xs text-base-content/60 max-w-sm mx-auto font-medium">
                  Cuando captures y avales los resultados de las órdenes pendientes, se archivarán automáticamente en este catálogo.
                </p>
              </div>
            ) : filteredCompletedOrders.length === 0 ? (
              <div className="p-10 text-center border border-base-200 rounded-2xl bg-base-200/20 space-y-2">
                <p className="text-xs text-base-content/60 font-bold">
                  No se encontraron órdenes completadas con el criterio: "{completedSearchTerm}"
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setCompletedSearchTerm('');
                    setCompletedLabFilter('');
                  }}
                  className="btn btn-xs btn-primary btn-outline rounded-xl"
                >
                  Restablecer filtros
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredCompletedOrders.map((order) => {
                  const patientFullName = `${order.patient?.firstName || ''} ${order.patient?.lastName || ''}`.trim() || 'Paciente Sin Nombre';
                  const orderFolio = order.folio || order.id.slice(0, 6);
                  const studiesCount = order.analyses?.length || 0;
                  const orderDate = new Date(order.createdAt).toLocaleDateString('es-MX', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  });

                  return (
                    <div
                      key={order.id}
                      className="card bg-base-100 border border-base-200 hover:border-primary/40 hover:shadow-md transition-all duration-200 rounded-2xl p-5 space-y-4 group"
                    >
                      {/* Encabezado de la Tarjeta: Folio y Estado */}
                      <div className="flex items-center justify-between gap-2 border-b border-base-200 pb-3">
                        <div className="flex items-center gap-2">
                          <span className="badge badge-primary badge-outline font-mono font-black text-xs px-2.5 py-1">
                            FOLIO #{orderFolio}
                          </span>
                          <span className="text-[11px] text-base-content/50 font-medium flex items-center gap-1">
                            <IconClock className="w-3 h-3 text-base-content/40" />
                            {orderDate}
                          </span>
                        </div>
                        <span className="badge badge-success text-success-content font-black text-[11px] gap-1 px-2.5 py-1 shadow-2xs">
                          <IconCheckCircle className="w-3 h-3" />
                          COMPLETADO
                        </span>
                      </div>

                      {/* Información del Paciente y Sede */}
                      <div className="space-y-1">
                        <div className="font-black text-base text-base-content group-hover:text-primary transition-colors flex items-center justify-between">
                          <span>{patientFullName}</span>
                          {order.patient?.phone && (
                            <span className="text-[11px] font-mono font-medium text-base-content/60 bg-base-200/70 px-2 py-0.5 rounded-md">
                              {order.patient.phone}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-base-content/60 flex items-center gap-1">
                          <IconBuilding className="w-3.5 h-3.5 text-base-content/40 shrink-0" />
                          <span className="truncate">{order.laboratory?.name || 'Sede Laboratorio'}</span>
                        </div>
                      </div>

                      {/* Lista resumida de Estudios */}
                      <div className="bg-base-200/40 rounded-xl p-3 border border-base-200/60 space-y-2">
                        <div className="flex items-center justify-between text-[11px] font-bold text-base-content/70">
                          <span className="uppercase tracking-wider">Estudios Procesados ({studiesCount})</span>
                          <span className="badge badge-xs badge-success badge-outline font-mono font-bold">Avalado</span>
                        </div>
                        <ul className="text-xs text-base-content/80 space-y-1.5">
                          {order.analyses?.slice(0, 3).map((a) => (
                            <li key={a.id} className="flex items-center justify-between gap-2">
                              <span className="font-semibold text-base-content/90 truncate">• {a.analysis?.name}</span>
                              <span className="badge badge-xs badge-ghost text-[10px] font-bold text-success shrink-0">
                                Validado
                              </span>
                            </li>
                          ))}
                          {studiesCount > 3 && (
                            <li className="text-[10px] text-base-content/50 font-semibold italic">
                              + {studiesCount - 3} estudio(s) adicional(es) en el reporte
                            </li>
                          )}
                        </ul>
                      </div>

                      {/* Barra de Acciones de Entrega e Impresión */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-base-200">
                        {/* Acciones Secundarias */}
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => setCreatedOrderTicket(order)}
                            className="btn btn-xs btn-ghost text-base-content/70 hover:text-base-content font-bold rounded-lg gap-1"
                            title="Ver o reimprimir comprobante de recepción"
                          >
                            <IconPrinter className="w-3.5 h-3.5 text-base-content/50" />
                            <span className="hidden sm:inline">Comprobante</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setSelectedOrderForLabels(order)}
                            className="btn btn-xs btn-ghost text-secondary hover:bg-secondary/10 font-bold rounded-lg gap-1"
                            title="Reimprimir etiquetas térmicas para tubos Vacutainer"
                          >
                            <IconFlask className="w-3.5 h-3.5" />
                            <span>Tubos</span>
                          </button>
                        </div>

                        {/* Botones Principales con Tema DaisyUI */}
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleSendAutomatedWhatsApp(order)}
                            disabled={sendingWhatsAppOrderId === order.id}
                            className="btn btn-xs sm:btn-sm btn-success text-success-content font-bold gap-1.5 rounded-xl shadow-xs"
                            title="Despachar notificación automática oficial por WhatsApp vía UltraMsg"
                          >
                            {sendingWhatsAppOrderId === order.id ? (
                              <span className="loading loading-spinner loading-xs"></span>
                            ) : (
                              <IconPhone className="w-3.5 h-3.5" />
                            )}
                            <span>WhatsApp Auto</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setSelectedOrderForPDF(order)}
                            className="btn btn-xs sm:btn-sm btn-primary text-primary-content font-bold rounded-xl gap-1.5 shadow-xs"
                            title="Ver reporte médico oficial en PDF para impresión o descarga"
                          >
                            <IconPrinter className="w-3.5 h-3.5" />
                            <span>Imprimir PDF</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
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

      {/* MODAL DE ETIQUETAS TÉRMICAS VACUTAINER */}
      {selectedOrderForLabels && (
        <BarcodeThermalLabelModal
          order={selectedOrderForLabels}
          onClose={() => setSelectedOrderForLabels(null)}
        />
      )}

      {/* MODAL / COMPROBANTE DE TICKET SIMPLE */}
      {createdOrderTicket && (
        <dialog className="modal modal-open backdrop-blur-xs p-2 sm:p-4">
          <div className="modal-box w-full max-w-[95vw] sm:max-w-lg rounded-2xl p-4 sm:p-6 border border-base-200 shadow-xl max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between border-b border-base-200 pb-3 mb-4">
              <div className="flex items-center gap-2 text-primary font-bold text-base">
                <IconCheckCircle className="w-5 h-5 text-success" />
                <span>Comprobante de Recepción</span>
              </div>
              <button
                onClick={() => setCreatedOrderTicket(null)}
                className="btn btn-sm btn-circle btn-ghost"
              >
                <IconX className="w-4 h-4" />
              </button>
            </div>

            <div id="printable-ticket" className="bg-base-200/40 p-4 sm:p-5 rounded-xl border border-base-200 space-y-3 text-xs">
              <div className="text-center pb-2 border-b border-base-200">
                <h4 className="font-bold text-base text-base-content">{createdOrderTicket.laboratory?.name || 'LabSystem Clinique'}</h4>
                <p className="text-[11px] text-base-content/60">Comprobante de Recepción de Muestras Médicas</p>
                <div className="mt-2 inline-block bg-primary text-primary-content font-mono font-bold text-xs px-3 py-1 rounded-full">
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

              {/* QR de Autenticidad y Consulta para el Paciente */}
              <div className="pt-2.5 border-t border-base-200 flex items-center justify-between gap-3 bg-base-100/70 p-2.5 rounded-xl">
                <div className="text-left space-y-0.5">
                  <span className="text-[10px] text-primary font-black block uppercase tracking-wider">CONSULTA DIGITAL EN LÍNEA:</span>
                  <p className="text-[10.5px] text-base-content/70 font-medium">
                    Escanea este código con la cámara de tu celular para consultar tus resultados en tiempo real.
                  </p>
                </div>
                <div className="shrink-0 text-center">
                  <QRCodeSVG
                    value={`${window.location.origin}/results/${createdOrderTicket.id}`}
                    size={58}
                  />
                  <span className="block text-[7.5px] font-mono text-base-content/50 uppercase mt-0.5 font-bold">
                    VALIDAR
                  </span>
                </div>
              </div>
            </div>

            <div className="modal-action pt-4 border-t border-base-200 flex justify-end gap-2">
              <button
                onClick={() => setCreatedOrderTicket(null)}
                className="btn btn-ghost btn-sm rounded-xl font-semibold"
              >
                Cerrar
              </button>

              <button
                onClick={() => {
                  const targetOrd = createdOrderTicket;
                  setCreatedOrderTicket(null);
                  setSelectedOrderForLabels(targetOrd);
                }}
                className="btn btn-secondary btn-sm text-white font-bold rounded-xl gap-1.5 shadow-xs"
              >
                <IconFlask className="w-4 h-4" />
                Etiquetas Tubos
              </button>

              <button
                onClick={() => window.print()}
                className="btn btn-primary btn-sm text-primary-content font-bold rounded-xl gap-2 shadow-xs"
              >
                <IconPrinter className="w-4 h-4" />
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
        <dialog className="modal modal-open backdrop-blur-xs p-2 sm:p-4">
          <div className="modal-box w-full max-w-[95vw] sm:max-w-md rounded-2xl p-4 sm:p-6 border border-base-200 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-base-200 pb-3 mb-4">
              <h3 className="font-bold text-base text-base-content flex items-center gap-2">
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
                  className="btn btn-ghost btn-sm rounded-xl font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn-primary btn-sm text-primary-content font-bold rounded-xl"
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
