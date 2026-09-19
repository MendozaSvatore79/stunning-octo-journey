// src/components/Sidebar.tsx
import { type ReactNode } from 'react';
import { useUserContext } from '../hooks/useUserContext';
import {
  IconLayoutDashboard,
  IconFlask,
  IconUsers,
  IconClipboardList,
  IconFileText,
  IconSettings,
  IconUserPlus,
  IconBuilding,
  IconFolder,
  IconPlus,
  IconCertificate,
  IconChartLine,
  IconHeadphones,
  IconMicroscope,
  IconClock,
  IconCheckCircle,
} from './icons';

export type DashboardViewType =
  | 'dashboard'
  | 'labs'
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
  | 'support';

interface SidebarProps {
  children: ReactNode;
  activeView?: DashboardViewType;
  onSelectView?: (view: DashboardViewType) => void;
}

export default function Sidebar({ children, activeView = 'dashboard', onSelectView }: SidebarProps) {
  const { role, isAdmin, isLoading } = useUserContext();

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-base-200 gap-3">
        <span className="loading loading-spinner loading-lg text-primary"></span>
        <span className="text-sm font-semibold text-base-content/70">Cargando sistema clínico...</span>
      </div>
    );
  }

  const isOperationalUser = isAdmin || ['TECH', 'LAB_TECHNICIAN', 'RECEPTIONIST'].includes(role || '');

  const handleNav = (view: DashboardViewType) => {
    if (onSelectView) {
      onSelectView(view);
    }
  };

  const isLabsActive = ['labs', 'analysis-catalog', 'add-user'].includes(activeView);
  const isPatientsActive = ['patients', 'add-patient', 'patient-history'].includes(activeView);
  const isOrdersActive = ['create-order', 'pending-orders', 'completed-orders'].includes(activeView);
  const isQCActive = ['qc-controls', 'qc-results', 'qc-levey-jennings'].includes(activeView);

  return (
    <div className="drawer lg:drawer-open">
      <input id="main-drawer" type="checkbox" className="drawer-toggle" />

      <div className="drawer-content flex flex-col bg-base-200 min-h-screen overflow-x-hidden">
        {children}
      </div>

      <div className="drawer-side z-50">
        <label htmlFor="main-drawer" aria-label="close sidebar" className="drawer-overlay"></label>

        {/* Sidebar con Ancho Fijo Rígido w-64 (16rem) Estricto para Evitar Deformaciones al Desplegar */}
        <aside className="bg-base-100 min-h-screen w-64 min-w-[16rem] max-w-[16rem] flex flex-col border-r border-base-200 overflow-x-hidden shrink-0">
          {/* Logo del Sistema */}
          <div className="p-6 border-b border-base-200 flex items-center gap-3 shrink-0">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-black text-xl shadow-md shadow-blue-500/20 shrink-0">
              L
            </div>
            <div className="overflow-hidden">
              <span className="text-xl font-black text-base-content tracking-tight block leading-none truncate">LabSystem</span>
              <span className="text-[10px] uppercase font-bold text-primary tracking-widest block mt-1 truncate">
                {isAdmin ? 'Panel Administrador' : 'Portal Clínico'}
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

            {/* Submenú Dropdown de Laboratorios */}
            <li>
              <details open={isLabsActive}>
                <summary className={`py-2.5 rounded-xl gap-3 text-base-content/85 ${isLabsActive ? 'bg-base-200 font-bold' : ''}`}>
                  <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-500/20">
                    <IconFlask className="w-4 h-4" />
                  </div>
                  <span className="truncate">Laboratorios</span>
                </summary>
                <ul className="mt-1 space-y-0.5">
                  <li>
                    <button
                      onClick={() => handleNav('labs')}
                      className={`gap-2.5 text-xs py-2 rounded-lg ${activeView === 'labs' ? 'active font-bold' : ''}`}
                    >
                      <IconBuilding className="w-3.5 h-3.5 opacity-80 shrink-0" />
                      <span className="truncate">Directorio de Sedes</span>
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => handleNav('analysis-catalog')}
                      className={`gap-2.5 text-xs py-2 rounded-lg ${activeView === 'analysis-catalog' ? 'active font-bold' : ''}`}
                    >
                      <IconMicroscope className="w-3.5 h-3.5 opacity-80 shrink-0" />
                      <span className="truncate">Catálogo de Servicios</span>
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => handleNav('add-user')}
                      className={`gap-2.5 text-xs py-2 rounded-lg ${activeView === 'add-user' ? 'active font-bold' : ''}`}
                    >
                      <IconUserPlus className="w-3.5 h-3.5 opacity-80 shrink-0" />
                      <span className="truncate">Agregar Usuarios</span>
                    </button>
                  </li>
                </ul>
              </details>
            </li>

            {/* Submenú Dropdown de Pacientes */}
            {isOperationalUser && (
              <li>
                <details open={isPatientsActive}>
                  <summary className={`py-2.5 rounded-xl gap-3 text-base-content/85 ${isPatientsActive ? 'bg-base-200 font-bold' : ''}`}>
                    <div className="w-7 h-7 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-500/20">
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
            )}

            {/* Submenú Dropdown de Órdenes de Trabajo */}
            {isOperationalUser && (
              <li>
                <details open={isOrdersActive}>
                  <summary className={`py-2.5 rounded-xl gap-3 text-base-content/85 ${isOrdersActive ? 'bg-base-200 font-bold' : ''}`}>
                    <div className="w-7 h-7 rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0 border border-teal-500/20">
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
                        <span className="truncate">Pendientes</span>
                      </button>
                    </li>
                    <li>
                      <button
                        onClick={() => handleNav('completed-orders')}
                        className={`gap-2.5 text-xs py-2 rounded-lg ${activeView === 'completed-orders' ? 'active font-bold' : ''}`}
                      >
                        <IconCheckCircle className="w-3.5 h-3.5 text-success shrink-0" />
                        <span className="truncate">Completadas</span>
                      </button>
                    </li>
                  </ul>
                </details>
              </li>
            )}

            {/* SUBMENÚ DROPDOWN: CONTROL DE CALIDAD */}
            {isOperationalUser && (
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
            )}

            {/* OPCIÓN DE MENÚ: SOPORTE TÉCNICO CON GETSTREAM CHAT */}
            <li>
              <button
                onClick={() => handleNav('support')}
                className={`py-2.5 rounded-xl gap-3 text-base-content/85 ${activeView === 'support' ? 'active font-bold' : 'hover:bg-base-200'}`}
              >
                <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-primary/20">
                  <IconHeadphones className="w-4 h-4" />
                </div>
                <span className="truncate flex-1 text-left">Soporte Técnico</span>
                <span className="badge badge-accent badge-xs font-bold font-mono">LIVE</span>
              </button>
            </li>

            {isOperationalUser && (
              <li>
                <a className="py-2.5 rounded-xl gap-3 text-base-content/85 hover:bg-base-200">
                  <div className="w-7 h-7 rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0 border border-sky-500/20">
                    <IconFileText className="w-4 h-4" />
                  </div>
                  <span className="truncate">Resultados Clínicos</span>
                </a>
              </li>
            )}

            {isAdmin && (
              <li className="mt-2 pt-2 border-t border-base-200">
                <span className="menu-title text-[10px] uppercase font-bold text-primary tracking-widest px-3">
                  Administración Total
                </span>
                <button
                  onClick={() => handleNav('add-user')}
                  className={`py-2.5 rounded-xl gap-3 text-base-content/85 ${activeView === 'add-user' ? 'active font-bold' : 'hover:bg-base-200'}`}
                >
                  <div className="w-7 h-7 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-500/20">
                    <IconSettings className="w-4 h-4" />
                  </div>
                  <span className="truncate">Gestión de Usuarios</span>
                </button>
              </li>
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