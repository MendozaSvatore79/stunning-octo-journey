// src/components/PriceAgreementsView.tsx
import { useState, useEffect, useCallback } from 'react';
import { useApi } from '../hooks/useApi';
import { useUserContext } from '../hooks/useUserContext';
import type { PriceAgreement } from '../types/agreement';
import { toast } from 'react-toastify';
import {
  IconHandshake,
  IconPlus,
  IconRefresh,
  IconShield,
  IconTrash,
  IconEdit,
  IconAlertTriangle,
  IconX,
  IconCheckCircle,
  IconTag,
  IconSearch,
} from './icons';

export default function PriceAgreementsView() {
  const api = useApi();
  const { isAdmin } = useUserContext();

  const [agreements, setAgreements] = useState<PriceAgreement[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Modales
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PriceAgreement | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    discountPct: 10,
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    notes: '',
  });

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

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.code.trim()) {
      toast.warning('Por favor ingresa el nombre y código del convenio');
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
      });

      toast.success('Convenio registrado exitosamente');
      setIsCreateOpen(false);
      setFormData({
        name: '',
        code: '',
        discountPct: 10,
        contactName: '',
        contactEmail: '',
        contactPhone: '',
        notes: '',
      });
      fetchAgreements();
    } catch (err: any) {
      const msg = err.response?.data?.message || 'No se pudo registrar el convenio';
      toast.error(msg);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    try {
      await api.patch(`/agreements/${editingItem.id}`, {
        name: editingItem.name,
        code: editingItem.code.toUpperCase(),
        discountPct: Number(editingItem.discountPct) || 0,
        contactName: editingItem.contactName || undefined,
        contactEmail: editingItem.contactEmail || undefined,
        contactPhone: editingItem.contactPhone || undefined,
        notes: editingItem.notes || undefined,
      });

      toast.success('Convenio actualizado correctamente');
      setEditingItem(null);
      fetchAgreements();
    } catch {
      toast.error('No se pudo actualizar el convenio');
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

  const filtered = agreements.filter(
    (a) =>
      a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (a.contactName && a.contactName.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const activeCount = agreements.filter((a) => a.isActive).length;
  const avgDiscount =
    agreements.length > 0
      ? Math.round(agreements.reduce((acc, curr) => acc + curr.discountPct, 0) / agreements.length)
      : 0;

  if (!isAdmin) {
    return (
      <div className="card bg-base-100 border border-base-200 p-8 text-center rounded-2xl shadow-xs">
        <IconShield className="w-12 h-12 text-warning mx-auto mb-3" />
        <h2 className="text-lg font-bold text-base-content">Acceso Exclusivo de Administrador</h2>
        <p className="text-xs text-base-content/70 mt-1">
          Las tarifas comerciales y convenios institucionales solo pueden ser configurados por el Administrador Global.
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
                <IconHandshake className="w-3.5 h-3.5" />
                Comercial y Tarifas
              </span>
              <span className="badge badge-sm badge-ghost text-base-content/60 font-medium">
                Convenios Médicos
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-base-content tracking-tight">
              Gestor de Convenios, Aseguradoras y Listas de Precios
            </h1>
            <p className="text-xs sm:text-sm text-base-content/70 max-w-2xl leading-relaxed">
              Administra convenios con hospitales, empresas y aseguradoras. Aplica descuentos y tarifas preferenciales de forma automática.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setIsCreateOpen(true)}
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
          <span className="text-[11px] text-base-content/50 mt-0.5">Disponibles para recepción</span>
        </div>

        <div className="card bg-base-100 border border-base-200 p-4 rounded-2xl shadow-xs">
          <span className="text-[11px] font-semibold text-base-content/60 uppercase">Descuento Promedio</span>
          <span className="text-2xl font-black text-primary mt-1">{avgDiscount}%</span>
          <span className="text-[11px] text-base-content/50 mt-0.5">Margen preferencial</span>
        </div>
      </section>

      {/* 3. Filtro de Búsqueda */}
      <section className="card bg-base-100 border border-base-200 p-4 rounded-2xl shadow-xs">
        <div className="relative w-full sm:w-96">
          <IconSearch className="w-4 h-4 text-base-content/40 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por nombre, código o contacto..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input input-sm input-bordered w-full pl-9 rounded-xl text-xs"
          />
        </div>
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
                <th>Contacto</th>
                <th>Notas</th>
                <th>Estado</th>
                <th className="text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-base-100">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="text-center py-12">
                    <span className="loading loading-spinner text-primary loading-md"></span>
                    <p className="text-xs text-base-content/60 mt-2 font-medium">Cargando convenios...</p>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-base-content/60">
                    <IconHandshake className="w-8 h-8 opacity-30 mx-auto mb-2 text-primary" />
                    No se encontraron convenios registrados
                  </td>
                </tr>
              ) : (
                filtered.map((item) => (
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
                          onClick={() => setEditingItem(item)}
                          className="btn btn-ghost btn-xs btn-circle text-base-content/70 hover:text-primary"
                          title="Editar Convenio"
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
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Modal Crear Convenio */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="card bg-base-100 border border-base-200 shadow-2xl rounded-2xl w-full max-w-md animate-scale-up">
            <div className="p-4 sm:p-5 border-b border-base-200 flex items-center justify-between">
              <h3 className="font-bold text-sm text-base-content flex items-center gap-2">
                <IconHandshake className="w-4 h-4 text-primary" />
                Registrar Nuevo Convenio
              </h3>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="btn btn-ghost btn-xs btn-circle"
              >
                <IconX className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-4 sm:p-5 space-y-3 text-xs">
              <div>
                <label className="text-[11px] font-bold text-base-content/70 block mb-1">
                  Nombre del Convenio o Empresa *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ej: Aseguradora AXA Salud"
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
                    Descuento Otorgado (%)
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
                  />
                </div>
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
                    placeholder="convenios@axa.com"
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
                  placeholder="Válido presentando credencial vigente de la aseguradora..."
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

      {/* Modal Editar Convenio */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="card bg-base-100 border border-base-200 shadow-2xl rounded-2xl w-full max-w-md animate-scale-up">
            <div className="p-4 sm:p-5 border-b border-base-200 flex items-center justify-between">
              <h3 className="font-bold text-sm text-base-content flex items-center gap-2">
                <IconEdit className="w-4 h-4 text-primary" />
                Modificar Convenio
              </h3>
              <button
                onClick={() => setEditingItem(null)}
                className="btn btn-ghost btn-xs btn-circle"
              >
                <IconX className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-4 sm:p-5 space-y-3 text-xs">
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
                  />
                </div>
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
                  Actualizar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
