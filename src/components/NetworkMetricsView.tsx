// src/components/NetworkMetricsView.tsx
import React, { useState, useEffect } from 'react';
import { useApi } from '../hooks/useApi';
import type { Laboratory } from '../types/lab';
import {
  IconFlask,
  IconCheckCircle,
  IconAlertCircle,
  IconDownload,
  IconHistory,
  IconMapPin,
  IconShieldCheck,
  IconExternalLink,
} from './icons';
import AuditLabModal from './AuditLabModal';

interface NetworkMetricsData {
  overview: {
    totalOrdersAllTime: number;
    ordersThisMonth: number;
    ordersLastMonth: number;
    orderGrowthPercent: number;
    totalPatients: number;
    totalLabs: number;
    avgTatHours: number;
  };
  topTests: Array<{
    rank: number;
    id: string;
    name: string;
    count: number;
    price: number;
    estimatedRevenue: number;
  }>;
  topActiveLabs: Array<{
    id: string;
    name: string;
    location: string;
    verificationStatus: string;
    isSuspended: boolean;
    ordersThisMonth: number;
  }>;
  lowActiveLabs: Array<{
    id: string;
    name: string;
    location: string;
    verificationStatus: string;
    isSuspended: boolean;
    ordersThisMonth: number;
  }>;
  regulatoryAlerts: Array<{
    id: string;
    name: string;
    city?: string;
    state?: string;
    isSuspended: boolean;
    verificationStatus: string;
    permitExpiresAt?: string;
    daysToPermitExpiry: number | null;
    permitSemaphore: 'GREEN' | 'YELLOW' | 'RED' | 'NO_DATA';
    rpbiExpiresAt?: string;
    daysToRpbiExpiry: number | null;
    rpbiSemaphore: 'GREEN' | 'YELLOW' | 'RED' | 'NO_DATA';
    isUrgent: boolean;
    isWarning: boolean;
  }>;
  generatedAt: string;
}

export const NetworkMetricsView: React.FC = () => {
  const api = useApi();
  const [data, setData] = useState<NetworkMetricsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [auditingLab, setAuditingLab] = useState<Laboratory | null>(null);

  const fetchMetrics = async () => {
    try {
      setIsLoading(true);
      setErrorMsg(null);
      const res = await api.get<NetworkMetricsData>('/admin/metrics/network');
      setData(res.data);
    } catch (e: any) {
      console.error('Error al cargar métricas de la red:', e);
      setErrorMsg(
        e?.response?.data?.message || 'Error al conectar con el servidor de métricas consolidadas.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  const exportToCsv = () => {
    if (!data) return;

    const rows: string[] = [];
    rows.push('REPORTE EJECUTIVO Y CONSOLIDADO DE LA RED CLÍNICA');
    rows.push(`Fecha de Generación,${new Date(data.generatedAt).toLocaleString()}`);
    rows.push('');
    rows.push('RESUMEN GENERAL');
    rows.push(`Total Órdenes Histórico,${data.overview.totalOrdersAllTime}`);
    rows.push(`Órdenes Mes Actual,${data.overview.ordersThisMonth}`);
    rows.push(`Órdenes Mes Anterior,${data.overview.ordersLastMonth}`);
    rows.push(`Crecimiento Mensual,${data.overview.orderGrowthPercent}%`);
    rows.push(`Total Pacientes Registrados,${data.overview.totalPatients}`);
    rows.push(`Total Sedes Habilitadas,${data.overview.totalLabs}`);
    rows.push(`Tiempo Promedio de Entrega (TAT),${data.overview.avgTatHours} horas`);
    rows.push('');
    rows.push('TOP 10 PRUEBAS CLÍNICAS MÁS DEMANDADAS');
    rows.push('Posición,Nombre del Estudio,Volumen de Órdenes,Precio Unitario MXN,Ingreso Estimado MXN');
    data.topTests.forEach((t) => {
      rows.push(`${t.rank},"${t.name}",${t.count},${t.price},${t.estimatedRevenue}`);
    });
    rows.push('');
    rows.push('VIGILANCIA SANITARIA (ALERTAS COFEPRIS / RPBI)');
    rows.push('Sede,Estado,Estatus Regulatorio,Semáforo COFEPRIS,Días COFEPRIS,Semáforo RPBI,Días RPBI,Suspendida');
    data.regulatoryAlerts.forEach((a) => {
      rows.push(
        `"${a.name}","${a.state || 'México'}","${a.verificationStatus}","${a.permitSemaphore}","${
          a.daysToPermitExpiry ?? 'N/A'
        }","${a.rpbiSemaphore}","${a.daysToRpbiExpiry ?? 'N/A'}","${a.isSuspended ? 'SÍ' : 'NO'}"`
      );
    });

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + encodeURIComponent(rows.join('\n'));
    const link = document.createElement('a');
    link.setAttribute('href', csvContent);
    link.setAttribute('download', `metricas-red-clinica-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const openAuditForLabId = async (labId: string) => {
    try {
      const res = await api.get<Laboratory>(`/lab/${labId}`);
      setAuditingLab(res.data);
    } catch (e) {
      console.error('Error al abrir auditoría:', e);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 sm:p-10 flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <span className="loading loading-spinner loading-lg text-primary"></span>
        <p className="text-xs font-semibold text-base-content/60">
          Consolidando datos de todas las sedes y órdenes del país...
        </p>
      </div>
    );
  }

  if (errorMsg || !data) {
    return (
      <div className="p-6 sm:p-10">
        <div className="alert alert-error text-white rounded-2xl shadow-sm text-xs">
          <IconAlertCircle className="w-4 h-4" />
          <span>{errorMsg || 'No se pudieron calcular las métricas de la red.'}</span>
          <button onClick={fetchMetrics} className="btn btn-xs btn-outline btn-white ml-auto">
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Cabecera Principal */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-base-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-base-content tracking-tight">
              Métricas Consolidadas de la Red Clínica
            </h1>
            <span className="badge badge-primary text-white font-bold text-[10px]">
              ADMIN GLOBAL
            </span>
          </div>
          <p className="text-xs text-base-content/60 mt-1">
            Supervisión nacional de volumen analítico, pruebas más demandadas y semáforo regulatorio COFEPRIS.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchMetrics}
            className="btn btn-sm btn-ghost border border-base-300 rounded-xl gap-1 text-xs"
          >
            <IconHistory className="w-4 h-4" /> Actualizar
          </button>
          <button
            type="button"
            onClick={exportToCsv}
            className="btn btn-sm btn-primary text-white font-bold rounded-xl gap-1.5 shadow-xs"
          >
            <IconDownload className="w-4 h-4" /> Exportar Reporte (CSV/Excel)
          </button>
        </div>
      </div>

      {/* Tarjetas de Métricas Clave (KPIs) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Órdenes del Mes */}
        <div className="p-4 sm:p-5 rounded-3xl bg-base-100 border border-base-200 shadow-xs space-y-1">
          <span className="text-[11px] font-bold text-base-content/50 uppercase tracking-wider">
            Órdenes Este Mes
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-black text-primary">
              {data.overview.ordersThisMonth.toLocaleString()}
            </span>
            <span
              className={`badge badge-xs font-bold text-[10px] ${
                data.overview.orderGrowthPercent >= 0
                  ? 'badge-success text-white'
                  : 'badge-error text-white'
              }`}
            >
              {data.overview.orderGrowthPercent >= 0 ? '+' : ''}
              {data.overview.orderGrowthPercent}%
            </span>
          </div>
          <p className="text-[10px] text-base-content/60 font-medium">
            vs {data.overview.ordersLastMonth} el mes pasado ({data.overview.totalOrdersAllTime} histórico)
          </p>
        </div>

        {/* Total Pacientes */}
        <div className="p-4 sm:p-5 rounded-3xl bg-base-100 border border-base-200 shadow-xs space-y-1">
          <span className="text-[11px] font-bold text-base-content/50 uppercase tracking-wider">
            Pacientes Registrados
          </span>
          <div className="text-2xl sm:text-3xl font-black text-base-content">
            {data.overview.totalPatients.toLocaleString()}
          </div>
          <p className="text-[10px] text-base-content/60 font-medium">
            En toda la red nacional de laboratorios
          </p>
        </div>

        {/* Sedes Habilitadas */}
        <div className="p-4 sm:p-5 rounded-3xl bg-base-100 border border-base-200 shadow-xs space-y-1">
          <span className="text-[11px] font-bold text-base-content/50 uppercase tracking-wider">
            Sedes Clínicas
          </span>
          <div className="text-2xl sm:text-3xl font-black text-secondary">
            {data.overview.totalLabs}
          </div>
          <p className="text-[10px] text-base-content/60 font-medium">
            Establecimientos clínicos activos
          </p>
        </div>

        {/* TAT Promedio */}
        <div className="p-4 sm:p-5 rounded-3xl bg-base-100 border border-base-200 shadow-xs space-y-1">
          <span className="text-[11px] font-bold text-base-content/50 uppercase tracking-wider">
            Tiempo de Entrega (TAT)
          </span>
          <div className="text-2xl sm:text-3xl font-black text-accent">
            {data.overview.avgTatHours} <span className="text-sm font-normal">hrs</span>
          </div>
          <p className="text-[10px] text-base-content/60 font-medium">
            Promedio desde recepción a validación
          </p>
        </div>
      </div>

      {/* SECCIÓN 2: TOP 10 PRUEBAS MÁS DEMANDADAS & RANKING DE SEDES */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top 10 Pruebas Clínicas */}
        <div className="lg:col-span-2 bg-base-100 rounded-3xl border border-base-200 p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-base-200 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <IconFlask className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-sm sm:text-base text-base-content">
                  Top 10 de Pruebas Clínicas más Solicitadas
                </h3>
                <p className="text-[11px] text-base-content/60">
                  Estudios con mayor volumen de procesamiento en la plataforma
                </p>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="table table-xs w-full">
              <thead>
                <tr className="text-base-content/50 border-b border-base-200">
                  <th className="w-8">#</th>
                  <th>Estudio Clínico</th>
                  <th className="text-right">Volumen</th>
                  <th className="text-right">Precio Prom.</th>
                  <th className="text-right">Ingreso Estimado</th>
                </tr>
              </thead>
              <tbody>
                {data.topTests.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-6 text-base-content/40 italic">
                      Aún no hay órdenes registradas para calcular el top de estudios.
                    </td>
                  </tr>
                ) : (
                  data.topTests.map((t) => (
                    <tr key={t.id} className="hover:bg-base-200/40 border-b border-base-100">
                      <td className="font-bold text-primary">{t.rank}</td>
                      <td className="font-semibold text-base-content">{t.name}</td>
                      <td className="text-right font-mono font-bold text-primary">{t.count}</td>
                      <td className="text-right font-mono text-base-content/70">
                        ${t.price.toLocaleString()} MXN
                      </td>
                      <td className="text-right font-mono font-bold text-success">
                        ${t.estimatedRevenue.toLocaleString()} MXN
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Sedes con Mayor Actividad */}
        <div className="bg-base-100 rounded-3xl border border-base-200 p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-base-200 pb-3">
            <div className="w-8 h-8 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center">
              <IconMapPin className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-base-content">
                Sedes de Mayor Volumen
              </h3>
              <p className="text-[11px] text-base-content/60">
                Órdenes procesadas en el mes corriente
              </p>
            </div>
          </div>

          <div className="space-y-2.5">
            {data.topActiveLabs.map((l, idx) => (
              <div
                key={l.id}
                className="p-2.5 bg-base-200/40 rounded-2xl border border-base-200 flex items-center justify-between gap-2 text-xs"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-base-content/40 text-[10px]">#{idx + 1}</span>
                    <p className="font-bold text-base-content truncate">{l.name}</p>
                  </div>
                  <p className="text-[10px] text-base-content/50 truncate mt-0.5">{l.location}</p>
                </div>
                <div className="text-right shrink-0">
                  <span className="badge badge-primary badge-sm font-mono font-bold text-white">
                    {l.ordersThisMonth} órdenes
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* SECCIÓN 3: SEMÁFORO REGULATORIO COFEPRIS / RPBI */}
      <div className="bg-base-100 rounded-3xl border border-base-200 p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-base-200 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-warning/10 text-warning flex items-center justify-center">
              <IconShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-base-content">
                Tablero de Vigilancia Sanitaria y Semáforo de Permisos (COFEPRIS / RPBI)
              </h3>
              <p className="text-[11px] text-base-content/60">
                Monitoreo automático de vigencias legales para prevenir suspensiones y sanciones sanitarias
              </p>
            </div>
          </div>
        </div>

        {data.regulatoryAlerts.length === 0 ? (
          <div className="p-6 text-center text-xs text-base-content/50 bg-base-200/40 rounded-2xl border border-base-200">
            <IconCheckCircle className="w-8 h-8 text-success mx-auto mb-2" />
            <p className="font-bold text-base-content">Todas las sedes operan con documentación al corriente.</p>
            <p className="text-[10px] text-base-content/60">No se detectaron permisos vencidos ni en riesgo inmediato de caducidad.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table table-xs w-full">
              <thead>
                <tr className="text-base-content/50 border-b border-base-200">
                  <th>Sede Clínica</th>
                  <th>Ubicación</th>
                  <th>Aviso / Licencia COFEPRIS</th>
                  <th>Contrato RPBI</th>
                  <th>Estado de Operación</th>
                  <th className="text-right">Acción</th>
                </tr>
              </thead>
              <tbody>
                {data.regulatoryAlerts.map((a) => (
                  <tr key={a.id} className="hover:bg-base-200/40 border-b border-base-100">
                    <td className="font-bold text-base-content">{a.name}</td>
                    <td className="text-base-content/60">{[a.city, a.state].filter(Boolean).join(', ') || 'México'}</td>
                    <td>
                      <span
                        className={`badge badge-xs font-bold ${
                          a.permitSemaphore === 'RED'
                            ? 'badge-error text-white'
                            : a.permitSemaphore === 'YELLOW'
                            ? 'badge-warning text-warning-content'
                            : 'badge-ghost text-base-content/60'
                        }`}
                      >
                        {a.daysToPermitExpiry !== null
                          ? a.daysToPermitExpiry <= 0
                            ? `Vencido hace ${Math.abs(a.daysToPermitExpiry)}d`
                            : `Vence en ${a.daysToPermitExpiry}d`
                          : 'Sin registrar'}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`badge badge-xs font-bold ${
                          a.rpbiSemaphore === 'RED'
                            ? 'badge-error text-white'
                            : a.rpbiSemaphore === 'YELLOW'
                            ? 'badge-warning text-warning-content'
                            : 'badge-ghost text-base-content/60'
                        }`}
                      >
                        {a.daysToRpbiExpiry !== null
                          ? a.daysToRpbiExpiry <= 0
                            ? `Vencido hace ${Math.abs(a.daysToRpbiExpiry)}d`
                            : `Vence en ${a.daysToRpbiExpiry}d`
                          : 'Sin registrar'}
                      </span>
                    </td>
                    <td>
                      {a.isSuspended ? (
                        <span className="badge badge-error text-white font-bold badge-xs">
                          Suspendida Preventivamente
                        </span>
                      ) : (
                        <span className="badge badge-success text-white font-bold badge-xs">
                          Operando Normal
                        </span>
                      )}
                    </td>
                    <td className="text-right">
                      <button
                        type="button"
                        onClick={() => openAuditForLabId(a.id)}
                        className="btn btn-xs btn-ghost gap-1 text-primary"
                      >
                        <IconExternalLink className="w-3.5 h-3.5" /> Auditar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de Auditoría */}
      {auditingLab && (
        <AuditLabModal
          lab={auditingLab}
          isOpen={Boolean(auditingLab)}
          onClose={() => setAuditingLab(null)}
          onLabUpdated={() => {
            fetchMetrics();
          }}
        />
      )}
    </div>
  );
};

export default NetworkMetricsView;
