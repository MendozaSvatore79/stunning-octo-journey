// src/components/Sidebar.tsx
import { type ReactNode } from 'react';
import { useUserContext } from '../hooks/useUserContext';
import { useLabBranding } from '../context/LabBrandingContext';
import {
  IconLayoutDashboard,
  IconFlask,
  IconUsers,
  IconClipboardList,
  IconUserPlus,
  IconBuilding,
  IconFolder,
  IconPlus,
  IconCertificate,
  IconChartLine,
  IconMicroscope,
  IconClock,
  IconCheckCircle,
  IconTicket,
  IconHistory,
  IconHeartPulse,
  IconMegaphone,
  IconHandshake,
  IconQrCode,
} from './icons';

export type DashboardViewType =
  | 'dashboard'
  | 'labs'
  | 'create-lab'
  | 'analysis-catalog'
  | 'add-user'
  | 'patients'
  | 'add-patient'
  | 'patient-history'
  | 'create-order'
  | 'pending-orders'
  | 'completed-orders'
  | 'qc-controls'
  | 'qc-results'
  | 'qc-levey-jennings'
  | 'reagents'
  | 'analyzers'
  | 'support'
  | 'tickets'
  | 'audit-logs'
  | 'system-health'
  | 'announcements'
  | 'price-agreements'
  | 'report-templates'
  | 'general-settings';

interface SidebarProps {
  children: ReactNode;
  activeView?: DashboardViewType;
  onSelectView?: (view: DashboardViewType) => void;
  onOpenCreateLab?: () => void;
}

export default function Sidebar({
  children,
  activeView = 'dashboard',
  onSelectView,
  onOpenCreateLab,
}: SidebarProps) {
  const { role, isAdmin, isLoading } = useUserContext();
  const { activeBranding } = useLabBranding();

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-base-200 gap-3">
        <span className="loading loading-spinner loading-lg text-primary"></span>
        <span className="text-sm font-semibold text-base-content/70">Cargando sistema clínico...</span>
      </div>
    );
  }

  const isOperationalUser = !isAdmin && ['TECH', 'LAB_TECHNICIAN', 'RECEPTIONIST'].includes(role || '');

  const handleNav = (view: DashboardViewType) => {
    if (onSelectView) {
      onSelectView(view);
    }
    // Cerrar automáticamente el drawer en pantallas móviles (Samsung S21, iPhone, etc.)
    const drawerCheckbox = document.getElementById('main-drawer') as HTMLInputElement | null;
    if (drawerCheckbox && drawerCheckbox.checked) {
      drawerCheckbox.checked = false;
    }
  };

  const isPatientsActive = ['patients', 'add-patient', 'patient-history'].includes(activeView);
  const isOrdersActive = ['create-order', 'pending-orders', 'completed-orders'].includes(activeView);
  const isQCActive = ['qc-controls', 'qc-results', 'qc-levey-jennings'].includes(activeView);

  return (
    <div className="drawer lg:drawer-open">
      <input id="main-drawer" type="checkbox" className="drawer-toggle" />

      <div className="drawer-content flex flex-col bg-base-200 min-h-screen overflow-x-hidden w-full max-w-full">
        {children}
      </div>

      <div className="drawer-side z-50">
        <label htmlFor="main-drawer" aria-label="close sidebar" className="drawer-overlay"></label>

        {/* Sidebar responsivo para móviles pequeños hasta pantallas grandes */}
        <aside className="bg-base-100 min-h-screen w-72 max-w-[85vw] flex flex-col border-r border-base-200 overflow-x-hidden shrink-0">
          {/* Logo del Sistema Dinámico por Sede */}
          <div className="p-5 border-b border-base-200 flex items-center gap-3 shrink-0">
            {activeBranding.logo ? (
              <img
                src={activeBranding.logo}
                alt={activeBranding.name}
                className="w-10 h-10 rounded-2xl object-cover border border-base-300 shadow-sm shrink-0 bg-white"
              />
            ) : (
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-teal-600 to-cyan-700 text-white flex items-center justify-center shadow-md shadow-teal-500/20 shrink-0">
                <IconFlask className="w-5 h-5 text-white" />
              </div>
            )}
            <div className="overflow-hidden min-w-0">
              <span className="text-lg font-black text-base-content tracking-tight block leading-tight truncate">
                {activeBranding.name || 'LabSystem'}
              </span>
              <span className="text-[10px] uppercase font-bold text-primary tracking-widest block mt-0.5 truncate">
                {activeBranding.subtitle || (isAdmin ? 'Panel Administrador' : 'Portal Clínico')}
              </span>
            </div>
          </div>

          {/* Menú de Navegación con Submenús Dropdown */}
          <ul className="menu p-3 w-full flex-1 gap-1 text-sm font-semibold overflow-x-hidden">
            <li>
              <button
                onClick={() => handleNav('dashboard')}
                className={`py-2.5 rounded-xl gap-3 text-base-content ${activeView === 'dashboard' ? 'active font-bold' : 'hover:bg-base-200'}`}
              >
                <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-primary/20">
                  <IconLayoutDashboard className="w-4 h-4" />
                </div>
                <span className="truncate">Dashboard</span>
              </button>
            </li>

            {/* ======================================================== */}
            {/* 1. SECCIÓN OPERATIVA: PERSONAL DE SEDE (TÉCNICOS, QUÍMICOS) */}
            {/* ======================================================== */}
            {isOperationalUser && (
              <>
                {/* Submenú Dropdown de Pacientes */}
                <li>
                  <details open={isPatientsActive}>
                    <summary className={`py-2.5 rounded-xl gap-3 text-base-content/85 ${isPatientsActive ? 'bg-base-200 font-bold' : ''}`}>
                      <div className="w-7 h-7 rounded-lg bg-secondary/10 text-secondary flex items-center justify-center shrink-0 border border-secondary/20">
                        <IconUsers className="w-4 h-4" />
                      </div>
                      <span className="truncate">Pacientes</span>
                    </summary>
                    <ul className="mt-1 space-y-0.5">
                      <li>
                        <button
                          onClick={() => handleNav('patients')}
                          className={`gap-2.5 text-xs py-2 rounded-lg ${activeView === 'patients' ? 'active font-bold' : ''}`}
                        >
                          <IconUsers className="w-3.5 h-3.5 opacity-80 shrink-0" />
                          <span className="truncate">Directorio de Pacientes</span>
                        </button>
                      </li>
                      <li>
                        <button
                          onClick={() => handleNav('add-patient')}
                          className={`gap-2.5 text-xs py-2 rounded-lg ${activeView === 'add-patient' ? 'active font-bold' : ''}`}
                        >
                          <IconUserPlus className="w-3.5 h-3.5 opacity-80 shrink-0" />
                          <span className="truncate">Registrar Nuevo</span>
                        </button>
                      </li>
                      <li>
                        <button
                          onClick={() => handleNav('patient-history')}
                          className={`gap-2.5 text-xs py-2 rounded-lg ${activeView === 'patient-history' ? 'active font-bold' : ''}`}
                        >
                          <IconFolder className="w-3.5 h-3.5 opacity-80 shrink-0" />
                          <span className="truncate">Historial Clínico</span>
                        </button>
                      </li>
                    </ul>
                  </details>
                </li>

                {/* Submenú Dropdown de Órdenes de Trabajo */}
                <li>
                  <details open={isOrdersActive}>
                    <summary className={`py-2.5 rounded-xl gap-3 text-base-content/85 ${isOrdersActive ? 'bg-base-200 font-bold' : ''}`}>
                      <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-primary/20">
                        <IconClipboardList className="w-4 h-4" />
                      </div>
                      <span className="truncate">Órdenes de Trabajo</span>
                    </summary>
                    <ul className="mt-1 space-y-0.5">
                      <li>
                        <button
                          onClick={() => handleNav('create-order')}
                          className={`gap-2.5 text-xs py-2 rounded-lg ${activeView === 'create-order' ? 'active font-bold' : ''}`}
                        >
                          <IconPlus className="w-3.5 h-3.5 opacity-80 shrink-0" />
                          <span className="truncate">Crear Orden</span>
                        </button>
                      </li>
                      <li>
                        <button
                          onClick={() => handleNav('pending-orders')}
                          className={`gap-2.5 text-xs py-2 rounded-lg ${activeView === 'pending-orders' ? 'active font-bold' : ''}`}
                        >
                          <IconClock className="w-3.5 h-3.5 text-warning shrink-0" />
                          <span className="whitespace-nowrap font-medium">Pendientes</span>
                        </button>
                      </li>
                      <li>
                        <button
                          onClick={() => handleNav('completed-orders')}
                          className={`gap-2.5 text-xs py-2 rounded-lg ${activeView === 'completed-orders' ? 'active font-bold' : ''}`}
                        >
                          <IconCheckCircle className="w-3.5 h-3.5 text-success shrink-0" />
                          <span className="whitespace-nowrap font-medium">Completadas</span>
                        </button>
                      </li>
                    </ul>
                  </details>
                </li>

                {/* SUBMENÚ: CONTROL DE CALIDAD */}
                <li>
                  <details open={isQCActive}>
                    <summary className={`py-2.5 rounded-xl gap-3 text-base-content/85 ${isQCActive ? 'bg-base-200 font-bold' : ''}`}>
                      <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/20">
                        <IconCertificate className="w-4 h-4" />
                      </div>
                      <span className="truncate">Control de Calidad</span>
                    </summary>
                    <ul className="mt-1 space-y-0.5">
                      <li>
                        <button
                          onClick={() => handleNav('qc-controls')}
                          className={`gap-2.5 text-xs py-2 rounded-lg ${activeView === 'qc-controls' ? 'active font-bold' : ''}`}
                        >
                          <IconFlask className="w-3.5 h-3.5 opacity-80 shrink-0" />
                          <span className="truncate">Controles</span>
                        </button>
                      </li>
                      <li>
                        <button
                          onClick={() => handleNav('qc-results')}
                          className={`gap-2.5 text-xs py-2 rounded-lg ${activeView === 'qc-results' ? 'active font-bold' : ''}`}
                        >
                          <IconClipboardList className="w-3.5 h-3.5 opacity-80 shrink-0" />
                          <span className="truncate">Resultados a Controles</span>
                        </button>
                      </li>
                      <li>
                        <button
                          onClick={() => handleNav('qc-levey-jennings')}
                          className={`gap-2.5 text-xs py-2 rounded-lg leading-tight text-left ${activeView === 'qc-levey-jennings' ? 'active font-bold' : ''}`}
                          title="Gráfica de Levey Jennings"
                        >
                          <IconChartLine className="w-3.5 h-3.5 text-success shrink-0" />
                          <span className="truncate">Gráfica de Levey Jennings</span>
                        </button>
                      </li>
                    </ul>
                  </details>
                </li>

                {/* INVENTARIO DE REACTIVOS (ISO 15189) */}
                <li>
                  <button
                    onClick={() => handleNav('reagents')}
                    className={`py-2.5 rounded-xl gap-3 text-base-content/85 ${activeView === 'reagents' ? 'active font-bold' : 'hover:bg-base-200'}`}
                  >
                    <div className="w-7 h-7 rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0 border border-teal-500/20">
                      <IconFlask className="w-4 h-4" />
                    </div>
                    <span className="truncate flex-1 text-left">Reactivos e Insumos</span>
                    <span className="badge badge-primary badge-xs font-bold text-[9px]">STOCK</span>
                  </button>
                </li>

                {/* ANALIZADORES CLÍNICOS (ASTM / HL7) */}
                <li>
                  <button
                    onClick={() => handleNav('analyzers')}
                    className={`py-2.5 rounded-xl gap-3 text-base-content/85 ${activeView === 'analyzers' ? 'active font-bold' : 'hover:bg-base-200'}`}
                  >
                    <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-500/20">
                      <IconMicroscope className="w-4 h-4" />
                    </div>
                    <span className="truncate flex-1 text-left">Analizadores LIS</span>
                    <span className="badge badge-success text-white badge-xs font-bold text-[9px]">ASTM/HL7</span>
                  </button>
                </li>

                {/* Gestión de Sede para Encargado del Laboratorio */}
                {role === 'LAB_TECHNICIAN' && (
                  <>
                    <li className="mt-2 pt-2 border-t border-base-200">
                      <span className="menu-title text-[10px] uppercase font-bold text-primary tracking-widest px-3">
                        Sede y Establecimiento
                      </span>
                    </li>
                    <li>
                      <button
                        onClick={() => {
                          if (onOpenCreateLab) {
                            onOpenCreateLab();
                          } else {
                            handleNav('create-lab');
                          }
                        }}
                        className="py-2.5 rounded-xl gap-3 text-base-content/85 hover:bg-base-200"
                        title="Dar de alta una nueva sede o laboratorio con permisos sanitarios"
                      >
                        <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-primary/20">
                          <IconPlus className="w-4 h-4" />
                        </div>
                        <span className="truncate flex-1 text-left">Dar de Alta Sede</span>
                        <span className="badge badge-primary badge-xs font-bold text-[9px]">REGISTRO</span>
                      </button>
                    </li>
                    <li>
                      <button
                        onClick={() => handleNav('general-settings')}
                        className={`py-2.5 rounded-xl gap-3 text-base-content/85 ${activeView === 'general-settings' ? 'active font-bold' : 'hover:bg-base-200'}`}
                        title="Configurar logotipo y datos de esta sede"
                      >
                        <div className="w-7 h-7 rounded-lg bg-base-300 text-base-content flex items-center justify-center shrink-0 border border-base-content/10">
                          <IconBuilding className="w-4 h-4" />
                        </div>
                        <span className="truncate flex-1 text-left">Configuración de Sede</span>
                      </button>
                    </li>
                  </>
                )}
              </>
            )}

            {/* ======================================================== */}
            {/* 2. SECCIÓN EXCLUSIVA: ADMINISTRADOR GLOBAL (GOBERNANZA) */}
            {/* ======================================================== */}
            {isAdmin && (
              <>
                <li className="mt-2 pt-2 border-t border-base-200">
                  <span className="menu-title text-[10px] uppercase font-bold text-primary tracking-widest px-3">
                    Red Hospitalaria y Catálogo
                  </span>
                </li>

                <li>
                  <button
                    onClick={() => handleNav('labs')}
                    className={`py-2.5 rounded-xl gap-3 text-base-content/85 ${activeView === 'labs' ? 'active font-bold' : 'hover:bg-base-200'}`}
                    title="Supervisión y creación de laboratorios de la red"
                  >
                    <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-primary/20">
                      <IconBuilding className="w-4 h-4" />
                    </div>
                    <span className="truncate flex-1 text-left">Directorio de Sedes</span>
                  </button>
                </li>

                <li>
                  <button
                    onClick={() => handleNav('analysis-catalog')}
                    className={`py-2.5 rounded-xl gap-3 text-base-content/85 ${activeView === 'analysis-catalog' ? 'active font-bold' : 'hover:bg-base-200'}`}
                    title="Catálogo unificado de estudios clínicos"
                  >
                    <div className="w-7 h-7 rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0 border border-teal-500/20">
                      <IconMicroscope className="w-4 h-4" />
                    </div>
                    <span className="truncate flex-1 text-left">Catálogo de Servicios</span>
                  </button>
                </li>

                <li>
                  <button
                    onClick={() => handleNav('add-user')}
                    className={`py-2.5 rounded-xl gap-3 text-base-content/85 ${activeView === 'add-user' ? 'active font-bold' : 'hover:bg-base-200'}`}
                    title="Gestión de usuarios y personal adscrito a las sedes"
                  >
                    <div className="w-7 h-7 rounded-lg bg-secondary/10 text-secondary flex items-center justify-center shrink-0 border border-secondary/20">
                      <IconUserPlus className="w-4 h-4" />
                    </div>
                    <span className="truncate flex-1 text-left">Gestión de Personal</span>
                  </button>
                </li>

                <li className="mt-2 pt-2 border-t border-base-200">
                  <span className="menu-title text-[10px] uppercase font-bold text-primary tracking-widest px-3">
                    Gobernanza y Control Central
                  </span>
                </li>

                <li>
                  <button
                    onClick={() => handleNav('audit-logs')}
                    className={`py-2.5 rounded-xl gap-3 text-base-content/85 ${activeView === 'audit-logs' ? 'active font-bold' : 'hover:bg-base-200'}`}
                    title="Bitácora inmutable de auditoría y trazabilidad ISO 15189"
                  >
                    <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/20">
                      <IconHistory className="w-4 h-4" />
                    </div>
                    <span className="truncate flex-1 text-left">Bitácora de Auditoría</span>
                  </button>
                </li>

                <li>
                  <button
                    onClick={() => handleNav('system-health')}
                    className={`py-2.5 rounded-xl gap-3 text-base-content/85 ${activeView === 'system-health' ? 'active font-bold' : 'hover:bg-base-200'}`}
                    title="Monitor en vivo de infraestructura, latencia de base de datos y memoria"
                  >
                    <div className="w-7 h-7 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 border border-rose-500/20">
                      <IconHeartPulse className="w-4 h-4" />
                    </div>
                    <span className="truncate flex-1 text-left">Salud del Sistema</span>
                  </button>
                </li>

                <li>
                  <button
                    onClick={() => handleNav('announcements')}
                    className={`py-2.5 rounded-xl gap-3 text-base-content/85 ${activeView === 'announcements' ? 'active font-bold' : 'hover:bg-base-200'}`}
                    title="Emisión y control de comunicados globales y alertas operativas"
                  >
                    <div className="w-7 h-7 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-500/20">
                      <IconMegaphone className="w-4 h-4" />
                    </div>
                    <span className="truncate flex-1 text-left">Comunicados Globales</span>
                  </button>
                </li>

                <li>
                  <button
                    onClick={() => handleNav('price-agreements')}
                    className={`py-2.5 rounded-xl gap-3 text-base-content/85 ${activeView === 'price-agreements' ? 'active font-bold' : 'hover:bg-base-200'}`}
                    title="Gestión de convenios, tarifas especiales y aseguradoras"
                  >
                    <div className="w-7 h-7 rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0 border border-teal-500/20">
                      <IconHandshake className="w-4 h-4" />
                    </div>
                    <span className="truncate flex-1 text-left">Convenios y Precios</span>
                  </button>
                </li>

                <li>
                  <button
                    onClick={() => handleNav('report-templates')}
                    className={`py-2.5 rounded-xl gap-3 text-base-content/85 ${activeView === 'report-templates' ? 'active font-bold' : 'hover:bg-base-200'}`}
                    title="Personalización de plantilla médica, firmas y código QR"
                  >
                    <div className="w-7 h-7 rounded-lg bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center shrink-0 border border-cyan-500/20">
                      <IconQrCode className="w-4 h-4" />
                    </div>
                    <span className="truncate flex-1 text-left">Plantilla Oficial & QR</span>
                  </button>
                </li>

                <li>
                  <button
                    onClick={() => handleNav('tickets')}
                    className={`py-2.5 rounded-xl gap-3 text-base-content/85 ${activeView === 'tickets' ? 'active font-bold' : 'hover:bg-base-200'}`}
                    title="Gestión y supervisión de tickets de soporte técnico generados por Synova IA"
                  >
                    <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/20">
                      <IconTicket className="w-4 h-4" />
                    </div>
                    <span className="truncate flex-1 text-left">Tickets de Soporte</span>
                  </button>
                </li>

                <li>
                  <button
                    onClick={() => handleNav('general-settings')}
                    className={`py-2.5 rounded-xl gap-3 text-base-content/85 ${activeView === 'general-settings' ? 'active font-bold' : 'hover:bg-base-200'}`}
                    title="Configuración de identidad institucional de la sede activa"
                  >
                    <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-primary/20">
                      <IconBuilding className="w-4 h-4" />
                    </div>
                    <span className="truncate flex-1 text-left">Configuración General</span>
                  </button>
                </li>
              </>
            )}
          </ul>

          {/* Pie de Sidebar */}
          <div className="p-4 border-t border-base-200 text-xs text-base-content/50 text-center font-medium shrink-0">
            v1.0.0 • LabSystem Clinique
          </div>
        </aside>
      </div>
    </div>
  );
}