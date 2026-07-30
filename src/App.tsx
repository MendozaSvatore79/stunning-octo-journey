// src/App.tsx
import './App.css';
import { useState, useEffect, useRef } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { SignedIn, SignedOut, useClerk, useAuth } from '@clerk/clerk-react';
import Home from './pages/Home.tsx';
import Dashboard from './pages/Dashboard.tsx';
import PublicReportView from './components/PublicReportView.tsx';
import { UserProvider } from './context/UserContext.tsx';

function AppContent() {
  const clerk = useClerk();
  const { isSignedIn, isLoaded } = useAuth();
  
  // Inicializar estado persistente para mantener el overlay activo incluso durante recargas o redirecciones
  const [isSigningOut, setIsSigningOut] = useState(() => {
    return sessionStorage.getItem('lab_signing_out') === 'true';
  });

  const wasSignedInRef = useRef(false);

  // Auto-cerrar el overlay de salida tras 2.5 segundos con desvanecimiento
  useEffect(() => {
    if (isSigningOut) {
      const timer = setTimeout(() => {
        setIsSigningOut(false);
        sessionStorage.removeItem('lab_signing_out');
        wasSignedInRef.current = false;
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [isSigningOut]);

  // Interceptar clerk.signOut a nivel global con retraso de 2.5 segundos
  useEffect(() => {
    if (!clerk) return;
    const originalSignOut = clerk.signOut.bind(clerk);

    clerk.signOut = async (options?: any) => {
      sessionStorage.setItem('lab_signing_out', 'true');
      setIsSigningOut(true);
      
      // Retraso intencional de 2.5 segundos para mostrar la pantalla de carga médica completa
      await new Promise((resolve) => setTimeout(resolve, 2500));
      return originalSignOut(options);
    };

    return () => {
      clerk.signOut = originalSignOut;
    };
  }, [clerk]);

  // Detección secundaria: si el estado de autenticación cambia de activo a inactivo
  useEffect(() => {
    if (isLoaded) {
      if (isSignedIn) {
        wasSignedInRef.current = true;
      } else if (wasSignedInRef.current && !isSigningOut) {
        sessionStorage.setItem('lab_signing_out', 'true');
        setIsSigningOut(true);
      }
    }
  }, [isSignedIn, isLoaded, isSigningOut]);

  return (
    <>
      {/* Pantalla de Carga Global al Cerrar Sesión (Overlay z-[99999]) */}
      {isSigningOut && (
        <div className="fixed inset-0 z-[99999] bg-slate-950/95 backdrop-blur-2xl flex flex-col items-center justify-center text-white animate-fade-in transition-all duration-700">
          
          {/* Logo Médico con Resplandor Azul */}
          <div className="relative mb-6">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-black text-4xl shadow-2xl shadow-blue-500/60 animate-pulse">
              L
            </div>
            <div className="absolute inset-0 rounded-3xl bg-blue-500/30 blur-xl animate-ping"></div>
          </div>

          <span className="loading loading-spinner loading-lg text-blue-400 mb-5"></span>
          
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-white text-center drop-shadow-md">
            Cerrando sistema clínico...
          </h2>
          
          <p className="text-base sm:text-lg text-slate-300 font-semibold mt-2 text-center max-w-md px-4">
            ¡Hasta luego! Finalizando tu sesión médica de forma segura.
          </p>

          <div className="mt-6 flex items-center gap-2 text-xs text-slate-400 font-medium bg-white/5 px-4 py-2 rounded-full border border-white/10">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
            Guardando estado del sistema
          </div>
        </div>
      )}

      <Routes>
        <Route path="/" element={<Home />} />
        {/* Rutas Públicas de Consulta de PDF Sin Necesidad de Iniciar Sesión */}
        <Route path="/results/:orderId" element={<PublicReportView />} />
        <Route path="/results" element={<PublicReportView />} />
        <Route path="/verify" element={<PublicReportView />} />

        <Route
          path="/dashboard"
          element={
            <>
              <SignedIn>
                <Dashboard />
              </SignedIn>
              <SignedOut>
                <Navigate to="/" replace />
              </SignedOut>
            </>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <UserProvider>
      <AppContent />
    </UserProvider>
  );
}
