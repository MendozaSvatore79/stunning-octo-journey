// src/components/GlobalMaintenanceLanding.tsx
import { useState } from 'react';
import { useMaintenance } from '../context/MaintenanceContext';
import { IconShield, IconSettings, IconHeadphones } from './icons';

export default function GlobalMaintenanceLanding() {
  const { config, validateVipKey } = useMaintenance();
  const [vipInput, setVipInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [showVipInput, setShowVipInput] = useState(false);

  const handleVipSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vipInput.trim()) return;

    const isValid = validateVipKey(vipInput.trim());
    if (!isValid) {
      setErrorMsg('Clave de Acceso VIP no válida o expirada.');
    } else {
      setErrorMsg('');
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-between selection:bg-indigo-500 selection:text-white relative overflow-hidden">
      {/* Fondos Decorativos con Gradiente sutil */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none"></div>

      {/* Header Superior */}
      <header className="p-6 lg:px-12 flex items-center justify-between relative z-10 border-b border-slate-800/60 bg-slate-900/40 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-black text-xl shadow-lg shadow-blue-500/20">
            L
          </div>
          <div>
            <span className="font-black text-lg tracking-tight block leading-none">LabSystem Clinique</span>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest block mt-0.5">Plataforma Médica Analítica</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="badge bg-amber-500/20 border border-amber-500/40 text-amber-300 font-bold text-xs px-3 py-2 rounded-xl gap-2 backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
            Mantenimiento Global Programado
          </span>
        </div>
      </header>

      {/* Contenido Principal de Mantenimiento */}
      <main className="max-w-4xl mx-auto px-6 py-12 text-center relative z-10 flex-1 flex flex-col items-center justify-center space-y-8">
        <div className="w-24 h-24 rounded-3xl bg-slate-900/90 border border-slate-800 flex items-center justify-center shadow-2xl shadow-indigo-500/10 backdrop-blur-xl relative">
          <IconSettings className="w-12 h-12 text-indigo-400 animate-spin" style={{ animationDuration: '12s' }} />
          <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-black text-xs shadow-md">
            !
          </div>
        </div>

        <div className="space-y-3 max-w-2xl">
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
            Sistema en Mantenimiento de Infraestructura
          </h1>
          <p className="text-slate-400 text-sm sm:text-base leading-relaxed font-medium">
            {config.reason || 'Estamos realizando mejoras en nuestros servidores de datos clínicos para brindarte mayor velocidad y máxima seguridad.'}
          </p>
        </div>

        {/* Ficha Informativa de Estado */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-lg text-left">
          <div className="bg-slate-900/70 border border-slate-800/80 p-5 rounded-2xl backdrop-blur-md space-y-1">
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">Tiempo Estimado</span>
            <span className="text-lg font-black text-indigo-300 block">{config.estimatedTime || '30 a 45 minutos'}</span>
          </div>

          <div className="bg-slate-900/70 border border-slate-800/80 p-5 rounded-2xl backdrop-blur-md space-y-1">
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">Estado del Servicio</span>
            <span className="text-lg font-black text-emerald-400 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
              Resguardo de Datos Activo
            </span>
          </div>
        </div>

        {/* Acceso VIP por Clave Segura */}
        <div className="w-full max-w-md bg-slate-900/90 border border-indigo-500/30 p-6 rounded-3xl backdrop-blur-xl shadow-2xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-indigo-300 font-extrabold text-xs uppercase tracking-wider">
              <IconShield className="w-4 h-4 text-indigo-400" />
              ¿Tienes Acceso VIP o Eres Administrador?
            </div>
            <button
              onClick={() => setShowVipInput(!showVipInput)}
              className="text-xs font-bold text-indigo-400 hover:text-indigo-300 underline"
            >
              {showVipInput ? 'Ocultar' : 'Ingresar Clave VIP'}
            </button>
          </div>

          {showVipInput && (
            <form onSubmit={handleVipSubmit} className="space-y-3 animate-fade-in">
              <div className="relative">
                <input
                  type="password"
                  placeholder="Introduce la Clave VIP Segura..."
                  value={vipInput}
                  onChange={(e) => setVipInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 focus:border-indigo-500 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none transition-all placeholder:text-slate-600 font-mono"
                />
              </div>

              {errorMsg && <p className="text-xs text-rose-400 font-bold text-left">{errorMsg}</p>}

              <button
                type="submit"
                className="w-full btn bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-2xl border-none shadow-lg shadow-indigo-600/30 text-xs py-3"
              >
                🔓 Desbloquear Acceso VIP Seguro
              </button>
            </form>
          )}
        </div>
      </main>

      {/* Footer Inferior */}
      <footer className="p-6 border-t border-slate-800/60 bg-slate-900/30 text-center text-xs text-slate-500 font-medium relative z-10 flex flex-col sm:flex-row items-center justify-between max-w-7xl mx-auto w-full gap-4">
        <span>© {new Date().getFullYear()} LabSystem Clinique. Todos los derechos reservados.</span>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1 text-slate-400 hover:text-white transition-colors cursor-pointer">
            <IconHeadphones className="w-4 h-4 text-indigo-400" />
            Soporte de Emergencia
          </span>
        </div>
      </footer>
    </div>
  );
}
