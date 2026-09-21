// src/components/LabCard.tsx
import { useState } from 'react';
import type { Laboratory, VerificationStatus } from '../types/lab';
import { useApi } from '../hooks/useApi';
import {
  IconMapPin,
  IconMoreVertical,
  IconTrash,
  IconAlertCircle,
  IconBuilding,
  IconShieldCheck,
  IconHistory,
  IconFileText,
  IconScan,
} from './icons';

interface LabCardProps {
  lab: Laboratory;
  isAdmin?: boolean;
  onDeleteSuccess: (id: string) => void;
  onAuditClick?: (lab: Laboratory) => void;
}

export default function LabCard({
  lab,
  isAdmin = false,
  onDeleteSuccess,
  onAuditClick,
}: LabCardProps) {
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
    <div className="card bg-base-100 border border-base-200 shadow-xs hover:border-primary/40 hover:shadow-md transition-all duration-200 rounded-2xl overflow-hidden group flex flex-col justify-between">
      <div className="card-body p-5 space-y-3">
        
        {/* Cabecera de la Tarjeta */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {lab.logo ? (
              <img
                src={lab.logo}
                alt={lab.name}
                className="w-11 h-11 rounded-xl object-cover border border-base-200 shrink-0"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            ) : (
              <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-lg shrink-0">
                {lab.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="card-title text-base font-bold text-base-content truncate group-hover:text-primary transition-colors">
                  {lab.name}
                </h3>
              </div>
              {locationText ? (
                <p className="text-xs text-base-content/60 flex items-center gap-1 mt-0.5 font-medium truncate">
                  <IconMapPin className="w-3.5 h-3.5 text-base-content/40 shrink-0" />
                  <span className="truncate">{locationText}</span>
                </p>
              ) : (
                <span className="badge badge-ghost badge-xs text-[10px] text-base-content/50 mt-0.5">
                  Sede Operativa
                </span>
              )}
            </div>
          </div>

          <div className="dropdown dropdown-end shrink-0">
            <button
              tabIndex={0}
              className="btn btn-ghost btn-xs btn-circle text-base-content/40 hover:text-base-content"
              title="Opciones de sede"
            >
              <IconMoreVertical className="w-4 h-4" />
            </button>
            <ul
              tabIndex={0}
              className="dropdown-content z-20 menu p-1.5 shadow-lg bg-base-100 rounded-xl w-40 text-xs border border-base-200"
            >
              {isAdmin && onAuditClick && (
                <li>
                  <button
                    onClick={() => onAuditClick(lab)}
                    className="text-primary hover:bg-primary/10 font-semibold gap-2 py-2"
                  >
                    <IconShieldCheck className="w-3.5 h-3.5" />
                    Auditar Permisos
                  </button>
                </li>
              )}
              <li>
                <button
                  onClick={() => setShowConfirmDelete(true)}
                  className="text-error hover:bg-error/10 font-semibold gap-2 py-2"
                >
                  <IconTrash className="w-3.5 h-3.5" />
                  Eliminar Sede
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Estatus Regulatorio Sanitario */}
        <div className="flex items-center justify-between gap-2 pt-1">
          {getStatusBadge(lab.verificationStatus)}
          {lab.rfc && (
            <span className="text-[10px] font-mono font-bold text-base-content/60 bg-base-200/60 px-2 py-0.5 rounded-md">
              RFC: {lab.rfc}
            </span>
          )}
        </div>

        {/* Expediente Breve (Folio COFEPRIS y Responsable) */}
        {(lab.cofeprisNotice || lab.sanitaryResponsible) && (
          <div className="text-[11px] bg-base-200/40 p-2.5 rounded-xl border border-base-200/60 space-y-1">
            {lab.cofeprisNotice && (
              <div className="flex items-center justify-between text-base-content/70">
                <span className="font-semibold flex items-center gap-1">
                  <IconFileText className="w-3 h-3 text-primary" /> COFEPRIS:
                </span>
                <span className="font-mono text-primary font-bold">{lab.cofeprisNotice}</span>
              </div>
            )}
            {lab.sanitaryResponsible && (
              <div className="flex items-center justify-between text-base-content/70">
                <span className="font-semibold">Responsable:</span>
                <span className="truncate max-w-[150px] text-right font-medium">{lab.sanitaryResponsible}</span>
              </div>
            )}
            {lab.sanitaryPermitUrl && (
              <div className="flex items-center justify-between text-[10px] text-base-content/70 pt-1 border-t border-base-200/60">
                <span className="flex items-center gap-1 text-success font-semibold">
                  <IconScan className="w-3 h-3" /> Comprobante Adjunto
                </span>
                <span className="text-[9px] badge badge-ghost badge-xs">
                  {lab.sanitaryPermitUrl.startsWith('data:image/')
                    ? 'Escaneo Digital'
                    : lab.sanitaryPermitUrl.startsWith('data:application/pdf')
                    ? 'PDF Oficial'
                    : 'Enlace Web'}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Dirección Física */}
        {lab.address ? (
          <div className="pt-2 border-t border-base-200 text-xs text-base-content/60 flex items-center gap-1.5">
            <IconBuilding className="w-3.5 h-3.5 text-base-content/40 shrink-0" />
            <span className="truncate">{lab.address}</span>
          </div>
        ) : (
          <div className="pt-2 border-t border-base-200 text-xs text-base-content/40 flex items-center justify-between">
            <span>Sede activa y sincronizada</span>
            <span className="w-1.5 h-1.5 rounded-full bg-success"></span>
          </div>
        )}
      </div>

      {/* Botón de Auditoría Directa para Administrador Global */}
      {isAdmin && onAuditClick && (
        <div className="px-5 pb-4">
          <button
            onClick={() => onAuditClick(lab)}
            className="btn btn-outline btn-primary btn-xs w-full rounded-xl gap-1.5 font-bold"
          >
            <IconShieldCheck className="w-3.5 h-3.5" />
            Auditar Expediente COFEPRIS
          </button>
        </div>
      )}

      {/* Modal de confirmación para eliminar */}
      {showConfirmDelete && (
        <dialog className="modal modal-open backdrop-blur-xs">
          <div className="modal-box w-full max-w-[95vw] sm:max-w-sm rounded-2xl p-4 sm:p-6 border border-base-200">
            <div className="flex items-center gap-2 text-error font-bold text-base mb-2">
              <IconAlertCircle className="w-5 h-5 shrink-0" />
              <span>¿Eliminar laboratorio?</span>
            </div>
            <p className="py-2 text-xs sm:text-sm text-base-content/70 leading-relaxed">
              ¿Estás seguro de que deseas eliminar <strong>"{lab.name}"</strong>? Las órdenes asociadas a esta sede se verán afectadas.
            </p>
            <div className="modal-action gap-2 mt-4">
              <button
                className="btn btn-sm btn-ghost rounded-xl text-xs"
                onClick={() => setShowConfirmDelete(false)}
                disabled={isDeleting}
              >
                Cancelar
              </button>
              <button
                className="btn btn-sm btn-error text-white rounded-xl gap-1.5 font-semibold text-xs"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <span className="loading loading-spinner loading-xs"></span>
                ) : (
                  <>
                    <IconTrash className="w-3.5 h-3.5" />
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
