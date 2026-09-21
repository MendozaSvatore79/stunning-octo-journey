// src/components/GlobalAnnouncementBanner.tsx
import { useState, useEffect } from 'react';
import { useApi } from '../hooks/useApi';
import { useLabBranding } from '../context/LabBrandingContext';
import type { BroadcastAnnouncement } from '../types/announcement';
import { IconMegaphone, IconAlertTriangle, IconWrench, IconX } from './icons';

export default function GlobalAnnouncementBanner() {
  const api = useApi();
  const { activeBranding } = useLabBranding();
  const [announcements, setAnnouncements] = useState<BroadcastAnnouncement[]>([]);
  const [dismissedIds, setDismissedIds] = useState<string[]>(() => {
    try {
      const stored = sessionStorage.getItem('synova_dismissed_announcements');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    let isMounted = true;
    const fetchActive = async () => {
      try {
        const labParam = activeBranding?.labId ? `?laboratoryId=${activeBranding.labId}` : '';
        const res = await api.get(`/announcements/active${labParam}`);
        if (isMounted && Array.isArray(res.data)) {
          setAnnouncements(res.data);
        }
      } catch (err) {
        // Silencioso para no interrumpir el flujo operativo
      }
    };

    fetchActive();
    const interval = setInterval(fetchActive, 60000); // Actualiza cada 60s
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [api, activeBranding?.labId]);

  const handleDismiss = (id: string) => {
    const updated = [...dismissedIds, id];
    setDismissedIds(updated);
    try {
      sessionStorage.setItem('synova_dismissed_announcements', JSON.stringify(updated));
    } catch {
      // Ignorar
    }
  };

  const visibleAnnouncements = announcements.filter((a) => !dismissedIds.includes(a.id));
  if (visibleAnnouncements.length === 0) return null;

  return (
    <div className="w-full space-y-2 mb-4">
      {visibleAnnouncements.map((a) => {
        const isUrgent = a.type === 'URGENT';
        const isWarning = a.type === 'WARNING';
        const isMaint = a.type === 'MAINTENANCE';

        // Estilos de alto contraste tanto en modo claro como en modo oscuro
        const containerStyle = isUrgent
          ? 'bg-red-50 dark:bg-red-950/50 border-red-300 dark:border-red-800 text-red-950 dark:text-red-100 shadow-sm'
          : isWarning
          ? 'bg-amber-50 dark:bg-amber-950/50 border-amber-300 dark:border-amber-800 text-amber-950 dark:text-amber-100 shadow-sm'
          : isMaint
          ? 'bg-purple-50 dark:bg-purple-950/50 border-purple-300 dark:border-purple-800 text-purple-950 dark:text-purple-100 shadow-sm'
          : 'bg-sky-50 dark:bg-sky-950/50 border-sky-300 dark:border-sky-800 text-sky-950 dark:text-sky-100 shadow-sm';

        const iconBoxStyle = isUrgent
          ? 'bg-red-600 text-white'
          : isWarning
          ? 'bg-amber-500 text-white'
          : isMaint
          ? 'bg-purple-600 text-white'
          : 'bg-sky-600 text-white';

        const titleStyle = isUrgent
          ? 'text-red-950 dark:text-red-100'
          : isWarning
          ? 'text-amber-950 dark:text-amber-100'
          : isMaint
          ? 'text-purple-950 dark:text-purple-100'
          : 'text-sky-950 dark:text-sky-100';

        const messageStyle = isUrgent
          ? 'text-red-900 dark:text-red-200'
          : isWarning
          ? 'text-amber-900 dark:text-amber-200'
          : isMaint
          ? 'text-purple-900 dark:text-purple-200'
          : 'text-sky-900 dark:text-sky-200';

        const badgeStyle = isUrgent
          ? 'bg-red-200 text-red-900 dark:bg-red-900/80 dark:text-red-100'
          : isWarning
          ? 'bg-amber-200 text-amber-900 dark:bg-amber-900/80 dark:text-amber-100'
          : isMaint
          ? 'bg-purple-200 text-purple-900 dark:bg-purple-900/80 dark:text-purple-100'
          : 'bg-sky-200 text-sky-900 dark:bg-sky-900/80 dark:text-sky-100';

        const dismissBtnStyle = isUrgent
          ? 'text-red-800 hover:text-red-950 hover:bg-red-200/60 dark:text-red-300 dark:hover:text-white'
          : isWarning
          ? 'text-amber-800 hover:text-amber-950 hover:bg-amber-200/60 dark:text-amber-300 dark:hover:text-white'
          : isMaint
          ? 'text-purple-800 hover:text-purple-950 hover:bg-purple-200/60 dark:text-purple-300 dark:hover:text-white'
          : 'text-sky-800 hover:text-sky-950 hover:bg-sky-200/60 dark:text-sky-300 dark:hover:text-white';

        return (
          <div
            key={a.id}
            className={`p-3 sm:px-4 rounded-2xl border flex items-start sm:items-center justify-between gap-3 animate-fade-in ${containerStyle}`}
          >
            <div className="flex items-start sm:items-center gap-3 min-w-0">
              <div className={`shrink-0 p-2 rounded-xl shadow-xs ${iconBoxStyle}`}>
                {isMaint ? (
                  <IconWrench className="w-4 h-4" />
                ) : isUrgent || isWarning ? (
                  <IconAlertTriangle className="w-4 h-4" />
                ) : (
                  <IconMegaphone className="w-4 h-4" />
                )}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`font-black text-xs uppercase tracking-wider ${titleStyle}`}>
                    {a.title}
                  </span>
                  <span className={`badge badge-xs font-bold uppercase tracking-wide border-none px-2 py-0.5 ${badgeStyle}`}>
                    {a.targetScope === 'GLOBAL' ? 'Aviso Global' : 'Sede Específica'}
                  </span>
                </div>
                <p className={`text-xs font-medium leading-relaxed mt-0.5 ${messageStyle}`}>
                  {a.message}
                </p>
              </div>
            </div>

            <button
              onClick={() => handleDismiss(a.id)}
              className={`btn btn-ghost btn-xs btn-circle shrink-0 transition-colors ${dismissBtnStyle}`}
              title="Descartar aviso"
            >
              <IconX className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
