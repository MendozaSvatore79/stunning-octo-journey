// src/components/OperatorDashboardView.tsx
import type { UserRole } from '../types/user';
import type { DashboardViewType } from './Sidebar';
import {
  IconFlask,
  IconUsers,
  IconClipboardList,
  IconPlus,
  IconUserPlus,
  IconChartLine,
  IconHeadphones,
  IconMicroscope,
  IconActivity,
} from './icons';

interface OperatorDashboardViewProps {
  userName?: string;
  role: UserRole | null;
  labs?: any[];
  isLoadingLabs?: boolean;
  onOpenCreateLab?: () => void;
  onOpenOnboarding?: () => void;
  onDeleteLabSuccess?: (id: string) => void;
  onNavigate?: (view: DashboardViewType) => void;
}

export default function OperatorDashboardView({
  userName,
  role,
  onNavigate,
}: OperatorDashboardViewProps) {
  const roleLabel =
    role === 'LAB_TECHNICIAN'
      ? 'Responsable del Laboratorio'
      : role === 'TECH'
      ? 'Técnico Analista'
      : role === 'RECEPTIONIST'
      ? 'Recepcionista Clínico'
      : 'Personal Clínico';

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-6">
      {/* ========================================================================= */}
      {/* 1. CABECERA CLÍNICA MINIMALISTA Y ELEGANTE */}
      {/* ========================================================================= */}
      <section className="card bg-base-100 border border-teal-500/15 p-5 sm:p-6 shadow-xs rounded-2xl relative overflow-hidden">
        {/* Acento de brillo clínico de fondo */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-teal-500/10 via-sky-500/5 to-transparent rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 relative z-10">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 py-1 px-2.5 rounded-full text-xs font-semibold bg-teal-50 text-teal-800 dark:bg-teal-950/60 dark:text-teal-200 border border-teal-200/80 dark:border-teal-800/80 shadow-xs">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500"></span>
                </span>
                {roleLabel}
              </span>
              <span className="text-xs text-base-content/50 font-medium">
                • Estación Analítica
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-base-content tracking-tight">
              Hola, {userName || 'Colega'} 👋
            </h1>
            <p className="text-xs sm:text-sm text-base-content/70 max-w-lg leading-relaxed">
              Panel de control simplificado para la gestión diaria de pacientes, recepción de muestras y aseguramiento analítico.
            </p>
          </div>

          {/* Acciones Clínicas de Mayor Prioridad */}
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={() => onNavigate?.('create-order')}
              className="btn btn-sm text-white font-semibold rounded-xl gap-2 shadow-sm transition-all border-none bg-teal-600 hover:bg-teal-700 hover:shadow-teal-600/25"
            >
              <IconPlus className="w-4 h-4" />
              Nueva Orden
            </button>
            <button
              onClick={() => onNavigate?.('add-patient')}
              className="btn btn-sm font-semibold rounded-xl gap-2 transition-all border border-sky-300 dark:border-sky-800 text-sky-700 dark:text-sky-300 bg-sky-50/60 hover:bg-sky-100/80 dark:bg-sky-950/30 dark:hover:bg-sky-950/60"
            >
              <IconUserPlus className="w-4 h-4" />
              Registrar Paciente
            </button>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. CUADRÍCULA DE MÓDULOS ESENCIALES CON CÓDIGO DE COLOR CLÍNICO (2x2) */}
      {/* ========================================================================= */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-5">
        
        {/* MÓDULO 1: ÓRDENES DE TRABAJO (TEAL BIO-CLÍNICO) */}
        <div className="card bg-base-100 border border-teal-500/20 hover:border-teal-500/50 p-6 rounded-2xl shadow-xs hover:shadow-md transition-all flex flex-col justify-between group">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-2xl bg-teal-50 dark:bg-teal-950/50 text-teal-600 dark:text-teal-300 border border-teal-200/60 dark:border-teal-800/60 flex items-center justify-center transition-transform group-hover:scale-105">
                <IconClipboardList className="w-6 h-6" />
              </div>
              <span className="badge badge-sm py-2 px-2.5 font-semibold text-teal-800 bg-teal-50 dark:bg-teal-950/50 dark:text-teal-300 border border-teal-200 dark:border-teal-800 text-[11px]">
                Recepción & Muestras
              </span>
            </div>

            <h2 className="text-lg font-bold text-base-content group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
              Órdenes de Trabajo
            </h2>
            <p className="text-xs text-base-content/65 mt-1.5 leading-relaxed">
              Genera solicitudes de análisis clínicos, imprime fichas térmicas de toma de muestra y captura resultados validados.
            </p>
          </div>

          <div className="pt-5 mt-4 border-t border-teal-500/10 flex items-center justify-between gap-3">
            <button
              onClick={() => onNavigate?.('create-order')}
              className="btn btn-sm rounded-xl gap-2 font-semibold text-xs text-white bg-teal-600 hover:bg-teal-700 border-none shadow-xs flex-1"
            >
              <IconPlus className="w-4 h-4" /> Crear Orden
            </button>
            <button
              onClick={() => onNavigate?.('pending-orders')}
              className="btn btn-sm btn-ghost hover:bg-teal-50 dark:hover:bg-teal-950/40 text-teal-700 dark:text-teal-300 rounded-xl text-xs font-semibold flex-1"
            >
              Ver Pendientes →
            </button>
          </div>
        </div>

        {/* MÓDULO 2: PACIENTES Y EXPEDIENTES (AZUL COBALTO DIAGNÓSTICO) */}
        <div className="card bg-base-100 border border-sky-500/20 hover:border-sky-500/50 p-6 rounded-2xl shadow-xs hover:shadow-md transition-all flex flex-col justify-between group">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-2xl bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-300 border border-sky-200/60 dark:border-sky-800/60 flex items-center justify-center transition-transform group-hover:scale-105">
                <IconUsers className="w-6 h-6" />
              </div>
              <span className="badge badge-sm py-2 px-2.5 font-semibold text-sky-800 bg-sky-50 dark:bg-sky-950/50 dark:text-sky-300 border border-sky-200 dark:border-sky-800 text-[11px]">
                Padrón Clínico
              </span>
            </div>

            <h2 className="text-lg font-bold text-base-content group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
              Pacientes y Registro
            </h2>
            <p className="text-xs text-base-content/65 mt-1.5 leading-relaxed">
              Alta rápida de pacientes, consulta del historial clínico, datos demográficos, antecedentes y expedientes médicos.
            </p>
          </div>

          <div className="pt-5 mt-4 border-t border-sky-500/10 flex items-center justify-between gap-3">
            <button
              onClick={() => onNavigate?.('add-patient')}
              className="btn btn-sm rounded-xl gap-2 font-semibold text-xs text-white bg-sky-600 hover:bg-sky-700 border-none shadow-xs flex-1"
            >
              <IconUserPlus className="w-4 h-4" /> Registrar Paciente
            </button>
            <button
              onClick={() => onNavigate?.('patients')}
              className="btn btn-sm btn-ghost hover:bg-sky-50 dark:hover:bg-sky-950/40 text-sky-700 dark:text-sky-300 rounded-xl text-xs font-semibold flex-1"
            >
              Directorio Clínico →
            </button>
          </div>
        </div>

        {/* MÓDULO 3: CONTROL DE CALIDAD (BIO-MINT / ESMERALDA ANALÍTICO) */}
        <div className="card bg-base-100 border border-emerald-500/20 hover:border-emerald-500/50 p-6 rounded-2xl shadow-xs hover:shadow-md transition-all flex flex-col justify-between group">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60 flex items-center justify-center transition-transform group-hover:scale-105">
                <IconFlask className="w-6 h-6" />
              </div>
              <span className="badge badge-sm py-2 px-2.5 font-semibold text-emerald-800 bg-emerald-50 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[11px]">
                Garantía Analítica
              </span>
            </div>

            <h2 className="text-lg font-bold text-base-content group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
              Control de Calidad (QC)
            </h2>
            <p className="text-xs text-base-content/65 mt-1.5 leading-relaxed">
              Captura de corridas analíticas de calibradores, evaluación de reglas de Westgard y gráficas de Levey-Jennings.
            </p>
          </div>

          <div className="pt-5 mt-4 border-t border-emerald-500/10 flex items-center justify-between gap-3">
            <button
              onClick={() => onNavigate?.('qc-controls')}
              className="btn btn-sm rounded-xl gap-2 font-semibold text-xs text-white bg-emerald-600 hover:bg-emerald-700 border-none shadow-xs flex-1"
            >
              <IconFlask className="w-4 h-4" /> Lotes de Control
            </button>
            <button
              onClick={() => onNavigate?.('qc-levey-jennings')}
              className="btn btn-sm btn-ghost hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 rounded-xl text-xs font-semibold gap-1.5 flex-1"
            >
              <IconChartLine className="w-4 h-4" /> Levey-Jennings →
            </button>
          </div>
        </div>

        {/* MÓDULO 4: CATÁLOGO DE SERVICIOS (ÍNDIGO / PÚRPURA DE DIAGNÓSTICO) */}
        <div className="card bg-base-100 border border-indigo-500/20 hover:border-indigo-500/50 p-6 rounded-2xl shadow-xs hover:shadow-md transition-all flex flex-col justify-between group">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60 flex items-center justify-center transition-transform group-hover:scale-105">
                <IconMicroscope className="w-6 h-6" />
              </div>
              <span className="badge badge-sm py-2 px-2.5 font-semibold text-indigo-800 bg-indigo-50 dark:bg-indigo-950/50 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-[11px]">
                Pruebas & Parámetros
              </span>
            </div>

            <h2 className="text-lg font-bold text-base-content group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
              Catálogo de Servicios
            </h2>
            <p className="text-xs text-base-content/65 mt-1.5 leading-relaxed">
              Catálogo oficial de estudios clínicos, valores de referencia por edad y sexo, unidades de medida y metodologías.
            </p>
          </div>

          <div className="pt-5 mt-4 border-t border-indigo-500/10 flex items-center justify-between gap-3">
            <button
              onClick={() => onNavigate?.('analysis-catalog')}
              className="btn btn-sm rounded-xl gap-2 font-semibold text-xs text-white bg-indigo-600 hover:bg-indigo-700 border-none shadow-xs flex-1"
            >
              <IconMicroscope className="w-4 h-4" /> Ver Catálogo
            </button>
            <button
              onClick={() => onNavigate?.('add-analysis')}
              className="btn btn-sm btn-ghost hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 rounded-xl text-xs font-semibold flex-1"
            >
              + Alta de Prueba →
            </button>
          </div>
        </div>

      </section>

      {/* ========================================================================= */}
      {/* 3. DOCK CLÍNICO DE ATAJOS RÁPIDOS EN 1 SOLO CLIC */}
      {/* ========================================================================= */}
      <section className="bg-base-100 border border-base-200 p-4 rounded-2xl shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-bold text-base-content/75 uppercase tracking-wider">
            <IconActivity className="w-4 h-4 text-teal-600 dark:text-teal-400" />
            <span>Atajos Rápidos de Turno</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => onNavigate?.('pending-orders')}
              className="btn btn-xs rounded-xl font-medium border border-teal-200 dark:border-teal-800 bg-teal-50/50 hover:bg-teal-100/70 dark:bg-teal-950/30 text-teal-700 dark:text-teal-300"
            >
              Captura de Resultados
            </button>
            <button
              onClick={() => onNavigate?.('completed-orders')}
              className="btn btn-xs rounded-xl font-medium border border-base-300 bg-base-200/50 hover:bg-base-200 text-base-content/70"
            >
              Órdenes Completadas
            </button>
            <button
              onClick={() => onNavigate?.('reagents')}
              className="btn btn-xs rounded-xl font-medium border border-base-300 bg-base-200/50 hover:bg-base-200 text-base-content/70"
            >
              Inventario de Reactivos
            </button>
            <button
              onClick={() => onNavigate?.('support')}
              className="btn btn-xs rounded-xl font-medium border border-primary/20 text-primary hover:bg-primary/10 gap-1"
            >
              <IconHeadphones className="w-3.5 h-3.5" />
              Soporte Synova
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
