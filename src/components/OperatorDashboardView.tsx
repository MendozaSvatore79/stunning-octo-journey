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
  IconArrowRight,
  IconMicroscope,
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
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* 1. Cabecera Principal Limpia y Despejada */}
      <section className="card bg-base-100 border border-base-200 p-5 sm:p-6 shadow-xs rounded-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="badge badge-sm badge-outline text-primary border-primary/30 font-semibold gap-1.5 py-2.5 px-3">
                <IconFlask className="w-3.5 h-3.5" />
                {roleLabel}
              </span>
              <span className="badge badge-sm badge-ghost text-base-content/60 font-medium">
                Panel Operativo
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-base-content tracking-tight">
              Hola, {userName || 'Colega'} 👋
            </h1>
            <p className="text-xs sm:text-sm text-base-content/70 max-w-xl leading-relaxed">
              Bienvenida a tu espacio de trabajo. Aquí tienes los accesos directos y esenciales para gestionar tus actividades del día.
            </p>
          </div>

          {/* Acciones Rápidas Principales */}
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={() => onNavigate?.('create-order')}
              className="btn btn-primary btn-sm gap-2 font-semibold rounded-xl shadow-xs"
            >
              <IconPlus className="w-4 h-4" />
              Nueva Orden
            </button>
            <button
              onClick={() => onNavigate?.('add-patient')}
              className="btn btn-outline btn-primary btn-sm gap-2 font-semibold rounded-xl shadow-xs"
            >
              <IconUserPlus className="w-4 h-4" />
              Registrar Paciente
            </button>
          </div>
        </div>
      </section>

      {/* 2. Métricas Operativas Clave (Solo lo esencial) */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Métrica 1: Órdenes de Trabajo */}
        <div
          onClick={() => onNavigate?.('pending-orders')}
          className="card bg-base-100 border border-base-200 p-4 rounded-2xl shadow-xs hover:border-primary/40 hover:shadow-sm transition-all cursor-pointer flex flex-row items-center justify-between"
        >
          <div className="space-y-0.5">
            <span className="text-[11px] font-semibold text-base-content/60 uppercase tracking-wider">
              Órdenes de Trabajo
            </span>
            <div className="text-base font-bold text-base-content">
              Flujo Diario
            </div>
            <p className="text-[11px] text-base-content/50">
              Recepción, tomas y captura analítica
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <IconClipboardList className="w-5 h-5" />
          </div>
        </div>

        {/* Métrica 2: Pacientes */}
        <div
          onClick={() => onNavigate?.('patients')}
          className="card bg-base-100 border border-base-200 p-4 rounded-2xl shadow-xs hover:border-sky-500/40 hover:shadow-sm transition-all cursor-pointer flex flex-row items-center justify-between"
        >
          <div className="space-y-0.5">
            <span className="text-[11px] font-semibold text-base-content/60 uppercase tracking-wider">
              Pacientes
            </span>
            <div className="text-base font-bold text-base-content">
              Expedientes Clínicos
            </div>
            <p className="text-[11px] text-base-content/50">
              Padrón y búsqueda de pacientes
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-600 flex items-center justify-center shrink-0">
            <IconUsers className="w-5 h-5" />
          </div>
        </div>

        {/* Métrica 3: Control de Calidad */}
        <div
          onClick={() => onNavigate?.('qc-controls')}
          className="card bg-base-100 border border-base-200 p-4 rounded-2xl shadow-xs hover:border-emerald-500/40 hover:shadow-sm transition-all cursor-pointer flex flex-row items-center justify-between"
        >
          <div className="space-y-0.5">
            <span className="text-[11px] font-semibold text-base-content/60 uppercase tracking-wider">
              Control de Calidad
            </span>
            <div className="text-base font-bold text-base-content">
              Calidad Analítica
            </div>
            <p className="text-[11px] text-base-content/50">
              Lotes QC y gráficas Levey-Jennings
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
            <IconFlask className="w-5 h-5" />
          </div>
        </div>
      </section>

      {/* 3. Cuadrícula de Módulos Esenciales (2x2 Limpio, sin barra lateral) */}
      <section className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-xs font-bold text-base-content/70 uppercase tracking-wider">
            Módulos de Trabajo Diario
          </h2>
          <span className="text-xs text-base-content/40">
            Accesos directos
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Card 1: Órdenes de Trabajo */}
          <div className="card bg-base-100 border border-base-200 p-5 rounded-2xl shadow-xs hover:border-primary/40 transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <IconClipboardList className="w-5 h-5" />
                </div>
                <span className="badge badge-ghost badge-sm text-[11px] text-base-content/60 font-medium">
                  Recepción & Muestras
                </span>
              </div>
              <h3 className="font-bold text-base text-base-content mb-1">
                Órdenes de Trabajo
              </h3>
              <p className="text-xs text-base-content/60 leading-relaxed mb-4">
                Genera solicitudes de análisis, asigna estudios, imprime fichas de toma y captura los resultados analíticos.
              </p>
            </div>
            <div className="flex items-center gap-2 pt-3 border-t border-base-100">
              <button
                onClick={() => onNavigate?.('create-order')}
                className="btn btn-sm btn-primary rounded-xl gap-2 font-semibold text-xs flex-1 shadow-xs"
              >
                <IconPlus className="w-4 h-4" /> Crear Orden
              </button>
              <button
                onClick={() => onNavigate?.('pending-orders')}
                className="btn btn-sm btn-ghost border border-base-200 hover:bg-base-200 rounded-xl text-xs font-semibold text-base-content/80 flex-1"
              >
                Ver Pendientes
              </button>
            </div>
          </div>

          {/* Card 2: Pacientes y Expedientes */}
          <div className="card bg-base-100 border border-base-200 p-5 rounded-2xl shadow-xs hover:border-sky-500/40 transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-600 flex items-center justify-center">
                  <IconUsers className="w-5 h-5" />
                </div>
                <span className="badge badge-ghost badge-sm text-[11px] text-base-content/60 font-medium">
                  Padrón Clínico
                </span>
              </div>
              <h3 className="font-bold text-base text-base-content mb-1">
                Pacientes y Registro
              </h3>
              <p className="text-xs text-base-content/60 leading-relaxed mb-4">
                Alta rápida de pacientes, consulta del padrón clínico, actualización de datos demográficos e historial.
              </p>
            </div>
            <div className="flex items-center gap-2 pt-3 border-t border-base-100">
              <button
                onClick={() => onNavigate?.('add-patient')}
                className="btn btn-sm rounded-xl gap-2 font-semibold text-xs flex-1 text-white bg-sky-600 hover:bg-sky-700 border-none shadow-xs"
              >
                <IconUserPlus className="w-4 h-4" /> Registrar Paciente
              </button>
              <button
                onClick={() => onNavigate?.('patients')}
                className="btn btn-sm btn-ghost border border-base-200 hover:bg-base-200 rounded-xl text-xs font-semibold text-base-content/80 flex-1"
              >
                Directorio
              </button>
            </div>
          </div>

          {/* Card 3: Control de Calidad (QC) */}
          <div className="card bg-base-100 border border-base-200 p-5 rounded-2xl shadow-xs hover:border-emerald-500/40 transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                  <IconFlask className="w-5 h-5" />
                </div>
                <span className="badge badge-ghost badge-sm text-[11px] text-base-content/60 font-medium">
                  Garantía Analítica
                </span>
              </div>
              <h3 className="font-bold text-base text-base-content mb-1">
                Control de Calidad (QC)
              </h3>
              <p className="text-xs text-base-content/60 leading-relaxed mb-4">
                Captura de corridas analíticas para lotes de control, evaluación de reglas Westgard y gráficas Levey-Jennings.
              </p>
            </div>
            <div className="flex items-center gap-2 pt-3 border-t border-base-100">
              <button
                onClick={() => onNavigate?.('qc-controls')}
                className="btn btn-sm rounded-xl gap-2 font-semibold text-xs flex-1 text-white bg-emerald-600 hover:bg-emerald-700 border-none shadow-xs"
              >
                <IconFlask className="w-4 h-4" /> Lotes de Control
              </button>
              <button
                onClick={() => onNavigate?.('qc-levey-jennings')}
                className="btn btn-sm btn-ghost border border-base-200 hover:bg-base-200 rounded-xl gap-1.5 text-xs font-semibold text-base-content/80 flex-1"
              >
                <IconChartLine className="w-3.5 h-3.5 text-emerald-600" /> Levey-Jennings
              </button>
            </div>
          </div>

          {/* Card 4: Catálogo de Servicios */}
          <div className="card bg-base-100 border border-base-200 p-5 rounded-2xl shadow-xs hover:border-teal-500/40 transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-600 flex items-center justify-center">
                  <IconMicroscope className="w-5 h-5" />
                </div>
                <span className="badge badge-ghost badge-sm text-[11px] text-base-content/60 font-medium">
                  Estudios & Tarifas
                </span>
              </div>
              <h3 className="font-bold text-base text-base-content mb-1">
                Catálogo de Servicios
              </h3>
              <p className="text-xs text-base-content/60 leading-relaxed mb-4">
                Consulta rápida de pruebas de laboratorio, valores de referencia, unidades de medida y metodologías.
              </p>
            </div>
            <div className="flex items-center gap-2 pt-3 border-t border-base-100">
              <button
                onClick={() => onNavigate?.('analysis-catalog')}
                className="btn btn-sm rounded-xl gap-2 font-semibold text-xs flex-1 text-white bg-teal-600 hover:bg-teal-700 border-none shadow-xs"
              >
                <IconMicroscope className="w-4 h-4" /> Ver Catálogo
              </button>
              <button
                onClick={() => onNavigate?.('add-analysis')}
                className="btn btn-sm btn-ghost border border-base-200 hover:bg-base-200 rounded-xl text-xs font-semibold text-base-content/80 flex-1"
              >
                + Alta de Prueba
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Banner Minimalista de Soporte Técnico (Sutil y elegante) */}
      <section className="card bg-base-100 border border-base-200 p-4 rounded-2xl shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <IconHeadphones className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-base-content">
                ¿Necesitas soporte técnico o asistencia clínica?
              </p>
              <p className="text-[11px] text-base-content/60">
                Resuelve fallas de analizadores, dudas del sistema o genera tickets con Synova en tiempo real.
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigate?.('support')}
            className="btn btn-xs btn-outline btn-primary rounded-xl font-semibold gap-1.5 self-start sm:self-auto shrink-0"
          >
            Abrir Soporte <IconArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </section>
    </div>
  );
}
