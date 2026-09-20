// src/components/AddUserForm.tsx
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useUser } from '@clerk/clerk-react';
import { useApi } from '../hooks/useApi';
import { useUserContext } from '../hooks/useUserContext';
import { useLabBranding } from '../context/LabBrandingContext';
import type { Laboratory } from '../types/lab';
import type { UserRole } from '../types/user';
import {
  IconUserPlus,
  IconUsers,
  IconFlask,
  IconBuilding,
  IconCheckCircle,
  IconAlertCircle,
  IconSearch,
  IconRefresh,
  IconTrash,
  IconEdit,
  IconShield,
  IconMicroscope,
} from './icons';

export interface UserRecord {
  id: string;
  clerkId?: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  role: UserRole;
  laboratoryId?: string | null;
  laboratory?: Laboratory | null;
  createdAt?: string;
  updatedAt?: string;
}

interface AddUserFormProps {
  labs: Laboratory[];
  onUserAdded?: () => void;
  onCancel?: () => void;
}

export default function AddUserForm({ labs, onCancel }: AddUserFormProps) {
  const api = useApi();
  const { user } = useUser();
  const { userProfile, isAdmin } = useUserContext();
  const { selectedLabId } = useLabBranding();

  // Lista general de usuarios y laboratorios
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [localLabs, setLocalLabs] = useState<Laboratory[]>(labs || []);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);

  // Filtro de sede seleccionada: por defecto el laboratorio activo
  const [filterLabId, setFilterLabId] = useState<string>(() => {
    return selectedLabId && selectedLabId !== 'default' ? selectedLabId : 'ALL';
  });

  // Filtros adicionales: búsqueda y rol
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');

  // Notificaciones en pantalla
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Estados para Modales de CRUD
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserRecord | null>(null);
  const [deletingUser, setDeletingUser] = useState<UserRecord | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Formulario de Creación
  const [createForm, setCreateForm] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    role: 'TECH',
    laboratoryId: '',
  });
  const [showCreatePassword, setShowCreatePassword] = useState(false);

  // Formulario de Edición
  const [editForm, setEditForm] = useState({
    email: '',
    firstName: '',
    lastName: '',
    role: 'TECH',
    laboratoryId: '',
  });

  // Cargar laboratorios si vienen vacíos
  const fetchLabs = useCallback(async () => {
    try {
      const res = await api.get<Laboratory[]>('/lab');
      if (res.data) {
        setLocalLabs(res.data);
      }
    } catch (err) {
      console.warn('Error al cargar laboratorios:', err);
    }
  }, [api]);

  useEffect(() => {
    if (!labs || labs.length === 0) {
      fetchLabs();
    } else {
      setLocalLabs(labs);
    }
  }, [labs, fetchLabs]);

  // Cargar lista de usuarios desde la Base de Datos
  const fetchUsers = useCallback(async () => {
    setIsLoadingUsers(true);
    setErrorMsg(null);
    try {
      const res = await api.get<UserRecord[]>('/users');
      setUsers(res.data || []);
    } catch (err: any) {
      console.error('Error al cargar usuarios:', err);
      setErrorMsg('No se pudo cargar la lista de personal. Verifica la conexión con el servidor.');
    } finally {
      setIsLoadingUsers(false);
    }
  }, [api]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Sincronizar filtro si cambia el laboratorio activo
  useEffect(() => {
    if (selectedLabId && selectedLabId !== 'default') {
      setFilterLabId(selectedLabId);
    }
  }, [selectedLabId]);

  // Filtrado de usuarios por laboratorio, búsqueda y rol
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      // Filtro por Laboratorio
      if (filterLabId !== 'ALL') {
        if (filterLabId === 'UNASSIGNED') {
          if (u.laboratoryId) return false;
        } else if (u.laboratoryId !== filterLabId) {
          return false;
        }
      }

      // Filtro por Rol
      if (roleFilter !== 'ALL' && u.role !== roleFilter) {
        return false;
      }

      // Búsqueda por texto (nombre, apellido o email)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const fullName = `${u.firstName || ''} ${u.lastName || ''}`.toLowerCase();
        const email = (u.email || '').toLowerCase();
        if (!fullName.includes(q) && !email.includes(q)) {
          return false;
        }
      }

      return true;
    });
  }, [users, filterLabId, roleFilter, searchQuery]);

  // Contadores para métricas
  const currentLabName = useMemo(() => {
    if (filterLabId === 'ALL') return 'Todas las Sedes';
    if (filterLabId === 'UNASSIGNED') return 'Sin Sede Asignada';
    const found = localLabs.find((l) => l.id === filterLabId);
    return found ? `${found.name} ${found.city ? `(${found.city})` : ''}` : 'Sede Seleccionada';
  }, [filterLabId, localLabs]);

  const labMetrics = useMemo(() => {
    const list = filterLabId === 'ALL'
      ? users
      : users.filter((u) => u.laboratoryId === filterLabId);

    return {
      total: list.length,
      techs: list.filter((u) => u.role === 'TECH' || u.role === 'LAB_TECHNICIAN').length,
      receptionists: list.filter((u) => u.role === 'RECEPTIONIST').length,
      admins: list.filter((u) => u.role === 'ADMIN').length,
    };
  }, [users, filterLabId]);

  // Abrir modal de creación preconfigurado con la sede seleccionada
  const handleOpenCreateModal = () => {
    const validInitialLab =
      filterLabId !== 'ALL' && filterLabId !== 'UNASSIGNED' && filterLabId !== 'default'
        ? filterLabId
        : (localLabs.find((l) => l.id && l.id !== 'default')?.id || '');

    setCreateForm({
      email: '',
      password: '',
      firstName: '',
      lastName: '',
      role: 'TECH',
      laboratoryId: validInitialLab,
    });
    setShowCreatePassword(false);
    setIsCreateModalOpen(true);
  };

  // Enviar Creación de Usuario
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.email.trim() || !createForm.password.trim()) {
      setErrorMsg('El correo y la contraseña son obligatorios.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const cleanLabId =
      createForm.laboratoryId &&
      createForm.laboratoryId !== 'default' &&
      createForm.laboratoryId !== 'ALL' &&
      createForm.laboratoryId !== 'UNASSIGNED'
        ? createForm.laboratoryId
        : undefined;

    try {
      const payload = {
        email: createForm.email.trim(),
        password: createForm.password.trim(),
        firstName: createForm.firstName.trim() || undefined,
        lastName: createForm.lastName.trim() || undefined,
        role: createForm.role,
        laboratoryId: cleanLabId,
      };

      await api.post('/users', payload);
      setSuccessMsg('¡Personal registrado exitosamente en el sistema y asignado a la sede!');
      setIsCreateModalOpen(false);
      fetchUsers();
    } catch (err: any) {
      console.error('Error al registrar usuario:', err);
      const rawMsg = err?.response?.data?.message || err?.message || 'Error al registrar el usuario';
      setErrorMsg(typeof rawMsg === 'string' ? rawMsg : JSON.stringify(rawMsg));
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setSuccessMsg(null), 4000);
    }
  };

  // Abrir modal de edición
  const handleOpenEditModal = (u: UserRecord) => {
    setEditingUser(u);
    setEditForm({
      email: u.email || '',
      firstName: u.firstName || '',
      lastName: u.lastName || '',
      role: u.role || 'TECH',
      laboratoryId: u.laboratoryId && u.laboratoryId !== 'default' ? u.laboratoryId : '',
    });
  };

  // Enviar Edición de Usuario
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    setIsSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const cleanLabId =
      editForm.laboratoryId &&
      editForm.laboratoryId !== 'default' &&
      editForm.laboratoryId !== 'ALL' &&
      editForm.laboratoryId !== 'UNASSIGNED'
        ? editForm.laboratoryId
        : null;

    try {
      const payload = {
        email: editForm.email.trim() || undefined,
        firstName: editForm.firstName.trim() || undefined,
        lastName: editForm.lastName.trim() || undefined,
        role: editForm.role,
        laboratoryId: cleanLabId,
      };

      await api.patch(`/users/${editingUser.id}`, payload);
      setSuccessMsg('¡Información del usuario actualizada con éxito!');
      setEditingUser(null);
      fetchUsers();
    } catch (err: any) {
      console.error('Error al actualizar usuario:', err);
      const rawMsg = err?.response?.data?.message || err?.message || 'Error al actualizar usuario';
      setErrorMsg(typeof rawMsg === 'string' ? rawMsg : JSON.stringify(rawMsg));
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setSuccessMsg(null), 4000);
    }
  };

  // Eliminar Usuario
  const handleDeleteConfirm = async () => {
    if (!deletingUser) return;

    setIsSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      await api.delete(`/users/${deletingUser.id}`);
      setSuccessMsg(`El usuario ${deletingUser.email} ha sido eliminado del sistema.`);
      setDeletingUser(null);
      fetchUsers();
    } catch (err: any) {
      console.error('Error al eliminar usuario:', err);
      const rawMsg = err?.response?.data?.message || err?.message || 'Error al eliminar usuario';
      setErrorMsg(typeof rawMsg === 'string' ? rawMsg : JSON.stringify(rawMsg));
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setSuccessMsg(null), 4000);
    }
  };

  // Formato de rol amigable con insignia DaisyUI
  const renderRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'ADMIN':
        return (
          <span className="badge badge-accent badge-sm font-bold gap-1 shadow-2xs">
            <IconShield className="w-3 h-3" /> Administrador
          </span>
        );
      case 'LAB_TECHNICIAN':
        return (
          <span className="badge badge-primary badge-sm font-bold gap-1 shadow-2xs">
            <IconFlask className="w-3 h-3" /> Químico / Técnico
          </span>
        );
      case 'TECH':
        return (
          <span className="badge badge-info badge-sm font-bold gap-1 shadow-2xs">
            <IconMicroscope className="w-3 h-3" /> Analista Operativo
          </span>
        );
      case 'RECEPTIONIST':
        return (
          <span className="badge badge-secondary badge-sm font-bold gap-1 shadow-2xs">
            <IconUsers className="w-3 h-3" /> Recepcionista
          </span>
        );
      default:
        return <span className="badge badge-ghost badge-sm font-medium">{role}</span>;
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-fade-in pb-10">
      
      {/* Encabezado Principal y Selector de Sede */}
      <section className="card bg-base-100 border border-base-200 p-4 sm:p-6 shadow-xs rounded-2xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          
          {/* Título de la Sección */}
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="badge badge-primary badge-outline text-xs font-semibold gap-1.5 py-2.5 px-3">
                <IconUsers className="w-3.5 h-3.5" />
                Administración de Personal
              </span>
              <span className="badge badge-ghost text-xs text-base-content/60 font-medium">
                Gestión de Usuarios
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-base-content tracking-tight">
              Directorio de Personal por Laboratorio
            </h1>
            <p className="text-xs text-base-content/60">
              Administra las cuentas de acceso, roles analíticos y asignación de personal para cada laboratorio clínico.
            </p>
          </div>

          {/* Selector de Laboratorio / Sede a Consultar */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2 bg-base-200/70 p-2 rounded-2xl border border-base-300/60 max-w-full">
              <IconBuilding className="w-4 h-4 text-primary shrink-0 ml-1" />
              <div className="flex flex-col min-w-0">
                <span className="text-[10px] font-bold text-base-content/50 uppercase tracking-wider">
                  Sede a Consultar
                </span>
                <select
                  value={filterLabId}
                  onChange={(e) => setFilterLabId(e.target.value)}
                  className="select select-xs select-bordered font-bold text-primary bg-base-100 rounded-xl focus:select-primary max-w-[180px] sm:max-w-none"
                >
                  <option value="ALL">Todas las Sedes ({users.length})</option>
                  {localLabs.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name} {l.city ? `(${l.city})` : ''}
                    </option>
                  ))}
                  <option value="UNASSIGNED">Sin Sede Asignada</option>
                </select>
              </div>
            </div>

            {/* Botón de Nuevo Usuario */}
            <button
              onClick={handleOpenCreateModal}
              className="btn btn-sm btn-primary text-primary-content font-bold rounded-xl gap-2 shadow-xs"
            >
              <IconUserPlus className="w-4 h-4" />
              Nuevo Usuario
            </button>
          </div>

        </div>
      </section>

      {/* Alertas de Éxito / Error */}
      {successMsg && (
        <div className="alert alert-success border border-success/40 shadow-xs rounded-2xl text-xs font-semibold text-success-content animate-fade-in flex items-center justify-between">
          <div className="flex items-center gap-2">
            <IconCheckCircle className="w-5 h-5 shrink-0 text-success-content" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="btn btn-xs btn-ghost text-success-content">✕</button>
        </div>
      )}

      {errorMsg && (
        <div className="alert alert-error border border-error/40 shadow-xs rounded-2xl text-xs font-semibold text-error-content animate-fade-in flex items-center justify-between">
          <div className="flex items-center gap-2">
            <IconAlertCircle className="w-5 h-5 shrink-0 text-error-content" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg(null)} className="btn btn-xs btn-ghost text-error-content">✕</button>
        </div>
      )}

      {/* Tarjetas de Métricas de Personal para la Sede */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-4">
        <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-base-100 border border-base-200 shadow-2xs">
          <span className="text-[10px] uppercase font-bold text-base-content/50 block">Personal Total</span>
          <div className="text-xl sm:text-2xl font-black text-base-content mt-0.5">{labMetrics.total}</div>
          <span className="text-[10px] text-base-content/60 truncate block mt-0.5">{currentLabName}</span>
        </div>

        <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-base-100 border border-base-200 shadow-2xs">
          <span className="text-[10px] uppercase font-bold text-primary block">Químicos / Analistas</span>
          <div className="text-xl sm:text-2xl font-black text-primary mt-0.5">{labMetrics.techs}</div>
          <span className="text-[10px] text-base-content/60 block mt-0.5">Operación técnica</span>
        </div>

        <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-base-100 border border-base-200 shadow-2xs">
          <span className="text-[10px] uppercase font-bold text-secondary block">Recepcionistas</span>
          <div className="text-xl sm:text-2xl font-black text-secondary mt-0.5">{labMetrics.receptionists}</div>
          <span className="text-[10px] text-base-content/60 block mt-0.5">Atención a pacientes</span>
        </div>

        <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-base-100 border border-base-200 shadow-2xs">
          <span className="text-[10px] uppercase font-bold text-accent block">Administradores</span>
          <div className="text-xl sm:text-2xl font-black text-accent mt-0.5">{labMetrics.admins}</div>
          <span className="text-[10px] text-base-content/60 block mt-0.5">Gestión de sede</span>
        </div>
      </div>

      {/* Barra de Filtros y Búsqueda */}
      <div className="card bg-base-100 border border-base-200 p-4 rounded-2xl shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          
          {/* Input de Búsqueda */}
          <div className="relative flex-1 max-w-md">
            <IconSearch className="w-4 h-4 text-base-content/40 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por nombre, apellido o correo..."
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

          {/* Filtro por Rol y Botón de Recargar */}
          <div className="flex items-center gap-2">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="select select-sm select-bordered rounded-xl text-xs font-semibold focus:select-primary"
            >
              <option value="ALL">Todos los Roles</option>
              <option value="TECH">Analistas (TECH)</option>
              <option value="LAB_TECHNICIAN">Químicos (LAB_TECHNICIAN)</option>
              <option value="RECEPTIONIST">Recepcionistas (RECEPTIONIST)</option>
              {isAdmin && <option value="ADMIN">Administradores (ADMIN)</option>}
            </select>

            <button
              onClick={fetchUsers}
              disabled={isLoadingUsers}
              className="btn btn-sm btn-ghost border border-base-200 rounded-xl"
              title="Refrescar Lista"
            >
              <IconRefresh className={`w-4 h-4 ${isLoadingUsers ? 'animate-spin text-primary' : ''}`} />
            </button>
          </div>

        </div>
      </div>

      {/* Tabla de Usuarios del Laboratorio */}
      <div className="card bg-base-100 border border-base-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table table-zebra w-full text-xs">
            <thead className="bg-base-200/60 text-base-content/70 font-bold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Personal / Usuario</th>
                <th>Rol en el Sistema</th>
                <th>Laboratorio Asignado</th>
                <th>Fecha de Alta</th>
                <th className="text-right px-4">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {isLoadingUsers ? (
                <tr>
                  <td colSpan={5} className="text-center py-12">
                    <span className="loading loading-spinner loading-md text-primary"></span>
                    <p className="text-xs font-semibold text-base-content/60 mt-2">
                      Cargando personal del laboratorio...
                    </p>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-base-200 text-base-content/40 flex items-center justify-center mx-auto">
                      <IconUsers className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-base-content">No se encontraron usuarios</h3>
                      <p className="text-xs text-base-content/50 mt-0.5">
                        {filterLabId !== 'ALL'
                          ? 'Esta sede no tiene personal asignado todavía.'
                          : 'No hay usuarios que coincidan con los filtros aplicados.'}
                      </p>
                    </div>
                    <button
                      onClick={handleOpenCreateModal}
                      className="btn btn-xs btn-primary text-primary-content font-bold rounded-xl gap-1.5"
                    >
                      <IconUserPlus className="w-3.5 h-3.5" />
                      Agregar Usuario a esta Sede
                    </button>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const fullName = [u.firstName, u.lastName].filter(Boolean).join(' ') || 'Sin nombre';
                  const labInfo = u.laboratory || localLabs.find((l) => l.id === u.laboratoryId);
                  const isCurrentUser = u.email === user?.primaryEmailAddress?.emailAddress || u.id === userProfile?.id;

                  return (
                    <tr key={u.id} className="hover:bg-base-200/40 transition-colors">
                      {/* Usuario y Correo */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-teal-600 to-cyan-700 text-white flex items-center justify-center font-bold text-xs shadow-2xs shrink-0">
                            {u.firstName ? u.firstName.charAt(0).toUpperCase() : u.email.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-base-content flex items-center gap-1.5">
                              {fullName}
                              {isCurrentUser && (
                                <span className="badge badge-xs badge-outline text-[9px] font-bold text-primary">Tú</span>
                              )}
                            </div>
                            <div className="text-[11px] text-base-content/60 font-mono">{u.email}</div>
                          </div>
                        </div>
                      </td>

                      {/* Rol */}
                      <td>{renderRoleBadge(u.role)}</td>

                      {/* Laboratorio Asignado */}
                      <td>
                        {labInfo ? (
                          <div className="flex items-center gap-1.5 font-semibold text-base-content/80">
                            <IconBuilding className="w-3.5 h-3.5 text-primary shrink-0" />
                            <span>{labInfo.name}</span>
                            {labInfo.city && (
                              <span className="text-[10px] text-base-content/50 font-normal">({labInfo.city})</span>
                            )}
                          </div>
                        ) : (
                          <span className="badge badge-ghost badge-sm text-base-content/50 font-normal">
                            Sin Sede Asignada
                          </span>
                        )}
                      </td>

                      {/* Fecha de Creación */}
                      <td className="text-base-content/60 font-medium">
                        {u.createdAt ? new Date(u.createdAt).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                      </td>

                      {/* Acciones */}
                      <td className="text-right px-4">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEditModal(u)}
                            className="btn btn-xs btn-ghost text-primary hover:bg-primary/10 rounded-lg"
                            title="Editar Datos y Rol"
                          >
                            <IconEdit className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Editar</span>
                          </button>

                          <button
                            onClick={() => setDeletingUser(u)}
                            disabled={isCurrentUser}
                            className={`btn btn-xs btn-ghost text-error hover:bg-error/10 rounded-lg ${
                              isCurrentUser ? 'opacity-30 cursor-not-allowed' : ''
                            }`}
                            title={isCurrentUser ? 'No puedes eliminar tu propia cuenta' : 'Eliminar Usuario'}
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

        {/* Pie de Tabla con Total */}
        <div className="p-4 bg-base-200/40 border-t border-base-200 flex items-center justify-between text-xs text-base-content/60 font-medium">
          <span>Mostrando {filteredUsers.length} de {users.length} usuarios registrados</span>
          {onCancel && (
            <button onClick={onCancel} className="btn btn-xs btn-ghost font-semibold">
              Volver al Dashboard
            </button>
          )}
        </div>
      </div>

      {/* ============================================================ */}
      {/* MODAL: REGISTRAR NUEVO USUARIO                              */}
      {/* ============================================================ */}
      {isCreateModalOpen && (
        <div className="modal modal-open backdrop-blur-xs p-2 sm:p-4">
          <div className="modal-box rounded-2xl w-full max-w-[95vw] sm:max-w-lg border border-base-200 shadow-2xl p-4 sm:p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-base-200 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <IconUserPlus className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-base text-base-content">Registrar Nuevo Usuario</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="btn btn-xs btn-circle btn-ghost"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="form-control">
                  <label className="label py-1">
                    <span className="label-text font-bold text-xs">Correo Electrónico <span className="text-error">*</span></span>
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="usuario@laboratorio.com"
                    value={createForm.email}
                    onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                    className="input input-sm input-bordered rounded-xl text-xs focus:input-primary"
                  />
                </div>

                <div className="form-control">
                  <label className="label py-1">
                    <span className="label-text font-bold text-xs">Contraseña Inicial <span className="text-error">*</span></span>
                  </label>
                  <div className="relative">
                    <input
                      type={showCreatePassword ? 'text' : 'password'}
                      required
                      placeholder="Mín. 8 caracteres"
                      value={createForm.password}
                      onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                      className="input input-sm input-bordered rounded-xl text-xs focus:input-primary w-full pr-12"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCreatePassword(!showCreatePassword)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-base-content/50 hover:text-primary"
                    >
                      {showCreatePassword ? 'Ocultar' : 'Ver'}
                    </button>
                  </div>
                </div>

                <div className="form-control">
                  <label className="label py-1">
                    <span className="label-text font-bold text-xs">Nombre(s)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. Juan Carlos"
                    value={createForm.firstName}
                    onChange={(e) => setCreateForm({ ...createForm, firstName: e.target.value })}
                    className="input input-sm input-bordered rounded-xl text-xs focus:input-primary"
                  />
                </div>

                <div className="form-control">
                  <label className="label py-1">
                    <span className="label-text font-bold text-xs">Apellido(s)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. Mendoza"
                    value={createForm.lastName}
                    onChange={(e) => setCreateForm({ ...createForm, lastName: e.target.value })}
                    className="input input-sm input-bordered rounded-xl text-xs focus:input-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-base-200">
                <div className="form-control">
                  <label className="label py-1">
                    <span className="label-text font-bold text-xs">Rol en el Sistema <span className="text-error">*</span></span>
                  </label>
                  <select
                    value={createForm.role}
                    onChange={(e) => setCreateForm({ ...createForm, role: e.target.value })}
                    className="select select-sm select-bordered rounded-xl text-xs font-semibold focus:select-primary"
                  >
                    <option value="TECH">Técnico Analista (TECH)</option>
                    <option value="LAB_TECHNICIAN">Químico Responsable (LAB_TECHNICIAN)</option>
                    <option value="RECEPTIONIST">Recepcionista Clínico (RECEPTIONIST)</option>
                    {isAdmin && <option value="ADMIN">Administrador General (ADMIN)</option>}
                  </select>
                </div>

                <div className="form-control">
                  <label className="label py-1">
                    <span className="label-text font-bold text-xs flex items-center gap-1">
                      <IconBuilding className="w-3.5 h-3.5 text-primary" /> Sede Asignada
                    </span>
                  </label>
                  <select
                    value={createForm.laboratoryId}
                    onChange={(e) => setCreateForm({ ...createForm, laboratoryId: e.target.value })}
                    className="select select-sm select-bordered rounded-xl text-xs font-semibold focus:select-primary"
                  >
                    <option value="">-- Sin Asignación (General) --</option>
                    {localLabs.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.name} {l.city ? `(${l.city})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="modal-action border-t border-base-200 pt-3">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  disabled={isSubmitting}
                  className="btn btn-sm btn-ghost rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn btn-sm btn-primary text-primary-content font-bold rounded-xl gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <span className="loading loading-spinner loading-xs"></span>
                      Registrando...
                    </>
                  ) : (
                    <>
                      <IconUserPlus className="w-4 h-4" />
                      Registrar en el Sistema
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL: EDITAR USUARIO                                       */}
      {/* ============================================================ */}
      {editingUser && (
        <div className="modal modal-open backdrop-blur-xs p-2 sm:p-4">
          <div className="modal-box rounded-2xl w-full max-w-[95vw] sm:max-w-lg border border-base-200 shadow-2xl p-4 sm:p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-base-200 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <IconEdit className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-base-content">Editar Usuario</h3>
                  <p className="text-[11px] text-base-content/60 font-mono">{editingUser.email}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="btn btn-xs btn-circle btn-ghost"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="form-control">
                  <label className="label py-1">
                    <span className="label-text font-bold text-xs">Nombre(s)</span>
                  </label>
                  <input
                    type="text"
                    value={editForm.firstName}
                    onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                    className="input input-sm input-bordered rounded-xl text-xs focus:input-primary"
                  />
                </div>

                <div className="form-control">
                  <label className="label py-1">
                    <span className="label-text font-bold text-xs">Apellido(s)</span>
                  </label>
                  <input
                    type="text"
                    value={editForm.lastName}
                    onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                    className="input input-sm input-bordered rounded-xl text-xs focus:input-primary"
                  />
                </div>

                <div className="form-control sm:col-span-2">
                  <label className="label py-1">
                    <span className="label-text font-bold text-xs">Correo Electrónico</span>
                  </label>
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    className="input input-sm input-bordered rounded-xl text-xs focus:input-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-base-200">
                <div className="form-control">
                  <label className="label py-1">
                    <span className="label-text font-bold text-xs">Rol en el Sistema <span className="text-error">*</span></span>
                  </label>
                  <select
                    value={editForm.role}
                    onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                    className="select select-sm select-bordered rounded-xl text-xs font-semibold focus:select-primary"
                  >
                    <option value="TECH">Técnico Analista (TECH)</option>
                    <option value="LAB_TECHNICIAN">Químico Responsable (LAB_TECHNICIAN)</option>
                    <option value="RECEPTIONIST">Recepcionista Clínico (RECEPTIONIST)</option>
                    {isAdmin && <option value="ADMIN">Administrador General (ADMIN)</option>}
                  </select>
                </div>

                <div className="form-control">
                  <label className="label py-1">
                    <span className="label-text font-bold text-xs flex items-center gap-1">
                      <IconBuilding className="w-3.5 h-3.5 text-primary" /> Sede Asignada
                    </span>
                  </label>
                  <select
                    value={editForm.laboratoryId}
                    onChange={(e) => setEditForm({ ...editForm, laboratoryId: e.target.value })}
                    className="select select-sm select-bordered rounded-xl text-xs font-semibold focus:select-primary"
                  >
                    <option value="">-- Sin Sede (General) --</option>
                    {localLabs.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.name} {l.city ? `(${l.city})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="modal-action border-t border-base-200 pt-3">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  disabled={isSubmitting}
                  className="btn btn-sm btn-ghost rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn btn-sm btn-primary text-primary-content font-bold rounded-xl gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <span className="loading loading-spinner loading-xs"></span>
                      Guardando...
                    </>
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

      {/* ============================================================ */}
      {/* MODAL: CONFIRMAR ELIMINACIÓN                                 */}
      {/* ============================================================ */}
      {deletingUser && (
        <div className="modal modal-open backdrop-blur-xs p-2 sm:p-4">
          <div className="modal-box rounded-2xl w-full max-w-[95vw] sm:max-w-md border border-base-200 shadow-2xl p-4 sm:p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center gap-3 text-error mb-3">
              <div className="w-10 h-10 rounded-2xl bg-error/10 flex items-center justify-center shrink-0">
                <IconTrash className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-base-content">¿Eliminar Usuario?</h3>
                <p className="text-xs text-base-content/60">Esta acción no se puede deshacer.</p>
              </div>
            </div>

            <p className="text-xs text-base-content/70 leading-relaxed">
              Estás a punto de revocar el acceso y dar de baja la cuenta de:{' '}
              <strong className="text-base-content">
                {[deletingUser.firstName, deletingUser.lastName].filter(Boolean).join(' ') || deletingUser.email}
              </strong>{' '}
              ({deletingUser.email}).
            </p>

            <div className="modal-action border-t border-base-200 pt-3 mt-4">
              <button
                type="button"
                onClick={() => setDeletingUser(null)}
                disabled={isSubmitting}
                className="btn btn-sm btn-ghost rounded-xl"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={isSubmitting}
                className="btn btn-sm btn-error text-white font-bold rounded-xl gap-2 shadow-xs"
              >
                {isSubmitting ? (
                  <>
                    <span className="loading loading-spinner loading-xs"></span>
                    Eliminando...
                  </>
                ) : (
                  <>
                    <IconTrash className="w-4 h-4" />
                    Sí, Eliminar Usuario
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
