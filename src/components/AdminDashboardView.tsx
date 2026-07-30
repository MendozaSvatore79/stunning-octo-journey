// src/components/AdminDashboardView.tsx
import type { Laboratory } from '../types/lab';
import LabCard from './LabCard';
import {
  IconShield,
  IconPlus,
  IconSparkles,
  IconFlask,
  IconUsers,
  IconActivity,
  IconSettings,
  IconFileText,
} from './icons';

interface AdminDashboardViewProps {
  userName?: string;
  labs: Laboratory[];
  isLoadingLabs: boolean;
  onOpenCreateLab: () => void;
  onOpenOnboarding: () => void;
  onDeleteLabSuccess: (id: string) => void;
}

export default function AdminDashboardView({
  userName,
  labs,
  isLoadingLabs,
  onOpenCreateLab,
  onOpenOnboarding,
  onDeleteLabSuccess,
}: AdminDashboardViewProps) {
  return (
    <div className="space-y-8">
      {/* Banner de Administración */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-primary/15 via-base-100 to-secondary/10 p-6 sm:p-8 border border-primary/20 shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="badge badge-primary gap-1.5 mb-3 font-semibold text-xs py-2.5 px-3 rounded-xl">
              <IconShield className="w-4 h-4" />
              Administrador General del Sistema
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-base-content tracking-tight">
              Panel Administrativo
            </h1>
            <p className="text-base-content/70 mt-1 max-w-xl text-sm sm:text-base">
              Hola <span className="font-bold text-primary">{userName || 'Administrador'}</span>, tienes acceso completo para gestionar laboratorios, roles de usuario y parámetros globales del sistema.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={onOpenCreateLab}
              className="btn btn-primary text-primary-content font-bold rounded-2xl gap-2 shadow-lg shadow-primary/25 hover:scale-[1.02] transition-all"
            >
              <IconPlus className="w-5 h-5" />
              Nuevo Laboratorio
            </button>

            <button
              onClick={onOpenOnboarding}
              className="btn btn-ghost rounded-2xl gap-2 text-xs"
            >
              <IconSparkles className="w-4 h-4 text-primary" />
              Guía de Inicio
            </button>
          </div>
        </div>

        {/* Estadísticas para Administradores */}
        <div className="stats stats-vertical sm:stats-horizontal shadow-sm bg-base-100/90 border border-base-200 mt-6 w-full rounded-2xl backdrop-blur-sm">
          <div className="stat">
            <div className="stat-figure text-primary">
              <IconFlask className="w-8 h-8" />
            </div>
            <div className="stat-title text-xs font-semibold uppercase">Laboratorios Registrados</div>
            <div className="stat-value text-primary">{labs.length}</div>
            <div className="stat-desc">Sedes globales en BD</div>
          </div>

          <div className="stat">
            <div className="stat-figure text-secondary">
              <IconUsers className="w-8 h-8" />
            </div>
            <div className="stat-title text-xs font-semibold uppercase">Roles de Usuario</div>
            <div className="stat-value text-secondary">ADMIN / TECH</div>
            <div className="stat-desc">Permisos gestionados por API</div>
          </div>

          <div className="stat">
            <div className="stat-figure text-accent">
              <IconActivity className="w-8 h-8" />
            </div>
            <div className="stat-title text-xs font-semibold uppercase">Estado del Servidor</div>
            <div className="stat-value text-success text-2xl">Activo 100%</div>
            <div className="stat-desc">Base de Datos PostgreSQL</div>
          </div>
        </div>
      </section>

      {/* Gestión de Laboratorios */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-base-content flex items-center gap-2">
              <span>Gestión de Laboratorios</span>
              <span className="badge badge-sm badge-primary">{labs.length}</span>
            </h2>
            <p className="text-sm text-base-content/60">
              Administración de sedes globales y configuración de entidades
            </p>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 py-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="skeleton h-44 w-full rounded-2xl"></div>
            ))}
          </div>
        ) : labs.length === 0 ? (
          <div className="card bg-base-100 border-2 border-dashed border-base-300 p-8 sm:p-12 text-center rounded-3xl">
            <div className="mx-auto w-16 h-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mb-4">
              <IconFlask className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-base-content mb-1">No hay laboratorios registrados</h3>
            <p className="text-sm text-base-content/60 max-w-md mx-auto mb-6">
              Como Administrador, crea el primer laboratorio para habilitar la operación clínica del sistema.
            </p>
            <button
              onClick={onOpenCreateLab}
              className="btn btn-primary font-bold text-primary-content rounded-xl gap-2 shadow-md mx-auto"
            >
              <IconPlus className="w-5 h-5" />
              Crear primer laboratorio
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {labs.map((lab) => (
              <LabCard
                key={lab.id}
                lab={lab}
                onDeleteSuccess={onDeleteLabSuccess}
              />
            ))}
          </div>
        )}
      </section>

      {/* Herramientas Exclusivas de Administración con Íconos Vectoriales */}
      <section className="grid gap-6 md:grid-cols-3">
        <div className="card bg-base-100 shadow-sm border border-base-200 rounded-3xl p-6 hover:shadow-md transition-all">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold mb-4">
            <IconUsers className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-lg text-base-content mb-1">Gestión de Usuarios</h3>
          <p className="text-xs text-base-content/60 leading-relaxed mb-4">
            Asigna roles (`ADMIN`, `TECH`, `LAB_TECHNICIAN`, `RECEPTIONIST`) a los usuarios registrados.
          </p>
          <button className="btn btn-sm btn-outline btn-primary rounded-xl w-full">
            Administrar Usuarios
          </button>
        </div>

        <div className="card bg-base-100 shadow-sm border border-base-200 rounded-3xl p-6 hover:shadow-md transition-all">
          <div className="w-12 h-12 rounded-2xl bg-secondary/10 text-secondary flex items-center justify-center font-bold mb-4">
            <IconSettings className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-lg text-base-content mb-1">Ajustes del Sistema</h3>
          <p className="text-xs text-base-content/60 leading-relaxed mb-4">
            Configura parámetros generales, integraciones de correo y webhooks del servidor.
          </p>
          <button className="btn btn-sm btn-outline btn-secondary rounded-xl w-full">
            Configurar Parámetros
          </button>
        </div>

        <div className="card bg-base-100 shadow-sm border border-base-200 rounded-3xl p-6 hover:shadow-md transition-all">
          <div className="w-12 h-12 rounded-2xl bg-accent/10 text-accent flex items-center justify-center font-bold mb-4">
            <IconFileText className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-lg text-base-content mb-1">Auditoría y Reportes</h3>
          <p className="text-xs text-base-content/60 leading-relaxed mb-4">
            Inspecciona el historial de cambios, registro de logs y exportación de reportes globales.
          </p>
          <button className="btn btn-sm btn-outline btn-accent rounded-xl w-full">
            Ver Logs de Auditoría
          </button>
        </div>
      </section>
    </div>
  );
}
