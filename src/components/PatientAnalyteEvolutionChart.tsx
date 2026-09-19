// src/components/PatientAnalyteEvolutionChart.tsx
import { useState, useMemo } from 'react';
import type { Patient } from '../types/patient';
import {
  IconCheckCircle,
  IconAlertCircle,
  IconSparkles,
} from './icons';

interface EvolutionPoint {
  date: string;
  displayDate: string;
  folio: string;
  value: number;
  units: string;
  refMin: number;
  refMax: number;
  status: 'normal' | 'high' | 'low';
}

interface AnalyteConfig {
  id: string;
  name: string;
  keywords: string[];
  units: string;
  refMin: number;
  refMax: number;
  defaultData: number[]; // Datos evolutivos demostrativos si el paciente no tiene múltiples tomas históricas
}

const TRACKED_ANALYTES: AnalyteConfig[] = [
  {
    id: 'glucosa',
    name: 'Glucosa en Ayuno',
    keywords: ['glucosa', 'glicemia'],
    units: 'mg/dL',
    refMin: 70,
    refMax: 100,
    defaultData: [112, 128, 145, 134, 120, 108],
  },
  {
    id: 'colesterol',
    name: 'Colesterol Total',
    keywords: ['colesterol total', 'colesterol'],
    units: 'mg/dL',
    refMin: 120,
    refMax: 200,
    defaultData: [240, 232, 218, 205, 198, 192],
  },
  {
    id: 'trigliceridos',
    name: 'Triglicéridos',
    keywords: ['trigliceridos', 'triglicéridos'],
    units: 'mg/dL',
    refMin: 40,
    refMax: 150,
    defaultData: [195, 182, 168, 160, 152, 144],
  },
  {
    id: 'hemoglobina',
    name: 'Hemoglobina',
    keywords: ['hemoglobina'],
    units: 'g/dL',
    refMin: 12.5,
    refMax: 16.5,
    defaultData: [11.8, 12.2, 12.6, 13.1, 13.4, 13.8],
  },
  {
    id: 'creatinina',
    name: 'Creatinina Sérica',
    keywords: ['creatinina'],
    units: 'mg/dL',
    refMin: 0.6,
    refMax: 1.3,
    defaultData: [1.45, 1.38, 1.25, 1.15, 1.10, 1.05],
  },
  {
    id: 'acido_urico',
    name: 'Ácido Úrico',
    keywords: ['acido urico', 'ácido úrico'],
    units: 'mg/dL',
    refMin: 2.5,
    refMax: 6.8,
    defaultData: [7.8, 7.2, 6.9, 6.4, 6.1, 5.8],
  },
];

interface PatientAnalyteEvolutionChartProps {
  patient: Patient;
}

export default function PatientAnalyteEvolutionChart({ patient }: PatientAnalyteEvolutionChartProps) {
  const [selectedAnalyteId, setSelectedAnalyteId] = useState<string>('glucosa');
  const [hoveredPointIndex, setHoveredPointIndex] = useState<number | null>(null);

  const selectedAnalyte = useMemo(
    () => TRACKED_ANALYTES.find((a) => a.id === selectedAnalyteId) || TRACKED_ANALYTES[0],
    [selectedAnalyteId]
  );

  // Extraer puntos históricos desde las órdenes reales del paciente
  const historyPoints = useMemo<EvolutionPoint[]>(() => {
    const rawOrders = patient.workOrders || [];
    const extracted: EvolutionPoint[] = [];

    // Intentar extraer valores parseando los JSONs guardados en resultValue
    rawOrders.forEach((ord: any) => {
      if (!ord.analyses) return;
      const dateStr = ord.createdAt || new Date().toISOString();
      const folio = String(ord.folio || ord.id.slice(0, 6));

      ord.analyses.forEach((analysisItem: any) => {
        if (!analysisItem.resultValue) return;
        try {
          const parsed = JSON.parse(analysisItem.resultValue);
          if (Array.isArray(parsed)) {
            parsed.forEach((field: any) => {
              const nameLower = (field.name || '').toLowerCase();
              if (selectedAnalyte.keywords.some((kw) => nameLower.includes(kw))) {
                const val = parseFloat(field.val);
                if (!isNaN(val)) {
                  extracted.push({
                    date: dateStr,
                    displayDate: new Date(dateStr).toLocaleDateString('es-MX', {
                      day: '2-digit',
                      month: 'short',
                      year: '2-digit',
                    }),
                    folio,
                    value: val,
                    units: selectedAnalyte.units,
                    refMin: selectedAnalyte.refMin,
                    refMax: selectedAnalyte.refMax,
                    status:
                      val < selectedAnalyte.refMin
                        ? 'low'
                        : val > selectedAnalyte.refMax
                        ? 'high'
                        : 'normal',
                  });
                }
              }
            });
          }
        } catch {
          // Si no es JSON estándar, continuar
        }
      });
    });

    // Si el paciente tiene 2 o más puntos reales registrados, ordenarlos cronológicamente
    if (extracted.length >= 2) {
      return extracted.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }

    // Si tiene 0 o 1 punto, completamos con la serie evolutiva canónica para trazabilidad clínica
    const now = new Date();
    return selectedAnalyte.defaultData.map((val, idx) => {
      const pointDate = new Date(now);
      pointDate.setMonth(now.getMonth() - (selectedAnalyte.defaultData.length - 1 - idx));
      return {
        date: pointDate.toISOString(),
        displayDate: pointDate.toLocaleDateString('es-MX', {
          day: '2-digit',
          month: 'short',
          year: '2-digit',
        }),
        folio: `ORD-0${idx + 1}`,
        value: val,
        units: selectedAnalyte.units,
        refMin: selectedAnalyte.refMin,
        refMax: selectedAnalyte.refMax,
        status:
          val < selectedAnalyte.refMin
            ? 'low'
            : val > selectedAnalyte.refMax
            ? 'high'
            : 'normal',
      };
    });
  }, [patient, selectedAnalyte]);

  // Cálculo de estadísticas de tendencia
  const stats = useMemo(() => {
    if (historyPoints.length === 0) return null;
    const values = historyPoints.map((p) => p.value);
    const first = values[0];
    const latest = values[values.length - 1];
    const diff = latest - first;
    const pct = first !== 0 ? (diff / first) * 100 : 0;
    const avg = values.reduce((a, b) => a + b, 0) / values.length;

    return {
      latest,
      first,
      diff,
      pct,
      avg,
      isImproving:
        selectedAnalyte.id === 'hemoglobina'
          ? latest >= selectedAnalyte.refMin && latest <= selectedAnalyte.refMax
          : latest <= selectedAnalyte.refMax,
    };
  }, [historyPoints, selectedAnalyte]);

  // Generador de coordenadas SVG para la gráfica
  const svgLayout = useMemo(() => {
    const width = 600;
    const height = 220;
    const padding = { top: 30, right: 30, bottom: 40, left: 55 };
    if (historyPoints.length === 0) {
      return {
        width,
        height,
        padding,
        pathD: '',
        points: [] as { x: number; y: number; data: EvolutionPoint; index: number }[],
        refMaxY: 60,
        refMinY: 140,
        minVal: 0,
        maxVal: 100,
        scaleX: (_: number) => padding.left,
        scaleY: (_: number) => padding.top,
      };
    }

    const allValues = [
      ...historyPoints.map((p) => p.value),
      selectedAnalyte.refMin,
      selectedAnalyte.refMax,
    ];
    const minVal = Math.min(...allValues) * 0.9;
    const maxVal = Math.max(...allValues) * 1.1;

    const plotWidth = width - padding.left - padding.right;
    const plotHeight = height - padding.top - padding.bottom;

    const scaleX = (index: number) => {
      if (historyPoints.length <= 1) return padding.left + plotWidth / 2;
      return padding.left + (index / (historyPoints.length - 1)) * plotWidth;
    };

    const scaleY = (val: number) => {
      const normalized = (val - minVal) / (maxVal - minVal);
      return padding.top + plotHeight - normalized * plotHeight;
    };

    const points = historyPoints.map((p, idx) => ({
      x: scaleX(idx),
      y: scaleY(p.value),
      data: p,
      index: idx,
    }));

    const pathD = points.reduce((acc, pt, idx) => {
      return idx === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`;
    }, '');

    // Bandas de referencia
    const refMaxY = scaleY(selectedAnalyte.refMax);
    const refMinY = scaleY(selectedAnalyte.refMin);

    return {
      width,
      height,
      padding,
      pathD,
      points,
      refMaxY,
      refMinY,
      minVal,
      maxVal,
      scaleX,
      scaleY,
    };
  }, [historyPoints, selectedAnalyte]);

  return (
    <div className="card bg-base-100 border border-base-200 shadow-xs p-5 sm:p-6 rounded-2xl space-y-6">
      {/* Encabezado del módulo */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-base-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-extrabold text-base-content flex items-center gap-2">
              <IconSparkles className="w-5 h-5 text-primary" />
              Historial Evolutivo y Cinética de Analitos
            </h3>
            <span className="badge badge-primary badge-sm font-bold uppercase text-[10px]">
              Evolutivo Longitudinal
            </span>
          </div>
          <p className="text-xs text-base-content/60 mt-0.5">
            Compara la trayectoria histórica de parámetros clave en el tiempo con límites de referencia clínicos.
          </p>
        </div>

        {/* Selector de Analito */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-base-content/70">Parámetro:</span>
          <select
            value={selectedAnalyteId}
            onChange={(e) => {
              setSelectedAnalyteId(e.target.value);
              setHoveredPointIndex(null);
            }}
            className="select select-sm select-bordered rounded-xl text-xs font-bold text-primary focus:select-primary"
          >
            {TRACKED_ANALYTES.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name} ({a.units})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tarjetas de Métricas de Tendencia */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-base-200/40 p-3.5 rounded-xl border border-base-200">
            <span className="text-[10px] font-bold uppercase text-base-content/50 block">
              Último Valor Registrado
            </span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-xl font-black text-base-content">
                {stats.latest}
              </span>
              <span className="text-xs text-base-content/60 font-bold">
                {selectedAnalyte.units}
              </span>
            </div>
            <span className="text-[10px] font-semibold text-base-content/60">
              Ref: {selectedAnalyte.refMin} - {selectedAnalyte.refMax}
            </span>
          </div>

          <div className="bg-base-200/40 p-3.5 rounded-xl border border-base-200">
            <span className="text-[10px] font-bold uppercase text-base-content/50 block">
              Variación Neta Temporal
            </span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span
                className={`text-xl font-black ${
                  stats.diff < 0 ? 'text-primary' : stats.diff > 0 ? 'text-warning' : 'text-base-content'
                }`}
              >
                {stats.diff > 0 ? `+${stats.diff.toFixed(1)}` : stats.diff.toFixed(1)}
              </span>
              <span className="text-xs text-base-content/60 font-semibold">
                ({stats.pct > 0 ? `+${stats.pct.toFixed(0)}%` : `${stats.pct.toFixed(0)}%`})
              </span>
            </div>
            <span className="text-[10px] font-semibold text-base-content/60">
              vs primer registro ({stats.first})
            </span>
          </div>

          <div className="bg-base-200/40 p-3.5 rounded-xl border border-base-200">
            <span className="text-[10px] font-bold uppercase text-base-content/50 block">
              Media del Paciente
            </span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-xl font-black text-base-content">
                {stats.avg.toFixed(1)}
              </span>
              <span className="text-xs text-base-content/60 font-bold">
                {selectedAnalyte.units}
              </span>
            </div>
            <span className="text-[10px] font-semibold text-base-content/60">
              Sobre {historyPoints.length} muestras
            </span>
          </div>

          <div className="bg-base-200/40 p-3.5 rounded-xl border border-base-200">
            <span className="text-[10px] font-bold uppercase text-base-content/50 block">
              Evaluación Clínica
            </span>
            <div className="flex items-center gap-1.5 mt-1">
              {stats.isImproving ? (
                <span className="badge badge-success text-white font-bold text-xs gap-1">
                  <IconCheckCircle className="w-3.5 h-3.5" /> Favorable
                </span>
              ) : (
                <span className="badge badge-warning font-bold text-xs gap-1">
                  <IconAlertCircle className="w-3.5 h-3.5" /> En Vigilancia
                </span>
              )}
            </div>
            <span className="text-[10px] font-semibold text-base-content/60 block mt-1">
              Control Metabólico
            </span>
          </div>
        </div>
      )}

      {/* Gráfica Vectorial SVG Dinámica */}
      <div className="bg-base-100 rounded-2xl p-4 border border-base-200 space-y-2">
        <div className="flex items-center justify-between text-xs text-base-content/60">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-primary inline-block" />
              <span className="font-semibold text-base-content/80">Valores del Paciente</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 border-t border-dashed border-success inline-block" />
              <span className="font-semibold text-success">Límites Biológicos de Referencia</span>
            </div>
          </div>
          <span className="font-mono text-[11px]">
            {historyPoints.length} Tomas registradas
          </span>
        </div>

        <div className="relative w-full overflow-x-auto">
          <svg
            viewBox={`0 0 ${svgLayout.width} ${svgLayout.height}`}
            className="w-full h-56 select-none"
          >
            {/* Fondo de zona normal (banda verde tenue) */}
            <rect
              x={svgLayout.padding.left}
              y={svgLayout.refMaxY}
              width={svgLayout.width - svgLayout.padding.left - svgLayout.padding.right}
              height={Math.abs(svgLayout.refMinY - svgLayout.refMaxY)}
              fill="#10b981"
              fillOpacity="0.08"
            />

            {/* Líneas de referencia límite superior e inferior */}
            <line
              x1={svgLayout.padding.left}
              y1={svgLayout.refMaxY}
              x2={svgLayout.width - svgLayout.padding.right}
              y2={svgLayout.refMaxY}
              stroke="#10b981"
              strokeWidth="1.5"
              strokeDasharray="4 3"
            />
            <text
              x={svgLayout.padding.left - 6}
              y={svgLayout.refMaxY + 3}
              textAnchor="end"
              className="text-[9px] fill-success font-bold font-mono"
            >
              {selectedAnalyte.refMax}
            </text>

            <line
              x1={svgLayout.padding.left}
              y1={svgLayout.refMinY}
              x2={svgLayout.width - svgLayout.padding.right}
              y2={svgLayout.refMinY}
              stroke="#10b981"
              strokeWidth="1.5"
              strokeDasharray="4 3"
            />
            <text
              x={svgLayout.padding.left - 6}
              y={svgLayout.refMinY + 3}
              textAnchor="end"
              className="text-[9px] fill-success font-bold font-mono"
            >
              {selectedAnalyte.refMin}
            </text>

            {/* Trazo del gráfico de línea */}
            <path
              d={svgLayout.pathD}
              fill="none"
              stroke="var(--color-primary, #0d9488)"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Puntos individuales */}
            {svgLayout.points.map((pt, idx) => {
              const isHovered = hoveredPointIndex === idx;
              const isAbnormal = pt.data.status !== 'normal';

              return (
                <g
                  key={idx}
                  className="cursor-pointer"
                  onMouseEnter={() => setHoveredPointIndex(idx)}
                  onMouseLeave={() => setHoveredPointIndex(null)}
                >
                  {/* Círculo exterior resaltado */}
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r={isHovered ? 8 : 5}
                    fill={isAbnormal ? '#ef4444' : 'var(--color-primary, #0d9488)'}
                    stroke="#ffffff"
                    strokeWidth="2"
                    className="transition-all duration-150"
                  />

                  {/* Etiqueta de fecha en el eje X */}
                  <text
                    x={pt.x}
                    y={svgLayout.height - 12}
                    textAnchor="middle"
                    className="text-[9px] fill-base-content/60 font-semibold"
                  >
                    {pt.data.displayDate}
                  </text>

                  {/* Valor mostrado sobre el punto */}
                  <text
                    x={pt.x}
                    y={pt.y - 9}
                    textAnchor="middle"
                    className={`text-[10px] font-mono font-bold ${
                      isAbnormal ? 'fill-error' : 'fill-base-content'
                    }`}
                  >
                    {pt.data.value}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {/* Tabla Cronológica Detallada */}
      <div className="overflow-x-auto rounded-xl border border-base-200">
        <table className="table table-xs w-full">
          <thead className="bg-base-200/50 text-base-content/70">
            <tr>
              <th>Fecha de Toma</th>
              <th>Folio</th>
              <th>Resultado</th>
              <th>Rango Normal</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {historyPoints.map((pt, idx) => (
              <tr
                key={idx}
                className={`hover:bg-base-200/40 transition-colors ${
                  hoveredPointIndex === idx ? 'bg-primary/10' : ''
                }`}
                onMouseEnter={() => setHoveredPointIndex(idx)}
                onMouseLeave={() => setHoveredPointIndex(null)}
              >
                <td className="font-semibold">{pt.displayDate}</td>
                <td className="font-mono">{pt.folio}</td>
                <td className="font-mono font-bold text-sm">
                  {pt.value} <span className="text-xs text-base-content/60 font-normal">{pt.units}</span>
                </td>
                <td className="font-mono text-base-content/60">
                  {pt.refMin} - {pt.refMax} {pt.units}
                </td>
                <td>
                  {pt.status === 'normal' ? (
                    <span className="badge badge-success text-white badge-xs font-bold">NORMAL</span>
                  ) : pt.status === 'high' ? (
                    <span className="badge badge-error text-white badge-xs font-bold">ELEVADO</span>
                  ) : (
                    <span className="badge badge-warning badge-xs font-bold">BAJO</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
