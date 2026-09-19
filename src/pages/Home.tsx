// src/pages/Home.tsx
import { SignedIn, SignedOut, SignIn } from "@clerk/clerk-react";
import { Navigate } from "react-router-dom";
import {
  IconFlask,
  IconBuilding,
  IconUsers,
  IconClipboardList,
  IconShield,
  IconCheckCircle,
} from "../components/icons";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50/50 via-base-100 to-slate-100/70 text-base-content font-sans relative overflow-x-hidden selection:bg-primary selection:text-primary-content flex flex-col justify-between">
      
      {/* Esferas de Luz Suave de Fondo Clínico */}
      <div className="absolute top-[-100px] left-[-100px] w-[600px] h-[600px] rounded-full bg-teal-500/10 blur-[140px] pointer-events-none"></div>
      <div className="absolute top-[30%] right-[-100px] w-[600px] h-[600px] rounded-full bg-cyan-500/10 blur-[150px] pointer-events-none"></div>

      <SignedOut>
        {/* Navbar Blanco Translúcido y Elegante */}
        <header className="navbar bg-base-100/85 backdrop-blur-md border-b border-base-200 px-6 sm:px-12 lg:px-16 sticky top-0 z-50 shadow-xs">
          <div className="flex-1 items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-teal-600 to-cyan-700 text-white flex items-center justify-center font-black text-2xl shadow-md shadow-teal-600/25">
              L
            </div>
            <div>
              <span className="text-2xl font-black tracking-tight text-base-content block leading-none">
                LabSystem<span className="text-primary">.</span>
              </span>
              <span className="text-[10px] uppercase font-bold text-primary tracking-widest block mt-0.5">
                Plataforma de Análisis Clínicos
              </span>
            </div>
          </div>

          <div className="flex-none">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold">
              <span className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse"></span>
              <span>Portal Diagnóstico Activo</span>
            </div>
          </div>
        </header>

        {/* Hero Principal Claro, Luminoso y Profesional */}
        <main className="relative z-10 flex-1 flex items-center">
          <div className="mx-auto max-w-7xl px-6 sm:px-12 lg:px-16 py-12 lg:py-16 w-full">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-12 items-center">
              
              {/* Columna Izquierda: Mensaje Claro e Impresionante */}
              <section className="lg:col-span-7 space-y-8 text-left">
                
                {/* Insignia Clínica de Laboratorio */}
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/25 text-primary text-xs font-bold tracking-wide uppercase shadow-2xs">
                  <IconFlask className="w-4 h-4 text-primary" /> Sistema Integral de Análisis Clínicos
                </div>

                {/* Titular Principal Limpio */}
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-base-content leading-[1.1]">
                  Gestión Inteligente de <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-600 via-cyan-700 to-emerald-600">
                    Laboratorios y Pacientes
                  </span>
                </h1>

                {/* Subtítulo Claro */}
                <p className="text-base sm:text-lg text-base-content/70 max-w-2xl leading-relaxed font-normal">
                  Plataforma médica para el registro de expedientes, control de sedes, seguimiento de órdenes de trabajo y captura de resultados analíticos.
                </p>

                {/* Tarjetas de Módulos Luminosas */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                  <div className="p-5 rounded-2xl bg-base-100 border border-base-200 shadow-md hover:shadow-xl hover:border-primary/40 transition-all group">
                    <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                      <IconBuilding className="w-6 h-6" />
                    </div>
                    <div className="font-bold text-base text-base-content">Laboratorios</div>
                    <div className="text-xs text-base-content/60 mt-0.5">Control de sedes clínicas</div>
                  </div>

                  <div className="p-5 rounded-2xl bg-base-100 border border-base-200 shadow-md hover:shadow-xl hover:border-secondary/40 transition-all group">
                    <div className="w-11 h-11 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                      <IconUsers className="w-6 h-6" />
                    </div>
                    <div className="font-bold text-base text-base-content">Pacientes</div>
                    <div className="text-xs text-base-content/60 mt-0.5">Directorio e historial</div>
                  </div>

                  <div className="p-5 rounded-2xl bg-base-100 border border-base-200 shadow-md hover:shadow-xl hover:border-accent/40 transition-all group">
                    <div className="w-11 h-11 rounded-xl bg-accent/15 text-accent-content flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                      <IconClipboardList className="w-6 h-6 text-primary" />
                    </div>
                    <div className="font-bold text-base text-base-content">Órdenes</div>
                    <div className="text-xs text-base-content/60 mt-0.5">Captura de pruebas</div>
                  </div>
                </div>
              </section>

              {/* Columna Derecha: Tarjeta Blanca Elegante de Login */}
              <section className="lg:col-span-5 w-full flex justify-center">
                <div className="w-full max-w-md card bg-base-100 border border-base-200 shadow-2xl rounded-3xl p-6 sm:p-8 hover:shadow-primary/10 transition-all duration-300 relative overflow-hidden">
                  
                  {/* Borde Superior Clínico */}
                  <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-teal-600 via-cyan-600 to-emerald-500"></div>

                  <div className="mb-6 text-center space-y-1.5">
                    <div className="mx-auto w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-3 border border-primary/20 shadow-inner">
                      <IconShield className="w-7 h-7" />
                    </div>
                    <h2 className="text-2xl font-bold text-base-content tracking-tight">
                      Acceso al Sistema
                    </h2>
                    <p className="text-xs text-base-content/60 font-medium">
                      Inicia sesión para ingresar al panel clínico
                    </p>
                  </div>

                  {/* Formulario Clerk Estilizado */}
                  <div className="flex justify-center w-full">
                    <SignIn 
                      routing="virtual" 
                      afterSignInUrl="/dashboard"
                      appearance={{
                        elements: {
                          card: "shadow-none border-none bg-transparent p-0 w-full",
                          headerTitle: "hidden",
                          headerSubtitle: "hidden",
                          socialButtonsBlockButton: "rounded-xl border border-base-200 bg-base-200/50 hover:bg-base-200 text-base-content font-semibold text-sm transition-all py-2.5",
                          formButtonPrimary: "btn btn-primary w-full text-primary-content font-bold rounded-xl shadow-lg shadow-primary/25 py-3 text-sm transition-all",
                          formFieldInput: "bg-base-100 border border-base-300 text-base-content rounded-xl focus:border-primary focus:outline-none transition-all text-sm py-2.5 px-3",
                          footerActionLink: "text-primary font-bold hover:underline",
                          identityPreviewText: "text-sm font-semibold text-base-content/80",
                          formFieldLabel: "text-xs font-semibold text-base-content/80 mb-1"
                        }
                      }}
                    />
                  </div>
                </div>
              </section>

            </div>
          </div>
        </main>

        {/* Footer Claro y Elegante */}
        <footer className="bg-base-100 border-t border-base-200 text-base-content/60 py-6 px-6 sm:px-12 lg:px-16">
          <div className="mx-auto max-w-7xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-medium">
            <div className="flex items-center gap-2">
              <span className="font-bold text-base-content">LabSystem</span>
              <span>© 2026. Plataforma de Análisis y Diagnóstico Clínico.</span>
            </div>
            <div className="text-base-content/50 flex items-center gap-1.5">
              <IconCheckCircle className="w-4 h-4 text-primary" /> Autenticación Segura con Clerk
            </div>
          </div>
        </footer>
      </SignedOut>

      <SignedIn>
        <Navigate to="/dashboard" replace />
      </SignedIn>
    </div>
  );
}