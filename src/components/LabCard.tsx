// src/components/LabCard.tsx
import { useState } from 'react';
import type { Laboratory } from '../types/lab';
import { useApi } from '../hooks/useApi';
import { IconMapPin, IconMoreVertical, IconTrash, IconAlertCircle } from './icons';

interface LabCardProps {
  lab: Laboratory;
  onDeleteSuccess: (id: string) => void;
}

export default function LabCard({ lab, onDeleteSuccess }: LabCardProps) {
  const api = useApi();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await api.delete(`/lab/${lab.id}`);
      onDeleteSuccess(lab.id);
    } catch (error) {
      console.error('Error al eliminar el laboratorio:', error);
      alert('No se pudo eliminar el laboratorio. Intenta de nuevo.');
    } finally {
      setIsDeleting(false);
      setShowConfirmDelete(false);
    }
  };

  const locationText = [lab.city, lab.state, lab.country].filter(Boolean).join(', ');

  return (
    <div className="card bg-base-100 border border-base-300 shadow-md hover:shadow-xl transition-all duration-300 rounded-2xl overflow-hidden group">
      <div className="card-body p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            {lab.logo ? (
              <img
                src={lab.logo}
                alt={lab.name}
                className="w-12 h-12 rounded-xl object-cover border border-base-200 shrink-0"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            ) : (
              <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-xl shrink-0">
                {lab.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <h3 className="card-title text-lg font-bold text-base-content group-hover:text-primary transition-colors">
                {lab.name}
              </h3>
              {locationText && (
                <p className="text-xs text-base-content/60 flex items-center gap-1 mt-0.5 font-medium">
                  <IconMapPin className="w-3.5 h-3.5 text-secondary" />
                  {locationText}
                </p>
              )}
            </div>
          </div>

          <div className="dropdown dropdown-end">
            <button tabIndex={0} className="btn btn-ghost btn-xs btn-circle text-base-content/50 hover:text-base-content">
              <IconMoreVertical className="w-4 h-4" />
            </button>
            <ul tabIndex={0} className="dropdown-content z-10 menu p-2 shadow-lg bg-base-100 rounded-box w-40 text-sm border border-base-200">
              <li>
                <button
                  onClick={() => setShowConfirmDelete(true)}
                  className="text-error hover:bg-error/10 font-semibold"
                >
                  <IconTrash className="w-4 h-4" />
                  Eliminar
                </button>
              </li>
            </ul>
          </div>
        </div>

        {lab.address && (
          <div className="mt-3 pt-3 border-t border-base-200 text-xs text-base-content/70 flex items-center gap-2">
            <IconMapPin className="w-4 h-4 text-base-content/40 shrink-0" />
            <span className="truncate">{lab.address}</span>
          </div>
        )}
      </div>

      {/* Modal de confirmación para eliminar */}
      {showConfirmDelete && (
        <dialog className="modal modal-open backdrop-blur-xs">
          <div className="modal-box max-w-sm rounded-2xl p-6">
            <div className="flex items-center gap-2 text-error font-bold text-lg mb-2">
              <IconAlertCircle className="w-6 h-6" />
              <span>¿Eliminar laboratorio?</span>
            </div>
            <p className="py-2 text-sm text-base-content/70">
              ¿Estás seguro de que deseas eliminar <strong>"{lab.name}"</strong>? Esta acción no se puede deshacer.
            </p>
            <div className="modal-action">
              <button
                className="btn btn-ghost rounded-xl"
                onClick={() => setShowConfirmDelete(false)}
                disabled={isDeleting}
              >
                Cancelar
              </button>
              <button
                className="btn btn-error text-white rounded-xl gap-2 font-bold"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <span className="loading loading-spinner loading-xs"></span>
                ) : (
                  <>
                    <IconTrash className="w-4 h-4" />
                    Eliminar
                  </>
                )}
              </button>
            </div>
          </div>
        </dialog>
      )}
    </div>
  );
}
