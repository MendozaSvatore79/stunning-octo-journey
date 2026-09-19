// src/components/MaintenanceControlModal.tsx
import { useState } from 'react';
import { useMaintenance, type MaintenanceModules } from '../context/MaintenanceContext';
import {
  IconSettings,
  IconShield,
  IconUsers,
  IconFlask,
  IconClipboardList,
  IconCertificate,
  IconBuilding,
  IconHeadphones,
  IconAlertTriangle,
  IconEye,
  IconCheck,
  IconWrench,
} from './icons';

interface MaintenanceControlModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MaintenanceControlModal({ isOpen, onClose }: MaintenanceControlModalProps) {
  const {
    config,
    updateConfig,
    toggleGlobalMaintenance,
    toggleModuleMaintenance,
    getVipUrl,
    setIsPreviewingMaintenance,
  } = useMaintenance();

  const [vipKeyInput, setVipKeyInput] = useState(config.vipAccessKey);
  const [estimatedInput, setEstimatedInput] = useState(config.estimatedTime);
  const [reasonInput, setReasonInput] = useState(config.reason);
  const [copiedLink, setCopiedLink] = useState(false);

  if (!isOpen) return null;

  const handleSaveTextChanges = () => {
    updateConfig({
      vipAccessKey: vipKeyInput.trim() || 'SECURE_VIP_PASS_2026',
      estimatedTime: estimatedInput.trim(),
      reason: reasonInput.trim(),
    });
    alert('¡Configuración de Mantenimiento actualizada correctamente!');
  };

  const handleCopyVipLink = () => {
    const url = getVipUrl();
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 3000);
  };

  const handlePreviewMaintenanceLanding = () => {
    setIsPreviewingMaintenance(true);
    onClose();
  };

  const moduleItems: { key: keyof MaintenanceModules; label: string; icon: any; color: string }[] = [
    { key: 'patients', label: 'Módulo de Pacientes', icon: IconUsers, color: 'text-indigo-600' },
    { key: 'catalog', label: 'Catálogo de Análisis', icon: IconFlask, color: 'text-teal-600' },
    { key: 'workOrders', label: 'Órdenes de Trabajo', icon: IconClipboardList, color: 'text-amber-600' },
    { key: 'qualityControl', label: 'Control de Calidad', icon: IconCertificate, color: 'text-rose-600' },
    { key: 'labsDirectory', label: 'Directorio de Sedes', icon: IconBuilding, color: 'text-blue-600' },
    { key: 'supportChat', label: 'Soporte Técnico Live', icon: IconHeadphones, color: 'text-purple-600 font-bold' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fade-in overflow-y-auto">
      <div className="bg-base-100 rounded-2xl border border-base-200 shadow-2xl max-w-2xl w-full overflow-hidden my-8">
        {/* Header del Modal */}
        <div className="border-b border-base-200 p-5 bg-base-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-primary/20">
              <IconSettings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-base-content tracking-tight">Gestor de Modo Mantenimiento</h2>
              <p className="text-xs text-base-content/60">Panel de Control Exclusivo para Administradores</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="btn btn-sm btn-circle btn-ghost text-base-content/60 hover:bg-base-200"
          >
            ✕
          </button>
        </div>

        {/* Cuerpo del Modal */}
        <div className="p-5 sm:p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* MANTENIMIENTO GLOBAL CONTROL SWITCH & BOTÓN PREVISUALIZAR */}
          <div className="p-4 sm:p-5 rounded-xl bg-base-200/40 border border-base-200 space-y-3">
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <IconAlertTriangle className="w-4 h-4 text-error shrink-0" />
                  <span className="font-bold text-base-content text-sm">Mantenimiento Global (Todo el Sistema)</span>
                  {config.globalMaintenance && (
                    <span className="badge badge-error text-[10px] font-bold text-white uppercase px-2 py-0.5 animate-pulse">ACTIVO</span>
                  )}
                </div>
                <p className="text-xs text-base-content/60">
                  Bloquea el acceso público a todo el sistema. Solo los Administradores o personas con la Clave VIP podrán acceder.
                </p>
              </div>

              <input
                type="checkbox"
                className="toggle toggle-error toggle-md sm:toggle-lg"
                checked={config.globalMaintenance}
                onChange={(e) => toggleGlobalMaintenance(e.target.checked)}
              />
            </div>

            <div className="pt-2 border-t border-base-200 flex items-center justify-between gap-2">
              <span className="text-xs text-base-content/70 font-medium">
                ¿Quieres probar cómo la ven los usuarios públicos?
              </span>
              <button
                onClick={handlePreviewMaintenanceLanding}
                className="btn btn-xs btn-outline rounded-lg font-bold inline-flex items-center gap-1.5"
              >
                <IconEye className="w-3.5 h-3.5" />
                <span>Ver Pantalla de Mantenimiento</span>
              </button>
            </div>
          </div>

          {/* CLAVE VIP Y ENLACE SEGURO */}
          <div className="p-4 sm:p-5 rounded-xl bg-primary/5 border border-primary/20 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-primary font-bold text-sm">
                <IconShield className="w-4 h-4" />
                Acceso VIP Seguro (Bypass de Mantenimiento)
              </div>

              <button
                onClick={handleCopyVipLink}
                className="btn btn-xs btn-primary text-primary-content font-bold rounded-lg inline-flex items-center gap-1.5 shadow-xs"
              >
                {copiedLink ? (
                  <>
                    <IconCheck className="w-3.5 h-3.5" />
                    <span>¡URL VIP Copiada!</span>
                  </>
                ) : (
                  <>
                    <IconClipboardList className="w-3.5 h-3.5" />
                    <span>Copiar URL VIP Segura</span>
                  </>
                )}
              </button>
            </div>

            <p className="text-xs text-base-content/70 leading-relaxed">
              Cualquier usuario que abra la aplicación con esta clave en la URL podrá navegar normalmente aunque el proyecto esté en mantenimiento.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
              <div className="sm:col-span-8">
                <label className="text-[11px] font-bold uppercase text-base-content/70 block mb-1">
                  Clave VIP Personalizada:
                </label>
                <input
                  type="text"
                  value={vipKeyInput}
                  onChange={(e) => setVipKeyInput(e.target.value)}
                  placeholder="Ej. SECURE_VIP_PASS_2026"
                  className="input input-sm input-bordered w-full rounded-xl font-mono text-xs font-bold"
                />
              </div>

              <div className="sm:col-span-4 flex items-end">
                <button
                  onClick={handleSaveTextChanges}
                  className="btn btn-sm btn-primary text-primary-content w-full font-bold rounded-xl text-xs shadow-xs"
                >
                  Guardar Clave
                </button>
              </div>
            </div>
          </div>

          {/* MANTENIMIENTO POR MÓDULOS ESPECÍFICOS */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase text-base-content/60 tracking-wider flex items-center gap-2">
              <IconWrench className="w-4 h-4 text-base-content/70" />
              <span>Inhabilitar Módulos Individuales</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {moduleItems.map((item) => {
                const IconComp = item.icon;
                const isModuleDisabled = config.modules[item.key];
                return (
                  <div
                    key={item.key}
                    className={`p-3.5 rounded-xl border transition-all flex items-center justify-between ${
                      isModuleDisabled
                        ? 'bg-warning/10 border-warning/30 text-warning-content'
                        : 'bg-base-100 border-base-200 text-base-content'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <IconComp className="w-4 h-4 text-primary" />
                      <span className="text-xs font-bold">{item.label}</span>
                    </div>

                    <input
                      type="checkbox"
                      className="toggle toggle-warning toggle-sm"
                      checked={isModuleDisabled}
                      onChange={(e) => toggleModuleMaintenance(item.key, e.target.checked)}
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* TIEMPO ESTIMADO Y NOTA */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold uppercase text-base-content/60 block mb-1">
                Tiempo Estimado a Mostrar:
              </label>
              <input
                type="text"
                value={estimatedInput}
                onChange={(e) => setEstimatedInput(e.target.value)}
                placeholder="Ej. 30 a 45 minutos"
                className="input input-sm input-bordered w-full rounded-xl text-xs font-medium"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold uppercase text-base-content/60 block mb-1">
                Motivo del Mantenimiento:
              </label>
              <input
                type="text"
                value={reasonInput}
                onChange={(e) => setReasonInput(e.target.value)}
                placeholder="Ej. Actualización de servidores"
                className="input input-sm input-bordered w-full rounded-xl text-xs font-medium"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={handleSaveTextChanges}
              className="btn btn-sm btn-outline rounded-xl font-bold text-xs"
            >
              Guardar Mensajes Informativos
            </button>
          </div>
        </div>

        {/* Footer del Modal */}
        <div className="p-4 px-6 bg-base-200/40 border-t border-base-200 flex justify-end">
          <button
            onClick={onClose}
            className="btn btn-sm btn-primary text-primary-content font-bold text-xs rounded-xl px-6"
          >
            Listo / Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
