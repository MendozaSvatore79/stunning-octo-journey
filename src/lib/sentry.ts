import * as Sentry from '@sentry/react';

export function initSentry() {
  const dsn = import.meta.env.SENTRY_DSN;

  if (!dsn) {
    // Sentry no configurado aún en este entorno (modo silencioso)
    return;
  }

  Sentry.init({
    dsn,
    environment: import.meta.env.MODE || 'production',
    integrations: [
      Sentry.browserTracingIntegration(),
    ],
    // Tracing de rendimiento clínico
    tracesSampleRate: 0.2,

    // Sanitización y Protección de Privacidad Clínica
    beforeSend(event) {
      // 1. Eliminar cookies y headers de autorización
      if (event.request?.headers) {
        delete event.request.headers['Authorization'];
        delete event.request.headers['Cookie'];
      }

      // 2. Anonimizar o filtrar datos sensibles en migas de pan (breadcrumbs)
      if (event.breadcrumbs) {
        event.breadcrumbs = event.breadcrumbs.map((crumb) => {
          if (crumb.data && typeof crumb.data === 'object') {
            const sanitizedData = { ...crumb.data };
            ['patient', 'results', 'password', 'token', 'phone', 'address'].forEach((key) => {
              if (key in sanitizedData) {
                sanitizedData[key] = '[REDACTED]';
              }
            });
            crumb.data = sanitizedData;
          }
          return crumb;
        });
      }

      return event;
    },
  });

  console.log('🛡️ Sentry inicializado en el Portal Clínico con protección de datos de salud');
}

export { Sentry };
