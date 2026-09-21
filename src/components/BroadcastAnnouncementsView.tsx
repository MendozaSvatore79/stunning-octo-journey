// src/components/BroadcastAnnouncementsView.tsx
import { useState, useEffect, useCallback } from 'react';
import { useUser } from '@clerk/clerk-react';
import { useApi } from '../hooks/useApi';
import { useUserContext } from '../hooks/useUserContext';
import type { BroadcastAnnouncement, AnnouncementType, AnnouncementScope } from '../types/announcement';
import { toast } from 'react-toastify';
import {
  IconMegaphone,
  IconPlus,
  IconRefresh,
  IconShield,
  IconTrash,
  IconEdit,
  IconAlertTriangle,
  IconX,
  IconCheckCircle,
} from './icons';

export default function BroadcastAnnouncementsView() {
  const api = useApi();
  const { user } = useUser();
  const { isAdmin } = useUserContext();

  const [announcements, setAnnouncements] = useState<BroadcastAnnouncement[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Modales
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<BroadcastAnnouncement | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    type: 'INFO' as AnnouncementType,
    targetScope: 'GLOBAL' as AnnouncementScope,
    expiresAt: '',
  });

  const fetchAnnouncements = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/announcements');
      if (Array.isArray(res.data)) {
        setAnnouncements(res.data);
      }
    } catch (err) {
      console.error('Error fetching announcements:', err);
      toast.error('No se pudieron cargar los comunicados');
    } finally {
      setIsLoading(false);
    }
  }, [api]);

  useEffect(() => {
    fetchAnnouncements();
  }, [fetchAnnouncements]);

  const handleToggleActive = async (item: BroadcastAnnouncement) => {
    try {
      const newStatus = !item.isActive;
      await api.patch(`/announcements/${item.id}`, { isActive: newStatus });
      setAnnouncements((prev) =>
        prev.map((a) => (a.id === item.id ? { ...a, isActive: newStatus } : a))
      );
      toast.info(`Comunicado ${newStatus ? 'activado' : 'pausado'}`);
    } catch {
      toast.error('Error al cambiar el estado del comunicado');
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.message.trim()) {
      toast.warning('Por favor completa el título y el mensaje del comunicado');
      return;
    }

    try {
      await api.post('/announcements', {
        title: formData.title.trim(),
        message: formData.message.trim(),
        type: formData.type,
        targetScope: formData.targetScope,
        createdByName: user?.fullName || user?.firstName || 'Administrador',
        expiresAt: formData.expiresAt ? new Date(formData.expiresAt).toISOString() : undefined,
      });

      toast.success('Comunicado publicado exitosamente en la red de sedes');
      setIsCreateOpen(false);
      setFormData({
        title: '',
        message: '',
        type: 'INFO',
        targetScope: 'GLOBAL',
        expiresAt: '',
      });
      fetchAnnouncements();
    } catch {
      toast.error('No se pudo crear el comunicado');
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    try {
      await api.patch(`/announcements/${editingItem.id}`, {
        title: editingItem.title,
        message: editingItem.message,
        type: editingItem.type,
        targetScope: editingItem.targetScope,
      });

      toast.success('Comunicado actualizado correctamente');
      setEditingItem(null);
      fetchAnnouncements();
    } catch {
      toast.error('No se pudo actualizar el comunicado');
    }
  };

  const handleDeletePrompt = (item: BroadcastAnnouncement) => {
    toast(
      ({ closeToast }) => (
        <div className="flex flex-col gap-2 p-1">
          <div className="flex items-center gap-2 text-warning font-bold text-xs">
            <IconAlertTriangle className="w-4 h-4 shrink-0" />
            <span>¿Eliminar este comunicado?</span>
          </div>
          <p className="text-[11px] opacity-90">
            Se retirará permanentemente el aviso: <span className="font-semibold">"{item.title}"</span>.
          </p>
          <div className="flex items-center justify-end gap-2 mt-2">
            <button onClick={closeToast} className="btn btn-ghost btn-xs rounded-lg">
              Cancelar
            </button>
            <button
              onClick={async () => {
                try {
                  await api.delete(`/announcements/${item.id}`);
                  setAnnouncements((prev) => prev.filter((a) => a.id !== item.id));
                  toast.success('Comunicado eliminado');
                } catch {
                  toast.error('Error al eliminar comunicado');
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

  if (!isAdmin) {
    return (
      <div className="card bg-base-100 border border-base-200 p-8 text-center rounded-2xl shadow-xs">
        <IconShield className="w-12 h-12 text-warning mx-auto mb-3" />
        <h2 className="text-lg font-bold text-base-content">Acceso Exclusivo de Administrador</h2>
        <p className="text-xs text-base-content/70 mt-1">
          Solo el Administrador Global tiene facultades para emitir y gestionar comunicados del sistema.
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
                <IconMegaphone className="w-3.5 h-3.5" />
                Difusión Centralizada
              </span>
              <span className="badge badge-sm badge-ghost text-base-content/60 font-medium">
                Multisede
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-base-content tracking-tight">
              Centro de Comunicados Globales y Avisos
            </h1>
            <p className="text-xs sm:text-sm text-base-content/70 max-w-2xl leading-relaxed">
              Publica notificaciones operativas, directrices sanitarias y avisos urgentes visibles en tiempo real para todo el personal.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setIsCreateOpen(true)}
              className="btn btn-primary btn-sm gap-2 font-semibold rounded-xl text-xs shadow-xs"
            >
              <IconPlus className="w-4 h-4" />
              Nuevo Comunicado
            </button>
            <button
              onClick={fetchAnnouncements}
              className="btn btn-ghost btn-sm border border-base-200 hover:bg-base-200 gap-1.5 rounded-xl text-xs font-semibold"
              disabled={isLoading}
            >
              <IconRefresh className={`w-4 h-4 ${isLoading ? 'animate-spin text-primary' : ''}`} />
              Actualizar
            </button>
          </div>
        </div>
      </section>

      {/* 2. Lista de Comunicados */}
      <section className="card bg-base-100 border border-base-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-base-200 flex items-center justify-between">
          <h2 className="text-sm font-bold text-base-content flex items-center gap-2">
            <IconMegaphone className="w-4 h-4 text-primary" />
            Comunicados Emitidos ({announcements.length})
          </h2>
          <span className="text-[11px] text-base-content/50">
            Los comunicados activos se despliegan en la barra superior de todas las pantallas
          </span>
        </div>

        <div className="divide-y divide-base-100">
          {isLoading ? (
            <div className="text-center py-12">
              <span className="loading loading-spinner text-primary loading-md"></span>
              <p className="text-xs text-base-content/60 mt-2 font-medium">Cargando comunicados...</p>
            </div>
          ) : announcements.length === 0 ? (
            <div className="text-center py-12 p-4">
              <IconMegaphone className="w-10 h-10 opacity-30 text-primary mx-auto mb-2" />
              <p className="text-xs text-base-content/70 font-semibold">No hay comunicados registrados</p>
              <button
                onClick={() => setIsCreateOpen(true)}
                className="btn btn-xs btn-primary font-semibold rounded-lg mt-3"
              >
                Crear primer comunicado
              </button>
            </div>
          ) : (
            announcements.map((item) => {
              const typeBadge =
                item.type === 'URGENT'
                  ? 'badge-error text-white'
                  : item.type === 'WARNING'
                  ? 'badge-warning'
                  : item.type === 'MAINTENANCE'
                  ? 'badge-accent'
                  : 'badge-info text-white';

              return (
                <div
                  key={item.id}
                  className="p-4 sm:p-5 hover:bg-base-200/30 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`badge badge-xs font-bold ${typeBadge}`}>{item.type}</span>
                      <span className="badge badge-ghost badge-xs font-medium">
                        {item.targetScope === 'GLOBAL' ? 'Toda la Red (Global)' : 'Sede Específica'}
                      </span>
                      <span className="text-[11px] text-base-content/50">
                        Por: <span className="font-semibold text-base-content/70">{item.createdByName}</span> •{' '}
                        {new Date(item.createdAt).toLocaleDateString('es-MX')}
                      </span>
                    </div>

                    <h3 className="font-bold text-sm text-base-content">{item.title}</h3>
                    <p className="text-xs text-base-content/70 leading-relaxed max-w-3xl">
                      {item.message}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                    <div className="flex items-center gap-1.5 bg-base-200/50 py-1 px-2.5 rounded-xl border border-base-200">
                      <span className="text-[10px] font-bold text-base-content/60">
                        {item.isActive ? 'ACTIVO' : 'PAUSADO'}
                      </span>
                      <input
                        type="checkbox"
                        checked={item.isActive}
                        onChange={() => handleToggleActive(item)}
                        className="toggle toggle-primary toggle-xs"
                      />
                    </div>

                    <button
                      onClick={() => setEditingItem(item)}
                      className="btn btn-ghost btn-xs btn-circle text-base-content/70 hover:text-primary"
                      title="Editar"
                    >
                      <IconEdit className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handleDeletePrompt(item)}
                      className="btn btn-ghost btn-xs btn-circle text-error/70 hover:text-error"
                      title="Eliminar"
                    >
                      <IconTrash className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* Modal Crear Comunicado */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="card bg-base-100 border border-base-200 shadow-2xl rounded-2xl w-full max-w-lg animate-scale-up">
            <div className="p-4 sm:p-5 border-b border-base-200 flex items-center justify-between">
              <h3 className="font-bold text-sm text-base-content flex items-center gap-2">
                <IconMegaphone className="w-4 h-4 text-primary" />
                Emitir Nuevo Comunicado
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
                  Título del Comunicado *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Ej: Mantenimiento Preventivo de Analizadores"
                  className="input input-sm input-bordered w-full rounded-xl text-xs"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-base-content/70 block mb-1">
                    Nivel de Importancia
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) =>
                      setFormData({ ...formData, type: e.target.value as AnnouncementType })
                    }
                    className="select select-sm select-bordered w-full rounded-xl text-xs"
                  >
                    <option value="INFO">Informativo (Azul)</option>
                    <option value="WARNING">Advertencia (Ámbar)</option>
                    <option value="URGENT">Urgente / Crítico (Rojo)</option>
                    <option value="MAINTENANCE">Mantenimiento (Púrpura)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-base-content/70 block mb-1">
                    Alcance del Aviso
                  </label>
                  <select
                    value={formData.targetScope}
                    onChange={(e) =>
                      setFormData({ ...formData, targetScope: e.target.value as AnnouncementScope })
                    }
                    className="select select-sm select-bordered w-full rounded-xl text-xs"
                  >
                    <option value="GLOBAL">Toda la Red (Todas las Sedes)</option>
                    <option value="SPECIFIC_LAB">Sede del Operador</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-base-content/70 block mb-1">
                  Mensaje Detallado *
                </label>
                <textarea
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  rows={4}
                  placeholder="Escribe las instrucciones o el comunicado para el personal..."
                  className="textarea textarea-bordered w-full rounded-xl text-xs"
                  required
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
                  Publicar Aviso
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Editar Comunicado */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="card bg-base-100 border border-base-200 shadow-2xl rounded-2xl w-full max-w-lg animate-scale-up">
            <div className="p-4 sm:p-5 border-b border-base-200 flex items-center justify-between">
              <h3 className="font-bold text-sm text-base-content flex items-center gap-2">
                <IconEdit className="w-4 h-4 text-primary" />
                Editar Comunicado
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
                  Título
                </label>
                <input
                  type="text"
                  value={editingItem.title}
                  onChange={(e) => setEditingItem({ ...editingItem, title: e.target.value })}
                  className="input input-sm input-bordered w-full rounded-xl text-xs"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-base-content/70 block mb-1">
                    Tipo
                  </label>
                  <select
                    value={editingItem.type}
                    onChange={(e) =>
                      setEditingItem({
                        ...editingItem,
                        type: e.target.value as AnnouncementType,
                      })
                    }
                    className="select select-sm select-bordered w-full rounded-xl text-xs"
                  >
                    <option value="INFO">Informativo</option>
                    <option value="WARNING">Advertencia</option>
                    <option value="URGENT">Urgente</option>
                    <option value="MAINTENANCE">Mantenimiento</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-base-content/70 block mb-1">
                    Alcance
                  </label>
                  <select
                    value={editingItem.targetScope}
                    onChange={(e) =>
                      setEditingItem({
                        ...editingItem,
                        targetScope: e.target.value as AnnouncementScope,
                      })
                    }
                    className="select select-sm select-bordered w-full rounded-xl text-xs"
                  >
                    <option value="GLOBAL">Global</option>
                    <option value="SPECIFIC_LAB">Sede Específica</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-base-content/70 block mb-1">
                  Mensaje
                </label>
                <textarea
                  value={editingItem.message}
                  onChange={(e) => setEditingItem({ ...editingItem, message: e.target.value })}
                  rows={4}
                  className="textarea textarea-bordered w-full rounded-xl text-xs"
                  required
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
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
