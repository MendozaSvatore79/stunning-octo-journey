// src/components/AuditLogsView.tsx
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useApi } from '../hooks/useApi';
import { useUserContext } from '../hooks/useUserContext';
import type { AuditLog, AuditStats } from '../types/audit';
import { toast } from 'react-toastify';
import {
  IconHistory,
  IconShield,
  IconSearch,
  IconRefresh,
  IconDownload,
  IconEye,
  IconX,
} from './icons';

export default function AuditLogsView() {
  const api = useApi();
  const { isAdmin } = useUserContext();

  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [stats, setStats] = useState<AuditStats>({ total: 0, todayCount: 0, byCategory: {} });
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const fetchLogs = useCallback(async () => {
    setIsLoading(true);
    try {
      const [logsRes, statsRes] = await Promise.all([
        api.get('/audit/logs', {
          params: {
            category: selectedCategory !== 'ALL' ? selectedCategory : undefined,
            search: searchQuery.trim() || undefined,
            limit: 100,
          },
        }),
        api.get('/audit/stats'),
      ]);

      if (logsRes.data && Array.isArray(logsRes.data.logs)) {
        setLogs(logsRes.data.logs);
      }
      if (statsRes.data) {
        setStats(statsRes.data);
      }
    } catch (err) {
      console.error('Error al cargar bitácora de auditoría:', err);
      toast.error('No se pudo cargar la bitácora de auditoría');
    } finally {
      setIsLoading(false);
    }
  }, [api, selectedCategory, searchQuery]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleExportCSV = () => {
    if (logs.length === 0) {
      toast.info('No hay registros para exportar');
      return;
    }

    const headers = ['Fecha/Hora', 'Categoría', 'Acción', 'Descripción', 'Usuario', 'Correo', 'IP'];
    const rows = logs.map((l) => [
      `"${new Date(l.createdAt).toLocaleString('es-MX')}"`,
      `"${l.category}"`,
      `"${l.action}"`,
      `"${l.description.replace(/"/g, '""')}"`,
      `"${l.actorName}"`,
      `"${l.actorEmail || 'N/A'}"`,
      `"${l.ipAddress || 'Local'}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `bitacora_auditoria_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success('Bitácora descargada exitosamente en formato CSV');
  };

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const matchesCategory = selectedCategory === 'ALL' || log.category === selectedCategory;
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !q ||
        log.action.toLowerCase().includes(q) ||
        log.description.toLowerCase().includes(q) ||
        log.actorName.toLowerCase().includes(q) ||
        (log.actorEmail && log.actorEmail.toLowerCase().includes(q));
      return matchesCategory && matchesSearch;
    });
  }, [logs, selectedCategory, searchQuery]);

  if (!isAdmin) {
    return (
      <div className="card bg-base-100 border border-base-200 p-8 text-center rounded-2xl shadow-xs">
        <IconShield className="w-12 h-12 text-warning mx-auto mb-3" />
        <h2 className="text-lg font-bold text-base-content">Acceso Exclusivo de Administrador</h2>
        <p className="text-xs text-base-content/70 mt-1">
          La bitácora forense de auditoría solo puede ser consultada por el Administrador Global del sistema.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 1. Cabecera */}
      <section className="card bg-base-100 border border-base-200 p-5 sm:p-6 shadow-xs rounded-2xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="badge badge-sm badge-outline text-primary border-primary/30 font-semibold gap-1.5 py-2.5 px-3">
                <IconHistory className="w-3.5 h-3.5" />
                Inmutabilidad y Cumplimiento
              </span>
              <span className="badge badge-sm badge-ghost text-base-content/60 font-medium">
                ISO 15189 §5.10
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-base-content tracking-tight">
              Bitácora de Auditoría y Trazabilidad Forense
            </h1>
            <p className="text-xs sm:text-sm text-base-content/70 max-w-2xl leading-relaxed">
              Supervisión cronológica de eventos del sistema, cambios de datos clínicos, accesos y seguridad institucional.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleExportCSV}
              className="btn btn-outline border-base-300 hover:bg-base-200 btn-sm gap-2 font-semibold rounded-xl text-xs"
              title="Descargar reporte para inspección sanitaria"
            >
              <IconDownload className="w-4 h-4 text-primary" />
              Exportar CSV
            </button>
            <button
              onClick={fetchLogs}
              className="btn btn-ghost btn-sm border border-base-200 hover:bg-base-200 gap-1.5 rounded-xl text-xs font-semibold"
              disabled={isLoading}
            >
              <IconRefresh className={`w-4 h-4 ${isLoading ? 'animate-spin text-primary' : ''}`} />
              Actualizar
            </button>
          </div>
        </div>
      </section>

      {/* 2. Tarjetas de Estadísticas */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card bg-base-100 border border-base-200 p-4 rounded-2xl shadow-xs">
          <span className="text-[11px] font-semibold text-base-content/60 uppercase">Total de Eventos</span>
          <span className="text-2xl font-black text-base-content mt-1">{stats.total}</span>
          <span className="text-[11px] text-base-content/50 mt-0.5">Registros almacenados</span>
        </div>

        <div className="card bg-base-100 border border-base-200 p-4 rounded-2xl shadow-xs">
          <span className="text-[11px] font-semibold text-base-content/60 uppercase">Eventos Hoy</span>
          <span className="text-2xl font-black text-primary mt-1">{stats.todayCount}</span>
          <span className="text-[11px] text-base-content/50 mt-0.5">Actividad durante la jornada</span>
        </div>

        <div className="card bg-base-100 border border-base-200 p-4 rounded-2xl shadow-xs">
          <span className="text-[11px] font-semibold text-base-content/60 uppercase">Seguridad y Accesos</span>
          <span className="text-2xl font-black text-warning mt-1">{stats.byCategory['SECURITY'] || 0}</span>
          <span className="text-[11px] text-base-content/50 mt-0.5">Autenticación y permisos</span>
        </div>

        <div className="card bg-base-100 border border-base-200 p-4 rounded-2xl shadow-xs">
          <span className="text-[11px] font-semibold text-base-content/60 uppercase">Órdenes y Reactivos</span>
          <span className="text-2xl font-black text-success mt-1">
            {(stats.byCategory['ORDERS'] || 0) + (stats.byCategory['REAGENTS'] || 0)}
          </span>
          <span className="text-[11px] text-base-content/50 mt-0.5">Modificaciones analíticas</span>
        </div>
      </section>

      {/* 3. Filtros y Búsqueda */}
      <section className="card bg-base-100 border border-base-200 p-4 rounded-2xl shadow-xs">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <IconSearch className="w-4 h-4 text-base-content/40 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por acción, usuario o detalle..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input input-sm input-bordered w-full pl-9 rounded-xl text-xs"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
            {['ALL', 'SECURITY', 'ORDERS', 'REAGENTS', 'USERS', 'CONFIG', 'SYSTEM'].map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`btn btn-xs rounded-lg font-semibold ${
                  selectedCategory === cat ? 'btn-primary' : 'btn-ghost border border-base-200'
                }`}
              >
                {cat === 'ALL' ? 'Todos' : cat}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* 4. Tabla de Registros */}
      <section className="card bg-base-100 border border-base-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table table-sm">
            <thead className="bg-base-200/50 text-[11px] uppercase tracking-wider text-base-content/70">
              <tr>
                <th>Fecha / Hora</th>
                <th>Categoría</th>
                <th>Acción</th>
                <th>Descripción</th>
                <th>Responsable</th>
                <th>IP</th>
                <th className="text-right">Detalle</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-base-100 text-xs">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="text-center py-12">
                    <span className="loading loading-spinner text-primary loading-md"></span>
                    <p className="text-xs text-base-content/60 mt-2 font-medium">Consultando registros inmutables...</p>
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-base-content/60">
                    <IconHistory className="w-8 h-8 opacity-30 mx-auto mb-2 text-primary" />
                    No se encontraron eventos con los filtros seleccionados
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const isSec = log.category === 'SECURITY';
                  const isOrder = log.category === 'ORDERS';
                  const isReagent = log.category === 'REAGENTS';

                  const badgeStyle = isSec
                    ? 'badge-warning'
                    : isOrder
                    ? 'badge-primary'
                    : isReagent
                    ? 'badge-accent'
                    : 'badge-ghost';

                  return (
                    <tr key={log.id} className="hover:bg-base-200/40 transition-colors">
                      <td className="whitespace-nowrap font-mono text-[11px] text-base-content/70">
                        {new Date(log.createdAt).toLocaleString('es-MX', {
                          day: '2-digit',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        })}
                      </td>
                      <td>
                        <span className={`badge badge-xs font-bold ${badgeStyle}`}>
                          {log.category}
                        </span>
                      </td>
                      <td className="font-semibold text-base-content">{log.action}</td>
                      <td className="max-w-xs truncate text-base-content/80" title={log.description}>
                        {log.description}
                      </td>
                      <td>
                        <div className="flex flex-col">
                          <span className="font-medium text-base-content">{log.actorName}</span>
                          {log.actorEmail && (
                            <span className="text-[10px] text-base-content/50 truncate max-w-[140px]">
                              {log.actorEmail}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="font-mono text-[11px] text-base-content/60">
                        {log.ipAddress || 'Interno'}
                      </td>
                      <td className="text-right">
                        <button
                          onClick={() => setSelectedLog(log)}
                          className="btn btn-ghost btn-xs text-primary font-semibold gap-1"
                          title="Ver cambios antes / después"
                        >
                          <IconEye className="w-3.5 h-3.5" />
                          Inspeccionar
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Modal de Detalle JSON */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="card bg-base-100 border border-base-200 shadow-2xl rounded-2xl w-full max-w-xl max-h-[85vh] flex flex-col animate-scale-up">
            <div className="p-4 sm:p-5 border-b border-base-200 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-base-content flex items-center gap-2">
                  <IconShield className="w-4 h-4 text-primary" />
                  Inspección Forense de Evento
                </h3>
                <span className="text-[11px] text-base-content/60 font-mono">
                  ID: {selectedLog.id}
                </span>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="btn btn-ghost btn-xs btn-circle"
              >
                <IconX className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 sm:p-5 overflow-y-auto space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3 bg-base-200/50 rounded-xl">
                <div>
                  <span className="text-[10px] uppercase font-bold text-base-content/50">Acción</span>
                  <p className="font-semibold text-base-content">{selectedLog.action}</p>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-base-content/50">Categoría</span>
                  <p className="font-semibold text-primary">{selectedLog.category}</p>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-base-content/50">Actor</span>
                  <p className="font-semibold text-base-content">{selectedLog.actorName}</p>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-base-content/50">Fecha / Hora</span>
                  <p className="font-semibold text-base-content">
                    {new Date(selectedLog.createdAt).toLocaleString('es-MX')}
                  </p>
                </div>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-base-content/50 block mb-1">
                  Descripción Oficial
                </span>
                <p className="p-3 bg-base-200/30 rounded-xl border border-base-200 text-base-content/80">
                  {selectedLog.description}
                </p>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-base-content/50 block mb-1">
                  Carga Útil / Cambios Registrados (Payload JSON)
                </span>
                <pre className="p-3 bg-neutral text-neutral-content rounded-xl font-mono text-[11px] overflow-x-auto max-h-56">
                  {JSON.stringify(selectedLog.details || { info: 'Sin carga útil adicional' }, null, 2)}
                </pre>
              </div>
            </div>

            <div className="p-4 border-t border-base-200 flex justify-end">
              <button
                onClick={() => setSelectedLog(null)}
                className="btn btn-sm btn-primary rounded-xl font-semibold text-xs"
              >
                Cerrar Inspección
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
