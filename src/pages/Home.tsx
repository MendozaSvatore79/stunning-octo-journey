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
    <div className="min-h-screen bg-gradient-to-br from-blue-50/80 via-white to-slate-100 text-slate-800 font-sans relative overflow-x-hidden selection:bg-blue-600 selection:text-white flex flex-col justify-between">
      
      {/* Esferas de Luz Suave de Fondo */}
      <div className="absolute top-[-100px] left-[-100px] w-[600px] h-[600px] rounded-full bg-blue-400/10 blur-[130px] pointer-events-none"></div>
      <div className="absolute top-[30%] right-[-100px] w-[600px] h-[600px] rounded-full bg-indigo-400/10 blur-[140px] pointer-events-none"></div>

      <SignedOut>
        {/* Navbar Blanco Translúcido y Elegante */}
        <header className="navbar bg-white/80 backdrop-blur-md border-b border-slate-200/80 px-6 sm:px-12 lg:px-16 sticky top-0 z-50 shadow-xs">
          <div className="flex-1 items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-black text-2xl shadow-md shadow-blue-600/25">
              L
            </div>
            <div>
              <span className="text-2xl font-black tracking-tight text-slate-900 block leading-none">
                LabSystem<span className="text-blue-600">.</span>
              </span>
              <span className="text-[10px] uppercase font-bold text-blue-600 tracking-widest block mt-0.5">
                Plataforma Médica & Diagnóstica
              </span>
            </div>
          </div>

          <div className="flex-none">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse"></span>
              <span>Portal Clínico En Línea</span>
            </div>
          </div>
        </header>

        {/* Hero Principal Claro, Luminoso y Profesional */}
        <main className="relative z-10 flex-1 flex items-center">
          <div className="mx-auto max-w-7xl px-6 sm:px-12 lg:px-16 py-12 lg:py-16 w-full">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-12 items-center">
              
              {/* Columna Izquierda: Mensaje Claro e Impresionante */}
              <section className="lg:col-span-7 space-y-8 text-left">
                
                {/* Insignia Azul Médica */}
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-100/80 border border-blue-200 text-blue-800 text-xs font-bold tracking-wide uppercase shadow-2xs">
                  <IconFlask className="w-4 h-4 text-blue-600" /> Sistema Integral de Análisis Clínicos
                </div>

                {/* Titular Principal Limpio */}
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-slate-900 leading-[1.1]">
                  Gestión Inteligente de <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-teal-600">
                    Laboratorios y Pacientes
                  </span>
                </h1>

                {/* Subtítulo Claro */}
                <p className="text-base sm:text-lg text-slate-600 max-w-2xl leading-relaxed font-normal">
                  Plataforma médica para el registro de expedientes, control de sedes, seguimiento de órdenes de trabajo y captura de resultados analíticos.
                </p>

                {/* Tarjetas de Módulos Luminosas */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                  <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-md hover:shadow-xl hover:border-blue-300 transition-all group">
                    <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                      <IconBuilding className="w-6 h-6" />
                    </div>
                    <div className="font-bold text-base text-slate-900">Laboratorios</div>
                    <div className="text-xs text-slate-500 mt-0.5">Control de sedes clínicas</div>
                  </div>

                  <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-md hover:shadow-xl hover:border-indigo-300 transition-all group">
                    <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                      <IconUsers className="w-6 h-6" />
                    </div>
                    <div className="font-bold text-base text-slate-900">Pacientes</div>
                    <div className="text-xs text-slate-500 mt-0.5">Directorio e historial</div>
                  </div>

                  <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-md hover:shadow-xl hover:border-teal-300 transition-all group">
                    <div className="w-11 h-11 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                      <IconClipboardList className="w-6 h-6" />
                    </div>
                    <div className="font-bold text-base text-slate-900">Órdenes</div>
                    <div className="text-xs text-slate-500 mt-0.5">Captura de pruebas</div>
                  </div>
                </div>
              </section>

              {/* Columna Derecha: Tarjeta Blanca Elegante de Login */}
              <section className="lg:col-span-5 w-full flex justify-center">
                <div className="w-full max-w-md card bg-white border border-slate-200 shadow-2xl rounded-3xl p-6 sm:p-8 hover:shadow-blue-500/10 transition-all duration-300 relative overflow-hidden">
                  
                  {/* Borde Superior Azul */}
                  <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-teal-500"></div>

                  <div className="mb-6 text-center space-y-1.5">
                    <div className="mx-auto w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3 border border-blue-100 shadow-inner">
                      <IconShield className="w-7 h-7" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                      Acceso al Sistema
                    </h2>
                    <p className="text-xs text-slate-500 font-medium">
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
                          socialButtonsBlockButton: "rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800 font-semibold text-sm transition-all py-2.5",
                          formButtonPrimary: "btn btn-primary bg-blue-600 hover:bg-blue-700 border-none w-full text-white font-bold rounded-xl shadow-lg shadow-blue-600/25 py-3 text-sm transition-all",
                          formFieldInput: "bg-white border border-slate-300 text-slate-900 rounded-xl focus:border-blue-600 focus:outline-none transition-all text-sm py-2.5 px-3",
                          footerActionLink: "text-blue-600 font-bold hover:underline",
                          identityPreviewText: "text-sm font-semibold text-slate-700",
                          formFieldLabel: "text-xs font-semibold text-slate-700 mb-1"
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
        <footer className="bg-white border-t border-slate-200/80 text-slate-500 py-6 px-6 sm:px-12 lg:px-16">
          <div className="mx-auto max-w-7xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-medium">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900">LabSystem</span>
              <span>© 2026. Plataforma de Diagnóstico Clínico.</span>
            </div>
            <div className="text-slate-400 flex items-center gap-1.5">
              <IconCheckCircle className="w-4 h-4 text-blue-600" /> Autenticación Segura con Clerk
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