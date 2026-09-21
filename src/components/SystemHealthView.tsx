// src/components/SystemHealthView.tsx
import { useState, useEffect, useCallback } from 'react';
import { useApi } from '../hooks/useApi';
import { useUserContext } from '../hooks/useUserContext';
import type { SystemHealthData, SystemErrorItem } from '../types/system-health';
import { toast } from 'react-toastify';
import {
  IconHeartPulse,
  IconDatabase,
  IconShield,
  IconRefresh,
  IconAlertTriangle,
  IconActivity,
  IconClock,
  IconEye,
  IconX,
} from './icons';

export default function SystemHealthView() {
  const api = useApi();
  const { isAdmin } = useUserContext();

  const [health, setHealth] = useState<SystemHealthData | null>(null);
  const [errorsData, setErrorsData] = useState<{ total: number; errors: SystemErrorItem[] }>({
    total: 0,
    errors: [],
  });
  const [isLoading, setIsLoading] = useState(false);
  const [selectedError, setSelectedError] = useState<SystemErrorItem | null>(null);

  const fetchHealth = useCallback(async () => {
    setIsLoading(true);
    try {
      const [healthRes, errorsRes] = await Promise.all([
        api.get('/system-health/status'),
        api.get('/system-health/errors?limit=15'),
      ]);

      setHealth(healthRes.data);
      if (errorsRes.data) {
        setErrorsData(errorsRes.data);
      }
    } catch (err) {
      console.error('Error al consultar salud del sistema:', err);
      toast.error('No se pudo verificar el estado de los servidores');
    } finally {
      setIsLoading(false);
    }
  }, [api]);

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 30000); // 30s auto-refresh
    return () => clearInterval(interval);
  }, [fetchHealth]);

  if (!isAdmin) {
    return (
      <div className="card bg-base-100 border border-base-200 p-8 text-center rounded-2xl shadow-xs">
        <IconShield className="w-12 h-12 text-warning mx-auto mb-3" />
        <h2 className="text-lg font-bold text-base-content">Acceso Exclusivo de Administrador</h2>
        <p className="text-xs text-base-content/70 mt-1">
          El monitor de infraestructura y métricas de base de datos solo puede ser consultado por el Administrador Global.
        </p>
      </div>
    );
  }

  const formatUptime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) return `${hrs}h ${mins}m ${secs}s`;
    if (mins > 0) return `${mins}m ${secs}s`;
    return `${secs}s`;
  };

  const latency = health?.database.latencyMs ?? 0;
  const latencyBadgeColor =
    latency < 150 ? 'badge-success text-white' : latency < 400 ? 'badge-warning' : 'badge-error text-white';

  return (
    <div className="space-y-6">
      {/* 1. Cabecera */}
      <section className="card bg-base-100 border border-base-200 p-5 sm:p-6 shadow-xs rounded-2xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="badge badge-sm badge-outline text-primary border-primary/30 font-semibold gap-1.5 py-2.5 px-3">
                <IconHeartPulse className="w-3.5 h-3.5" />
                Infraestructura y Base de Datos
              </span>
              <span className="badge badge-sm badge-ghost text-base-content/60 font-medium">
                Monitor Live
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-base-content tracking-tight">
              Tablero de Salud del Sistema y Rendimiento
            </h1>
            <p className="text-xs sm:text-sm text-base-content/70 max-w-2xl leading-relaxed">
              Monitoreo en tiempo real de latencia de PostgreSQL en Neon DB, uso de memoria, volumen de datos y excepciones.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={fetchHealth}
              className="btn btn-primary btn-sm gap-2 font-semibold rounded-xl text-xs shadow-xs"
              disabled={isLoading}
            >
              <IconRefresh className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              Testear Conexión
            </button>
          </div>
        </div>
      </section>

      {/* 2. Tarjetas de Infraestructura Principal */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Latencia DB */}
        <div className="card bg-base-100 border border-base-200 p-5 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-base-content/60 uppercase">
              Latencia Neon DB
            </span>
            <span className={`badge badge-xs font-mono font-bold ${latencyBadgeColor}`}>
              {latency > 0 ? `${latency} ms` : 'Verificando'}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <IconDatabase className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-base text-base-content">
                {health?.database.status === 'CONNECTED' ? 'En Línea' : 'Reconectando'}
              </p>
              <span className="text-[10px] text-base-content/50">PostgreSQL Cloud Pooler</span>
            </div>
          </div>
        </div>

        {/* Memoria RAM */}
        <div className="card bg-base-100 border border-base-200 p-5 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-base-content/60 uppercase">
              Memoria Heap Node
            </span>
            <span className="badge badge-ghost badge-xs font-mono font-semibold">
              RSS: {health?.server.memoryMb.rss ?? 0} MB
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
              <IconActivity className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-base text-base-content">
                {health?.server.memoryMb.heapUsed ?? 0} MB
              </p>
              <span className="text-[10px] text-base-content/50">
                de {health?.server.memoryMb.heapTotal ?? 0} MB asignados
              </span>
            </div>
          </div>
        </div>

        {/* Uptime Servidor */}
        <div className="card bg-base-100 border border-base-200 p-5 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-base-content/60 uppercase">
              Tiempo Activo
            </span>
            <span className="badge badge-success text-white badge-xs font-mono font-bold">ACTIVO</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <IconClock className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-base text-base-content">
                {health ? formatUptime(health.server.uptimeSeconds) : '...'}
              </p>
              <span className="text-[10px] text-base-content/50">
                Node {health?.server.nodeVersion || 'v20+'}
              </span>
            </div>
          </div>
        </div>

        {/* Excepciones */}
        <div className="card bg-base-100 border border-base-200 p-5 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-base-content/60 uppercase">
              Registro de Errores
            </span>
            <span
              className={`badge badge-xs font-bold ${
                errorsData.total === 0 ? 'badge-ghost' : 'badge-warning'
              }`}
            >
              {errorsData.total} logs
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-warning/10 text-warning flex items-center justify-center shrink-0">
              <IconAlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-base text-base-content">
                {errorsData.total === 0 ? 'Cero Errores' : `${errorsData.total} detectados`}
              </p>
              <span className="text-[10px] text-base-content/50">Capturados en backend</span>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Métricas de Volumen de Datos en Base de Datos */}
      <section className="card bg-base-100 border border-base-200 p-5 sm:p-6 rounded-2xl shadow-xs">
        <h2 className="text-sm font-bold text-base-content uppercase tracking-wider mb-4 flex items-center gap-2">
          <IconDatabase className="w-4 h-4 text-primary" />
          Volumen de Registros en PostgreSQL
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="p-3.5 bg-base-200/40 rounded-xl border border-base-200">
            <span className="text-[10px] font-bold text-base-content/50 uppercase block">Pacientes</span>
            <span className="text-xl font-black text-base-content mt-0.5 block">
              {health?.database.tables.patients ?? 0}
            </span>
          </div>

          <div className="p-3.5 bg-base-200/40 rounded-xl border border-base-200">
            <span className="text-[10px] font-bold text-base-content/50 uppercase block">Órdenes Totales</span>
            <span className="text-xl font-black text-primary mt-0.5 block">
              {health?.database.tables.workOrders ?? 0}
            </span>
          </div>

          <div className="p-3.5 bg-base-200/40 rounded-xl border border-base-200">
            <span className="text-[10px] font-bold text-base-content/50 uppercase block">Órdenes Pendientes</span>
            <span className="text-xl font-black text-warning mt-0.5 block">
              {health?.database.tables.pendingOrders ?? 0}
            </span>
          </div>

          <div className="p-3.5 bg-base-200/40 rounded-xl border border-base-200">
            <span className="text-[10px] font-bold text-base-content/50 uppercase block">Lotes Reactivos</span>
            <span className="text-xl font-black text-teal-600 dark:text-teal-400 mt-0.5 block">
              {health?.database.tables.reagents ?? 0}
            </span>
          </div>

          <div className="p-3.5 bg-base-200/40 rounded-xl border border-base-200">
            <span className="text-[10px] font-bold text-base-content/50 uppercase block">Tickets Soporte</span>
            <span className="text-xl font-black text-amber-600 dark:text-amber-400 mt-0.5 block">
              {health?.database.tables.supportTickets ?? 0}
            </span>
          </div>

          <div className="p-3.5 bg-base-200/40 rounded-xl border border-base-200">
            <span className="text-[10px] font-bold text-base-content/50 uppercase block">Logs Auditoría</span>
            <span className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5 block">
              {health?.database.tables.auditLogs ?? 0}
            </span>
          </div>
        </div>
      </section>

      {/* 4. Bitácora de Errores Recientes del Servidor */}
      <section className="card bg-base-100 border border-base-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-base-200 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-base-content flex items-center gap-2">
              <IconAlertTriangle className="w-4 h-4 text-warning" />
              Excepciones Recientes del Sistema (SystemErrorLog)
            </h2>
            <span className="text-[11px] text-base-content/50">
              Captura automática de fallos HTTP y errores internos de la API
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="table table-sm text-xs">
            <thead className="bg-base-200/50 text-[11px] uppercase tracking-wider text-base-content/70">
              <tr>
                <th>Fecha / Hora</th>
                <th>Status</th>
                <th>Método y Ruta</th>
                <th>Mensaje</th>
                <th>Usuario</th>
                <th className="text-right">Stack</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-base-100">
              {errorsData.errors.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-base-content/60 font-medium">
                    ✨ No hay excepciones registradas en el servidor. Todos los servicios operan normalmente.
                  </td>
                </tr>
              ) : (
                errorsData.errors.map((err) => (
                  <tr key={err.id} className="hover:bg-base-200/40">
                    <td className="whitespace-nowrap font-mono text-[11px] text-base-content/70">
                      {new Date(err.createdAt).toLocaleString('es-MX')}
                    </td>
                    <td>
                      <span
                        className={`badge badge-xs font-mono font-bold ${
                          err.statusCode >= 500
                            ? 'badge-error text-white'
                            : 'badge-warning'
                        }`}
                      >
                        {err.statusCode}
                      </span>
                    </td>
                    <td className="font-mono text-[11px] font-semibold text-base-content">
                      <span className="text-primary mr-1">{err.method}</span> {err.path}
                    </td>
                    <td className="max-w-xs truncate text-base-content/80" title={err.message}>
                      {err.message}
                    </td>
                    <td className="text-base-content/60 text-[11px]">
                      {err.userEmail || 'Anónimo / Sistema'}
                    </td>
                    <td className="text-right">
                      {err.stackTrace ? (
                        <button
                          onClick={() => setSelectedError(err)}
                          className="btn btn-ghost btn-xs text-primary font-semibold gap-1"
                        >
                          <IconEye className="w-3.5 h-3.5" /> Ver
                        </button>
                      ) : (
                        <span className="text-[10px] text-base-content/40">N/A</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Modal de StackTrace */}
      {selectedError && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="card bg-base-100 border border-base-200 shadow-2xl rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col animate-scale-up">
            <div className="p-4 sm:p-5 border-b border-base-200 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-base-content flex items-center gap-2">
                  <IconAlertTriangle className="w-4 h-4 text-warning" />
                  Traza de Error: {selectedError.statusCode} {selectedError.method} {selectedError.path}
                </h3>
                <span className="text-[11px] text-base-content/60 font-mono">
                  {new Date(selectedError.createdAt).toLocaleString('es-MX')}
                </span>
              </div>
              <button
                onClick={() => setSelectedError(null)}
                className="btn btn-ghost btn-xs btn-circle"
              >
                <IconX className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 sm:p-5 overflow-y-auto space-y-3 text-xs">
              <div>
                <span className="text-[10px] uppercase font-bold text-base-content/50 block mb-1">
                  Mensaje del Error
                </span>
                <p className="p-3 bg-error/10 text-error rounded-xl font-medium border border-error/20">
                  {selectedError.message}
                </p>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-base-content/50 block mb-1">
                  Pila de Llamadas (Stack Trace)
                </span>
                <pre className="p-3 bg-neutral text-neutral-content rounded-xl font-mono text-[11px] overflow-x-auto max-h-64">
                  {selectedError.stackTrace}
                </pre>
              </div>
            </div>

            <div className="p-4 border-t border-base-200 flex justify-end">
              <button
                onClick={() => setSelectedError(null)}
                className="btn btn-sm btn-primary rounded-xl font-semibold text-xs"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
