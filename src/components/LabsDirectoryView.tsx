// src/components/LabsDirectoryView.tsx
import { useState, useMemo } from 'react';
import type { Laboratory } from '../types/lab';
import { useUserContext } from '../hooks/useUserContext';
import {
  IconBuilding,
  IconPlus,
  IconMapPin,
  IconTrash,
  IconSparkles,
} from './icons';
import LabCard from './LabCard';

interface LabsDirectoryViewProps {
  labs: Laboratory[];
  isLoadingLabs: boolean;
  onOpenCreateLab: () => void;
  onDeleteLabSuccess: (id: string) => void;
}

export default function LabsDirectoryView({
  labs,
  isLoadingLabs,
  onOpenCreateLab,
  onDeleteLabSuccess,
}: LabsDirectoryViewProps) {
  const { userProfile } = useUserContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [filterOwnerOnly, setFilterOwnerOnly] = useState(false);

  // Filtrado dinámico de laboratorios
  const filteredLabs = useMemo(() => {
    return labs.filter((lab) => {
      const matchesSearch =
        lab.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (lab.city && lab.city.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (lab.state && lab.state.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (lab.address && lab.address.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (lab.country && lab.country.toLowerCase().includes(searchTerm.toLowerCase()));

      if (!filterOwnerOnly) return matchesSearch;

      const myId = userProfile?.id;
      const myClerkId = userProfile?.clerkId;
      const isOwner =
        (lab.createdById && (lab.createdById === myId || lab.createdById === myClerkId)) ||
        (lab.createdBy?.id && lab.createdBy.id === myId) ||
        (lab.createdBy?.clerkId && lab.createdBy.clerkId === myClerkId);

      return matchesSearch && isOwner;
    });
  }, [labs, searchTerm, filterOwnerOnly, userProfile]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Encabezado Principal Limpio con DaisyUI */}
      <section className="card bg-base-100 border border-base-200 p-5 sm:p-6 shadow-xs rounded-2xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="badge badge-sm badge-outline text-primary border-primary/30 font-semibold gap-1.5 py-2.5 px-3">
                <IconBuilding className="w-3.5 h-3.5" />
                Gestión de Sedes Clínicas
              </span>
              <span className="badge badge-sm badge-ghost text-base-content/60 font-medium">
                {filteredLabs.length} {filteredLabs.length === 1 ? 'sede registrada' : 'sedes registradas'}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-base-content tracking-tight">
              Directorio de Sedes
            </h1>
            <p className="text-xs sm:text-sm text-base-content/70 max-w-2xl leading-relaxed">
              Administra, busca y gestiona la información de las sedes clínicas y centros de procesamiento.
            </p>
          </div>

          <button
            onClick={onOpenCreateLab}
            className="btn btn-primary btn-sm sm:btn-md gap-2 font-semibold rounded-xl shadow-xs shrink-0"
          >
            <IconPlus className="w-4 h-4" />
            Agregar Sede
          </button>
        </div>
      </section>

      {/* Barra de Búsqueda, Filtros y Conmutador de Vista */}
      <section className="card bg-base-100 border border-base-200 shadow-xs p-3.5 sm:p-4 rounded-2xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Búsqueda en Vivo */}
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Buscar sede por nombre, ciudad o dirección..."
              className="input input-bordered input-sm sm:input-md w-full rounded-xl pl-10 focus:input-primary text-xs sm:text-sm font-medium"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <svg
              className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-base-content/40"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          {/* Filtros y Conmutador de Vista */}
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={() => setFilterOwnerOnly(!filterOwnerOnly)}
              className={`btn btn-sm rounded-xl gap-2 font-semibold text-xs ${
                filterOwnerOnly ? 'btn-primary' : 'btn-outline border-base-300'
              }`}
            >
              <IconSparkles className="w-3.5 h-3.5" />
              {filterOwnerOnly ? 'Mis Sedes' : 'Filtrar Mis Sedes'}
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
      </section>

      {/* Listado de Sedes Clínicas (Cuadrícula o Tabla) */}
      <section className="space-y-4">
        {isLoadingLabs ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="skeleton h-40 w-full rounded-2xl"></div>
            ))}
          </div>
        ) : filteredLabs.length === 0 ? (
          <div className="card bg-base-100 border border-dashed border-base-200 p-8 sm:p-12 text-center rounded-2xl">
            <div className="mx-auto w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center mb-3">
              <IconBuilding className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-base-content mb-1">
              No se encontraron sedes
            </h3>
            <p className="text-xs text-base-content/60 max-w-sm mx-auto mb-4">
              {searchTerm
                ? `No hay resultados para "${searchTerm}". Intenta con otro término de búsqueda.`
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
                onDeleteSuccess={onDeleteLabSuccess}
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
                    <th className="font-bold">Ubicación</th>
                    <th className="font-bold">Dirección</th>
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
                            <span className="text-[10px] text-base-content/50 font-mono">ID: {lab.id.slice(0, 8)}...</span>
                          </div>
                        </div>
                      </td>

                      <td>
                        <div className="flex items-center gap-1.5 text-xs text-base-content/80 font-medium">
                          <IconMapPin className="w-3.5 h-3.5 text-base-content/40 shrink-0" />
                          {[lab.city, lab.state, lab.country].filter(Boolean).join(', ') || 'Sin ubicación'}
                        </div>
                      </td>

                      <td>
                        <span className="text-xs text-base-content/70 truncate max-w-xs block">
                          {lab.address || 'Sin dirección especificada'}
                        </span>
                      </td>

                      <td className="text-center">
                        <button
                          onClick={() => onDeleteLabSuccess(lab.id)}
                          className="btn btn-ghost btn-xs text-error hover:bg-error/10 font-semibold rounded-lg gap-1"
                          title="Eliminar Sede"
                        >
                          <IconTrash className="w-3 h-3" /> Eliminar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
