// src/pages/Home.tsx
import { SignedIn, SignedOut, SignIn } from "@clerk/clerk-react";
import { Navigate } from "react-router-dom";
import { useLabBranding } from "../context/LabBrandingContext";
import { IconFlask } from "../components/icons";

export default function Home() {
  const { activeBranding } = useLabBranding();

  // Nombre de identidad institucional estilizado y profesional
  const brandName =
    activeBranding?.name &&
    activeBranding.name !== 'LAB-CENTROL OS' &&
    activeBranding.name !== 'LabSystem'
      ? activeBranding.name
      : 'Synova Lab';

  return (
    <div className="min-h-screen font-sans bg-base-100 text-base-content selection:bg-primary selection:text-primary-content">
      <SignedOut>
        <div className="min-h-screen flex flex-col lg:flex-row">
          
          {/* Panel Izquierdo: Identidad Institucional Sobria (Estilo LIS Clínico Hospitalario) */}
          <div className="hidden lg:flex lg:w-1/2 flex-col justify-between bg-gradient-to-b from-slate-900 via-slate-900 to-teal-950 text-slate-100 p-12 xl:p-16 relative overflow-hidden border-r border-slate-800">
            {/* Sutil halo ambiental en esquina */}
            <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-teal-500/10 blur-3xl pointer-events-none"></div>

            {/* Encabezado Institucional con Emblema de Laboratorio */}
            <div className="relative z-10 flex items-center gap-4">
              {activeBranding?.logo ? (
                <img
                  src={activeBranding.logo}
                  alt={brandName}
                  className="w-12 h-12 rounded-2xl object-contain bg-white p-1.5 shadow-md border border-slate-700 shrink-0"
                />
              ) : (
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-teal-500 via-teal-600 to-cyan-500 text-white flex items-center justify-center shadow-lg shadow-teal-500/20 ring-2 ring-teal-400/20 shrink-0">
                  <IconFlask className="w-6 h-6 text-white drop-shadow-sm" />
                </div>
              )}
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-black tracking-tight text-white block leading-none">
                    {brandName}
                  </span>
                  <span className="badge badge-sm badge-outline text-teal-300 border-teal-500/40 text-[10px] font-bold tracking-wider uppercase py-2">
                    LIS Pro
                  </span>
                </div>
                <span className="text-xs text-teal-400/90 font-medium tracking-wide block mt-1">
                  Sistema de Diagnóstico Clínico & Gestión Hospitalaria
                </span>
              </div>
            </div>

            {/* Mensaje Central Sobrio y Realista */}
            <div className="relative z-10 max-w-lg space-y-5 my-auto py-12">
              <div className="w-10 h-0.5 bg-teal-500"></div>
              <h1 className="text-2xl xl:text-3xl font-semibold leading-snug text-slate-100 tracking-tight">
                Control analítico de muestras, validación técnica y emisión segura de resultados.
              </h1>
              <p className="text-sm text-slate-400 leading-relaxed">
                Plataforma de operación clínica para químicos analistas y personal médico. Trazabilidad de órdenes y entrega digital directa a pacientes.
              </p>
            </div>

            {/* Pie Institucional */}
            <div className="relative z-10 flex items-center justify-between text-xs text-slate-500 border-t border-slate-800/80 pt-6">
              <span>{brandName} • Edición Médica</span>
              <span>Acceso seguro para personal autorizado</span>
            </div>
          </div>

          {/* Panel Derecho: Acceso Limpio de Clerk */}
          <div className="w-full lg:w-1/2 flex flex-col justify-between p-6 sm:p-10 lg:p-14 bg-base-100 min-h-screen">
            
            {/* Cabecera Móvil (solo visible en pantallas pequeñas) */}
            <div className="lg:hidden flex items-center justify-between pb-6 border-b border-base-200">
              <div className="flex items-center gap-3">
                {activeBranding?.logo ? (
                  <img
                    src={activeBranding.logo}
                    alt={brandName}
                    className="w-10 h-10 rounded-xl object-contain bg-white border border-base-300 p-1 shrink-0"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-600 to-cyan-600 text-white flex items-center justify-center shadow-sm shrink-0">
                    <IconFlask className="w-5 h-5 text-white" />
                  </div>
                )}
                <div>
                  <span className="font-black text-lg text-base-content block leading-tight">
                    {brandName}
                  </span>
                  <span className="text-[10px] text-primary font-bold uppercase tracking-wider block">
                    Diagnóstico Clínico LIS
                  </span>
                </div>
              </div>
              <a
                href="mailto:soporte@synovalab.com"
                className="text-xs font-semibold text-base-content/60 hover:text-primary"
              >
                Soporte
              </a>
            </div>

            {/* Enlace de soporte superior en Desktop */}
            <div className="hidden lg:flex justify-end">
              <a
                href="mailto:soporte@synovalab.com"
                className="text-xs font-medium text-base-content/60 hover:text-primary transition-colors"
              >
                ¿Necesitas ayuda? Contactar a Soporte
              </a>
            </div>

            {/* Contenedor Centrado del Formulario de Clerk */}
            <div className="w-full max-w-md mx-auto my-auto py-8">
              <div className="mb-6 space-y-1 text-center lg:text-left">
                <h2 className="text-2xl font-bold tracking-tight text-base-content">
                  Iniciar Sesión
                </h2>
                <p className="text-xs text-base-content/60">
                  Ingresa tus credenciales para acceder a la plataforma
                </p>
              </div>

              <div className="w-full">
                <SignIn
                  routing="virtual"
                  afterSignInUrl="/dashboard"
                  appearance={{
                    elements: {
                      card: "shadow-none border border-base-200 bg-base-100 rounded-2xl p-6 sm:p-7 w-full",
                      headerTitle: "hidden",
                      headerSubtitle: "hidden",
                      socialButtonsBlockButton:
                        "rounded-xl border border-base-300 bg-base-100 hover:bg-base-200/60 text-base-content font-medium text-sm transition-all py-2.5",
                      formButtonPrimary:
                        "btn btn-primary w-full text-primary-content font-semibold rounded-xl py-3 text-sm transition-all shadow-sm",
                      formFieldInput:
                        "bg-base-100 border border-base-300 text-base-content rounded-xl focus:border-primary focus:outline-none transition-all text-sm py-2.5 px-3",
                      footerActionLink: "text-primary font-semibold hover:underline",
                      identityPreviewText: "text-sm font-medium text-base-content/80",
                      formFieldLabel: "text-xs font-medium text-base-content/80 mb-1",
                    },
                  }}
                />
              </div>
            </div>

            {/* Pie de Página */}
            <div className="pt-6 border-t border-base-200/80 flex flex-col sm:flex-row items-center justify-between text-xs text-base-content/50 gap-2">
              <span>© 2026 {brandName}. Todos los derechos reservados.</span>
              <span className="text-[11px] text-base-content/40">Plataforma Médica Segura</span>
            </div>

          </div>

        </div>
      </SignedOut>

      <SignedIn>
        <Navigate to="/dashboard" replace />
      </SignedIn>
    </div>
  );
}