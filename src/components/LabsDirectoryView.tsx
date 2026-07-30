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
      
      {/* Encabezado Principal del CRUD con Botón de Agregar Sede */}
      <section className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-base-100 p-6 rounded-3xl border border-base-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="badge badge-primary badge-outline text-xs font-semibold">
              <IconBuilding className="w-3.5 h-3.5 mr-1" />
              Gestión de Sedes Clínicas
            </span>
            <span className="text-xs text-base-content/60 font-semibold">
              {filteredLabs.length} {filteredLabs.length === 1 ? 'sede registrada' : 'sedes registradas'}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-base-content tracking-tight">
            Directorio de Sedes
          </h1>
          <p className="text-xs sm:text-sm text-base-content/70 mt-0.5">
            Administra, busca y gestiona la información de los laboratorios del sistema.
          </p>
        </div>

        <button
          onClick={onOpenCreateLab}
          className="btn btn-primary text-primary-content font-bold rounded-2xl gap-2 shadow-md hover:scale-[1.02] transition-all shrink-0"
        >
          <IconPlus className="w-5 h-5" />
          Agregar Sede
        </button>
      </section>

      {/* Barra de Búsqueda, Filtros de Propiedad y Conmutador de Vista */}
      <section className="card bg-base-100 border border-base-200 shadow-sm p-4 sm:p-5 rounded-3xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* Búsqueda en Vivo */}
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Buscar laboratorio por nombre, ciudad o dirección..."
              className="input input-bordered w-full rounded-2xl pl-11 focus:input-primary transition-all text-sm font-medium"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <svg
              className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-base-content/40"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          {/* Filtros y Conmutador de Vista */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setFilterOwnerOnly(!filterOwnerOnly)}
              className={`btn btn-sm rounded-xl gap-2 font-semibold ${
                filterOwnerOnly ? 'btn-primary' : 'btn-outline border-base-300'
              }`}
            >
              <IconSparkles className="w-4 h-4" />
              {filterOwnerOnly ? 'Mostrando Mis Sedes' : 'Filtrar Mis Sedes'}
            </button>

            <div className="join border border-base-300 rounded-xl overflow-hidden p-0.5 bg-base-200">
              <button
                onClick={() => setViewMode('grid')}
                className={`join-item btn btn-xs border-none rounded-lg font-bold ${
                  viewMode === 'grid' ? 'btn-primary text-white' : 'btn-ghost'
                }`}
              >
                Tarjetas
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`join-item btn btn-xs border-none rounded-lg font-bold ${
                  viewMode === 'table' ? 'btn-primary text-white' : 'btn-ghost'
                }`}
              >
                Tabla
              </button>
            </div>
          </div>

        </div>
      </section>

      {/* Listado de Sedes Clínicas (Vista en Cuadrícula o Tabla) */}
      <section className="space-y-6">
        {isLoadingLabs ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="skeleton h-44 w-full rounded-3xl"></div>
            ))}
          </div>
        ) : filteredLabs.length === 0 ? (
          <div className="card bg-base-100 border-2 border-dashed border-base-300 p-12 text-center rounded-3xl">
            <div className="mx-auto w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-4">
              <IconBuilding className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-base-content mb-1">No se encontraron sedes clínicas</h3>
            <p className="text-xs sm:text-sm text-base-content/60 max-w-md mx-auto mb-6">
              {searchTerm
                ? `No hay laboratorios que coincidan con la búsqueda "${searchTerm}".`
                : 'Aún no hay sedes registradas en este catálogo. ¡Registra la primera sede ahora mismo!'}
            </p>
            <button
              onClick={onOpenCreateLab}
              className="btn btn-primary font-bold text-white rounded-xl gap-2 mx-auto"
            >
              <IconPlus className="w-5 h-5" />
              Agregar Sede
            </button>
          </div>
        ) : viewMode === 'grid' ? (
          /* Vista de Cuadrícula (Cards) */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
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
          <div className="card bg-base-100 border border-base-200 shadow-md rounded-3xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="table table-zebra w-full text-sm">
                <thead>
                  <tr className="bg-base-200/60 text-base-content/70">
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
                        <div className="flex items-center gap-3">
                          {lab.logo ? (
                            <img
                              src={lab.logo}
                              alt={lab.name}
                              className="w-10 h-10 rounded-xl object-cover border border-base-200"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 font-bold flex items-center justify-center text-lg">
                              {lab.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <div className="font-bold text-base-content">{lab.name}</div>
                            <span className="text-[11px] text-base-content/50">ID: {lab.id.slice(0, 8)}...</span>
                          </div>
                        </div>
                      </td>

                      <td>
                        <div className="flex items-center gap-1.5 text-xs text-base-content/80 font-medium">
                          <IconMapPin className="w-4 h-4 text-blue-600" />
                          {[lab.city, lab.state, lab.country].filter(Boolean).join(', ') || 'Sin ubicación'}
                        </div>
                      </td>

                      <td>
                        <span className="text-xs text-base-content/70 font-normal truncate max-w-xs block">
                          {lab.address || 'Sin dirección especificada'}
                        </span>
                      </td>

                      <td className="text-center">
                        <button
                          onClick={() => onDeleteLabSuccess(lab.id)}
                          className="btn btn-ghost btn-xs text-error hover:bg-error/10 font-bold rounded-lg gap-1"
                          title="Eliminar Sede"
                        >
                          <IconTrash className="w-3.5 h-3.5" /> Eliminar
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
