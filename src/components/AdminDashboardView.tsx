// src/components/AdminDashboardView.tsx
import type { Laboratory } from '../types/lab';
import type { DashboardViewType } from './Sidebar';
import {
  IconShield,
  IconPlus,
  IconSparkles,
  IconUsers,
  IconActivity,
  IconBuilding,
  IconChartLine,
  IconHeadphones,
  IconArrowRight,
  IconMapPin,
  IconTicket,
  IconHistory,
  IconHeartPulse,
  IconMegaphone,
  IconHandshake,
  IconQrCode,
  IconCreditCard,
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
                Gobernanza Central
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-base-content tracking-tight">
              Centro de Control y Gobernanza Global
            </h1>
            <p className="text-xs sm:text-sm text-base-content/70 max-w-2xl leading-relaxed">
              Hola, <span className="font-semibold text-base-content">{userName || 'Administrador'}</span>. Supervisa la infraestructura del sistema, gestiona la red hospitalaria, planes SaaS y bitácora de auditoría.
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
              <IconCreditCard className="w-4 h-4 text-primary" />
            </div>
          </div>
          <div className="stat-title text-[11px] font-semibold text-base-content/60 uppercase tracking-wide">
            Planes SaaS
          </div>
          <div className="stat-value text-lg font-bold text-base-content mt-0.5">
            Licencias
          </div>
          <div className="stat-desc text-[11px] text-base-content/50">
            Cuotas y facturación Polar
          </div>
        </div>
      </section>

      {/* 3. Centro de Gobernanza y Control Global (Organización Ejecutiva sin Cards Clínicas) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Columna Izquierda (2/3 de ancho): Cuadrícula Ejecutiva de Gobernanza */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-base-content uppercase tracking-wider text-xs">
                Gobernanza y Centro de Control Global
              </h2>
              <p className="text-xs text-base-content/60 mt-0.5">
                Módulos de administración, infraestructura técnica y supervisión central
              </p>
            </div>
            <span className="badge badge-warning badge-xs font-bold text-[9px]">EXCLUSIVO ADMIN</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
            {/* 1. Métricas Red */}
            <button
              onClick={() => onNavigate?.('network-metrics')}
              className="card bg-base-100 border border-base-200 p-4 rounded-2xl shadow-xs hover:border-primary/50 hover:shadow-md transition-all text-left group flex flex-col justify-between"
            >
              <div className="flex items-start justify-between gap-2 mb-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-500/20 group-hover:scale-105 transition-transform">
                  <IconChartLine className="w-4 h-4" />
                </div>
                <span className="badge badge-primary badge-xs font-bold text-[8px]">KPIs</span>
              </div>
              <div>
                <h3 className="font-bold text-sm text-base-content group-hover:text-primary transition-colors flex items-center justify-between">
                  <span>Métricas de la Red</span>
                  <IconArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all text-primary" />
                </h3>
                <span className="text-[11px] font-semibold text-primary/80 block mt-0.5">Nacional & TAT</span>
                <p className="text-xs text-base-content/60 leading-relaxed mt-1 line-clamp-2">
                  Volumen consolidado, semáforo sanitario y tiempos de respuesta.
                </p>
              </div>
            </button>

            {/* 2. Suscripciones SaaS */}
            <button
              onClick={() => onNavigate?.('subscriptions-billing')}
              className="card bg-base-100 border border-base-200 p-4 rounded-2xl shadow-xs hover:border-primary/50 hover:shadow-md transition-all text-left group flex flex-col justify-between"
            >
              <div className="flex items-start justify-between gap-2 mb-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/20 group-hover:scale-105 transition-transform">
                  <IconCreditCard className="w-4 h-4" />
                </div>
                <span className="badge badge-success text-white badge-xs font-bold text-[8px]">PLANES</span>
              </div>
              <div>
                <h3 className="font-bold text-sm text-base-content group-hover:text-primary transition-colors flex items-center justify-between">
                  <span>Suscripciones SaaS</span>
                  <IconArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all text-primary" />
                </h3>
                <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 block mt-0.5">Planes & Facturas</span>
                <p className="text-xs text-base-content/60 leading-relaxed mt-1 line-clamp-2">
                  Control de cuotas mensuales, planes y facturación corporativa Polar.
                </p>
              </div>
            </button>

            {/* 3. Bitácora de Auditoría */}
            <button
              onClick={() => onNavigate?.('audit-logs')}
              className="card bg-base-100 border border-base-200 p-4 rounded-2xl shadow-xs hover:border-primary/50 hover:shadow-md transition-all text-left group flex flex-col justify-between"
            >
              <div className="flex items-start justify-between gap-2 mb-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/20 group-hover:scale-105 transition-transform">
                  <IconHistory className="w-4 h-4" />
                </div>
                <span className="badge badge-ghost badge-xs font-bold text-[8px] text-emerald-600">ISO 15189</span>
              </div>
              <div>
                <h3 className="font-bold text-sm text-base-content group-hover:text-primary transition-colors flex items-center justify-between">
                  <span>Bitácora Auditoría</span>
                  <IconArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all text-primary" />
                </h3>
                <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 block mt-0.5">Trazabilidad Total</span>
                <p className="text-xs text-base-content/60 leading-relaxed mt-1 line-clamp-2">
                  Registro cronológico inmutable de accesos, cambios y eventos clínicos.
                </p>
              </div>
            </button>

            {/* 4. Salud del Servidor */}
            <button
              onClick={() => onNavigate?.('system-health')}
              className="card bg-base-100 border border-base-200 p-4 rounded-2xl shadow-xs hover:border-primary/50 hover:shadow-md transition-all text-left group flex flex-col justify-between"
            >
              <div className="flex items-start justify-between gap-2 mb-2.5">
                <div className="w-9 h-9 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 border border-rose-500/20 group-hover:scale-105 transition-transform">
                  <IconHeartPulse className="w-4 h-4" />
                </div>
                <span className="badge badge-error text-white badge-xs font-bold text-[8px]">ONLINE</span>
              </div>
              <div>
                <h3 className="font-bold text-sm text-base-content group-hover:text-primary transition-colors flex items-center justify-between">
                  <span>Salud Servidor</span>
                  <IconArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all text-primary" />
                </h3>
                <span className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 block mt-0.5">Neon DB & RAM</span>
                <p className="text-xs text-base-content/60 leading-relaxed mt-1 line-clamp-2">
                  Monitor en tiempo real de infraestructura, latencia y rendimiento de base de datos.
                </p>
              </div>
            </button>

            {/* 5. Comunicados Globales */}
            <button
              onClick={() => onNavigate?.('announcements')}
              className="card bg-base-100 border border-base-200 p-4 rounded-2xl shadow-xs hover:border-primary/50 hover:shadow-md transition-all text-left group flex flex-col justify-between"
            >
              <div className="flex items-start justify-between gap-2 mb-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-500/20 group-hover:scale-105 transition-transform">
                  <IconMegaphone className="w-4 h-4" />
                </div>
                <span className="badge badge-ghost badge-xs font-semibold text-[8px]">DIFUSIÓN</span>
              </div>
              <div>
                <h3 className="font-bold text-sm text-base-content group-hover:text-primary transition-colors flex items-center justify-between">
                  <span>Comunicados</span>
                  <IconArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all text-primary" />
                </h3>
                <span className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 block mt-0.5">Avisos Globales</span>
                <p className="text-xs text-base-content/60 leading-relaxed mt-1 line-clamp-2">
                  Emisión de notificaciones masivas y alertas operativas a toda la red.
                </p>
              </div>
            </button>

            {/* 6. Convenios y Precios */}
            <button
              onClick={() => onNavigate?.('price-agreements')}
              className="card bg-base-100 border border-base-200 p-4 rounded-2xl shadow-xs hover:border-primary/50 hover:shadow-md transition-all text-left group flex flex-col justify-between"
            >
              <div className="flex items-start justify-between gap-2 mb-2.5">
                <div className="w-9 h-9 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0 border border-teal-500/20 group-hover:scale-105 transition-transform">
                  <IconHandshake className="w-4 h-4" />
                </div>
                <span className="badge badge-ghost badge-xs font-semibold text-[8px]">TARIFAS</span>
              </div>
              <div>
                <h3 className="font-bold text-sm text-base-content group-hover:text-primary transition-colors flex items-center justify-between">
                  <span>Convenios</span>
                  <IconArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all text-primary" />
                </h3>
                <span className="text-[11px] font-semibold text-teal-600 dark:text-teal-400 block mt-0.5">Tarifas y Seguros</span>
                <p className="text-xs text-base-content/60 leading-relaxed mt-1 line-clamp-2">
                  Tabuladores comerciales, aseguradoras y convenios empresariales.
                </p>
              </div>
            </button>

            {/* 7. Plantillas & QR */}
            <button
              onClick={() => onNavigate?.('report-templates')}
              className="card bg-base-100 border border-base-200 p-4 rounded-2xl shadow-xs hover:border-primary/50 hover:shadow-md transition-all text-left group flex flex-col justify-between"
            >
              <div className="flex items-start justify-between gap-2 mb-2.5">
                <div className="w-9 h-9 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center shrink-0 border border-cyan-500/20 group-hover:scale-105 transition-transform">
                  <IconQrCode className="w-4 h-4" />
                </div>
                <span className="badge badge-ghost badge-xs font-semibold text-[8px]">FORMATOS</span>
              </div>
              <div>
                <h3 className="font-bold text-sm text-base-content group-hover:text-primary transition-colors flex items-center justify-between">
                  <span>Plantillas & QR</span>
                  <IconArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all text-primary" />
                </h3>
                <span className="text-[11px] font-semibold text-cyan-600 dark:text-cyan-400 block mt-0.5">Firmas Médicas</span>
                <p className="text-xs text-base-content/60 leading-relaxed mt-1 line-clamp-2">
                  Membretes oficiales de reportes, sellos y validación QR para pacientes.
                </p>
              </div>
            </button>

            {/* 8. Tickets de Soporte */}
            <button
              onClick={() => onNavigate?.('tickets')}
              className="card bg-base-100 border border-base-200 p-4 rounded-2xl shadow-xs hover:border-primary/50 hover:shadow-md transition-all text-left group flex flex-col justify-between"
            >
              <div className="flex items-start justify-between gap-2 mb-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/20 group-hover:scale-105 transition-transform">
                  <IconTicket className="w-4 h-4" />
                </div>
                <span className="badge badge-info text-white badge-xs font-bold text-[8px]">BOT IA</span>
              </div>
              <div>
                <h3 className="font-bold text-sm text-base-content group-hover:text-primary transition-colors flex items-center justify-between">
                  <span>Tickets Bot</span>
                  <IconArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all text-primary" />
                </h3>
                <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 block mt-0.5">Soporte IA</span>
                <p className="text-xs text-base-content/60 leading-relaxed mt-1 line-clamp-2">
                  Mesa de ayuda técnica, incidencias reportadas y resolución asistida.
                </p>
              </div>
            </button>

            {/* 9. Gestión de Personal */}
            <button
              onClick={() => onNavigate?.('add-user')}
              className="card bg-base-100 border border-base-200 p-4 rounded-2xl shadow-xs hover:border-primary/50 hover:shadow-md transition-all text-left group flex flex-col justify-between"
            >
              <div className="flex items-start justify-between gap-2 mb-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 border border-purple-500/20 group-hover:scale-105 transition-transform">
                  <IconUsers className="w-4 h-4" />
                </div>
                <span className="badge badge-ghost badge-xs font-semibold text-[8px]">ROLES</span>
              </div>
              <div>
                <h3 className="font-bold text-sm text-base-content group-hover:text-primary transition-colors flex items-center justify-between">
                  <span>Gestión Personal</span>
                  <IconArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all text-primary" />
                </h3>
                <span className="text-[11px] font-semibold text-purple-600 dark:text-purple-400 block mt-0.5">Usuarios & Sedes</span>
                <p className="text-xs text-base-content/60 leading-relaxed mt-1 line-clamp-2">
                  Alta de técnicos, químicos analistas y asignación de personal a sedes.
                </p>
              </div>
            </button>
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
