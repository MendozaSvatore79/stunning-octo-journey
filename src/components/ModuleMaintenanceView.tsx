// src/components/ModuleMaintenanceView.tsx
import { useMaintenance } from '../context/MaintenanceContext';
import { IconSettings } from './icons';

interface ModuleMaintenanceViewProps {
  moduleTitle: string;
  moduleKeyName: string;
}

export default function ModuleMaintenanceView({ moduleTitle }: ModuleMaintenanceViewProps) {
  const { config } = useMaintenance();

  return (
    <div className="min-h-[480px] bg-slate-900 rounded-3xl border border-slate-800 p-8 sm:p-12 text-white shadow-2xl flex flex-col items-center justify-center text-center space-y-6 animate-fade-in relative overflow-hidden">
      <div className="w-20 h-20 rounded-3xl bg-indigo-950/80 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-xl shadow-indigo-500/10">
        <IconSettings className="w-10 h-10 animate-spin" style={{ animationDuration: '10s' }} />
      </div>

      <div className="space-y-2 max-w-lg">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-bold uppercase tracking-wider mb-2">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
          Módulo en Mantenimiento Programado
        </div>

        <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
          {moduleTitle} en Optimización Operativa
        </h2>

        <p className="text-slate-400 text-xs sm:text-sm font-medium leading-relaxed">
          Este módulo específico se encuentra en actualización de datos. Las funciones se reanudarán a la brevedad sin afectar tus datos guardados.
        </p>
      </div>

      <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-2xl max-w-md w-full space-y-2 text-left">
        <div className="flex items-center justify-between text-xs font-bold">
          <span className="text-slate-400">Tiempo Estimado de Retorno:</span>
          <span className="text-indigo-300 font-mono">{config.estimatedTime || '20 a 30 minutos'}</span>
        </div>
        <div className="flex items-center justify-between text-xs font-bold">
          <span className="text-slate-400">Estado de Seguridad:</span>
          <span className="text-emerald-400 font-mono">✔ Datos Resguardados</span>
        </div>
      </div>
    </div>
  );
}
