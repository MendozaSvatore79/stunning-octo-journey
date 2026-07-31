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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xl max-w-2xl w-full overflow-hidden my-8">
        {/* Header del Modal */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-900 to-blue-900 p-6 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white shadow-lg">
              <IconSettings className="w-6 h-6 text-indigo-300 animate-spin" style={{ animationDuration: '15s' }} />
            </div>
            <div>
              <h2 className="text-xl font-black tracking-tight">Gestor de Modo Mantenimiento</h2>
              <p className="text-xs text-indigo-100/80 font-medium">Panel de Control Exclusivo para Administradores</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="btn btn-sm btn-circle btn-ghost text-white hover:bg-white/20"
          >
            ✕
          </button>
        </div>

        {/* Cuerpo del Modal */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* MANTENIMIENTO GLOBAL CONTROL SWITCH & BOTÓN PREVISUALIZAR */}
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-black text-slate-900 text-sm">🚨 Mantenimiento Global (Todo el Sistema)</span>
                  {config.globalMaintenance && (
                    <span className="badge badge-error text-[10px] font-bold text-white uppercase px-2 py-0.5 animate-pulse">ACTIVO</span>
                  )}
                </div>
                <p className="text-xs text-slate-500">
                  Bloquea el acceso público a todo el sistema. Solo los Administradores o personas con la Clave VIP podrán acceder.
                </p>
              </div>

              <input
                type="checkbox"
                className="toggle toggle-error toggle-lg"
                checked={config.globalMaintenance}
                onChange={(e) => toggleGlobalMaintenance(e.target.checked)}
              />
            </div>

            <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between gap-2">
              <span className="text-xs text-slate-600 font-medium">
                ¿Quieres probar cómo la ven los usuarios públicos?
              </span>
              <button
                onClick={handlePreviewMaintenanceLanding}
                className="btn btn-xs bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl gap-1"
              >
                👁️ Ver Página de Mantenimiento
              </button>
            </div>
          </div>

          {/* CLAVE VIP Y ENLACE SEGURO */}
          <div className="p-5 rounded-2xl bg-indigo-50/70 border border-indigo-200/80 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-indigo-950 font-black text-sm">
                <IconShield className="w-5 h-5 text-indigo-600" />
                Acceso VIP Seguro (Bypass de Mantenimiento)
              </div>

              <button
                onClick={handleCopyVipLink}
                className="btn btn-xs bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl gap-1 border-none shadow-xs"
              >
                {copiedLink ? '✓ ¡URL VIP Copiada!' : '📋 Copiar URL VIP Segura'}
              </button>
            </div>

            <p className="text-xs text-indigo-900/80 leading-relaxed">
              Cualquier usuario que abra la aplicación con esta clave en la URL podrá navegar normalmente aunque el proyecto esté en mantenimiento.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
              <div className="sm:col-span-8">
                <label className="text-[11px] font-extrabold uppercase text-indigo-900 block mb-1">
                  Clave VIP Personalizada:
                </label>
                <input
                  type="text"
                  value={vipKeyInput}
                  onChange={(e) => setVipKeyInput(e.target.value)}
                  placeholder="Ej. SECURE_VIP_PASS_2026"
                  className="input input-sm input-bordered w-full rounded-xl font-mono text-xs font-bold text-slate-800 border-indigo-200 bg-white"
                />
              </div>

              <div className="sm:col-span-4 flex items-end">
                <button
                  onClick={handleSaveTextChanges}
                  className="btn btn-sm btn-primary w-full text-white font-bold rounded-xl text-xs"
                >
                  Guardar Clave
                </button>
              </div>
            </div>
          </div>

          {/* MANTENIMIENTO POR MÓDULOS ESPECÍFICOS */}
          <div className="space-y-3">
            <h3 className="text-xs font-black uppercase text-slate-500 tracking-wider">
              🛠️ Inhabilitar Módulos Individuales
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {moduleItems.map((item) => {
                const IconComp = item.icon;
                const isModuleDisabled = config.modules[item.key];
                return (
                  <div
                    key={item.key}
                    className={`p-4 rounded-2xl border transition-all flex items-center justify-between ${
                      isModuleDisabled
                        ? 'bg-amber-50/80 border-amber-200 text-amber-950'
                        : 'bg-white border-slate-200/80 text-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <IconComp className={`w-5 h-5 ${item.color}`} />
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] font-extrabold uppercase text-slate-500 block mb-1">
                Tiempo Estimado a Mostrar:
              </label>
              <input
                type="text"
                value={estimatedInput}
                onChange={(e) => setEstimatedInput(e.target.value)}
                placeholder="Ej. 30 a 45 minutos"
                className="input input-sm input-bordered w-full rounded-xl text-xs text-slate-800 border-slate-200"
              />
            </div>

            <div>
              <label className="text-[11px] font-extrabold uppercase text-slate-500 block mb-1">
                Motivo / Aviso de Mantenimiento:
              </label>
              <input
                type="text"
                value={reasonInput}
                onChange={(e) => setReasonInput(e.target.value)}
                placeholder="Ej. Optimización de servidores de datos..."
                className="input input-sm input-bordered w-full rounded-xl text-xs text-slate-800 border-slate-200"
              />
            </div>
          </div>
        </div>

        {/* Footer del Modal */}
        <div className="p-4 px-6 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <button
            onClick={handleSaveTextChanges}
            className="btn btn-sm btn-outline btn-indigo font-bold text-xs rounded-xl"
          >
            Aplicar Textos
          </button>
          <button
            onClick={onClose}
            className="btn btn-sm bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl px-6 border-none"
          >
            Listo / Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
