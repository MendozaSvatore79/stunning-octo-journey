// src/components/SupportTicketsView.tsx
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useApi } from '../hooks/useApi';
import { useUserContext } from '../hooks/useUserContext';
import type { SupportTicket, TicketCategory, TicketPriority, TicketStatus } from '../types/ticket';
import { toast } from 'react-toastify';
import {
  IconTicket,
  IconSparkles,
  IconAlertTriangle,
  IconCheckCircle,
  IconTrash,
  IconEdit,
  IconPlus,
  IconSearch,
  IconRefresh,
  IconShield,
} from './icons';

export default function SupportTicketsView() {
  const api = useApi();
  const { userProfile, isAdmin } = useUserContext();

  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Filtros
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

  // Modales
  const [viewingTicket, setViewingTicket] = useState<SupportTicket | null>(null);
  const [editingTicket, setEditingTicket] = useState<SupportTicket | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Formulario de Creación
  const [createForm, setCreateForm] = useState({
    subject: '',
    category: 'EQUIPOS' as TicketCategory,
    priority: 'MEDIA' as TicketPriority,
    description: '',
    userName: userProfile ? `${userProfile.email?.split('@')[0] || 'Admin'}` : 'Administrador',
    userEmail: userProfile?.email || '',
  });

  // Formulario de Edición
  const [editForm, setEditForm] = useState({
    subject: '',
    category: 'EQUIPOS' as TicketCategory,
    priority: 'MEDIA' as TicketPriority,
    status: 'ABIERTO' as TicketStatus,
    description: '',
  });

  // Cargar tickets de Neon DB
  const fetchTickets = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await api.get<SupportTicket[]>('/support/tickets');
      setTickets(res.data || []);
    } catch (err) {
      console.error('Error al cargar tickets:', err);
      toast.error('No se pudieron cargar los tickets de soporte');
    } finally {
      setIsLoading(false);
    }
  }, [api]);

  useEffect(() => {
    if (isAdmin) {
      fetchTickets();
    }
  }, [isAdmin, fetchTickets]);

  // Filtrado de tickets
  const filteredTickets = useMemo(() => {
    return tickets.filter((t) => {
      if (statusFilter !== 'ALL' && t.status !== statusFilter) return false;
      if (priorityFilter !== 'ALL' && t.priority !== priorityFilter) return false;
      if (categoryFilter !== 'ALL' && t.category !== categoryFilter) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const num = (t.ticketNumber || '').toLowerCase();
        const subj = (t.subject || '').toLowerCase();
        const user = (t.userName || '').toLowerCase();
        const desc = (t.description || '').toLowerCase();
        if (!num.includes(q) && !subj.includes(q) && !user.includes(q) && !desc.includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [tickets, statusFilter, priorityFilter, categoryFilter, searchQuery]);

  // Contadores y métricas
  const metrics = useMemo(() => {
    return {
      total: tickets.length,
      open: tickets.filter((t) => t.status === 'ABIERTO').length,
      inProgress: tickets.filter((t) => t.status === 'EN_PROCESO').length,
      resolved: tickets.filter((t) => t.status === 'RESUELTO').length,
      critical: tickets.filter((t) => t.priority === 'CRITICA' && t.status !== 'RESUELTO' && t.status !== 'CERRADO').length,
    };
  }, [tickets]);

  // Cambiar estado rápido
  const handleQuickStatusChange = async (ticketId: string, newStatus: TicketStatus) => {
    try {
      await api.patch(`/support/tickets/${ticketId}/status`, { status: newStatus });
      setTickets((prev) =>
        prev.map((t) => (t.id === ticketId || t.ticketNumber === ticketId ? { ...t, status: newStatus } : t))
      );
      if (viewingTicket && (viewingTicket.id === ticketId || viewingTicket.ticketNumber === ticketId)) {
        setViewingTicket({ ...viewingTicket, status: newStatus });
      }
      toast.success(`Estado del ticket actualizado a ${newStatus}`);
    } catch (err) {
      console.error('Error al actualizar estado del ticket:', err);
      toast.error('No se pudo actualizar el estado del ticket');
    }
  };

  // Crear Ticket Manual
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.subject.trim() || !createForm.description.trim()) {
      toast.warning('Por favor completa el asunto y la descripción');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.post<SupportTicket>('/support/tickets', {
        userId: userProfile?.id || 'admin_usr',
        userName: createForm.userName.trim() || 'Administrador Global',
        userEmail: createForm.userEmail.trim() || undefined,
        subject: createForm.subject.trim(),
        category: createForm.category,
        priority: createForm.priority,
        description: createForm.description.trim(),
      });

      if (res.data) {
        toast.success(`¡Ticket #${res.data.ticketNumber} creado exitosamente!`);
        setIsCreateModalOpen(false);
        setCreateForm({
          subject: '',
          category: 'EQUIPOS',
          priority: 'MEDIA',
          description: '',
          userName: userProfile?.email?.split('@')[0] || 'Administrador',
          userEmail: userProfile?.email || '',
        });
        fetchTickets();
      }
    } catch (err: any) {
      console.error('Error al crear ticket:', err);
      const msg = err?.response?.data?.message || 'Error al registrar el ticket';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Abrir Modal de Edición
  const handleOpenEdit = (t: SupportTicket) => {
    setEditingTicket(t);
    setEditForm({
      subject: t.subject,
      category: t.category,
      priority: t.priority,
      status: t.status,
      description: t.description,
    });
  };

  // Guardar Edición
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTicket) return;

    setIsSubmitting(true);
    try {
      const res = await api.patch<SupportTicket>(`/support/tickets/${editingTicket.id}`, {
        subject: editForm.subject.trim(),
        category: editForm.category,
        priority: editForm.priority,
        status: editForm.status,
        description: editForm.description.trim(),
      });

      if (res.data) {
        toast.success(`Ticket #${editingTicket.ticketNumber} actualizado`);
        setEditingTicket(null);
        fetchTickets();
      }
    } catch (err: any) {
      console.error('Error al editar ticket:', err);
      const msg = err?.response?.data?.message || 'Error al actualizar el ticket';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Confirmar Eliminación con Toastify Interactivo
  const handleDeletePrompt = (t: SupportTicket) => {
    toast(
      ({ closeToast }) => (
        <div className="flex flex-col gap-2 p-1">
          <div className="flex items-center gap-2 text-warning font-bold text-sm">
            <IconAlertTriangle className="w-5 h-5 text-warning shrink-0" />
            <span>¿Eliminar ticket permanentemente?</span>
          </div>
          <p className="text-xs text-base-content/80 leading-relaxed">
            Se eliminará el ticket <strong>#{t.ticketNumber}</strong>: "{t.subject}". Esta acción no se puede deshacer en Neon DB.
          </p>
          <div className="flex justify-end gap-2 mt-2">
            <button
              onClick={closeToast}
              className="btn btn-xs btn-ghost text-xs rounded-lg"
            >
              Cancelar
            </button>
            <button
              onClick={async () => {
                closeToast();
                try {
                  await api.delete(`/support/tickets/${t.id}`);
                  setTickets((prev) => prev.filter((item) => item.id !== t.id));
                  if (viewingTicket?.id === t.id) setViewingTicket(null);
                  toast.success(`Ticket #${t.ticketNumber} eliminado correctamente`);
                } catch (err) {
                  console.error('Error al eliminar ticket:', err);
                  toast.error('No se pudo eliminar el ticket');
                }
              }}
              className="btn btn-xs btn-error text-white font-bold rounded-lg gap-1"
            >
              <IconTrash className="w-3.5 h-3.5" />
              Sí, eliminar
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

  // Badges y utilidades visuales
  const renderPriorityBadge = (priority: TicketPriority) => {
    switch (priority) {
      case 'CRITICA':
        return <span className="badge badge-error text-white font-black text-[10px] tracking-wide animate-pulse">CRÍTICA</span>;
      case 'ALTA':
        return <span className="badge badge-warning text-warning-content font-bold text-[10px]">ALTA</span>;
      case 'MEDIA':
        return <span className="badge badge-info text-info-content font-semibold text-[10px]">MEDIA</span>;
      case 'BAJA':
        return <span className="badge badge-ghost text-base-content/70 font-semibold text-[10px]">BAJA</span>;
      default:
        return <span className="badge badge-ghost text-[10px]">{priority}</span>;
    }
  };

  const renderStatusBadge = (status: TicketStatus) => {
    switch (status) {
      case 'ABIERTO':
        return <span className="badge badge-error badge-outline font-bold text-[10px]">ABIERTO</span>;
      case 'EN_PROCESO':
        return <span className="badge badge-warning font-bold text-[10px]">EN PROCESO</span>;
      case 'RESUELTO':
        return <span className="badge badge-success text-white font-bold text-[10px]">RESUELTO</span>;
      case 'CERRADO':
        return <span className="badge badge-ghost text-base-content/50 font-bold text-[10px]">CERRADO</span>;
      default:
        return <span className="badge badge-ghost text-[10px]">{status}</span>;
    }
  };

  if (!isAdmin) {
    return (
      <div className="card bg-base-100 border border-base-200 p-8 text-center rounded-2xl max-w-lg mx-auto mt-10">
        <IconShield className="w-12 h-12 text-warning mx-auto mb-3" />
        <h2 className="text-lg font-bold text-base-content">Acceso Restringido</h2>
        <p className="text-xs text-base-content/60 mt-1">
          La gestión y supervisión de tickets de soporte técnico generados por Synova está reservada para el Administrador Global.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fade-in pb-12">
      {/* 1. Encabezado Principal */}
      <section className="card bg-base-100 border border-base-200 p-4 sm:p-6 shadow-xs rounded-2xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="badge badge-primary badge-outline text-xs font-semibold gap-1.5 py-2.5 px-3">
                <IconTicket className="w-3.5 h-3.5" />
                Mesa de Ayuda Técnica
              </span>
              <span className="badge badge-ghost text-xs text-base-content/60 font-medium flex items-center gap-1">
                <IconSparkles className="w-3 h-3 text-primary" />
                Synova Bot & Incidencias
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-base-content tracking-tight">
              Gestor de Tickets de Soporte Clínico
            </h1>
            <p className="text-xs text-base-content/60">
              Supervisa, atiende, actualiza y resuelve las incidencias reportadas por el personal clínico y diagnosticadas por Synova IA.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={fetchTickets}
              disabled={isLoading}
              className="btn btn-sm btn-ghost border border-base-200 rounded-xl gap-1.5 text-xs font-semibold"
              title="Refrescar lista de tickets"
            >
              <IconRefresh className={`w-4 h-4 ${isLoading ? 'animate-spin text-primary' : ''}`} />
              <span className="hidden sm:inline">Actualizar</span>
            </button>

            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="btn btn-sm btn-primary rounded-xl gap-1.5 text-xs font-bold shadow-xs"
            >
              <IconPlus className="w-4 h-4" />
              Nuevo Ticket
            </button>
          </div>
        </div>
      </section>

      {/* 2. Tarjetas de Métricas de Tickets */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="card bg-base-100 border border-base-200 p-4 rounded-2xl shadow-xs">
          <span className="text-[10px] font-bold text-base-content/50 uppercase tracking-wider block">Total Radicados</span>
          <span className="text-2xl font-black text-base-content mt-1 block">{metrics.total}</span>
        </div>

        <div className="card bg-base-100 border border-error/20 p-4 rounded-2xl shadow-xs">
          <span className="text-[10px] font-bold text-error uppercase tracking-wider block">Abiertos</span>
          <span className="text-2xl font-black text-error mt-1 block">{metrics.open}</span>
        </div>

        <div className="card bg-base-100 border border-warning/20 p-4 rounded-2xl shadow-xs">
          <span className="text-[10px] font-bold text-warning uppercase tracking-wider block">En Proceso</span>
          <span className="text-2xl font-black text-warning mt-1 block">{metrics.inProgress}</span>
        </div>

        <div className="card bg-base-100 border border-success/20 p-4 rounded-2xl shadow-xs">
          <span className="text-[10px] font-bold text-success uppercase tracking-wider block">Resueltos</span>
          <span className="text-2xl font-black text-success mt-1 block">{metrics.resolved}</span>
        </div>

        <div className="card bg-base-100 border border-error/40 p-4 rounded-2xl shadow-xs col-span-2 sm:col-span-1 bg-error/5">
          <span className="text-[10px] font-black text-error uppercase tracking-wider block flex items-center gap-1">
            <IconAlertTriangle className="w-3.5 h-3.5" />
            Críticos Activos
          </span>
          <span className="text-2xl font-black text-error mt-1 block">{metrics.critical}</span>
        </div>
      </div>

      {/* 3. Barra de Búsqueda y Filtros */}
      <div className="card bg-base-100 border border-base-200 p-4 rounded-2xl shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Búsqueda */}
          <div className="relative">
            <IconSearch className="w-4 h-4 text-base-content/40 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por radicado (#TCK-), asunto o usuario..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input input-sm input-bordered w-full pl-9 rounded-xl text-xs focus:input-primary"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-base-content/40 hover:text-base-content"
              >
                ✕
              </button>
            )}
          </div>

          {/* Filtro Estado */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="select select-sm select-bordered w-full rounded-xl text-xs font-semibold focus:select-primary"
            >
              <option value="ALL">Todos los Estados</option>
              <option value="ABIERTO">Abiertos</option>
              <option value="EN_PROCESO">En Proceso</option>
              <option value="RESUELTO">Resueltos</option>
              <option value="CERRADO">Cerrados</option>
            </select>
          </div>

          {/* Filtro Prioridad */}
          <div>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="select select-sm select-bordered w-full rounded-xl text-xs font-semibold focus:select-primary"
            >
              <option value="ALL">Todas las Prioridades</option>
              <option value="CRITICA">Crítica</option>
              <option value="ALTA">Alta</option>
              <option value="MEDIA">Media</option>
              <option value="BAJA">Baja</option>
            </select>
          </div>

          {/* Filtro Categoría */}
          <div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="select select-sm select-bordered w-full rounded-xl text-xs font-semibold focus:select-primary"
            >
              <option value="ALL">Todas las Categorías</option>
              <option value="EQUIPOS">Equipos y Analizadores</option>
              <option value="CALIDAD">Control de Calidad</option>
              <option value="SISTEMA">Sistema y Software</option>
              <option value="FACTURACION">Facturación y Planes</option>
            </select>
          </div>
        </div>
      </div>

      {/* 4. Tabla Principal de Tickets */}
      <div className="card bg-base-100 border border-base-200 shadow-xs rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table table-sm w-full text-xs">
            <thead>
              <tr className="bg-base-200/50 border-b border-base-200 text-base-content/70">
                <th className="font-bold py-3 pl-4">Radicado</th>
                <th className="font-bold py-3">Incidencia y Diagnóstico IA</th>
                <th className="font-bold py-3">Reportado Por</th>
                <th className="font-bold py-3 text-center">Prioridad</th>
                <th className="font-bold py-3 text-center">Estado</th>
                <th className="font-bold py-3">Fecha</th>
                <th className="font-bold py-3 text-right pr-4">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-base-200/60">
              {filteredTickets.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-base-content/50">
                    <IconTicket className="w-10 h-10 mx-auto mb-2 opacity-30 text-primary" />
                    <p className="font-semibold text-sm">No se encontraron tickets registrados</p>
                    <p className="text-xs mt-0.5">Los tickets que cree Synova o que abras manualmente aparecerán aquí.</p>
                  </td>
                </tr>
              ) : (
                filteredTickets.map((t) => (
                  <tr key={t.id} className="hover:bg-base-200/40 transition-colors">
                    {/* Radicado */}
                    <td className="pl-4 font-mono font-bold text-primary whitespace-nowrap">
                      #{t.ticketNumber}
                    </td>

                    {/* Asunto y Diagnóstico */}
                    <td className="max-w-xs sm:max-w-md py-3">
                      <div className="font-bold text-base-content truncate hover:text-primary transition-colors cursor-pointer" onClick={() => setViewingTicket(t)}>
                        {t.subject}
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5 text-base-content/60 text-[11px] truncate">
                        <span className="badge badge-ghost badge-xs text-[9px] font-semibold">{t.category}</span>
                        {t.likelyCause && (
                          <span className="truncate flex items-center gap-1">
                            <IconSparkles className="w-3 h-3 text-primary shrink-0" />
                            {t.likelyCause}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Usuario */}
                    <td className="whitespace-nowrap">
                      <div className="font-semibold text-base-content">{t.userName}</div>
                      {t.userEmail && <div className="text-[10px] text-base-content/50 truncate max-w-[140px]">{t.userEmail}</div>}
                    </td>

                    {/* Prioridad */}
                    <td className="text-center whitespace-nowrap">
                      {renderPriorityBadge(t.priority)}
                    </td>

                    {/* Estado con Selector Rápido */}
                    <td className="text-center whitespace-nowrap">
                      <select
                        value={t.status}
                        onChange={(e) => handleQuickStatusChange(t.id, e.target.value as TicketStatus)}
                        className={`select select-xs rounded-lg font-bold border ${
                          t.status === 'ABIERTO'
                            ? 'select-error text-error border-error/30'
                            : t.status === 'EN_PROCESO'
                            ? 'select-warning text-warning border-warning/30'
                            : t.status === 'RESUELTO'
                            ? 'select-success text-success border-success/30'
                            : 'select-ghost text-base-content/50 border-base-300'
                        }`}
                      >
                        <option value="ABIERTO">Abierto</option>
                        <option value="EN_PROCESO">En Proceso</option>
                        <option value="RESUELTO">Resuelto</option>
                        <option value="CERRADO">Cerrado</option>
                      </select>
                    </td>

                    {/* Fecha */}
                    <td className="whitespace-nowrap text-base-content/60 text-[11px]">
                      {t.createdAt
                        ? new Date(t.createdAt).toLocaleDateString('es-MX', {
                            day: '2-digit',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : '—'}
                    </td>

                    {/* Acciones */}
                    <td className="text-right pr-4 whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setViewingTicket(t)}
                          className="btn btn-xs btn-ghost text-primary hover:bg-primary/10 rounded-lg"
                          title="Ver Diagnóstico y Detalle Completo"
                        >
                          Ver Detalle
                        </button>

                        <button
                          onClick={() => handleOpenEdit(t)}
                          className="btn btn-xs btn-ghost text-base-content/70 hover:text-base-content rounded-lg"
                          title="Editar Ticket"
                        >
                          <IconEdit className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handleDeletePrompt(t)}
                          className="btn btn-xs btn-ghost text-error hover:bg-error/10 rounded-lg"
                          title="Eliminar Ticket"
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

        {/* Footer con conteo */}
        <div className="p-3.5 bg-base-200/40 border-t border-base-200 flex items-center justify-between text-xs text-base-content/60">
          <span>Mostrando {filteredTickets.length} de {tickets.length} tickets en base de datos</span>
          <span className="font-semibold text-primary">Neon PostgreSQL Sincronizado</span>
        </div>
      </div>

      {/* ============================================================ */}
      {/* MODAL 1: VER DETALLE COMPLETO Y DIAGNÓSTICO IA SYNOVA       */}
      {/* ============================================================ */}
      {viewingTicket && (
        <div className="modal modal-open backdrop-blur-xs p-3">
          <div className="modal-box rounded-2xl w-full max-w-2xl border border-base-200 shadow-2xl p-5 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-base-200 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-base font-black text-primary">#{viewingTicket.ticketNumber}</span>
                  {renderPriorityBadge(viewingTicket.priority)}
                  {renderStatusBadge(viewingTicket.status)}
                </div>
                <h3 className="text-base font-bold text-base-content mt-1">{viewingTicket.subject}</h3>
              </div>
              <button
                onClick={() => setViewingTicket(null)}
                className="btn btn-xs btn-ghost btn-circle text-base-content/60"
              >
                ✕
              </button>
            </div>

            {/* Metadatos */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 bg-base-200/50 p-3 rounded-xl text-xs">
              <div>
                <span className="text-[10px] font-bold text-base-content/50 uppercase block">Categoría</span>
                <span className="font-semibold text-base-content">{viewingTicket.category}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-base-content/50 uppercase block">Reportado Por</span>
                <span className="font-semibold text-base-content truncate block">{viewingTicket.userName}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-base-content/50 uppercase block">Canal</span>
                <span className="font-mono text-xs text-base-content/70">{viewingTicket.channelId}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-base-content/50 uppercase block">Fecha</span>
                <span className="font-medium text-base-content/70">
                  {new Date(viewingTicket.createdAt).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>

            {/* Descripción del Reporte */}
            <div className="space-y-1">
              <span className="text-xs font-bold uppercase text-base-content/70 tracking-wider">Descripción del Problema</span>
              <div className="bg-base-100 border border-base-200 p-3.5 rounded-xl text-xs text-base-content/90 leading-relaxed whitespace-pre-wrap">
                {viewingTicket.description}
              </div>
            </div>

            {/* Diagnóstico Asistido por Synova IA */}
            {(viewingTicket.likelyCause || viewingTicket.suggestedAction || viewingTicket.aiFirstReply) && (
              <div className="bg-primary/5 border border-primary/20 p-4 rounded-xl space-y-3">
                <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider">
                  <IconSparkles className="w-4 h-4" />
                  Diagnóstico Técnico Asistido por Synova IA
                </div>

                {viewingTicket.likelyCause && (
                  <div>
                    <span className="text-[11px] font-bold text-base-content/70 block">Causa Probable Identificada:</span>
                    <p className="text-xs font-medium text-base-content mt-0.5">{viewingTicket.likelyCause}</p>
                  </div>
                )}

                {viewingTicket.suggestedAction && (
                  <div>
                    <span className="text-[11px] font-bold text-base-content/70 block">Acción Inmediata Sugerida:</span>
                    <p className="text-xs font-medium text-primary mt-0.5">{viewingTicket.suggestedAction}</p>
                  </div>
                )}

                {viewingTicket.aiFirstReply && (
                  <div className="border-t border-primary/10 pt-2 text-[11px] text-base-content/80 whitespace-pre-wrap">
                    {viewingTicket.aiFirstReply}
                  </div>
                )}
              </div>
            )}

            {/* Acciones Rápidas del Modal */}
            <div className="flex items-center justify-between pt-3 border-t border-base-200">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-base-content/60">Cambiar estado:</span>
                <select
                  value={viewingTicket.status}
                  onChange={(e) => handleQuickStatusChange(viewingTicket.id, e.target.value as TicketStatus)}
                  className="select select-xs select-bordered rounded-lg font-bold"
                >
                  <option value="ABIERTO">Abierto</option>
                  <option value="EN_PROCESO">En Proceso</option>
                  <option value="RESUELTO">Resuelto</option>
                  <option value="CERRADO">Cerrado</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const t = viewingTicket;
                    setViewingTicket(null);
                    handleOpenEdit(t);
                  }}
                  className="btn btn-xs btn-outline rounded-lg gap-1"
                >
                  <IconEdit className="w-3.5 h-3.5" />
                  Editar
                </button>
                <button
                  onClick={() => setViewingTicket(null)}
                  className="btn btn-xs btn-primary rounded-lg"
                >
                  Listo
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL 2: CREAR TICKET MANUAL                                 */}
      {/* ============================================================ */}
      {isCreateModalOpen && (
        <div className="modal modal-open backdrop-blur-xs p-3">
          <div className="modal-box rounded-2xl w-full max-w-lg border border-base-200 shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-base-200 pb-3">
              <div className="flex items-center gap-2 text-primary font-bold text-base">
                <IconPlus className="w-5 h-5" />
                <span>Levantar Nuevo Ticket Oficial</span>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="btn btn-xs btn-ghost btn-circle"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-3.5 text-xs">
              <div className="form-control">
                <label className="label py-1">
                  <span className="label-text font-bold text-xs">Asunto o Falla Reportada <span className="text-error">*</span></span>
                </label>
                <input
                  type="text"
                  placeholder="Ej. Falla en fotómetro de analizador BS-200"
                  value={createForm.subject}
                  onChange={(e) => setCreateForm({ ...createForm, subject: e.target.value })}
                  className="input input-sm input-bordered rounded-xl text-xs focus:input-primary"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="form-control">
                  <label className="label py-1">
                    <span className="label-text font-bold text-xs">Categoría</span>
                  </label>
                  <select
                    value={createForm.category}
                    onChange={(e) => setCreateForm({ ...createForm, category: e.target.value as TicketCategory })}
                    className="select select-sm select-bordered rounded-xl text-xs font-semibold focus:select-primary"
                  >
                    <option value="EQUIPOS">Equipos y Analizadores</option>
                    <option value="CALIDAD">Control de Calidad</option>
                    <option value="SISTEMA">Sistema y Software</option>
                    <option value="FACTURACION">Facturación y Planes</option>
                  </select>
                </div>

                <div className="form-control">
                  <label className="label py-1">
                    <span className="label-text font-bold text-xs">Prioridad Inicial</span>
                  </label>
                  <select
                    value={createForm.priority}
                    onChange={(e) => setCreateForm({ ...createForm, priority: e.target.value as TicketPriority })}
                    className="select select-sm select-bordered rounded-xl text-xs font-semibold focus:select-primary"
                  >
                    <option value="BAJA">Baja</option>
                    <option value="MEDIA">Media</option>
                    <option value="ALTA">Alta</option>
                    <option value="CRITICA">Crítica</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="form-control">
                  <label className="label py-1">
                    <span className="label-text font-bold text-xs">Nombre Solicitante</span>
                  </label>
                  <input
                    type="text"
                    value={createForm.userName}
                    onChange={(e) => setCreateForm({ ...createForm, userName: e.target.value })}
                    className="input input-sm input-bordered rounded-xl text-xs focus:input-primary"
                  />
                </div>

                <div className="form-control">
                  <label className="label py-1">
                    <span className="label-text font-bold text-xs">Correo Electrónico</span>
                  </label>
                  <input
                    type="email"
                    value={createForm.userEmail}
                    onChange={(e) => setCreateForm({ ...createForm, userEmail: e.target.value })}
                    className="input input-sm input-bordered rounded-xl text-xs focus:input-primary"
                  />
                </div>
              </div>

              <div className="form-control">
                <label className="label py-1">
                  <span className="label-text font-bold text-xs">Descripción Detallada <span className="text-error">*</span></span>
                </label>
                <textarea
                  rows={3}
                  placeholder="Detalla los códigos de error, analizador o pantalla donde se presenta el problema..."
                  value={createForm.description}
                  onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                  className="textarea textarea-bordered rounded-xl text-xs focus:textarea-primary"
                  required
                />
              </div>

              <div className="modal-action pt-2 border-t border-base-200">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="btn btn-sm btn-ghost rounded-xl"
                  disabled={isSubmitting}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn btn-sm btn-primary rounded-xl gap-2 font-bold"
                >
                  {isSubmitting ? (
                    <span className="loading loading-spinner loading-xs"></span>
                  ) : (
                    <>
                      <IconCheckCircle className="w-4 h-4" />
                      Registrar Ticket en Neon
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL 3: EDITAR TICKET EXISTENTE                             */}
      {/* ============================================================ */}
      {editingTicket && (
        <div className="modal modal-open backdrop-blur-xs p-3">
          <div className="modal-box rounded-2xl w-full max-w-lg border border-base-200 shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-base-200 pb-3">
              <div className="flex items-center gap-2 text-primary font-bold text-base">
                <IconEdit className="w-5 h-5" />
                <span>Editar Ticket #{editingTicket.ticketNumber}</span>
              </div>
              <button
                onClick={() => setEditingTicket(null)}
                className="btn btn-xs btn-ghost btn-circle"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-3.5 text-xs">
              <div className="form-control">
                <label className="label py-1">
                  <span className="label-text font-bold text-xs">Asunto del Ticket</span>
                </label>
                <input
                  type="text"
                  value={editForm.subject}
                  onChange={(e) => setEditForm({ ...editForm, subject: e.target.value })}
                  className="input input-sm input-bordered rounded-xl text-xs focus:input-primary"
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                <div className="form-control">
                  <label className="label py-1">
                    <span className="label-text font-bold text-xs">Estado</span>
                  </label>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value as TicketStatus })}
                    className="select select-sm select-bordered rounded-xl text-xs font-semibold focus:select-primary"
                  >
                    <option value="ABIERTO">Abierto</option>
                    <option value="EN_PROCESO">En Proceso</option>
                    <option value="RESUELTO">Resuelto</option>
                    <option value="CERRADO">Cerrado</option>
                  </select>
                </div>

                <div className="form-control">
                  <label className="label py-1">
                    <span className="label-text font-bold text-xs">Prioridad</span>
                  </label>
                  <select
                    value={editForm.priority}
                    onChange={(e) => setEditForm({ ...editForm, priority: e.target.value as TicketPriority })}
                    className="select select-sm select-bordered rounded-xl text-xs font-semibold focus:select-primary"
                  >
                    <option value="BAJA">Baja</option>
                    <option value="MEDIA">Media</option>
                    <option value="ALTA">Alta</option>
                    <option value="CRITICA">Crítica</option>
                  </select>
                </div>

                <div className="form-control">
                  <label className="label py-1">
                    <span className="label-text font-bold text-xs">Categoría</span>
                  </label>
                  <select
                    value={editForm.category}
                    onChange={(e) => setEditForm({ ...editForm, category: e.target.value as TicketCategory })}
                    className="select select-sm select-bordered rounded-xl text-xs font-semibold focus:select-primary"
                  >
                    <option value="EQUIPOS">Equipos</option>
                    <option value="CALIDAD">Calidad</option>
                    <option value="SISTEMA">Sistema</option>
                    <option value="FACTURACION">Facturación</option>
                  </select>
                </div>
              </div>

              <div className="form-control">
                <label className="label py-1">
                  <span className="label-text font-bold text-xs">Descripción y Notas de Seguimiento</span>
                </label>
                <textarea
                  rows={4}
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  className="textarea textarea-bordered rounded-xl text-xs focus:textarea-primary"
                  required
                />
              </div>

              <div className="modal-action pt-2 border-t border-base-200">
                <button
                  type="button"
                  onClick={() => setEditingTicket(null)}
                  className="btn btn-sm btn-ghost rounded-xl"
                  disabled={isSubmitting}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn btn-sm btn-primary rounded-xl gap-2 font-bold"
                >
                  {isSubmitting ? (
                    <span className="loading loading-spinner loading-xs"></span>
                  ) : (
                    <>
                      <IconCheckCircle className="w-4 h-4" />
                      Guardar Cambios
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
