// src/components/AdminDashboardView.tsx
import type { Laboratory } from '../types/lab';
import type { DashboardViewType } from './Sidebar';
import {
  IconShield,
  IconPlus,
  IconSparkles,
  IconFlask,
  IconUsers,
  IconActivity,
  IconBuilding,
  IconCertificate,
  IconClipboardList,
  IconUserPlus,
  IconFolder,
  IconChartLine,
  IconHeadphones,
  IconArrowRight,
  IconMapPin,
  IconTicket,
} from './icons';

interface AdminDashboardViewProps {
  userName?: string;
  labs: Laboratory[];
  isLoadingLabs: boolean;
  onOpenCreateLab: () => void;
  onOpenOnboarding: () => void;
  onDeleteLabSuccess: (id: string) => void;
  onNavigate?: (view: DashboardViewType) => void;
}

export default function AdminDashboardView({
  userName,
  labs,
  isLoadingLabs,
  onOpenCreateLab,
  onOpenOnboarding,
  onNavigate,
}: AdminDashboardViewProps) {
  // Mostrar las primeras 4 sedes en el resumen compacto
  const previewLabs = labs.slice(0, 4);

  return (
    <div className="space-y-6">
      {/* 1. Cabecera Principal Limpia y Compacta */}
      <section className="card bg-base-100 border border-base-200 p-5 sm:p-6 shadow-xs rounded-2xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="badge badge-sm badge-outline text-primary border-primary/30 font-semibold gap-1.5 py-2.5 px-3">
                <IconShield className="w-3.5 h-3.5" />
                Administrador General
              </span>
              <span className="badge badge-sm badge-ghost text-base-content/60 font-medium">
                Panel Central
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-base-content tracking-tight">
              Panel de Control Clínico
            </h1>
            <p className="text-xs sm:text-sm text-base-content/70 max-w-2xl leading-relaxed">
              Hola, <span className="font-semibold text-base-content">{userName || 'Administrador'}</span>. Supervisa las operaciones del laboratorio, gestiona el personal y da seguimiento a los módulos clínicos.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={onOpenCreateLab}
              className="btn btn-primary btn-sm gap-2 font-semibold rounded-xl shadow-xs"
            >
              <IconPlus className="w-4 h-4" />
              Nueva Sede
            </button>

            <button
              onClick={onOpenOnboarding}
              className="btn btn-ghost btn-sm border border-base-200 hover:bg-base-200 gap-1.5 rounded-xl text-xs font-semibold text-base-content/80"
            >
              <IconSparkles className="w-3.5 h-3.5 text-primary" />
              Guía
            </button>
          </div>
        </div>
      </section>

      {/* 2. Barra de Indicadores Operativos (DaisyUI Stats Compacto) */}
      <section className="stats stats-vertical sm:stats-horizontal bg-base-100 border border-base-200 shadow-xs w-full rounded-2xl divide-base-200">
        <div className="stat py-3.5 px-5">
          <div className="stat-figure text-primary">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <IconBuilding className="w-4 h-4 text-primary" />
            </div>
          </div>
          <div className="stat-title text-[11px] font-semibold text-base-content/60 uppercase tracking-wide">
            Sedes Activas
          </div>
          <div className="stat-value text-xl font-bold text-base-content mt-0.5">
            {labs.length}
          </div>
          <div className="stat-desc text-[11px] text-base-content/50">
            Red hospitalaria y clínica
          </div>
        </div>

        <div className="stat py-3.5 px-5">
          <div className="stat-figure text-success">
            <div className="w-9 h-9 rounded-xl bg-success/10 flex items-center justify-center">
              <IconActivity className="w-4 h-4 text-success" />
            </div>
          </div>
          <div className="stat-title text-[11px] font-semibold text-base-content/60 uppercase tracking-wide">
            Disponibilidad
          </div>
          <div className="stat-value text-lg font-bold text-base-content mt-0.5 flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-success"></span>
            </span>
            Operativo
          </div>
          <div className="stat-desc text-[11px] text-base-content/50">
            Sincronización en línea
          </div>
        </div>

        <div className="stat py-3.5 px-5">
          <div className="stat-figure text-primary">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <IconShield className="w-4 h-4 text-primary" />
            </div>
          </div>
          <div className="stat-title text-[11px] font-semibold text-base-content/60 uppercase tracking-wide">
            Nivel de Acceso
          </div>
          <div className="stat-value text-lg font-bold text-base-content mt-0.5">
            Administrador
          </div>
          <div className="stat-desc text-[11px] text-base-content/50">
            Control de configuración
          </div>
        </div>

        <div className="stat py-3.5 px-5">
          <div className="stat-figure text-primary">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <IconFlask className="w-4 h-4 text-primary" />
            </div>
          </div>
          <div className="stat-title text-[11px] font-semibold text-base-content/60 uppercase tracking-wide">
            Módulos Clínicos
          </div>
          <div className="stat-value text-lg font-bold text-base-content mt-0.5">
            Activos
          </div>
          <div className="stat-desc text-[11px] text-base-content/50">
            Pacientes, Órdenes y QC
          </div>
        </div>
      </section>

      {/* 3. Distribución Organizada en Cuadrícula Armónica (2 Columnas) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Columna Izquierda (2/3 de ancho): Flujos Operativos y Módulos Clínicos */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-base-content uppercase tracking-wider text-xs">
              Flujo Operativo y Clínico
            </h2>
            <span className="text-xs text-base-content/50">Accesos directos a módulos</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Card: Pacientes y Expedientes */}
            <div className="card bg-base-100 border border-base-200 p-5 rounded-2xl shadow-xs hover:border-primary/40 hover:shadow-sm transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                    <IconUsers className="w-4 h-4" />
                  </div>
                  <span className="badge badge-ghost badge-xs text-[10px] text-base-content/60 font-medium">
                    Recepción
                  </span>
                </div>
                <h3 className="font-bold text-base text-base-content mb-1">
                  Pacientes y Expedientes
                </h3>
                <p className="text-xs text-base-content/60 leading-relaxed mb-4">
                  Registro de pacientes, búsqueda de expedientes y consulta de historiales clínicos.
                </p>
              </div>
              <div className="flex flex-col gap-2 pt-2 border-t border-base-100">
                <button
                  onClick={() => onNavigate?.('add-patient')}
                  className="btn btn-sm btn-primary rounded-xl gap-2 font-semibold justify-start text-xs"
                >
                  <IconUserPlus className="w-4 h-4" /> Registrar Paciente
                </button>
                <button
                  onClick={() => onNavigate?.('patients')}
                  className="btn btn-sm btn-ghost border border-base-200 hover:bg-base-200 rounded-xl gap-2 text-xs font-semibold text-base-content/80 justify-start"
                >
                  <IconFolder className="w-4 h-4 text-primary" /> Directorio de Pacientes
                </button>
              </div>
            </div>

            {/* Card: Órdenes de Trabajo */}
            <div className="card bg-base-100 border border-base-200 p-5 rounded-2xl shadow-xs hover:border-primary/40 hover:shadow-sm transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                    <IconClipboardList className="w-4 h-4" />
                  </div>
                  <span className="badge badge-ghost badge-xs text-[10px] text-base-content/60 font-medium">
                    Pre-Analítica
                  </span>
                </div>
                <h3 className="font-bold text-base text-base-content mb-1">
                  Órdenes de Trabajo
                </h3>
                <p className="text-xs text-base-content/60 leading-relaxed mb-4">
                  Generación de solicitudes de análisis clínicos y monitoreo de muestras pendientes.
                </p>
              </div>
              <div className="flex flex-col gap-2 pt-2 border-t border-base-100">
                <button
                  onClick={() => onNavigate?.('create-order')}
                  className="btn btn-sm btn-primary rounded-xl gap-2 font-semibold justify-start text-xs"
                >
                  <IconPlus className="w-4 h-4" /> Nueva Orden de Análisis
                </button>
                <button
                  onClick={() => onNavigate?.('pending-orders')}
                  className="btn btn-sm btn-ghost border border-base-200 hover:bg-base-200 rounded-xl gap-2 text-xs font-semibold text-base-content/80 justify-start"
                >
                  <IconClipboardList className="w-4 h-4 text-primary" /> Órdenes Pendientes
                </button>
              </div>
            </div>

            {/* Card: Control de Calidad */}
            <div className="card bg-base-100 border border-base-200 p-5 rounded-2xl shadow-xs hover:border-primary/40 hover:shadow-sm transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                    <IconCertificate className="w-4 h-4" />
                  </div>
                  <span className="badge badge-ghost badge-xs text-[10px] text-base-content/60 font-medium">
                    Analítica
                  </span>
                </div>
                <h3 className="font-bold text-base text-base-content mb-1">
                  Control de Calidad (QC)
                </h3>
                <p className="text-xs text-base-content/60 leading-relaxed mb-4">
                  Supervisión de lotes de control, validación analítica y gráficas de Levey-Jennings.
                </p>
              </div>
              <div className="flex flex-col gap-2 pt-2 border-t border-base-100">
                <button
                  onClick={() => onNavigate?.('qc-controls')}
                  className="btn btn-sm btn-primary rounded-xl gap-2 font-semibold justify-start text-xs"
                >
                  <IconFlask className="w-4 h-4" /> Lotes de Control
                </button>
                <button
                  onClick={() => onNavigate?.('qc-levey-jennings')}
                  className="btn btn-sm btn-ghost border border-base-200 hover:bg-base-200 rounded-xl gap-2 text-xs font-semibold text-base-content/80 justify-start"
                >
                  <IconChartLine className="w-4 h-4 text-primary" /> Gráfica Levey-Jennings
                </button>
              </div>
            </div>

            {/* Card: Catálogo y Servicios */}
            <div className="card bg-base-100 border border-base-200 p-5 rounded-2xl shadow-xs hover:border-primary/40 hover:shadow-sm transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                    <IconFlask className="w-4 h-4" />
                  </div>
                  <span className="badge badge-ghost badge-xs text-[10px] text-base-content/60 font-medium">
                    Parámetros
                  </span>
                </div>
                <h3 className="font-bold text-base text-base-content mb-1">
                  Catálogo de Servicios
                </h3>
                <p className="text-xs text-base-content/60 leading-relaxed mb-4">
                  Configuración de estudios clínicos, valores de referencia y precios del laboratorio.
                </p>
              </div>
              <div className="flex flex-col gap-2 pt-2 border-t border-base-100">
                <button
                  onClick={() => onNavigate?.('analysis-catalog')}
                  className="btn btn-sm btn-outline border-base-300 hover:bg-base-200 text-base-content/80 rounded-xl gap-2 font-semibold justify-start text-xs"
                >
                  <IconArrowRight className="w-4 h-4 text-primary" /> Ver Catálogo de Estudios
                </button>
                <button
                  onClick={() => onNavigate?.('add-user')}
                  className="btn btn-sm btn-ghost border border-base-200 hover:bg-base-200 rounded-xl gap-2 text-xs font-semibold text-base-content/80 justify-start"
                >
                  <IconUsers className="w-4 h-4 text-primary" /> Gestión de Personal
                </button>
              </div>
            </div>

          </div>
        </div>

        {/* Columna Derecha (1/3 de ancho): Resumen Compacto de Sedes y Asistencia */}
        <div className="space-y-4">
          
          {/* Card Resumen de Sedes (Compacto y sin duplicidad masiva) */}
          <div className="card bg-base-100 border border-base-200 p-5 rounded-2xl shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-bold text-sm text-base-content flex items-center gap-1.5">
                  <IconBuilding className="w-4 h-4 text-primary" />
                  Sedes Activas
                </h3>
                <span className="text-[11px] text-base-content/50">
                  {labs.length} registradas en el sistema
                </span>
              </div>
              <button
                onClick={() => onNavigate?.('labs')}
                className="btn btn-xs btn-ghost text-primary font-semibold gap-1"
                title="Ir al Directorio de Sedes Completo"
              >
                Ver todas <IconArrowRight className="w-3 h-3" />
              </button>
            </div>

            {isLoadingLabs ? (
              <div className="space-y-2 py-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="skeleton h-10 w-full rounded-xl"></div>
                ))}
              </div>
            ) : previewLabs.length === 0 ? (
              <div className="text-center py-6 border border-dashed border-base-200 rounded-xl p-4">
                <p className="text-xs text-base-content/60 mb-2">No hay sedes registradas</p>
                <button
                  onClick={onOpenCreateLab}
                  className="btn btn-xs btn-primary font-semibold rounded-lg"
                >
                  Crear primera sede
                </button>
              </div>
            ) : (
              <div className="space-y-2 divide-y divide-base-100">
                {previewLabs.map((lab) => (
                  <div key={lab.id} className="pt-2 first:pt-0 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      {lab.logo ? (
                        <img
                          src={lab.logo}
                          alt={lab.name}
                          className="w-7 h-7 rounded-lg object-cover border border-base-200 shrink-0"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary font-bold text-xs flex items-center justify-center shrink-0">
                          {lab.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-base-content truncate">
                          {lab.name}
                        </p>
                        {lab.city && (
                          <p className="text-[10px] text-base-content/50 flex items-center gap-1 truncate">
                            <IconMapPin className="w-3 h-3 shrink-0" />
                            {lab.city}
                          </p>
                        )}
                      </div>
                    </div>
                    <span className="w-2 h-2 rounded-full bg-success shrink-0" title="Sede Operativa"></span>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-4 pt-3 border-t border-base-200">
              <button
                onClick={onOpenCreateLab}
                className="btn btn-sm btn-outline border-base-300 hover:bg-base-200 w-full rounded-xl gap-2 text-xs font-semibold text-base-content/80"
              >
                <IconPlus className="w-3.5 h-3.5" /> Agregar Nueva Sede
              </button>
            </div>
          </div>

          {/* Card Soporte Técnico Live */}
          <div className="card bg-base-100 border border-base-200 p-5 rounded-2xl shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <IconHeadphones className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-xs text-base-content">Soporte Técnico</h3>
                  <span className="text-[10px] text-base-content/50">Asistencia técnica en vivo</span>
                </div>
              </div>
              <span className="badge badge-accent badge-xs font-bold font-mono">LIVE</span>
            </div>

            <p className="text-xs text-base-content/60 leading-relaxed mb-3">
              ¿Dudas con una orden o resultado? Conéctate con soporte mediante chat o videollamada integrada.
            </p>

            <div className="flex flex-col gap-2">
              <button
                onClick={() => onNavigate?.('support')}
                className="btn btn-sm btn-primary w-full rounded-xl gap-2 text-xs font-semibold shadow-xs"
              >
                Abrir Canal de Soporte <IconArrowRight className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => onNavigate?.('tickets')}
                className="btn btn-sm btn-ghost border border-base-200 hover:bg-base-200 w-full rounded-xl gap-2 text-xs font-semibold text-base-content/80"
              >
                <IconTicket className="w-3.5 h-3.5 text-primary" /> Gestión de Tickets
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
