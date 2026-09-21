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

        const bgClass = isUrgent
          ? 'bg-error/15 text-error-content border-error/30'
          : isWarning
          ? 'bg-warning/15 text-warning-content border-warning/30'
          : isMaint
          ? 'bg-purple-500/15 text-purple-900 dark:text-purple-200 border-purple-500/30'
          : 'bg-info/15 text-info-content border-info/30';

        const iconClass = isUrgent
          ? 'text-error'
          : isWarning
          ? 'text-warning'
          : isMaint
          ? 'text-purple-600 dark:text-purple-400'
          : 'text-info';

        return (
          <div
            key={a.id}
            className={`p-3 sm:px-4 rounded-xl border flex items-start sm:items-center justify-between gap-3 shadow-xs animate-fade-in ${bgClass}`}
          >
            <div className="flex items-start sm:items-center gap-3 min-w-0">
              <div className={`shrink-0 p-1.5 rounded-lg bg-base-100/50 ${iconClass}`}>
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
                  <span className="font-bold text-xs uppercase tracking-wider">{a.title}</span>
                  <span className="badge badge-xs font-semibold uppercase opacity-80">
                    {a.targetScope === 'GLOBAL' ? 'Aviso Global' : 'Sede Específica'}
                  </span>
                </div>
                <p className="text-xs opacity-90 leading-snug mt-0.5">{a.message}</p>
              </div>
            </div>

            <button
              onClick={() => handleDismiss(a.id)}
              className="btn btn-ghost btn-xs btn-circle shrink-0 opacity-70 hover:opacity-100"
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
