// src/components/OperatorDashboardView.tsx
import type { Laboratory } from '../types/lab';
import type { UserRole } from '../types/user';
import {
  IconFlask,
  IconUsers,
  IconClipboardList,
  IconFileText,
  IconPlus,
  IconSparkles,
  IconUserPlus,
  IconFolder,
  IconPrinter,
  IconMapPin,
} from './icons';

interface OperatorDashboardViewProps {
  userName?: string;
  role: UserRole | null;
  labs: Laboratory[];
  isLoadingLabs: boolean;
  onOpenCreateLab: () => void;
  onOpenOnboarding: () => void;
}

export default function OperatorDashboardView({
  userName,
  role,
  labs,
  isLoadingLabs,
  onOpenCreateLab,
  onOpenOnboarding,
}: OperatorDashboardViewProps) {
  const roleLabel =
    role === 'TECH' || role === 'LAB_TECHNICIAN'
      ? 'Técnico de Laboratorio'
      : role === 'RECEPTIONIST'
      ? 'Recepcionista Clínico'
      : 'Usuario del Sistema';

  return (
    <div className="space-y-8">
      {/* Banner de Operaciones Completo */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-secondary/15 via-base-100 to-accent/10 p-6 sm:p-8 border border-secondary/20 shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="badge badge-secondary gap-1.5 mb-3 font-semibold text-xs py-2.5 px-3 rounded-xl">
              <IconFlask className="w-4 h-4" />
              {roleLabel} • Panel Técnico Completo
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-base-content tracking-tight">
              Panel Técnico y Operativo
            </h1>
            <p className="text-base-content/70 mt-1 max-w-xl text-sm sm:text-base">
              Bienvenido, <span className="font-bold text-secondary">{userName || 'Técnico'}</span>. Tienes acceso a todas las funcionalidades del sistema para registrar laboratorios, atender pacientes, gestionar órdenes y capturar resultados.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={onOpenCreateLab}
              className="btn btn-primary text-primary-content font-bold rounded-2xl gap-2 shadow-md hover:scale-[1.02] transition-all"
            >
              <IconPlus className="w-5 h-5" />
              Nuevo Laboratorio
            </button>

            <button
              onClick={onOpenOnboarding}
              className="btn btn-ghost rounded-2xl gap-2 text-xs"
            >
              <IconSparkles className="w-4 h-4 text-secondary" />
              Guía del Sistema
            </button>
          </div>
        </div>

        {/* Muestras y Estadísticas Operativas */}
        <div className="stats stats-vertical sm:stats-horizontal shadow-sm bg-base-100/90 border border-base-200 mt-6 w-full rounded-2xl backdrop-blur-sm">
          <div className="stat">
            <div className="stat-figure text-primary">
              <IconUsers className="w-8 h-8" />
            </div>
            <div className="stat-title text-xs font-semibold uppercase">Pacientes Registrados</div>
            <div className="stat-value text-primary">Directorio</div>
            <div className="stat-desc">Historiales clínicos disponibles</div>
          </div>

          <div className="stat">
            <div className="stat-figure text-accent">
              <IconClipboardList className="w-8 h-8" />
            </div>
            <div className="stat-title text-xs font-semibold uppercase">Órdenes de Trabajo</div>
            <div className="stat-value text-accent">En Proceso</div>
            <div className="stat-desc">Atención y seguimiento</div>
          </div>

          <div className="stat">
            <div className="stat-figure text-secondary">
              <IconFlask className="w-8 h-8" />
            </div>
            <div className="stat-title text-xs font-semibold uppercase">Laboratorios Registrados</div>
            <div className="stat-value text-secondary">{labs.length}</div>
            <div className="stat-desc">Sedes activas en el sistema</div>
          </div>
        </div>
      </section>

      {/* Funcionalidades del Sistema para Rol Técnico con Íconos Vectoriales */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-base-content flex items-center gap-2">
            <IconFlask className="w-6 h-6 text-secondary" />
            Funcionalidades del Sistema (Técnico)
          </h2>
          <span className="badge badge-outline text-xs">Acceso Operativo Completo</span>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {/* Módulo Pacientes */}
          <div className="card bg-base-100 shadow-sm border border-base-200 rounded-3xl p-6 hover:shadow-md transition-all group">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold text-xl group-hover:bg-primary group-hover:text-primary-content transition-colors">
                <IconUsers className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-base-content">Pacientes</h3>
                <span className="text-xs text-base-content/60">Gestión de expedientes</span>
              </div>
            </div>
            <p className="text-xs text-base-content/70 leading-relaxed mb-4">
              Consulta el directorio, registra nuevos pacientes y revisa historiales clínicos en tiempo real.
            </p>
            <div className="space-y-2">
              <button className="btn btn-sm btn-outline btn-primary w-full rounded-xl gap-2 justify-start font-semibold">
                <IconUserPlus className="w-4 h-4" /> Registrar Nuevo Paciente
              </button>
              <button className="btn btn-sm btn-ghost w-full rounded-xl gap-2 justify-start text-xs text-base-content/70 font-semibold">
                <IconFolder className="w-4 h-4" /> Ver Directorio e Historiales
              </button>
            </div>
          </div>

          {/* Módulo Órdenes de Trabajo */}
          <div className="card bg-base-100 shadow-sm border border-base-200 rounded-3xl p-6 hover:shadow-md transition-all group">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-2xl bg-accent/10 text-accent flex items-center justify-center font-bold text-xl group-hover:bg-accent group-hover:text-accent-content transition-colors">
                <IconClipboardList className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-base-content">Órdenes de Trabajo</h3>
                <span className="text-xs text-base-content/60">Flujo analítico</span>
              </div>
            </div>
            <p className="text-xs text-base-content/70 leading-relaxed mb-4">
              Genera solicitudes de estudio, consulta solicitudes pendientes y realiza seguimiento del proceso analítico.
            </p>
            <div className="space-y-2">
              <button className="btn btn-sm btn-outline btn-accent w-full rounded-xl gap-2 justify-start font-semibold">
                <IconPlus className="w-4 h-4" /> Crear Orden de Trabajo
              </button>
              <button className="btn btn-sm btn-ghost w-full rounded-xl gap-2 justify-start text-xs text-base-content/70 font-semibold">
                <IconClipboardList className="w-4 h-4" /> Revisar Órdenes Pendientes
              </button>
            </div>
          </div>

          {/* Módulo Resultados y Análisis */}
          <div className="card bg-base-100 shadow-sm border border-base-200 rounded-3xl p-6 hover:shadow-md transition-all group">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-2xl bg-secondary/10 text-secondary flex items-center justify-center font-bold text-xl group-hover:bg-secondary group-hover:text-secondary-content transition-colors">
                <IconFileText className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-base-content">Resultados</h3>
                <span className="text-xs text-base-content/60">Captura y validación</span>
              </div>
            </div>
            <p className="text-xs text-base-content/70 leading-relaxed mb-4">
              Ingresa valores analíticos de laboratorio, valida muestras procesadas y emite reportes clínicos.
            </p>
            <div className="space-y-2">
              <button className="btn btn-sm btn-outline btn-secondary w-full rounded-xl gap-2 justify-start font-semibold">
                <IconFlask className="w-4 h-4" /> Cargar Valores Analíticos
              </button>
              <button className="btn btn-sm btn-ghost w-full rounded-xl gap-2 justify-start text-xs text-base-content/70 font-semibold">
                <IconPrinter className="w-4 h-4" /> Reportes y Certificados
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Laboratorios Registrados y Botón de Creación */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-base-content">Laboratorios del Sistema</h2>
            <p className="text-xs text-base-content/60">Sedes operativas registradas para el procesamiento de muestras</p>
          </div>
          <button
            onClick={onOpenCreateLab}
            className="btn btn-sm btn-primary rounded-xl gap-1.5 font-bold"
          >
            <IconPlus className="w-4 h-4" />
            Crear Laboratorio
          </button>
        </div>

        {isLoadingLabs ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 py-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="skeleton h-36 w-full rounded-2xl"></div>
            ))}
          </div>
        ) : labs.length === 0 ? (
          <div className="card bg-base-100 border-2 border-dashed border-base-300 p-8 text-center rounded-3xl">
            <div className="mx-auto w-14 h-14 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mb-3">
              <IconFlask className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold text-base-content mb-1">Aún no hay laboratorios registrados</h3>
            <p className="text-xs text-base-content/60 max-w-md mx-auto mb-4">
              Registra tu primer laboratorio para comenzar a operar.
            </p>
            <button
              onClick={onOpenCreateLab}
              className="btn btn-primary font-bold text-primary-content rounded-xl gap-2 mx-auto"
            >
              <IconPlus className="w-4 h-4" />
              Registrar Laboratorio
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {labs.map((lab) => (
              <div
                key={lab.id}
                className="card bg-base-100 border border-base-200 p-5 rounded-2xl shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div className="flex items-center gap-3">
                  {lab.logo ? (
                    <img src={lab.logo} alt={lab.name} className="w-11 h-11 rounded-xl object-cover border border-base-200 shrink-0" />
                  ) : (
                    <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-xl shrink-0">
                      {lab.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <h3 className="font-bold text-base text-base-content">{lab.name}</h3>
                    {(lab.city || lab.country) && (
                      <p className="text-xs text-base-content/60 flex items-center gap-1 mt-0.5">
                        <IconMapPin className="w-3.5 h-3.5 text-secondary" />
                        {[lab.city, lab.country].filter(Boolean).join(', ')}
                      </p>
                    )}
                  </div>
                </div>

                {lab.address && (
                  <div className="mt-3 pt-3 border-t border-base-200 text-xs text-base-content/70 truncate">
                    {lab.address}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
