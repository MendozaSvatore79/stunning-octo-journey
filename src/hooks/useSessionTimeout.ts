// src/hooks/useSessionTimeout.ts
import { useEffect, useRef, useCallback } from 'react';
import { useAuth, useClerk } from '@clerk/clerk-react';
import { toast } from 'react-toastify';

const INACTIVITY_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutos de inactividad máxima
const WARNING_TIMEOUT_MS = 4 * 60 * 1000;    // 4 minutos (aviso previo de 60 segundos)
const CHECK_INTERVAL_MS = 5 * 1000;          // Chequeo periódico cada 5 segundos

const STORAGE_LAST_ACTIVE_KEY = 'lab_last_active_time';
const SESSION_ACTIVE_KEY = 'lab_session_alive';

export function useSessionTimeout() {
  const { isSignedIn, isLoaded } = useAuth();
  const clerk = useClerk();

  const lastActivityRef = useRef<number>(Date.now());
  const warnedRef = useRef<boolean>(false);
  const initialCheckDoneRef = useRef<boolean>(false);
  const wasSignedOutOnLoadRef = useRef<boolean>(false);

  // Registrar actividad del usuario (teclado, mouse, touch, scroll)
  const recordActivity = useCallback(() => {
    const now = Date.now();
    lastActivityRef.current = now;

    if (warnedRef.current) {
      warnedRef.current = false;
      toast.dismiss('session_expiring_soon');
    }

    // Actualizar localStorage con throttle (máximo 1 vez cada 3 segundos)
    try {
      const stored = localStorage.getItem(STORAGE_LAST_ACTIVE_KEY);
      const storedTime = stored ? parseInt(stored, 10) : 0;
      if (now - storedTime > 3000) {
        localStorage.setItem(STORAGE_LAST_ACTIVE_KEY, now.toString());
      }
    } catch {
      // Ignorar restricciones en entornos con storage bloqueado
    }
  }, []);

  // Manejador centralizado de cierre de sesión por política de seguridad
  const handleLogout = useCallback(
    async (reason: 'inactivity' | 'abandoned') => {
      try {
        sessionStorage.removeItem(SESSION_ACTIVE_KEY);
        localStorage.removeItem(STORAGE_LAST_ACTIVE_KEY);
        warnedRef.current = false;
        toast.dismiss('session_expiring_soon');

        if (reason === 'inactivity') {
          toast.error(
            'Tu sesión ha expirado por inactividad (5 minutos). Por seguridad médica institucional, ingresa tus credenciales de nuevo.',
            { toastId: 'session_expired_inactivity', autoClose: 6000 }
          );
          await clerk.signOut();
        } else {
          toast.info(
            'Por seguridad médica institucional, tu sesión expiró al abandonar o cerrar la página. Por favor inicia sesión nuevamente.',
            { toastId: 'session_expired_abandoned', autoClose: 5000 }
          );
          await (clerk as any).signOut({ immediate: true });
        }
      } catch (err) {
        console.warn('Error en cierre de sesión por política de expiración:', err);
      }
    },
    [clerk]
  );

  // 1. Verificación de abandono de página al cargar la aplicación
  useEffect(() => {
    if (!isLoaded) return;

    if (!initialCheckDoneRef.current) {
      initialCheckDoneRef.current = true;

      // Si en el primer render el usuario NO estaba autenticado, recordamos que vino deslogueado
      if (!isSignedIn) {
        wasSignedOutOnLoadRef.current = true;
        sessionStorage.removeItem(SESSION_ACTIVE_KEY);
        return;
      }

      // Si el usuario ya venía firmado en Clerk desde cookies persistentes:
      // Verificamos si esta pestaña/ventana tiene la sesión viva (preservada en sessionStorage por F5 o navegación)
      const hasActiveSession = sessionStorage.getItem(SESSION_ACTIVE_KEY) === 'true';

      if (!hasActiveSession) {
        // La pestaña/navegador fue cerrada anteriormente (página abandonada). Forzar expiración y pedir login.
        handleLogout('abandoned');
        return;
      }
    }

    if (isSignedIn) {
      // Usuario autenticado (sea por login manual o sesión continua)
      sessionStorage.setItem(SESSION_ACTIVE_KEY, 'true');
      recordActivity();
    } else {
      wasSignedOutOnLoadRef.current = true;
      sessionStorage.removeItem(SESSION_ACTIVE_KEY);
    }
  }, [isSignedIn, isLoaded, handleLogout, recordActivity]);

  // 2. Monitoreo continuo de inactividad (5 minutos)
  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;

    // Escuchar interacción del usuario
    const eventHandler = () => recordActivity();
    const events = ['mousedown', 'keydown', 'touchstart', 'scroll', 'click'];

    // Throttle especial para mousemove para no degradar el rendimiento
    let mouseMoveThrottle = 0;
    const throttledMouseMove = () => {
      const now = Date.now();
      if (now - mouseMoveThrottle > 2000) {
        mouseMoveThrottle = now;
        recordActivity();
      }
    };

    events.forEach((evt) => {
      window.addEventListener(evt, eventHandler, { passive: true });
    });
    window.addEventListener('mousemove', throttledMouseMove, { passive: true });

    // Chequeo periódico cada 5 segundos
    const interval = setInterval(() => {
      const now = Date.now();
      let lastActive = lastActivityRef.current;

      try {
        const stored = localStorage.getItem(STORAGE_LAST_ACTIVE_KEY);
        if (stored) {
          const storedTime = parseInt(stored, 10);
          if (storedTime > lastActive) {
            lastActive = storedTime;
            lastActivityRef.current = storedTime;
          }
        }
      } catch {
        // Ignorar
      }

      const elapsed = now - lastActive;

      // Advertencia 1 minuto antes de expirar
      if (elapsed >= WARNING_TIMEOUT_MS && elapsed < INACTIVITY_TIMEOUT_MS) {
        if (!warnedRef.current) {
          warnedRef.current = true;
          toast.warning(
            '⚠️ Tu sesión expirará por inactividad en 1 minuto. Mueve el cursor o interactúa con el sistema para mantenerla activa.',
            { toastId: 'session_expiring_soon', autoClose: 10000 }
          );
        }
      }

      // Expiración tras 5 minutos de inactividad
      if (elapsed >= INACTIVITY_TIMEOUT_MS) {
        handleLogout('inactivity');
      }
    }, CHECK_INTERVAL_MS);

    // Detección al volver a enfocar la ventana o cambiar de pestaña
    const handleVisibilityOrFocus = () => {
      if (document.visibilityState === 'visible') {
        const now = Date.now();
        let lastActive = lastActivityRef.current;
        try {
          const stored = localStorage.getItem(STORAGE_LAST_ACTIVE_KEY);
          if (stored) {
            const storedTime = parseInt(stored, 10);
            if (storedTime > lastActive) {
              lastActive = storedTime;
            }
          }
        } catch {}

        const elapsed = now - lastActive;
        if (elapsed >= INACTIVITY_TIMEOUT_MS) {
          handleLogout('inactivity');
        } else {
          recordActivity();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityOrFocus);
    window.addEventListener('focus', handleVisibilityOrFocus);

    return () => {
      events.forEach((evt) => {
        window.removeEventListener(evt, eventHandler);
      });
      window.removeEventListener('mousemove', throttledMouseMove);
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
      window.removeEventListener('focus', handleVisibilityOrFocus);
    };
  }, [isLoaded, isSignedIn, handleLogout, recordActivity]);
}
