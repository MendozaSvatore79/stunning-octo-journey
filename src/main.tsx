import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './App.css';
import App from './App.tsx';
import { ClerkProvider } from '@clerk/clerk-react';
import { BrowserRouter } from 'react-router-dom';
import { esES } from '@clerk/localizations';
import { initSentry, Sentry } from './lib/sentry';

// Inicializar Sentry (solo si existe VITE_SENTRY_DSN)
initSentry();

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
if (!PUBLISHABLE_KEY) {
  throw new Error('Missing Publishable key');
}

function ClinicalErrorFallback({ error, resetError }: { error?: any; resetError?: () => void }) {
  return (
    <div className="min-h-screen bg-base-200 flex items-center justify-center p-4 font-sans">
      <div className="card bg-base-100 shadow-2xl max-w-md w-full border border-error/20 p-6 text-center space-y-4">
        <div className="w-16 h-16 bg-error/10 text-error rounded-2xl flex items-center justify-center mx-auto text-3xl font-black">
          ⚕️
        </div>
        <h2 className="text-xl font-bold text-base-content">
          Incidencia en el Sistema Clínico
        </h2>
        <p className="text-xs text-base-content/70 leading-relaxed">
          Ha ocurrido una excepción inesperada en la interfaz. El equipo de soporte técnico y monitoreo ha sido notificado automáticamente para su resolución inmediata.
        </p>
        {error?.message && (
          <div className="p-2.5 bg-base-200 rounded-xl text-left font-mono text-[11px] text-error break-words">
            {error.message}
          </div>
        )}
        <div className="pt-2 flex gap-2 justify-center">
          <button
            onClick={() => {
              if (resetError) resetError();
              window.location.reload();
            }}
            className="btn btn-sm btn-primary rounded-xl font-bold px-6"
          >
            Recargar Sistema
          </button>
        </div>
      </div>
    </div>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Sentry.ErrorBoundary fallback={({ error, resetError }) => <ClinicalErrorFallback error={error} resetError={resetError} />}>
      <ClerkProvider publishableKey={PUBLISHABLE_KEY} localization={esES}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </ClerkProvider>
    </Sentry.ErrorBoundary>
  </StrictMode>,
);
