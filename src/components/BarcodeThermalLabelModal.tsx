import { useState, useMemo, useEffect } from 'react';
import type { WorkOrder } from '../types/order';
import {
  IconX,
  IconPrinter,
  IconCheckCircle,
  IconAlertCircle,
  IconFileText,
} from './icons';
import {
  getRequiredTubesForOrder,
  generateBarcodeSVG,
  type VacutainerTube,
} from '../utils/tubeVacutainer';

interface BarcodeThermalLabelModalProps {
  order: WorkOrder;
  onClose: () => void;
}

export default function BarcodeThermalLabelModal({
  order,
  onClose,
}: BarcodeThermalLabelModalProps) {
  const [currentOrder, setCurrentOrder] = useState<WorkOrder>(order);

  useEffect(() => {
    setCurrentOrder(order);
  }, [order]);

  const patient = currentOrder.patient;
  const folio = currentOrder.folio || currentOrder.id.slice(0, 6);
  const barcodeStr = `ORD-${String(folio).padStart(6, '0')}`;

  const tubes = useMemo(() => getRequiredTubesForOrder(currentOrder), [currentOrder]);
  const [selectedTubeId, setSelectedTubeId] = useState<string>('all');
  const [labelCopies, setLabelCopies] = useState<number>(1);

  // Fecha y hora formateada para la toma de muestra
  const sampleTime = useMemo(() => {
    const d = new Date();
    return d.toLocaleString('es-MX', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  }, []);

  // Calcular edad
  const patientAge = useMemo(() => {
    if (!patient?.dateOfBirth) return 'N/E';
    const birth = new Date(patient.dateOfBirth);
    const diff = Date.now() - birth.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25)) + 'a';
  }, [patient?.dateOfBirth]);

  const patientInitials = `${(patient?.lastName || '').toUpperCase()}, ${(patient?.firstName || '').toUpperCase()}`;

  const displayedTubes: VacutainerTube[] =
    selectedTubeId === 'all'
      ? tubes
      : tubes.filter((t) => t.id === selectedTubeId);

  const handlePrint = () => {
    window.print();
  };

  return (
    <dialog className="modal modal-open z-50">
      <div className="modal-box max-w-4xl bg-base-100 rounded-3xl p-6 md:p-8 border border-base-300 shadow-2xl space-y-6">
        {/* Encabezado */}
        <div className="flex items-center justify-between border-b border-base-200 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold">
              <IconFileText className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-base-content tracking-tight">
                  Etiquetas Térmicas de Muestra (50x25 mm)
                </h3>
                <span className="badge badge-primary badge-sm font-mono font-bold">
                  Folio #{folio}
                </span>
              </div>
              <p className="text-xs text-base-content/60">
                Guía de extracción Vacutainer (CLSI H3-A6) y códigos de barras Code-128
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="btn btn-sm btn-circle btn-ghost"
            title="Cerrar modal"
          >
            <IconX className="w-5 h-5" />
          </button>
        </div>

        {/* Panel de Orden de Toma de Tubos CLSI */}
        <div className="bg-base-200/50 rounded-2xl p-4 border border-base-300/60 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-base-content/70 flex items-center gap-2">
              <IconAlertCircle className="w-4 h-4 text-primary" />
              Tubos requeridos para esta orden ({tubes.length})
            </span>
            <span className="text-[11px] text-base-content/60">
              Respete el orden de llenado para evitar contaminación cruzada de aditivos
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {tubes.map((tube, idx) => (
              <div
                key={tube.id}
                onClick={() => setSelectedTubeId(tube.id === selectedTubeId ? 'all' : tube.id)}
                className={`p-3 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                  selectedTubeId === tube.id || selectedTubeId === 'all'
                    ? 'bg-base-100 border-primary/40 shadow-sm'
                    : 'bg-base-100/50 border-base-300 opacity-60'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-4 h-4 rounded-full border border-black/20 shadow-xs shrink-0"
                      style={{ backgroundColor: tube.capColorHex }}
                    />
                    <span className="text-xs font-bold text-base-content leading-tight">
                      {idx + 1}. {tube.name}
                    </span>
                  </div>
                </div>

                <div className="mt-2 text-[11px] text-base-content/70 space-y-0.5">
                  <p><strong className="text-base-content/90">Aditivo:</strong> {tube.additive}</p>
                  <p><strong className="text-base-content/90">Inversiones:</strong> {tube.inversions}</p>
                  <p><strong className="text-base-content/90">Estudios:</strong> {tube.matchedAnalyses.join(', ')}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Filtro y Configuración de Impresión */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-base-100 p-3 rounded-2xl border border-base-200">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-base-content/70">Mostrar:</span>
            <select
              value={selectedTubeId}
              onChange={(e) => setSelectedTubeId(e.target.value)}
              className="select select-sm select-bordered rounded-xl text-xs font-semibold"
            >
              <option value="all">Todos los tubos ({tubes.length} etiquetas)</option>
              {tubes.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.sampleType})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-base-content/70">Copias por tubo:</span>
            <div className="join">
              <button
                type="button"
                className="btn btn-xs join-item rounded-l-xl"
                onClick={() => setLabelCopies(Math.max(1, labelCopies - 1))}
              >
                -
              </button>
              <span className="btn btn-xs join-item btn-ghost font-bold px-3">
                {labelCopies}
              </span>
              <button
                type="button"
                className="btn btn-xs join-item rounded-r-xl"
                onClick={() => setLabelCopies(labelCopies + 1)}
              >
                +
              </button>
            </div>
          </div>
        </div>

        {/* Vista previa de Etiquetas Térmicas (50 x 25 mm aproximado en escala) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-base-content/60">
            <span className="font-bold uppercase tracking-wider">
              Vista Previa de Impresión Térmica (Zebra / TSC / Honeywell)
            </span>
            <span>Escala estándar 50mm x 25mm</span>
          </div>

          <div className="bg-base-300/40 p-6 rounded-2xl border border-base-300 flex flex-wrap gap-4 items-center justify-center max-h-72 overflow-y-auto">
            {displayedTubes.flatMap((tube) =>
              Array.from({ length: labelCopies }).map((_, copyIdx) => (
                <div
                  key={`${tube.id}-copy-${copyIdx}`}
                  className="w-[260px] h-[130px] bg-white text-black p-2.5 rounded-lg border-2 border-black/80 shadow-md flex flex-col justify-between select-none relative overflow-hidden"
                  style={{ fontFamily: 'monospace' }}
                >
                  {/* Borde de color de tapón en la esquina para rápida identificación */}
                  <div
                    className="absolute top-0 right-0 w-4 h-4"
                    style={{
                      backgroundColor: tube.capColorHex,
                      clipPath: 'polygon(100% 0, 0 0, 100% 100%)',
                    }}
                    title={tube.capColorName}
                  />

                  {/* Encabezado: Paciente, Folio, Sexo, Edad */}
                  <div>
                    <div className="flex justify-between items-baseline text-[10px] font-black border-b border-black/40 pb-0.5 leading-tight">
                      <span className="truncate max-w-[170px]" title={patientInitials}>
                        {patientInitials}
                      </span>
                      <span className="font-bold">
                        {patient?.gender?.charAt(0) || 'U'}/{patientAge}
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-[9px] pt-0.5 text-black font-bold">
                      <span>FOL: #{folio}</span>
                      <span className="text-[8px]">{sampleTime}</span>
                    </div>
                  </div>

                  {/* Código de barras Code-128 */}
                  <div className="flex flex-col items-center my-0.5">
                    <div
                      className="w-full h-8"
                      dangerouslySetInnerHTML={{
                        __html: generateBarcodeSVG(barcodeStr, 240, 32),
                      }}
                    />
                    <span className="text-[8px] font-black tracking-widest leading-none mt-0.5">
                      *{barcodeStr}*
                    </span>
                  </div>

                  {/* Footer de muestra y alícuota */}
                  <div className="flex justify-between items-center text-[8.5px] font-bold border-t border-black/40 pt-0.5">
                    <span className="truncate max-w-[150px] uppercase">
                      {tube.sampleType}
                    </span>
                    <span className="badge badge-neutral badge-xs font-mono text-[7px] text-white">
                      {tube.capColorName.split(' ')[0]}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Acciones */}
        <div className="flex items-center justify-between pt-2 border-t border-base-200">
          <p className="text-xs text-base-content/60 flex items-center gap-1.5">
            <IconCheckCircle className="w-4 h-4 text-success" />
            Listo para enviar a la impresora térmica predeterminada
          </p>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="btn btn-ghost rounded-2xl text-xs font-semibold"
            >
              Cerrar
            </button>
            <button
              onClick={handlePrint}
              className="btn btn-primary text-white font-bold rounded-2xl text-xs gap-2 shadow-lg hover:scale-[1.01] transition-transform"
            >
              <IconPrinter className="w-4 h-4" />
              Imprimir Etiquetas Térmicas
            </button>
          </div>
        </div>
      </div>
    </dialog>
  );
}
