// src/components/AuditLabModal.tsx
import { useState } from 'react';
import type { Laboratory, VerificationStatus } from '../types/lab';
import { useApi } from '../hooks/useApi';
import {
  IconShieldCheck,
  IconAlertCircle,
  IconCheckCircle,
  IconX,
  IconFileText,
  IconMapPin,
  IconExternalLink,
  IconPhone,
  IconHistory,
} from './icons';

interface AuditLabModalProps {
  lab: Laboratory | null;
  isOpen: boolean;
  onClose: () => void;
  onLabUpdated: (updatedLab: Laboratory) => void;
}

export default function AuditLabModal({
  lab,
  isOpen,
  onClose,
  onLabUpdated,
}: AuditLabModalProps) {
  const api = useApi();
  const [notes, setNotes] = useState(lab?.verificationNotes || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen || !lab) return null;

  const currentStatus = lab.verificationStatus || 'PENDING_REVIEW';

  const handleVerifyAction = async (targetStatus: VerificationStatus) => {
    if (targetStatus === 'REJECTED' && !notes.trim()) {
      setErrorMsg('Es obligatorio especificar las observaciones o motivos legales de rechazo.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const response = await api.patch<Laboratory>(`/lab/${lab.id}/verify`, {
        status: targetStatus,
        notes: notes.trim() || undefined,
      });

      const updated = response.data;
      onLabUpdated(updated);

      const statusMessages: Record<VerificationStatus, string> = {
        VERIFIED: '¡Sede acreditada exitosamente ante COFEPRIS!',
        REJECTED: 'Sede marcada como No Conforme / Rechazada.',
        IN_REVIEW: 'Sede puesta en estatus de Revisión Documental.',
        PENDING_REVIEW: 'Estatus restablecido a Pendiente de Validación.',
      };

      setSuccessMsg(statusMessages[targetStatus]);

      setTimeout(() => {
        setSuccessMsg(null);
        onClose();
      }, 1200);
    } catch (err: any) {
      console.error('Error al dictaminar sede:', err);
      const serverMsg =
        err?.response?.data?.message ||
        'No se pudo completar el dictamen de la sede. Verifica los permisos de administrador.';
      setErrorMsg(Array.isArray(serverMsg) ? serverMsg.join(', ') : serverMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (st: VerificationStatus) => {
    switch (st) {
      case 'VERIFIED':
        return (
          <span className="badge badge-success text-white text-xs font-bold gap-1 py-2 px-3">
            <IconShieldCheck className="w-3.5 h-3.5" /> Acreditado COFEPRIS
          </span>
        );
      case 'REJECTED':
        return (
          <span className="badge badge-error text-white text-xs font-bold gap-1 py-2 px-3">
            <IconAlertCircle className="w-3.5 h-3.5" /> No Conforme / Rechazado
          </span>
        );
      case 'IN_REVIEW':
        return (
          <span className="badge badge-info text-white text-xs font-bold gap-1 py-2 px-3">
            <IconHistory className="w-3.5 h-3.5" /> Documentación Solicitada
          </span>
        );
      default:
        return (
          <span className="badge badge-warning text-warning-content text-xs font-bold gap-1 py-2 px-3">
            <IconAlertCircle className="w-3.5 h-3.5" /> Validación Pendiente
          </span>
        );
    }
  };

  return (
    <dialog className="modal modal-open backdrop-blur-xs p-2 sm:p-4 z-50">
      <div className="modal-box w-full max-w-[95vw] sm:max-w-2xl border border-base-200 bg-base-100 p-4 sm:p-7 shadow-2xl rounded-3xl max-h-[92vh] overflow-y-auto">
        
        {/* Encabezado */}
        <div className="flex items-center justify-between border-b border-base-200 pb-4 mb-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-primary/20">
              <IconShieldCheck className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-base sm:text-lg text-base-content tracking-tight truncate">
                  Auditoría y Validación Sanitaria (COFEPRIS)
                </h3>
              </div>
              <p className="text-xs text-base-content/60 truncate">
                Dictamen regulatorio central para la sede: <span className="font-semibold text-base-content">{lab.name}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="btn btn-sm btn-circle btn-ghost text-base-content/70 hover:bg-base-200"
            disabled={isSubmitting}
          >
            <IconX className="w-5 h-5" />
          </button>
        </div>

        {/* Mensajes de Alerta */}
        {errorMsg && (
          <div className="alert alert-error mb-4 text-xs font-medium shadow-xs py-2.5 rounded-2xl text-white">
            <IconAlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="alert alert-success mb-4 text-xs font-medium shadow-xs py-2.5 rounded-2xl text-white">
            <IconCheckCircle className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <div className="space-y-4">
          
          {/* Ficha de Estado Actual */}
          <div className="flex items-center justify-between p-3.5 bg-base-200/50 rounded-2xl border border-base-200 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-base-content/70">Estado Regulatorio:</span>
              {getStatusBadge(currentStatus)}
            </div>
            {lab.verifiedAt && (
              <span className="text-[11px] text-base-content/60">
                Dictaminado el {new Date(lab.verifiedAt).toLocaleDateString()} {lab.verifiedBy ? `por ${lab.verifiedBy}` : ''}
              </span>
            )}
          </div>

          {/* Expediente Sanitario y Legal */}
          <div className="bg-primary/5 p-4 rounded-2xl border border-primary/20 space-y-3">
            <div className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
              <IconFileText className="w-3.5 h-3.5" /> Expediente Sanitario Acreditativo
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-2.5 bg-base-100 rounded-xl border border-base-200">
                <span className="text-[10px] text-base-content/50 uppercase font-bold block">
                  RFC del Establecimiento
                </span>
                <span className="font-mono font-bold text-sm text-base-content">
                  {lab.rfc || <span className="text-error font-normal text-xs">No proporcionado</span>}
                </span>
              </div>

              <div className="p-2.5 bg-base-100 rounded-xl border border-base-200">
                <span className="text-[10px] text-base-content/50 uppercase font-bold block">
                  Folio Aviso Funcionamiento COFEPRIS
                </span>
                <span className="font-mono font-bold text-sm text-primary">
                  {lab.cofeprisNotice || <span className="text-error font-normal text-xs">Sin folio registrado</span>}
                </span>
              </div>

              <div className="p-2.5 bg-base-100 rounded-xl border border-base-200">
                <span className="text-[10px] text-base-content/50 uppercase font-bold block">
                  Responsable Sanitario
                </span>
                <span className="font-semibold text-base-content">
                  {lab.sanitaryResponsible || <span className="text-base-content/40 italic">No especificado</span>}
                </span>
              </div>

              <div className="p-2.5 bg-base-100 rounded-xl border border-base-200">
                <span className="text-[10px] text-base-content/50 uppercase font-bold block">
                  Cédula Profesional
                </span>
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono font-semibold text-base-content">
                    {lab.professionalLicense || <span className="text-base-content/40 italic">N/A</span>}
                  </span>
                  {lab.professionalLicense && (
                    <a
                      href={`https://www.cedulaprofesional.sep.gob.mx/cedula/presidencia/indexAvanzada.action`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-xs btn-ghost text-primary gap-1 font-normal text-[10px]"
                      title="Consultar en Registro Nacional de Profesionistas SEP"
                    >
                      Verificar SEP <IconExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>

              {lab.sanitaryPermitUrl && (
                <div className="p-2.5 bg-base-100 rounded-xl border border-base-200 sm:col-span-2 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <span className="text-[10px] text-base-content/50 uppercase font-bold block">
                      Comprobante / Licencia Sanitaria Oficial
                    </span>
                    <span className="truncate block font-medium text-primary">
                      {lab.sanitaryPermitUrl}
                    </span>
                  </div>
                  <a
                    href={lab.sanitaryPermitUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-primary btn-outline btn-xs gap-1.5 shrink-0 rounded-lg"
                  >
                    Abrir Documento <IconExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Domicilio y Contacto */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-base-200/40 rounded-xl border border-base-200 space-y-1">
              <span className="text-[10px] text-base-content/50 uppercase font-bold flex items-center gap-1">
                <IconMapPin className="w-3 h-3 text-primary" /> Domicilio Registrado
              </span>
              <p className="font-medium text-base-content">
                {lab.address || 'Sin dirección física especificada'}
              </p>
              <p className="text-[11px] text-base-content/60">
                {[lab.city, lab.state, lab.country].filter(Boolean).join(', ')}
              </p>
            </div>

            <div className="p-3 bg-base-200/40 rounded-xl border border-base-200 space-y-1">
              <span className="text-[10px] text-base-content/50 uppercase font-bold flex items-center gap-1">
                <IconPhone className="w-3 h-3 text-primary" /> Contacto Oficial
              </span>
              <p className="text-base-content flex items-center gap-1.5">
                <span className="font-semibold">Tel:</span> {lab.phone || 'No registrado'}
              </p>
              <p className="text-base-content flex items-center gap-1.5 truncate">
                <span className="font-semibold">Email:</span> {lab.email || 'No registrado'}
              </p>
            </div>
          </div>

          {/* Observaciones del Dictamen */}
          <div className="form-control space-y-1">
            <label className="label py-0.5">
              <span className="label-text text-xs font-bold">
                Observaciones del Administrador / Fundamento Legal del Dictamen:
              </span>
            </label>
            <textarea
              className="textarea textarea-bordered rounded-xl text-xs focus:textarea-primary w-full h-20"
              placeholder="Escribe comentarios de auditoría, número de oficio de resolución o motivos legales de rechazo..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
            <span className="text-[10px] text-base-content/50">
              Estas notas se guardan en la Bitácora de Auditoría para respaldo ante requerimientos de COFEPRIS.
            </span>
          </div>

          {/* Panel de Dictamen y Botones de Acción */}
          <div className="border-t border-base-200 pt-4 mt-2 space-y-3">
            <span className="text-[11px] font-bold text-base-content/70 uppercase tracking-wider block">
              Emitir Dictamen de Auditoría:
            </span>

            <div className="flex items-center justify-end gap-2 flex-wrap">
              <button
                type="button"
                onClick={onClose}
                className="btn btn-ghost btn-sm rounded-xl font-semibold"
                disabled={isSubmitting}
              >
                Cerrar
              </button>

              <button
                type="button"
                onClick={() => handleVerifyAction('IN_REVIEW')}
                className="btn btn-info btn-outline btn-sm rounded-xl gap-1.5 font-semibold"
                disabled={isSubmitting}
                title="Marcar para subsanar documentación faltante"
              >
                <IconHistory className="w-4 h-4" /> Solicitar Subsanación
              </button>

              <button
                type="button"
                onClick={() => handleVerifyAction('REJECTED')}
                className="btn btn-error text-white btn-sm rounded-xl gap-1.5 font-semibold"
                disabled={isSubmitting}
                title="Rechazar la sede por incumplimiento sanitario"
              >
                <IconAlertCircle className="w-4 h-4" /> Rechazar Sede
              </button>

              <button
                type="button"
                onClick={() => handleVerifyAction('VERIFIED')}
                className="btn btn-success text-white btn-sm rounded-xl gap-1.5 font-bold shadow-xs"
                disabled={isSubmitting}
                title="Acreditar que el laboratorio cumple con COFEPRIS"
              >
                <IconShieldCheck className="w-4 h-4" /> Acreditar Sede
              </button>
            </div>
          </div>
        </div>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button onClick={onClose}>close</button>
      </form>
    </dialog>
  );
}
