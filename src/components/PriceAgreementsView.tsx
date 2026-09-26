// src/components/PriceAgreementsView.tsx
import { useState, useEffect, useCallback } from 'react';
import { useApi } from '../hooks/useApi';
import type { PriceAgreement } from '../types/agreement';
import type { Laboratory } from '../types/lab';
import { toast } from 'react-toastify';
import {
  IconHandshake,
  IconPlus,
  IconRefresh,
  IconTrash,
  IconEdit,
  IconAlertTriangle,
  IconX,
  IconCheckCircle,
  IconTag,
  IconSearch,
  IconBuilding,
} from './icons';

interface PriceAgreementsViewProps {
  labs?: Laboratory[];
}

export default function PriceAgreementsView({ labs }: PriceAgreementsViewProps) {
  const api = useApi();

  const [availableLabs, setAvailableLabs] = useState<Laboratory[]>(labs || []);
  const [agreements, setAgreements] = useState<PriceAgreement[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLabFilter, setSelectedLabFilter] = useState<string>('ALL');

  // Modales
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PriceAgreement | null>(null);

  // Form State para Crear
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    discountPct: 10,
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    notes: '',
  });
  const [selectedCreateLabIds, setSelectedCreateLabIds] = useState<string[]>([]);

  // State de sedes para Editar
  const [selectedEditLabIds, setSelectedEditLabIds] = useState<string[]>([]);

  // Sincronizar o cargar sedes si no vienen por props
  useEffect(() => {
    if (labs && labs.length > 0) {
      setAvailableLabs(labs);
    } else {
      api
        .get<Laboratory[]>('/lab')
        .then((res) => {
          if (Array.isArray(res.data)) {
            setAvailableLabs(res.data);
          }
        })
        .catch((err) => console.warn('No fue posible cargar sedes para convenios:', err));
    }
  }, [labs, api]);

  const fetchAgreements = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/agreements');
      if (Array.isArray(res.data)) {
        setAgreements(res.data);
      }
    } catch (err) {
      console.error('Error fetching agreements:', err);
      toast.error('No se pudieron cargar los convenios');
    } finally {
      setIsLoading(false);
    }
  }, [api]);

  useEffect(() => {
    fetchAgreements();
  }, [fetchAgreements]);

  const handleToggleActive = async (item: PriceAgreement) => {
    try {
      const newStatus = !item.isActive;
      await api.patch(`/agreements/${item.id}`, { isActive: newStatus });
      setAgreements((prev) =>
        prev.map((a) => (a.id === item.id ? { ...a, isActive: newStatus } : a))
      );
      toast.info(`Convenio ${newStatus ? 'activado' : 'pausado'}`);
    } catch {
      toast.error('Error al modificar el estado del convenio');
    }
  };

  const handleOpenCreateModal = () => {
    // Si hay un filtro de sede activo, pre-seleccionarla; si solo tiene 1 sede, seleccionarla
    if (selectedLabFilter !== 'ALL') {
      setSelectedCreateLabIds([selectedLabFilter]);
    } else if (availableLabs.length === 1) {
      setSelectedCreateLabIds([availableLabs[0].id]);
    } else {
      setSelectedCreateLabIds([]);
    }

    setFormData({
      name: '',
      code: '',
      discountPct: 10,
      contactName: '',
      contactEmail: '',
      contactPhone: '',
      notes: '',
    });
    setIsCreateOpen(true);
  };

  const handleToggleSelectAllCreateLabs = () => {
    if (selectedCreateLabIds.length === availableLabs.length) {
      setSelectedCreateLabIds([]);
    } else {
      setSelectedCreateLabIds(availableLabs.map((l) => l.id));
    }
  };

  const handleToggleLabCreate = (labId: string) => {
    setSelectedCreateLabIds((prev) =>
      prev.includes(labId) ? prev.filter((id) => id !== labId) : [...prev, labId]
    );
  };

  const handleOpenEditModal = (item: PriceAgreement) => {
    setEditingItem(item);
    setSelectedEditLabIds(item.laboratories?.map((l) => l.id) || []);
  };

  const handleToggleSelectAllEditLabs = () => {
    if (selectedEditLabIds.length === availableLabs.length) {
      setSelectedEditLabIds([]);
    } else {
      setSelectedEditLabIds(availableLabs.map((l) => l.id));
    }
  };

  const handleToggleLabEdit = (labId: string) => {
    setSelectedEditLabIds((prev) =>
      prev.includes(labId) ? prev.filter((id) => id !== labId) : [...prev, labId]
    );
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.code.trim()) {
      toast.warning('Por favor ingresa el nombre y código del convenio');
      return;
    }

    if (availableLabs.length > 0 && selectedCreateLabIds.length === 0) {
      toast.warning('Por favor selecciona al menos una sede donde aplicará este convenio');
      return;
    }

    try {
      await api.post('/agreements', {
        name: formData.name.trim(),
        code: formData.code.trim().toUpperCase(),
        discountPct: Number(formData.discountPct) || 0,
        contactName: formData.contactName.trim() || undefined,
        contactEmail: formData.contactEmail.trim() || undefined,
        contactPhone: formData.contactPhone.trim() || undefined,
        notes: formData.notes.trim() || undefined,
        laboratoryIds: selectedCreateLabIds,
      });

      toast.success('Convenio registrado exitosamente');
      setIsCreateOpen(false);
      fetchAgreements();
    } catch (err: any) {
      const msg = err.response?.data?.message || 'No se pudo registrar el convenio';
      toast.error(msg);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    if (availableLabs.length > 0 && selectedEditLabIds.length === 0) {
      toast.warning('Por favor selecciona al menos una sede donde aplicará este convenio');
      return;
    }

    try {
      await api.patch(`/agreements/${editingItem.id}`, {
        name: editingItem.name,
        code: editingItem.code.toUpperCase(),
        discountPct: Number(editingItem.discountPct) || 0,
        contactName: editingItem.contactName || undefined,
        contactEmail: editingItem.contactEmail || undefined,
        contactPhone: editingItem.contactPhone || undefined,
        notes: editingItem.notes || undefined,
        laboratoryIds: selectedEditLabIds,
      });

      toast.success('Convenio y sedes asignadas actualizados');
      setEditingItem(null);
      fetchAgreements();
    } catch (err: any) {
      const msg = err.response?.data?.message || 'No se pudo actualizar el convenio';
      toast.error(msg);
    }
  };

  const handleDeletePrompt = (item: PriceAgreement) => {
    toast(
      ({ closeToast }) => (
        <div className="flex flex-col gap-2 p-1">
          <div className="flex items-center gap-2 text-warning font-bold text-xs">
            <IconAlertTriangle className="w-4 h-4 shrink-0" />
            <span>¿Eliminar este convenio?</span>
          </div>
          <p className="text-[11px] opacity-90">
            Se eliminará el convenio <span className="font-semibold">"{item.name}"</span> ({item.code}).
          </p>
          <div className="flex items-center justify-end gap-2 mt-2">
            <button onClick={closeToast} className="btn btn-ghost btn-xs rounded-lg">
              Cancelar
            </button>
            <button
              onClick={async () => {
                try {
                  await api.delete(`/agreements/${item.id}`);
                  setAgreements((prev) => prev.filter((a) => a.id !== item.id));
                  toast.success('Convenio eliminado');
                } catch {
                  toast.error('Error al eliminar convenio');
                }
                closeToast();
              }}
              className="btn btn-error btn-xs rounded-lg text-white font-semibold"
            >
              <IconTrash className="w-3.5 h-3.5" /> Sí, eliminar
            </button>
          </div>
        </div>
      ),
      {
        autoClose: false,
        closeOnClick: false,
        position: 'top-center',
      }
    );
  };

  // Filtrar por término de búsqueda y por Sede seleccionada
  const agreementList = Array.isArray(agreements) ? agreements : [];
  const filtered = agreementList.filter((a) => {
    const matchesSearch =
      a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (a.contactName && a.contactName.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    if (selectedLabFilter === 'ALL') return true;

    return a.laboratories?.some((l) => l.id === selectedLabFilter);
  });

  const activeCount = agreementList.filter((a) => a.isActive).length;
  const avgDiscount =
    agreements.length > 0
      ? Math.round(agreements.reduce((acc, curr) => acc + curr.discountPct, 0) / agreements.length)
      : 0;

  return (
    <div className="space-y-6">
      {/* 1. Cabecera */}
      <section className="card bg-base-100 border border-base-200 p-5 sm:p-6 shadow-xs rounded-2xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="badge badge-sm badge-outline text-primary border-primary/30 font-semibold gap-1.5 py-2.5 px-3">
                <IconHandshake className="w-3.5 h-3.5" />
                Comercial y Tarifas
              </span>
              <span className="badge badge-sm badge-ghost text-base-content/60 font-medium">
                Convenios por Sede
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-base-content tracking-tight">
              Gestor de Convenios, Aseguradoras y Listas de Precios
            </h1>
            <p className="text-xs sm:text-sm text-base-content/70 max-w-2xl leading-relaxed">
              Configura tus propios descuentos comerciales y convenios locales. Asigna cada tarifa a una o varias sedes de tu laboratorio para aplicarlas automáticamente al emitir órdenes de trabajo.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleOpenCreateModal}
              className="btn btn-primary btn-sm gap-2 font-semibold rounded-xl text-xs shadow-xs"
            >
              <IconPlus className="w-4 h-4" />
              Nuevo Convenio
            </button>
            <button
              onClick={fetchAgreements}
              className="btn btn-ghost btn-sm border border-base-200 hover:bg-base-200 gap-1.5 rounded-xl text-xs font-semibold"
              disabled={isLoading}
            >
              <IconRefresh className={`w-4 h-4 ${isLoading ? 'animate-spin text-primary' : ''}`} />
              Actualizar
            </button>
          </div>
        </div>
      </section>

      {/* 2. Métricas de Convenios */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card bg-base-100 border border-base-200 p-4 rounded-2xl shadow-xs">
          <span className="text-[11px] font-semibold text-base-content/60 uppercase">Convenios Totales</span>
          <span className="text-2xl font-black text-base-content mt-1">{agreements.length}</span>
          <span className="text-[11px] text-base-content/50 mt-0.5">Empresas e instituciones</span>
        </div>

        <div className="card bg-base-100 border border-base-200 p-4 rounded-2xl shadow-xs">
          <span className="text-[11px] font-semibold text-base-content/60 uppercase">Convenios Activos</span>
          <span className="text-2xl font-black text-success mt-1">{activeCount}</span>
          <span className="text-[11px] text-base-content/50 mt-0.5">Disponibles en recepción</span>
        </div>

        <div className="card bg-base-100 border border-base-200 p-4 rounded-2xl shadow-xs">
          <span className="text-[11px] font-semibold text-base-content/60 uppercase">Descuento Promedio</span>
          <span className="text-2xl font-black text-primary mt-1">{avgDiscount}%</span>
          <span className="text-[11px] text-base-content/50 mt-0.5">Margen preferencial</span>
        </div>
      </section>

      {/* 3. Filtros: Búsqueda de Texto y Selector de Sedes */}
      <section className="card bg-base-100 border border-base-200 p-4 rounded-2xl shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <IconSearch className="w-4 h-4 text-base-content/40 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por nombre, código o contacto..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input input-sm input-bordered w-full pl-9 rounded-xl text-xs"
          />
        </div>

        {availableLabs.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-base-content/70 whitespace-nowrap flex items-center gap-1">
              <IconBuilding className="w-3.5 h-3.5 text-primary" /> Filtrar por Sede:
            </span>
            <select
              className="select select-sm select-bordered rounded-xl text-xs font-semibold focus:select-primary"
              value={selectedLabFilter}
              onChange={(e) => setSelectedLabFilter(e.target.value)}
            >
              <option value="ALL">Todas las sedes ({agreements.length})</option>
              {availableLabs.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name} {l.city ? `(${l.city})` : ''}
                </option>
              ))}
            </select>
          </div>
        )}
      </section>

      {/* 4. Tabla de Convenios */}
      <section className="card bg-base-100 border border-base-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table table-sm text-xs">
            <thead className="bg-base-200/50 text-[11px] uppercase tracking-wider text-base-content/70">
              <tr>
                <th>Convenio / Razón Social</th>
                <th>Código Único</th>
                <th>Descuento</th>
                <th>Sedes Habilitadas</th>
                <th>Contacto</th>
                <th>Notas</th>
                <th>Estado</th>
                <th className="text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-base-100">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="text-center py-12">
                    <span className="loading loading-spinner text-primary loading-md"></span>
                    <p className="text-xs text-base-content/60 mt-2 font-medium">Cargando convenios...</p>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-base-content/60">
                    <IconHandshake className="w-8 h-8 opacity-30 mx-auto mb-2 text-primary" />
                    {selectedLabFilter !== 'ALL'
                      ? 'No hay convenios registrados para la sede seleccionada'
                      : 'No se encontraron convenios registrados'}
                  </td>
                </tr>
              ) : (
                filtered.map((item) => {
                  const itemLabs = item.laboratories || [];
                  const isAllLabs =
                    availableLabs.length > 1 && itemLabs.length >= availableLabs.length;

                  return (
                    <tr key={item.id} className="hover:bg-base-200/40">
                      <td className="font-semibold text-base-content">{item.name}</td>
                      <td>
                        <span className="badge badge-ghost font-mono font-bold badge-xs text-primary border border-primary/20">
                          {item.code}
                        </span>
                      </td>
                      <td>
                        <span className="badge badge-success text-white font-bold badge-xs gap-1">
                          <IconTag className="w-3 h-3" />
                          {item.discountPct}% OFF
                        </span>
                      </td>
                      <td>
                        {isAllLabs ? (
                          <span className="badge badge-primary text-white badge-xs font-bold gap-1">
                            <IconBuilding className="w-3 h-3" /> Todas mis sedes ({itemLabs.length})
                          </span>
                        ) : itemLabs.length > 0 ? (
                          <div className="flex flex-wrap gap-1 max-w-xs">
                            {itemLabs.map((l) => (
                              <span
                                key={l.id}
                                className="badge badge-outline badge-xs text-primary border-primary/40 font-medium"
                                title={l.city || undefined}
                              >
                                {l.name}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="badge badge-ghost badge-xs text-base-content/50">
                            Sin sedes asignadas
                          </span>
                        )}
                      </td>
                      <td>
                        <div className="flex flex-col">
                          <span className="text-base-content font-medium">{item.contactName || 'Sin contacto'}</span>
                          <span className="text-[10px] text-base-content/50">
                            {item.contactEmail || item.contactPhone || 'N/A'}
                          </span>
                        </div>
                      </td>
                      <td className="max-w-xs truncate text-base-content/70" title={item.notes || ''}>
                        {item.notes || '—'}
                      </td>
                      <td>
                        <div className="flex items-center gap-1.5">
                          <input
                            type="checkbox"
                            checked={item.isActive}
                            onChange={() => handleToggleActive(item)}
                            className="toggle toggle-primary toggle-xs"
                          />
                          <span className="text-[10px] font-semibold text-base-content/70">
                            {item.isActive ? 'Activo' : 'Pausado'}
                          </span>
                        </div>
                      </td>
                      <td className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleOpenEditModal(item)}
                            className="btn btn-ghost btn-xs btn-circle text-base-content/70 hover:text-primary"
                            title="Modificar Convenio y Sedes"
                          >
                            <IconEdit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeletePrompt(item)}
                            className="btn btn-ghost btn-xs btn-circle text-error/70 hover:text-error"
                            title="Eliminar Convenio"
                          >
                            <IconTrash className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Modal Crear Convenio */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="card bg-base-100 border border-base-200 shadow-2xl rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-scale-up">
            <div className="p-4 sm:p-5 border-b border-base-200 flex items-center justify-between sticky top-0 bg-base-100 z-10">
              <h3 className="font-bold text-sm text-base-content flex items-center gap-2">
                <IconHandshake className="w-4 h-4 text-primary" />
                Registrar Nuevo Convenio / Descuento
              </h3>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="btn btn-ghost btn-xs btn-circle"
              >
                <IconX className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-4 sm:p-6 space-y-3.5 text-xs">
              <div>
                <label className="text-[11px] font-bold text-base-content/70 block mb-1">
                  Nombre del Convenio, Empresa o Institución *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ej: Aseguradora AXA Salud / Descuento INAPAM"
                  className="input input-sm input-bordered w-full rounded-xl text-xs"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-base-content/70 block mb-1">
                    Código Identificador *
                  </label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    placeholder="CONV-AXA"
                    className="input input-sm input-bordered w-full rounded-xl text-xs font-mono uppercase"
                    required
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-base-content/70 block mb-1">
                    Descuento Otorgado (%) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.discountPct}
                    onChange={(e) =>
                      setFormData({ ...formData, discountPct: parseFloat(e.target.value) || 0 })
                    }
                    className="input input-sm input-bordered w-full rounded-xl text-xs font-semibold"
                    required
                  />
                </div>
              </div>

              {/* Selector de Sedes donde está habilitado */}
              <div className="p-3.5 bg-base-200/60 rounded-2xl border border-base-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[11px] text-base-content flex items-center gap-1.5">
                    <IconBuilding className="w-3.5 h-3.5 text-primary" />
                    Sedes donde aplica este descuento:
                  </span>
                  {availableLabs.length > 1 && (
                    <button
                      type="button"
                      onClick={handleToggleSelectAllCreateLabs}
                      className="text-[10px] text-primary hover:underline font-semibold"
                    >
                      {selectedCreateLabIds.length === availableLabs.length
                        ? 'Desmarcar todas'
                        : 'Seleccionar todas'}
                    </button>
                  )}
                </div>

                {availableLabs.length === 0 ? (
                  <p className="text-[11px] text-base-content/60 italic">
                    No tienes sedes registradas aún. Da de alta una sede primero para asignarle convenios.
                  </p>
                ) : (
                  <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                    {availableLabs.map((lab) => {
                      const isChecked = selectedCreateLabIds.includes(lab.id);
                      return (
                        <label
                          key={lab.id}
                          className={`flex items-center justify-between p-2 rounded-xl border cursor-pointer transition-all ${
                            isChecked
                              ? 'bg-primary/5 border-primary/40'
                              : 'bg-base-100 border-base-200 hover:border-base-300'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handleToggleLabCreate(lab.id)}
                              className="checkbox checkbox-primary checkbox-xs rounded-md"
                            />
                            <span className="font-semibold text-xs text-base-content truncate">
                              {lab.name}
                            </span>
                          </div>
                          {lab.city && (
                            <span className="text-[10px] text-base-content/50 shrink-0 ml-2">
                              {lab.city}
                            </span>
                          )}
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>

              <div>
                <label className="text-[11px] font-bold text-base-content/70 block mb-1">
                  Nombre del Contacto / Enlace
                </label>
                <input
                  type="text"
                  value={formData.contactName}
                  onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                  placeholder="Lic. Mariana Torres"
                  className="input input-sm input-bordered w-full rounded-xl text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-base-content/70 block mb-1">
                    Correo Electrónico
                  </label>
                  <input
                    type="email"
                    value={formData.contactEmail}
                    onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                    placeholder="convenios@empresa.com"
                    className="input input-sm input-bordered w-full rounded-xl text-xs"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-base-content/70 block mb-1">
                    Teléfono
                  </label>
                  <input
                    type="tel"
                    value={formData.contactPhone}
                    onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                    placeholder="55 1234 5678"
                    className="input input-sm input-bordered w-full rounded-xl text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-base-content/70 block mb-1">
                  Notas o Condiciones Especiales
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={2}
                  placeholder="Válido presentando credencial vigente o código de empleado..."
                  className="textarea textarea-bordered w-full rounded-xl text-xs"
                ></textarea>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-base-200">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="btn btn-sm btn-ghost rounded-xl text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn-sm btn-primary rounded-xl font-semibold text-xs gap-1.5 shadow-xs"
                >
                  <IconCheckCircle className="w-4 h-4" />
                  Guardar Convenio
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Editar Convenio y Asignar a Demás Sedes */}
      {editingItem && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="card bg-base-100 border border-base-200 shadow-2xl rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-scale-up">
            <div className="p-4 sm:p-5 border-b border-base-200 flex items-center justify-between sticky top-0 bg-base-100 z-10">
              <h3 className="font-bold text-sm text-base-content flex items-center gap-2">
                <IconEdit className="w-4 h-4 text-primary" />
                Modificar Convenio y Asignación de Sedes
              </h3>
              <button
                onClick={() => setEditingItem(null)}
                className="btn btn-ghost btn-xs btn-circle"
              >
                <IconX className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-4 sm:p-6 space-y-3.5 text-xs">
              <div>
                <label className="text-[11px] font-bold text-base-content/70 block mb-1">
                  Nombre
                </label>
                <input
                  type="text"
                  value={editingItem.name}
                  onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                  className="input input-sm input-bordered w-full rounded-xl text-xs"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-base-content/70 block mb-1">
                    Código
                  </label>
                  <input
                    type="text"
                    value={editingItem.code}
                    onChange={(e) => setEditingItem({ ...editingItem, code: e.target.value })}
                    className="input input-sm input-bordered w-full rounded-xl text-xs font-mono uppercase"
                    required
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-base-content/70 block mb-1">
                    Descuento (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={editingItem.discountPct}
                    onChange={(e) =>
                      setEditingItem({
                        ...editingItem,
                        discountPct: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="input input-sm input-bordered w-full rounded-xl text-xs font-semibold"
                    required
                  />
                </div>
              </div>

              {/* Selector de Sedes Habilitadas (Asignar a las demás sedes) */}
              <div className="p-3.5 bg-base-200/60 rounded-2xl border border-base-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[11px] text-base-content flex items-center gap-1.5">
                    <IconBuilding className="w-3.5 h-3.5 text-primary" />
                    Sedes con este descuento habilitado:
                  </span>
                  {availableLabs.length > 1 && (
                    <button
                      type="button"
                      onClick={handleToggleSelectAllEditLabs}
                      className="text-[10px] text-primary hover:underline font-semibold"
                    >
                      {selectedEditLabIds.length === availableLabs.length
                        ? 'Desmarcar todas'
                        : 'Seleccionar todas'}
                    </button>
                  )}
                </div>

                {availableLabs.length === 0 ? (
                  <p className="text-[11px] text-base-content/60 italic">
                    No hay sedes disponibles.
                  </p>
                ) : (
                  <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                    {availableLabs.map((lab) => {
                      const isChecked = selectedEditLabIds.includes(lab.id);
                      return (
                        <label
                          key={lab.id}
                          className={`flex items-center justify-between p-2 rounded-xl border cursor-pointer transition-all ${
                            isChecked
                              ? 'bg-primary/5 border-primary/40'
                              : 'bg-base-100 border-base-200 hover:border-base-300'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handleToggleLabEdit(lab.id)}
                              className="checkbox checkbox-primary checkbox-xs rounded-md"
                            />
                            <span className="font-semibold text-xs text-base-content truncate">
                              {lab.name}
                            </span>
                          </div>
                          {lab.city && (
                            <span className="text-[10px] text-base-content/50 shrink-0 ml-2">
                              {lab.city}
                            </span>
                          )}
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>

              <div>
                <label className="text-[11px] font-bold text-base-content/70 block mb-1">
                  Contacto
                </label>
                <input
                  type="text"
                  value={editingItem.contactName || ''}
                  onChange={(e) =>
                    setEditingItem({ ...editingItem, contactName: e.target.value })
                  }
                  className="input input-sm input-bordered w-full rounded-xl text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-base-content/70 block mb-1">
                    Correo Electrónico
                  </label>
                  <input
                    type="email"
                    value={editingItem.contactEmail || ''}
                    onChange={(e) =>
                      setEditingItem({ ...editingItem, contactEmail: e.target.value })
                    }
                    className="input input-sm input-bordered w-full rounded-xl text-xs"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-base-content/70 block mb-1">
                    Teléfono
                  </label>
                  <input
                    type="tel"
                    value={editingItem.contactPhone || ''}
                    onChange={(e) =>
                      setEditingItem({ ...editingItem, contactPhone: e.target.value })
                    }
                    className="input input-sm input-bordered w-full rounded-xl text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-base-content/70 block mb-1">
                  Notas
                </label>
                <textarea
                  value={editingItem.notes || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, notes: e.target.value })}
                  rows={2}
                  className="textarea textarea-bordered w-full rounded-xl text-xs"
                ></textarea>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-base-200">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="btn btn-sm btn-ghost rounded-xl text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn-sm btn-primary rounded-xl font-semibold text-xs gap-1.5 shadow-xs"
                >
                  <IconCheckCircle className="w-4 h-4" />
                  Actualizar Convenio y Sedes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
