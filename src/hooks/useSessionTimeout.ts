// src/hooks/useSessionTimeout.ts
import { useEffect, useRef, useCallback } from 'react';
import { useAuth, useClerk, useSession, useUser } from '@clerk/clerk-react';
import { toast } from 'react-toastify';

const INACTIVITY_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutos de inactividad máxima
const WARNING_TIMEOUT_MS = 4 * 60 * 1000;    // 4 minutos (aviso previo de 60 segundos)
const CHECK_INTERVAL_MS = 5 * 1000;          // Chequeo periódico cada 5 segundos
const RECENT_LOGIN_WINDOW_MS = 60 * 1000;    // Ventana de 60s para considerar login reciente

const STORAGE_LAST_ACTIVE_KEY = 'lab_last_active_time';
const SESSION_ACTIVE_KEY = 'lab_session_alive';

export function useSessionTimeout() {
  const { isSignedIn, isLoaded } = useAuth();
  const { session } = useSession();
  const { user } = useUser();
  const clerk = useClerk();

  const lastActivityRef = useRef<number>(Date.now());
  const warnedRef = useRef<boolean>(false);
  const checkedAbandonedRef = useRef<boolean>(false);

  // Registrar actividad del usuario (teclado, mouse, touch, scroll)
  const recordActivity = useCallback(() => {
    const now = Date.now();
    lastActivityRef.current = now;

    if (warnedRef.current) {
      warnedRef.current = false;
      toast.dismiss('session_expiring_soon');
    }

    try {
      const stored = localStorage.getItem(STORAGE_LAST_ACTIVE_KEY);
      const storedTime = stored ? parseInt(stored, 10) : 0;
      if (now - storedTime > 3000) {
        localStorage.setItem(STORAGE_LAST_ACTIVE_KEY, now.toString());
      }
    } catch {
      // Ignorar errores en storage restringido
    }
  }, []);

  // Manejador centralizado de cierre de sesión
  const handleLogout = useCallback(
    async (reason: 'inactivity' | 'abandoned') => {
      try {
        sessionStorage.removeItem(SESSION_ACTIVE_KEY);
        localStorage.removeItem(STORAGE_LAST_ACTIVE_KEY);
        warnedRef.current = false;
        toast.dismiss('session_expiring_soon');

        if (reason === 'inactivity') {
          toast.error(
            'Tu sesión ha expirado por inactividad (5 minutos). Por seguridad médica, vuelve a iniciar sesión.',
            { toastId: 'session_expired_inactivity', autoClose: 6000 }
          );
          await clerk.signOut();
        } else {
          toast.info(
            'Por seguridad médica institucional, tu sesión expiró al abandonar la página. Por favor inicia sesión nuevamente.',
            { toastId: 'session_expired_abandoned', autoClose: 5000 }
          );
          await (clerk as any).signOut({ immediate: true });
        }
      } catch (err) {
        console.warn('Error al procesar expiración de sesión:', err);
      }
    },
    [clerk]
  );

  // 1. Verificación inteligente: distinguir login reciente vs sesión de pestaña cerrada
  useEffect(() => {
    if (!isLoaded) return;

    if (!isSignedIn) {
      // Usuario no autenticado: limpiar marca de sesión
      sessionStorage.removeItem(SESSION_ACTIVE_KEY);
      checkedAbandonedRef.current = false;
      return;
    }

    // Calcular si la autenticación se realizó recientemente (en los últimos 60 segundos)
    const sessionCreatedTime = session?.createdAt ? new Date(session.createdAt).getTime() : 0;
    const userSignInTime = user?.lastSignInAt ? new Date(user.lastSignInAt).getTime() : 0;
    const mostRecentAuth = Math.max(sessionCreatedTime, userSignInTime);
    const isRecentLogin = mostRecentAuth > 0 && Date.now() - mostRecentAuth < RECENT_LOGIN_WINDOW_MS;

    // Verificar si esta ventana/pestaña ya tiene sesión activa (conservada en sessionStorage tras F5 o navegación)
    const hasActiveSession = sessionStorage.getItem(SESSION_ACTIVE_KEY) === 'true';

    if (isRecentLogin || hasActiveSession) {
      // Es un login fresco legítimo o una sesión activa en esta ventana
      sessionStorage.setItem(SESSION_ACTIVE_KEY, 'true');
      checkedAbandonedRef.current = true;
      recordActivity();
      return;
    }

    // Si ya pasaron más de 60 segundos desde la autenticación y la pestaña NO tiene sessionStorage,
    // significa que el usuario cerró el navegador/pestaña previamente (abandonó la página).
    if (!checkedAbandonedRef.current) {
      checkedAbandonedRef.current = true;
      handleLogout('abandoned');
    }
  }, [isLoaded, isSignedIn, session, user, handleLogout, recordActivity]);

  // 2. Monitoreo continuo de inactividad (5 minutos)
  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;

    const eventHandler = () => recordActivity();
    const events = ['mousedown', 'keydown', 'touchstart', 'scroll', 'click'];

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

    // Chequeo cada 5 segundos
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
            '⚠️ Tu sesión expirará por inactividad en 1 minuto. Interactúa con el sistema para mantenerla activa.',
            { toastId: 'session_expiring_soon', autoClose: 10000 }
          );
        }
      }

      // Expiración cumplida
      if (elapsed >= INACTIVITY_TIMEOUT_MS) {
        handleLogout('inactivity');
      }
    }, CHECK_INTERVAL_MS);

    // Revisión inmediata al enfocar la pestaña o regresar a la ventana
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
