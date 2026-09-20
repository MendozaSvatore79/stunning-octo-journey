// src/components/ReagentsInventoryView.tsx
import { useState, useMemo, useEffect, useCallback } from 'react';
import { useApi } from '../hooks/useApi';
import { toast } from 'react-toastify';
import {
  IconFlask,
  IconCheckCircle,
  IconAlertTriangle,
  IconAlertCircle,
  IconPlus,
  IconSearch,
  IconX,
  IconSparkles,
  IconTrash,
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

const STORAGE_KEY = 'lab_reagents_inventory_v1';

export default function ReagentsInventoryView() {
  const api = useApi();
  const [reagents, setReagents] = useState<ReagentLot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'optimal' | 'warning' | 'critical'>('all');

  // Cargar inventario desde Neon DB vía Backend API
  const fetchReagents = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/reagents');
      if (Array.isArray(res.data)) {
        setReagents(res.data);
      } else {
        setReagents([]);
      }
    } catch (err) {
      console.error('Error al cargar inventario de reactivos desde la BD:', err);
      setReagents([]);
    } finally {
      setIsLoading(false);
    }
  }, [api]);

  useEffect(() => {
    // Limpiar cualquier residuo de mock previo en localStorage
    localStorage.removeItem(STORAGE_KEY);
    fetchReagents();
  }, [fetchReagents]);

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

  // Manejo de guardado de nuevo reactivo en la BD
  const handleSaveNewReagent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReagent.name || !newReagent.lotNumber || !newReagent.expirationDate) {
      toast.warning('Por favor completa el nombre, número de lote y fecha de caducidad.', {
        theme: 'colored',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        name: newReagent.name.trim(),
        category: newReagent.category || 'Química Clínica',
        brand: newReagent.brand?.trim() || 'Genérico',
        lotNumber: newReagent.lotNumber.trim(),
        expirationDate: newReagent.expirationDate,
        initialTests: Number(newReagent.initialTests) || 100,
        remainingTests: Number(newReagent.initialTests) || 100,
        minThreshold: Number(newReagent.minThreshold) || 20,
        storageCondition: newReagent.storageCondition || '2°C - 8°C (Refrigerado)',
        presentation: newReagent.presentation?.trim() || 'Caja / Frasco',
      };

      const res = await api.post('/reagents', payload);
      if (res.data) {
        setReagents((prev) => [res.data, ...prev]);
        toast.success(`Lote "${res.data.name}" registrado exitosamente en la base de datos.`, {
          theme: 'colored',
          autoClose: 3000,
        });
      } else {
        await fetchReagents();
      }

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
    } catch (err) {
      console.error('Error al guardar reactivo en la base de datos:', err);
      toast.error('Hubo un error al guardar el reactivo en la base de datos.', {
        theme: 'colored',
        autoClose: 4000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Descontar determinaciones en la BD
  const handleDeductTests = async (delta: number) => {
    if (!selectedForAdjust) return;
    try {
      const res = await api.patch(`/reagents/${selectedForAdjust.id}/adjust`, {
        discount: delta,
      });
      if (res.data) {
        setReagents((prev) =>
          prev.map((r) => (r.id === selectedForAdjust.id ? res.data : r))
        );
        toast.info(`Se registraron ${delta} determinaciones descontadas para el lote ${selectedForAdjust.lotNumber}.`, {
          theme: 'colored',
          autoClose: 2500,
        });
      }
    } catch (err) {
      console.error('Error descontando pruebas en la base de datos:', err);
      // Actualización optimista
      setReagents((prev) =>
        prev.map((r) => {
          if (r.id === selectedForAdjust.id) {
            const next = Math.max(0, r.remainingTests - delta);
            return { ...r, remainingTests: next };
          }
          return r;
        })
      );
    } finally {
      setSelectedForAdjust(null);
    }
  };

  // Solicitud de confirmación interactiva con Toastify
  const requestDeleteReagent = (reagent: ReagentLot) => {
    toast(
      ({ closeToast }) => (
        <div className="space-y-3 py-1">
          <div className="flex items-start gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-error/15 text-error flex items-center justify-center shrink-0 mt-0.5">
              <IconTrash className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-extrabold text-xs text-base-content leading-tight">
                ¿Eliminar reactivo del inventario?
              </h4>
              <p className="text-[11px] text-base-content/80 mt-1">
                Lote: <strong className="font-mono text-base-content">{reagent.lotNumber}</strong>
                <br />
                <span className="font-semibold text-error">{reagent.name}</span>
              </p>
            </div>
          </div>

          <p className="text-[10px] text-base-content/50 leading-tight">
            Esta acción removerá el lote de la base de datos de manera permanente.
          </p>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-base-200">
            <button
              type="button"
              onClick={closeToast}
              className="btn btn-xs btn-ghost text-xs rounded-xl font-semibold"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={async () => {
                closeToast();
                await executeDeleteReagent(reagent.id, reagent.name);
              }}
              className="btn btn-xs btn-error text-white font-bold rounded-xl shadow-xs gap-1"
            >
              <IconTrash className="w-3 h-3" />
              Sí, eliminar
            </button>
          </div>
        </div>
      ),
      {
        position: 'top-center',
        autoClose: false,
        closeOnClick: false,
        closeButton: false,
        draggable: false,
        className: 'border border-base-300 shadow-2xl rounded-2xl bg-base-100',
      }
    );
  };

  // Ejecución de eliminación tras confirmación
  const executeDeleteReagent = async (id: string, name: string) => {
    try {
      await api.delete(`/reagents/${id}`);
      setReagents((prev) => prev.filter((r) => r.id !== id));
      toast.success(`Reactivo "${name}" eliminado correctamente del inventario.`, {
        theme: 'colored',
        autoClose: 3000,
      });
    } catch (err) {
      console.error('Error eliminando reactivo:', err);
      toast.error('No se pudo eliminar el reactivo de la base de datos.', {
        theme: 'colored',
        autoClose: 4000,
      });
    }
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

      {/* Grid de Lotes de Reactivos con Semáforo o Estado Vacío */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center p-12 bg-base-100 rounded-3xl border border-base-200 shadow-xs">
          <span className="loading loading-spinner loading-lg text-primary"></span>
          <p className="text-xs font-semibold text-base-content/60 mt-3">
            Cargando inventario de reactivos desde la base de datos...
          </p>
        </div>
      ) : reagents.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 sm:p-16 bg-base-100 rounded-3xl border border-dashed border-base-300 shadow-xs text-center space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-primary/10 text-primary flex items-center justify-center shadow-inner">
            <IconFlask className="w-8 h-8" />
          </div>
          <div className="max-w-md space-y-1.5">
            <h3 className="font-black text-base sm:text-lg text-base-content">
              Inventario Vacío
            </h3>
            <p className="text-xs text-base-content/60 leading-relaxed">
              Aún no tienes reactivos ni insumos registrados en la base de datos de tu laboratorio. Registra tu primer lote para comenzar con el control de caducidades, alertas y trazabilidad analítica ISO 15189.
            </p>
          </div>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="btn btn-primary text-white font-bold rounded-2xl text-xs gap-2 shadow-md hover:scale-[1.01] transition-transform"
          >
            <IconPlus className="w-4 h-4" />
            Registrar Primer Lote de Reactivo
          </button>
        </div>
      ) : filteredReagents.length === 0 ? (
        <div className="p-8 text-center bg-base-100 rounded-2xl border border-base-200 text-xs text-base-content/60">
          No se encontraron reactivos que coincidan con la búsqueda o filtro seleccionado.
        </div>
      ) : (
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

                {/* Acciones: Descuento y Eliminación */}
                <div className="flex items-center justify-between pt-2 border-t border-base-200 gap-2">
                  <span className="text-[11px] text-base-content/50 font-medium truncate flex-1">
                    {reagent.presentation}
                  </span>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => requestDeleteReagent(reagent)}
                      className="btn btn-xs btn-ghost btn-circle text-error/70 hover:text-error hover:bg-error/10"
                      title="Eliminar lote del inventario"
                    >
                      <IconTrash className="w-3.5 h-3.5" />
                    </button>

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
              </div>
            );
          })}
        </div>
      )}

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
                  disabled={isSubmitting}
                  className="btn btn-sm btn-primary text-white font-bold rounded-xl text-xs shadow-md gap-1.5"
                >
                  {isSubmitting ? (
                    <>
                      <span className="loading loading-spinner loading-xs"></span>
                      Guardando...
                    </>
                  ) : (
                    'Guardar Lote'
                  )}
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
