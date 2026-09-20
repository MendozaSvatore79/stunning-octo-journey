// src/components/ReagentsInventoryView.tsx
import { useState, useMemo, useEffect } from 'react';
import {
  IconFlask,
  IconCheckCircle,
  IconAlertTriangle,
  IconAlertCircle,
  IconPlus,
  IconSearch,
  IconX,
  IconSparkles,
} from './icons';

export interface ReagentLot {
  id: string;
  name: string;
  category: string; // 'Química Clínica' | 'Hematología' | 'Urianálisis' | 'Inmunología' | 'Coagulación'
  brand: string;
  lotNumber: string;
  expirationDate: string; // YYYY-MM-DD
  initialTests: number;
  remainingTests: number;
  minThreshold: number;
  storageCondition: string;
  presentation: string;
}

const DEFAULT_REAGENTS: ReagentLot[] = [
  {
    id: 'rea-1',
    name: 'Glucosa GOD-PAP Líquida Enzimática',
    category: 'Química Clínica',
    brand: 'Wiener Lab',
    lotNumber: 'LT-GLU-2026A',
    expirationDate: '2026-11-30',
    initialTests: 500,
    remainingTests: 340,
    minThreshold: 80,
    storageCondition: '2°C - 8°C (Refrigerado)',
    presentation: 'Frasco 4 x 50 mL',
  },
  {
    id: 'rea-2',
    name: 'Colesterol Total CHOD-PAP',
    category: 'Química Clínica',
    brand: 'BioSystems',
    lotNumber: 'LT-COL-9932B',
    expirationDate: '2026-10-15',
    initialTests: 400,
    remainingTests: 120,
    minThreshold: 60,
    storageCondition: '2°C - 8°C (Refrigerado)',
    presentation: 'Frasco 2 x 100 mL',
  },
  {
    id: 'rea-3',
    name: 'Triglicéridos GPO-PAP Monorreactivo',
    category: 'Química Clínica',
    brand: 'Spinreact',
    lotNumber: 'LT-TG-4421C',
    expirationDate: '2026-12-31',
    initialTests: 350,
    remainingTests: 280,
    minThreshold: 50,
    storageCondition: '2°C - 8°C (Refrigerado)',
    presentation: 'Frasco 2 x 50 mL',
  },
  {
    id: 'rea-4',
    name: 'Cellpack DCL Diluyente Hematológico',
    category: 'Hematología',
    brand: 'Sysmex',
    lotNumber: 'LT-DCL-8871',
    expirationDate: '2026-08-20', // Próximo o vencido
    initialTests: 1200,
    remainingTests: 65,
    minThreshold: 100,
    storageCondition: '15°C - 30°C (Ambiente)',
    presentation: 'Bidón 20 Litros',
  },
  {
    id: 'rea-5',
    name: 'Tiras Reactivas para Orina Combur 10',
    category: 'Urianálisis',
    brand: 'Roche Cobas',
    lotNumber: 'LT-URI-5520',
    expirationDate: '2027-02-28',
    initialTests: 100,
    remainingTests: 88,
    minThreshold: 20,
    storageCondition: '2°C - 30°C (Lugar Seco)',
    presentation: 'Tubo 100 Tiras',
  },
  {
    id: 'rea-6',
    name: 'Neoplastine Clot Tromboplastina Líquida',
    category: 'Coagulación',
    brand: 'Diagnostica Stago',
    lotNumber: 'LT-TP-3310A',
    expirationDate: '2026-09-25', // Alerta próxima caducidad
    initialTests: 250,
    remainingTests: 30,
    minThreshold: 40,
    storageCondition: '2°C - 8°C (Refrigerado)',
    presentation: 'Viales 6 x 5 mL',
  },
  {
    id: 'rea-7',
    name: 'Hemoglobina Glicosilada HbA1c Directa',
    category: 'Inmunología',
    brand: 'Bio-Rad Laboratories',
    lotNumber: 'LT-A1C-7721',
    expirationDate: '2026-12-15',
    initialTests: 200,
    remainingTests: 145,
    minThreshold: 30,
    storageCondition: '2°C - 8°C (Refrigerado)',
    presentation: 'Kit 200 Determinaciones',
  },
];

const STORAGE_KEY = 'lab_reagents_inventory_v1';

export default function ReagentsInventoryView() {
  const [reagents, setReagents] = useState<ReagentLot[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return DEFAULT_REAGENTS;
      }
    }
    return DEFAULT_REAGENTS;
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'optimal' | 'warning' | 'critical'>('all');

  // Modal para agregar reactivo
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newReagent, setNewReagent] = useState<Partial<ReagentLot>>({
    name: '',
    category: 'Química Clínica',
    brand: '',
    lotNumber: '',
    expirationDate: '',
    initialTests: 200,
    remainingTests: 200,
    minThreshold: 30,
    storageCondition: '2°C - 8°C (Refrigerado)',
    presentation: 'Caja / Frasco',
  });

  // Modal para ajustar o descontar
  const [selectedForAdjust, setSelectedForAdjust] = useState<ReagentLot | null>(null);
  const [adjustAmount, setAdjustAmount] = useState<number>(10);

  // Guardar en localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(reagents));
  }, [reagents]);

  // Cálculo de días restantes de caducidad
  const getDaysUntilExpiration = (dateStr: string) => {
    const exp = new Date(dateStr).getTime();
    const now = new Date().getTime();
    return Math.ceil((exp - now) / (1000 * 60 * 60 * 24));
  };

  // Clasificación del semáforo
  const getReagentStatus = (r: ReagentLot): 'critical' | 'warning' | 'optimal' => {
    const days = getDaysUntilExpiration(r.expirationDate);
    const isLowStock = r.remainingTests <= r.minThreshold;
    const isOutOfStock = r.remainingTests <= 0;
    const isExpired = days <= 0;

    if (isExpired || isOutOfStock) return 'critical';
    if (days <= 30 || isLowStock) return 'warning';
    return 'optimal';
  };

  // Métricas globales KPI
  const kpiStats = useMemo(() => {
    let optimalCount = 0;
    let warningCount = 0;
    let criticalCount = 0;
    let totalTests = 0;

    reagents.forEach((r) => {
      totalTests += r.remainingTests;
      const status = getReagentStatus(r);
      if (status === 'optimal') optimalCount++;
      else if (status === 'warning') warningCount++;
      else criticalCount++;
    });

    return {
      totalLots: reagents.length,
      totalTests,
      optimalCount,
      warningCount,
      criticalCount,
    };
  }, [reagents]);

  // Filtrado de reactivos
  const filteredReagents = useMemo(() => {
    return reagents.filter((r) => {
      const matchesSearch =
        r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.lotNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.brand.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCat =
        selectedCategory === 'all' || r.category === selectedCategory;

      const status = getReagentStatus(r);
      const matchesStatus =
        statusFilter === 'all' || status === statusFilter;

      return matchesSearch && matchesCat && matchesStatus;
    });
  }, [reagents, searchTerm, selectedCategory, statusFilter]);

  // Manejo de guardado de nuevo reactivo
  const handleSaveNewReagent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReagent.name || !newReagent.lotNumber || !newReagent.expirationDate) {
      alert('Por favor completa el nombre, número de lote y fecha de caducidad.');
      return;
    }

    const created: ReagentLot = {
      id: `rea-${Date.now()}`,
      name: newReagent.name,
      category: newReagent.category || 'Química Clínica',
      brand: newReagent.brand || 'Genérico',
      lotNumber: newReagent.lotNumber,
      expirationDate: newReagent.expirationDate,
      initialTests: Number(newReagent.initialTests) || 100,
      remainingTests: Number(newReagent.initialTests) || 100,
      minThreshold: Number(newReagent.minThreshold) || 20,
      storageCondition: newReagent.storageCondition || '2°C - 8°C',
      presentation: newReagent.presentation || 'Frasco',
    };

    setReagents((prev) => [created, ...prev]);
    setIsAddModalOpen(false);
    setNewReagent({
      name: '',
      category: 'Química Clínica',
      brand: '',
      lotNumber: '',
      expirationDate: '',
      initialTests: 200,
      remainingTests: 200,
      minThreshold: 30,
      storageCondition: '2°C - 8°C (Refrigerado)',
      presentation: 'Caja / Frasco',
    });
  };

  // Descontar determinaciones
  const handleDeductTests = (delta: number) => {
    if (!selectedForAdjust) return;
    setReagents((prev) =>
      prev.map((r) => {
        if (r.id === selectedForAdjust.id) {
          const next = Math.max(0, r.remainingTests - delta);
          return { ...r, remainingTests: next };
        }
        return r;
      })
    );
    setSelectedForAdjust(null);
  };

  return (
    <div className="space-y-6">
      {/* Encabezado Principal */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-base-content tracking-tight">
              Control de Inventario de Reactivos e Insumos
            </h1>
            <span className="badge badge-primary font-bold text-xs">
              ISO 15189 §5.3
            </span>
          </div>
          <p className="text-xs text-base-content/60 mt-0.5">
            Semáforo de caducidad, trazabilidad de lotes y monitoreo de determinaciones analíticas.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="btn btn-primary text-white font-bold rounded-2xl text-xs gap-2 shadow-md hover:scale-[1.01] transition-transform"
        >
          <IconPlus className="w-4 h-4" />
          Registrar Entrada de Lote
        </button>
      </div>

      {/* KPI Cards de Semáforo */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-base-100 p-4 rounded-2xl border border-base-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase text-base-content/50 block">
              Lotes en Inventario
            </span>
            <div className="text-2xl font-black text-base-content mt-0.5">
              {kpiStats.totalLots}
            </div>
            <span className="text-[11px] font-semibold text-base-content/60">
              {kpiStats.totalTests.toLocaleString()} Pruebas en stock
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
            <IconFlask className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-base-100 p-4 rounded-2xl border border-base-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase text-success block">
              Lotes Óptimos (Verde)
            </span>
            <div className="text-2xl font-black text-success mt-0.5">
              {kpiStats.optimalCount}
            </div>
            <span className="text-[11px] font-semibold text-base-content/60">
              Caducidad y stock vigentes
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-success/10 text-success flex items-center justify-center">
            <IconCheckCircle className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-base-100 p-4 rounded-2xl border border-base-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase text-warning block">
              En Alerta (Amarillo)
            </span>
            <div className="text-2xl font-black text-warning mt-0.5">
              {kpiStats.warningCount}
            </div>
            <span className="text-[11px] font-semibold text-base-content/60">
              &lt; 30 días o reserva mínima
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-warning/10 text-warning flex items-center justify-center">
            <IconAlertTriangle className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-base-100 p-4 rounded-2xl border border-base-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase text-error block">
              Críticos / Caducados
            </span>
            <div className="text-2xl font-black text-error mt-0.5">
              {kpiStats.criticalCount}
            </div>
            <span className="text-[11px] font-semibold text-base-content/60">
              Acción correctiva inmediata
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-error/10 text-error flex items-center justify-center">
            <IconAlertCircle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Barra de Filtros y Búsqueda */}
      <div className="card bg-base-100 border border-base-200 p-4 rounded-2xl shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <IconSearch className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40" />
          <input
            type="text"
            placeholder="Buscar por reactivo, lote, marca..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input input-sm input-bordered w-full pl-9 rounded-xl text-xs font-semibold focus:input-primary"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="select select-sm select-bordered rounded-xl text-xs font-semibold"
          >
            <option value="all">Todas las Categorías</option>
            <option value="Química Clínica">Química Clínica</option>
            <option value="Hematología">Hematología</option>
            <option value="Urianálisis">Urianálisis</option>
            <option value="Coagulación">Coagulación</option>
            <option value="Inmunología">Inmunología</option>
          </select>

          <div className="join">
            <button
              onClick={() => setStatusFilter('all')}
              className={`btn btn-xs join-item font-bold ${statusFilter === 'all' ? 'btn-neutral' : 'btn-ghost'}`}
            >
              Todos
            </button>
            <button
              onClick={() => setStatusFilter('optimal')}
              className={`btn btn-xs join-item font-bold text-success ${statusFilter === 'optimal' ? 'btn-neutral' : 'btn-ghost'}`}
            >
              Óptimos
            </button>
            <button
              onClick={() => setStatusFilter('warning')}
              className={`btn btn-xs join-item font-bold text-warning ${statusFilter === 'warning' ? 'btn-neutral' : 'btn-ghost'}`}
            >
              Alertas
            </button>
            <button
              onClick={() => setStatusFilter('critical')}
              className={`btn btn-xs join-item font-bold text-error ${statusFilter === 'critical' ? 'btn-neutral' : 'btn-ghost'}`}
            >
              Críticos
            </button>
          </div>
        </div>
      </div>

      {/* Grid de Lotes de Reactivos con Semáforo */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredReagents.map((reagent) => {
          const status = getReagentStatus(reagent);
          const daysLeft = getDaysUntilExpiration(reagent.expirationDate);
          const pctLeft = Math.round((reagent.remainingTests / reagent.initialTests) * 100);

          return (
            <div
              key={reagent.id}
              className={`card bg-base-100 border p-5 rounded-2xl shadow-xs transition-all hover:shadow-md flex flex-col justify-between space-y-4 ${
                status === 'critical'
                  ? 'border-error/50 bg-error/5'
                  : status === 'warning'
                  ? 'border-warning/50 bg-warning/5'
                  : 'border-base-200'
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <span className="badge badge-ghost badge-sm text-[10px] font-bold uppercase">
                    {reagent.category}
                  </span>
                  {status === 'optimal' ? (
                    <span className="badge badge-success text-white badge-sm text-[10px] font-bold gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> Vigente ({daysLeft}d)
                    </span>
                  ) : status === 'warning' ? (
                    <span className="badge badge-warning badge-sm text-[10px] font-bold gap-1">
                      <IconAlertTriangle className="w-3 h-3" /> {daysLeft <= 30 ? `Vence en ${daysLeft}d` : 'Stock Bajo'}
                    </span>
                  ) : (
                    <span className="badge badge-error text-white badge-sm text-[10px] font-bold gap-1">
                      <IconAlertCircle className="w-3 h-3" /> {daysLeft <= 0 ? 'Caducado' : 'Agotado'}
                    </span>
                  )}
                </div>

                <div>
                  <h3 className="font-extrabold text-sm text-base-content leading-tight">
                    {reagent.name}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-base-content/60 mt-1">
                    <span>{reagent.brand}</span>
                    <span>•</span>
                    <span className="font-mono font-bold text-base-content/80">Lote: {reagent.lotNumber}</span>
                  </div>
                </div>

                <div className="bg-base-100/80 p-3 rounded-xl border border-base-200 space-y-2">
                  <div className="flex justify-between items-baseline text-xs">
                    <span className="text-base-content/60 font-semibold">Determinaciones:</span>
                    <span className="font-mono font-black text-sm">
                      {reagent.remainingTests}{' '}
                      <span className="text-xs font-normal text-base-content/50">
                        / {reagent.initialTests} ({pctLeft}%)
                      </span>
                    </span>
                  </div>

                  {/* Barra de progreso */}
                  <progress
                    className={`progress w-full h-2 rounded-full ${
                      status === 'critical'
                        ? 'progress-error'
                        : status === 'warning'
                        ? 'progress-warning'
                        : 'progress-primary'
                    }`}
                    value={reagent.remainingTests}
                    max={reagent.initialTests}
                  />

                  <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 text-base-content/70">
                    <div>
                      <span className="block text-[9px] uppercase font-bold text-base-content/40">Caducidad</span>
                      <span className="font-semibold">{reagent.expirationDate}</span>
                    </div>
                    <div>
                      <span className="block text-[9px] uppercase font-bold text-base-content/40">Conservación</span>
                      <span className="font-semibold truncate block">{reagent.storageCondition}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Botón de Ajuste / Descuento */}
              <div className="flex items-center justify-between pt-2 border-t border-base-200">
                <span className="text-[11px] text-base-content/50 font-medium">
                  {reagent.presentation}
                </span>

                <button
                  onClick={() => {
                    setSelectedForAdjust(reagent);
                    setAdjustAmount(1);
                  }}
                  className="btn btn-xs btn-outline btn-primary rounded-xl font-bold gap-1"
                >
                  <IconSparkles className="w-3.5 h-3.5" />
                  Descontar Pruebas
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal para Registrar Nuevo Lote */}
      {isAddModalOpen && (
        <dialog className="modal modal-open z-50 p-2 sm:p-4">
          <div className="modal-box w-full max-w-[95vw] sm:max-w-lg bg-base-100 rounded-3xl p-4 sm:p-6 border border-base-200 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-base-200 pb-3">
              <div className="flex items-center gap-2">
                <IconFlask className="w-5 h-5 text-primary" />
                <h3 className="font-black text-base text-base-content">
                  Registrar Entrada de Lote de Reactivo
                </h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="btn btn-sm btn-circle btn-ghost"
              >
                <IconX className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveNewReagent} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-base-content/70 block mb-1">
                  Nombre del Reactivo *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Glucosa GOD-PAP Líquida"
                  value={newReagent.name}
                  onChange={(e) => setNewReagent({ ...newReagent, name: e.target.value })}
                  className="input input-sm input-bordered w-full rounded-xl text-xs font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-base-content/70 block mb-1">
                    Categoría
                  </label>
                  <select
                    value={newReagent.category}
                    onChange={(e) => setNewReagent({ ...newReagent, category: e.target.value })}
                    className="select select-sm select-bordered w-full rounded-xl text-xs font-semibold"
                  >
                    <option value="Química Clínica">Química Clínica</option>
                    <option value="Hematología">Hematología</option>
                    <option value="Urianálisis">Urianálisis</option>
                    <option value="Coagulación">Coagulación</option>
                    <option value="Inmunología">Inmunología</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-base-content/70 block mb-1">
                    Marca / Proveedor
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. Wiener Lab / Roche"
                    value={newReagent.brand}
                    onChange={(e) => setNewReagent({ ...newReagent, brand: e.target.value })}
                    className="input input-sm input-bordered w-full rounded-xl text-xs font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-base-content/70 block mb-1">
                    Número de Lote *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. LT-202611-B"
                    value={newReagent.lotNumber}
                    onChange={(e) => setNewReagent({ ...newReagent, lotNumber: e.target.value })}
                    className="input input-sm input-bordered w-full rounded-xl text-xs font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-base-content/70 block mb-1">
                    Fecha de Caducidad *
                  </label>
                  <input
                    type="date"
                    required
                    value={newReagent.expirationDate}
                    onChange={(e) => setNewReagent({ ...newReagent, expirationDate: e.target.value })}
                    className="input input-sm input-bordered w-full rounded-xl text-xs font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-base-content/70 block mb-1">
                    Determinaciones Iniciales
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={newReagent.initialTests}
                    onChange={(e) => setNewReagent({ ...newReagent, initialTests: Number(e.target.value) })}
                    className="input input-sm input-bordered w-full rounded-xl text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-base-content/70 block mb-1">
                    Alerta de Stock Mínimo
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={newReagent.minThreshold}
                    onChange={(e) => setNewReagent({ ...newReagent, minThreshold: Number(e.target.value) })}
                    className="input input-sm input-bordered w-full rounded-xl text-xs font-bold"
                  />
                </div>
              </div>

              <div className="modal-action pt-3 border-t border-base-200">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="btn btn-sm btn-ghost rounded-xl text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn-sm btn-primary text-white font-bold rounded-xl text-xs shadow-md"
                >
                  Guardar Lote
                </button>
              </div>
            </form>
          </div>
        </dialog>
      )}

      {/* Modal para Ajustar o Descontar Determinaciones */}
      {selectedForAdjust && (
        <dialog className="modal modal-open z-50 p-2 sm:p-4">
          <div className="modal-box w-full max-w-[95vw] sm:max-w-sm bg-base-100 rounded-3xl p-4 sm:p-6 border border-base-200 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-base-200 pb-3">
              <h3 className="font-bold text-sm text-base-content">
                Descuento de Determinaciones
              </h3>
              <button
                onClick={() => setSelectedForAdjust(null)}
                className="btn btn-xs btn-circle btn-ghost"
              >
                <IconX className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs space-y-1 bg-base-200/50 p-3 rounded-xl">
              <p className="font-bold text-base-content">{selectedForAdjust.name}</p>
              <p className="text-base-content/60">Lote: <strong className="font-mono">{selectedForAdjust.lotNumber}</strong></p>
              <p className="text-base-content/60">Disponibles actuales: <strong className="text-primary font-bold">{selectedForAdjust.remainingTests}</strong></p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-base-content/70 block">
                Pruebas consumidas en corrida analítica:
              </label>
              <div className="join w-full">
                <button
                  type="button"
                  className="btn btn-sm join-item rounded-l-xl"
                  onClick={() => setAdjustAmount(Math.max(1, adjustAmount - 5))}
                >
                  -5
                </button>
                <input
                  type="number"
                  min="1"
                  max={selectedForAdjust.remainingTests}
                  value={adjustAmount}
                  onChange={(e) => setAdjustAmount(Number(e.target.value))}
                  className="input input-sm input-bordered join-item w-full text-center font-bold text-sm"
                />
                <button
                  type="button"
                  className="btn btn-sm join-item rounded-r-xl"
                  onClick={() => setAdjustAmount(adjustAmount + 5)}
                >
                  +5
                </button>
              </div>
            </div>

            <div className="modal-action pt-3 border-t border-base-200 flex justify-end gap-2">
              <button
                onClick={() => setSelectedForAdjust(null)}
                className="btn btn-xs btn-ghost rounded-xl"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDeductTests(adjustAmount)}
                className="btn btn-xs btn-primary text-white font-bold rounded-xl gap-1"
              >
                <IconCheckCircle className="w-3.5 h-3.5" />
                Confirmar Descuento
              </button>
            </div>
          </div>
        </dialog>
      )}
    </div>
  );
}
