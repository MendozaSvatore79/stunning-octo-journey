// src/components/LabsDirectoryView.tsx
import { useState, useMemo } from 'react';
import type { Laboratory, VerificationStatus } from '../types/lab';
import { useUserContext } from '../hooks/useUserContext';
import {
  IconBuilding,
  IconPlus,
  IconMapPin,
  IconTrash,
  IconSearch,
  IconFilter,
  IconShieldCheck,
  IconAlertCircle,
  IconHistory,
} from './icons';
import LabCard from './LabCard';
import AuditLabModal from './AuditLabModal';

interface LabsDirectoryViewProps {
  labs: Laboratory[];
  isLoadingLabs: boolean;
  onOpenCreateLab: () => void;
  onDeleteLabSuccess: (id: string) => void;
  onLabUpdated?: (updatedLab: Laboratory) => void;
}

export default function LabsDirectoryView({
  labs,
  isLoadingLabs,
  onOpenCreateLab,
  onDeleteLabSuccess,
  onLabUpdated,
}: LabsDirectoryViewProps) {
  const { userProfile, isAdmin } = useUserContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [filterOwnerOnly, setFilterOwnerOnly] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'ALL' | VerificationStatus>('ALL');

  // Estado del modal de auditoría
  const [selectedLabToAudit, setSelectedLabToAudit] = useState<Laboratory | null>(null);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);

  // Conteo de sedes pendientes de validación
  const pendingCount = useMemo(() => {
    return labs.filter(
      (l) => !l.verificationStatus || l.verificationStatus === 'PENDING_REVIEW'
    ).length;
  }, [labs]);

  // Filtrado dinámico de laboratorios
  const filteredLabs = useMemo(() => {
    return labs.filter((lab) => {
      const matchesSearch =
        lab.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (lab.city && lab.city.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (lab.state && lab.state.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (lab.address && lab.address.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (lab.country && lab.country.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (lab.rfc && lab.rfc.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (lab.cofeprisNotice && lab.cofeprisNotice.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (lab.sanitaryResponsible && lab.sanitaryResponsible.toLowerCase().includes(searchTerm.toLowerCase()));

      if (!matchesSearch) return false;

      // Filtro por estatus de verificación
      if (statusFilter !== 'ALL') {
        const labStatus = lab.verificationStatus || 'PENDING_REVIEW';
        if (labStatus !== statusFilter) return false;
      }

      if (!filterOwnerOnly) return true;

      const myId = userProfile?.id;
      const myClerkId = userProfile?.clerkId;
      const isOwner =
        (lab.createdById && (lab.createdById === myId || lab.createdById === myClerkId)) ||
        (lab.createdBy?.id && lab.createdBy.id === myId) ||
        (lab.createdBy?.clerkId && lab.createdBy.clerkId === myClerkId);

      return isOwner;
    });
  }, [labs, searchTerm, filterOwnerOnly, statusFilter, userProfile]);

  const handleOpenAudit = (lab: Laboratory) => {
    setSelectedLabToAudit(lab);
    setIsAuditModalOpen(true);
  };

  const handleLabAuditSuccess = (updatedLab: Laboratory) => {
    if (onLabUpdated) {
      onLabUpdated(updatedLab);
    }
  };

  const getStatusBadge = (st?: VerificationStatus) => {
    switch (st) {
      case 'VERIFIED':
        return (
          <span className="badge badge-success text-white badge-xs font-bold gap-1 py-2 px-2 text-[10px]">
            <IconShieldCheck className="w-3 h-3" /> Acreditado COFEPRIS
          </span>
        );
      case 'REJECTED':
        return (
          <span className="badge badge-error text-white badge-xs font-bold gap-1 py-2 px-2 text-[10px]">
            <IconAlertCircle className="w-3 h-3" /> No Conforme
          </span>
        );
      case 'IN_REVIEW':
        return (
          <span className="badge badge-info text-white badge-xs font-bold gap-1 py-2 px-2 text-[10px]">
            <IconHistory className="w-3 h-3" /> Doc. en Revisión
          </span>
        );
      default:
        return (
          <span className="badge badge-warning text-warning-content badge-xs font-bold gap-1 py-2 px-2 text-[10px]">
            <IconAlertCircle className="w-3 h-3" /> Validación Pendiente
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Encabezado Principal Limpio con DaisyUI */}
      <section className="card bg-base-100 border border-base-200 p-5 sm:p-6 shadow-xs rounded-2xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="badge badge-sm badge-outline text-primary border-primary/30 font-semibold gap-1.5 py-2.5 px-3">
                <IconBuilding className="w-3.5 h-3.5" />
                Red de Sedes Clínicas
              </span>
              <span className="badge badge-sm badge-ghost text-base-content/60 font-medium">
                {filteredLabs.length} {filteredLabs.length === 1 ? 'sede encontrada' : 'sedes encontradas'}
              </span>
              {isAdmin && pendingCount > 0 && (
                <span className="badge badge-sm badge-warning font-bold gap-1 py-2.5 px-3 text-warning-content">
                  <IconAlertCircle className="w-3 h-3" /> {pendingCount} por auditar COFEPRIS
                </span>
              )}
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-base-content tracking-tight">
              Directorio y Acreditación de Sedes
            </h1>
            <p className="text-xs sm:text-sm text-base-content/70 max-w-2xl leading-relaxed">
              Supervisa la legalidad sanitaria de cada establecimiento, folios de Aviso de Funcionamiento ante COFEPRIS y dictamina acreditaciones oficiales en territorio mexicano.
            </p>
          </div>

          <button
            onClick={onOpenCreateLab}
            className="btn btn-primary btn-sm sm:btn-md gap-2 font-semibold rounded-xl shadow-xs shrink-0"
          >
            <IconPlus className="w-4 h-4" />
            Nueva Sede
          </button>
        </div>
      </section>

      {/* Barra de Búsqueda, Pestañas Regulatorias y Filtros */}
      <section className="card bg-base-100 border border-base-200 shadow-xs p-3.5 sm:p-4 rounded-2xl space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Búsqueda en Vivo */}
          <label className="input input-bordered input-sm sm:input-md flex items-center gap-2.5 rounded-xl flex-1 focus-within:input-primary text-xs sm:text-sm font-medium">
            <IconSearch className="w-4 h-4 text-base-content/40 shrink-0" />
            <input
              type="text"
              placeholder="Buscar por nombre, RFC, Folio COFEPRIS, ciudad o responsable..."
              className="grow"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </label>

          {/* Filtros y Conmutador de Vista */}
          <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
            <button
              onClick={() => setFilterOwnerOnly(!filterOwnerOnly)}
              className={`btn btn-sm rounded-xl gap-2 font-semibold text-xs ${
                filterOwnerOnly ? 'btn-primary' : 'btn-outline border-base-300'
              }`}
            >
              <IconFilter className="w-3.5 h-3.5" />
              {filterOwnerOnly ? 'Mis Sedes' : 'Solo Mis Sedes'}
            </button>

            <div className="join border border-base-300 rounded-xl overflow-hidden p-0.5 bg-base-200">
              <button
                onClick={() => setViewMode('grid')}
                className={`join-item btn btn-xs border-none rounded-lg font-semibold ${
                  viewMode === 'grid' ? 'btn-primary text-primary-content' : 'btn-ghost'
                }`}
              >
                Cuadrícula
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`join-item btn btn-xs border-none rounded-lg font-semibold ${
                  viewMode === 'table' ? 'btn-primary text-primary-content' : 'btn-ghost'
                }`}
              >
                Tabla
              </button>
            </div>
          </div>
        </div>

        {/* Pestañas de Filtro por Cumplimiento Regulatorio */}
        <div className="flex items-center gap-2 overflow-x-auto pt-1 border-t border-base-200 text-xs">
          <span className="text-[11px] font-bold text-base-content/50 uppercase tracking-wider shrink-0 mr-1">
            Estado Regulatorio:
          </span>
          <button
            onClick={() => setStatusFilter('ALL')}
            className={`btn btn-xs rounded-lg font-semibold ${
              statusFilter === 'ALL' ? 'btn-neutral' : 'btn-ghost'
            }`}
          >
            Todas ({labs.length})
          </button>
          <button
            onClick={() => setStatusFilter('PENDING_REVIEW')}
            className={`btn btn-xs rounded-lg font-semibold gap-1 ${
              statusFilter === 'PENDING_REVIEW'
                ? 'btn-warning text-warning-content'
                : 'btn-ghost text-warning'
            }`}
          >
            <IconAlertCircle className="w-3 h-3" />
            Pendientes de Validación ({pendingCount})
          </button>
          <button
            onClick={() => setStatusFilter('VERIFIED')}
            className={`btn btn-xs rounded-lg font-semibold gap-1 ${
              statusFilter === 'VERIFIED'
                ? 'btn-success text-white'
                : 'btn-ghost text-success'
            }`}
          >
            <IconShieldCheck className="w-3 h-3" />
            Acreditadas COFEPRIS
          </button>
          <button
            onClick={() => setStatusFilter('REJECTED')}
            className={`btn btn-xs rounded-lg font-semibold gap-1 ${
              statusFilter === 'REJECTED'
                ? 'btn-error text-white'
                : 'btn-ghost text-error'
            }`}
          >
            <IconAlertCircle className="w-3 h-3" />
            No Conformes / Rechazadas
          </button>
          <button
            onClick={() => setStatusFilter('IN_REVIEW')}
            className={`btn btn-xs rounded-lg font-semibold gap-1 ${
              statusFilter === 'IN_REVIEW'
                ? 'btn-info text-white'
                : 'btn-ghost text-info'
            }`}
          >
            <IconHistory className="w-3 h-3" />
            Doc. Solicitada
          </button>
        </div>
      </section>

      {/* Listado de Sedes Clínicas (Cuadrícula o Tabla) */}
      <section className="space-y-4">
        {isLoadingLabs ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="skeleton h-44 w-full rounded-2xl"></div>
            ))}
          </div>
        ) : filteredLabs.length === 0 ? (
          <div className="card bg-base-100 border border-dashed border-base-200 p-8 sm:p-12 text-center rounded-2xl">
            <div className="mx-auto w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center mb-3">
              <IconBuilding className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-base-content mb-1">
              No se encontraron sedes con los filtros actuales
            </h3>
            <p className="text-xs text-base-content/60 max-w-sm mx-auto mb-4">
              {searchTerm || statusFilter !== 'ALL'
                ? 'Intenta restablecer los filtros de búsqueda o seleccionar otro estado regulatorio.'
                : 'Aún no hay sedes registradas en esta vista.'}
            </p>
            <button
              onClick={onOpenCreateLab}
              className="btn btn-primary btn-sm font-semibold rounded-xl gap-2 mx-auto shadow-xs"
            >
              <IconPlus className="w-4 h-4" />
              Registrar Nueva Sede
            </button>
          </div>
        ) : viewMode === 'grid' ? (
          /* Vista en Cuadrícula */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredLabs.map((lab) => (
              <LabCard
                key={lab.id}
                lab={lab}
                isAdmin={isAdmin}
                onDeleteSuccess={onDeleteLabSuccess}
                onAuditClick={handleOpenAudit}
              />
            ))}
          </div>
        ) : (
          /* Vista en Tabla Detallada */
          <div className="card bg-base-100 border border-base-200 shadow-xs rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="table table-zebra w-full text-xs sm:text-sm">
                <thead>
                  <tr className="bg-base-200/60 text-base-content/70 uppercase text-[11px] tracking-wider">
                    <th className="font-bold">Laboratorio / Sede</th>
                    <th className="font-bold">Estado Sanitario</th>
                    <th className="font-bold">RFC y Folio COFEPRIS</th>
                    <th className="font-bold">Ubicación</th>
                    <th className="font-bold text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLabs.map((lab) => (
                    <tr key={lab.id} className="hover:bg-base-200/40">
                      <td>
                        <div className="flex items-center gap-2.5">
                          {lab.logo ? (
                            <img
                              src={lab.logo}
                              alt={lab.name}
                              className="w-9 h-9 rounded-xl object-cover border border-base-200 shrink-0"
                              onError={(e) => {
                                (e.target as HTMLElement).style.display = 'none';
                              }}
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary font-bold flex items-center justify-center text-sm shrink-0">
                              {lab.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <div className="font-bold text-base-content">{lab.name}</div>
                            <span className="text-[10px] text-base-content/50 font-mono">
                              ID: {lab.id.slice(0, 8)}...
                            </span>
                          </div>
                        </div>
                      </td>

                      <td>
                        {getStatusBadge(lab.verificationStatus)}
                      </td>

                      <td>
                        <div className="space-y-0.5 text-xs">
                          <div className="font-mono font-bold text-base-content">
                            {lab.rfc || <span className="text-base-content/40 italic font-normal">Sin RFC</span>}
                          </div>
                          {lab.cofeprisNotice ? (
                            <div className="text-[11px] text-primary font-mono font-semibold">
                              COFEPRIS: {lab.cofeprisNotice}
                            </div>
                          ) : (
                            <div className="text-[10px] text-base-content/40 italic">
                              Sin aviso COFEPRIS
                            </div>
                          )}
                        </div>
                      </td>

                      <td>
                        <div className="flex items-center gap-1.5 text-xs text-base-content/80 font-medium">
                          <IconMapPin className="w-3.5 h-3.5 text-base-content/40 shrink-0" />
                          {[lab.city, lab.state, lab.country].filter(Boolean).join(', ') || 'Sin ubicación'}
                        </div>
                      </td>

                      <td className="text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {isAdmin && (
                            <button
                              onClick={() => handleOpenAudit(lab)}
                              className="btn btn-xs btn-outline btn-primary font-semibold rounded-lg gap-1"
                              title="Auditar y Validar Expediente Sanitario"
                            >
                              <IconShieldCheck className="w-3.5 h-3.5" /> Auditar
                            </button>
                          )}
                          <button
                            onClick={() => onDeleteLabSuccess(lab.id)}
                            className="btn btn-ghost btn-xs text-error hover:bg-error/10 font-semibold rounded-lg gap-1"
                            title="Eliminar Sede"
                          >
                            <IconTrash className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      {/* Modal de Auditoría y Dictamen Regulatorio */}
      <AuditLabModal
        lab={selectedLabToAudit}
        isOpen={isAuditModalOpen}
        onClose={() => {
          setIsAuditModalOpen(false);
          setSelectedLabToAudit(null);
        }}
        onLabUpdated={handleLabAuditSuccess}
      />
    </div>
  );
}
