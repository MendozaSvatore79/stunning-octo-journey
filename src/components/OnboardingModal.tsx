// src/components/OnboardingModal.tsx
import { useState } from 'react';
import { useApi } from '../hooks/useApi';
import type { PlanType } from '../types/subscription';
import {
  IconSparkles,
  IconFlask,
  IconBuilding,
  IconClipboardList,
  IconCheckCircle,
  IconArrowRight,
  IconArrowLeft,
  IconX,
  IconPlus,
  IconCreditCard,
  IconAlertCircle,
} from './icons';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartCreateLab: () => void;
}

export default function OnboardingModal({
  isOpen,
  onClose,
  onStartCreateLab,
}: OnboardingModalProps) {
  const api = useApi();
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedPlan, setSelectedPlan] = useState<PlanType>('BASIC');
  const [isSavingPlan, setIsSavingPlan] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [isRedirectingPolar, setIsRedirectingPolar] = useState(false);

  if (!isOpen) return null;

  const totalSteps = 5;

  const handleGoToPolarCheckout = async (planToUse = selectedPlan) => {
    try {
      setIsRedirectingPolar(true);
      setCheckoutError(null);
      const res = await api.post<{ checkoutUrl: string }>('/subscription/checkout', {
        planType: planToUse,
        clientOrigin: window.location.origin,
      });
      if (res.data?.checkoutUrl) {
        onClose();
        window.location.href = res.data.checkoutUrl;
        return true;
      }
      return false;
    } catch (err: any) {
      console.error('Error al iniciar Polar Checkout en Onboarding:', err);
      const msg = err?.response?.data?.message || err?.message || 'Error al conectar con la pasarela Polar';
      setCheckoutError(Array.isArray(msg) ? msg.join(', ') : msg);
      return false;
    } finally {
      setIsRedirectingPolar(false);
    }
  };

  const handleSkipCheckout = async () => {
    try {
      setIsSavingPlan(true);
      await api.post('/subscription/change-plan', { planType: selectedPlan });
    } catch (e) {
      console.warn('Error al guardar plan inicial:', e);
    } finally {
      setIsSavingPlan(false);
      setCurrentStep(3);
    }
  };

  const handleNext = async () => {
    if (currentStep === 2) {
      // Intentar redirigir al checkout de Polar automáticamente con los 14 días de prueba gratis
      const redirected = await handleGoToPolarCheckout(selectedPlan);
      if (redirected) return;

      // Si falló el checkout de Polar, mantenemos al usuario en este paso para que vea el error o decida omitir
      return;
    }

    if (currentStep < totalSteps) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleFinishAndCreate = () => {
    onClose();
    onStartCreateLab();
  };

  return (
    <dialog className="modal modal-open backdrop-blur-md p-2 sm:p-4 z-[9999]">
      <div className="modal-box w-full max-w-[95vw] sm:max-w-3xl border border-base-300 bg-base-100 p-4 sm:p-8 shadow-2xl rounded-3xl max-h-[92vh] overflow-y-auto">
        {/* Cabecera y botón omitir */}
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <div className="badge badge-primary badge-outline px-2.5 sm:px-3 py-2 text-[11px] sm:text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5">
            <IconSparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
            Guía de Inicio y Selección de Plan
          </div>
          <button
            onClick={onClose}
            className="btn btn-xs sm:btn-sm btn-ghost text-base-content/60 hover:text-base-content"
          >
            <span className="hidden xs:inline">Saltar</span> <IconX className="w-4 h-4" />
          </button>
        </div>

        {/* Indicador de pasos con DaisyUI Steps */}
        <div className="w-full mb-6 sm:mb-8">
          <ul className="steps steps-horizontal w-full text-[10px] sm:text-xs font-semibold">
            <li className={`step ${currentStep >= 1 ? 'step-primary' : ''}`}>Inicio</li>
            <li className={`step ${currentStep >= 2 ? 'step-primary' : ''}`}>Plan</li>
            <li className={`step ${currentStep >= 3 ? 'step-primary' : ''}`}>Sedes</li>
            <li className={`step ${currentStep >= 4 ? 'step-primary' : ''}`}>Módulos</li>
            <li className={`step ${currentStep >= 5 ? 'step-primary' : ''}`}>Listo</li>
          </ul>
        </div>

        {/* Contenido dinámico según el paso actual */}
        <div className="min-h-[260px] flex flex-col justify-center py-2">
          {currentStep === 1 && (
            <div className="text-center space-y-4 animate-fade-in">
              <div className="inline-flex p-4 bg-primary/10 text-primary rounded-2xl mb-2">
                <IconFlask className="w-12 h-12" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-base-content">
                ¡Bienvenido a LabSystem!
              </h2>
              <p className="text-base-content/70 max-w-md mx-auto leading-relaxed">
                Tu plataforma integral para administrar laboratorios clínicos, registro de pacientes, órdenes de trabajo y control de resultados analíticos.
              </p>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-4 animate-fade-in">
              <div className="text-center">
                <h2 className="text-xl sm:text-2xl font-black text-base-content">
                  Paso 1: Elige tu Plan de Suscripción
                </h2>
                <p className="text-xs text-base-content/60 mt-1 max-w-md mx-auto">
                  Precios accesibles diseñados para el mercado de laboratorios clínicos en México.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                {/* Plan Básico */}
                <div
                  onClick={() => setSelectedPlan('BASIC')}
                  className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                    selectedPlan === 'BASIC'
                      ? 'border-primary bg-primary/5 shadow-md'
                      : 'border-base-200 hover:border-base-300 bg-base-100'
                  }`}
                >
                  <div className="space-y-2">
                    <span className="badge badge-ghost text-[9px] uppercase font-bold">Más Accesible</span>
                    <h3 className="font-bold text-sm text-base-content">Esencial Clínico</h3>
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-black text-base-content">$490</span>
                      <span className="text-[10px] text-base-content/60">MXN/mes</span>
                    </div>
                    <ul className="text-[11px] space-y-1 text-base-content/70 pt-1">
                      <li>• Hasta <strong>400 órdenes / mes</strong></li>
                      <li>• Hasta <strong>3 sedes</strong></li>
                      <li>• Notificaciones ilimitadas</li>
                    </ul>
                  </div>
                  <div className="mt-3 text-right">
                    <input
                      type="radio"
                      name="onboarding-plan"
                      checked={selectedPlan === 'BASIC'}
                      onChange={() => setSelectedPlan('BASIC')}
                      className="radio radio-primary radio-sm"
                    />
                  </div>
                </div>

                {/* Plan Crecimiento */}
                <div
                  onClick={() => setSelectedPlan('GROWTH')}
                  className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between relative ${
                    selectedPlan === 'GROWTH'
                      ? 'border-primary bg-primary/5 shadow-md'
                      : 'border-base-200 hover:border-base-300 bg-base-100'
                  }`}
                >
                  <div className="space-y-2">
                    <span className="badge badge-primary text-white text-[9px] uppercase font-bold">Recomendado</span>
                    <h3 className="font-bold text-sm text-base-content">Clínico Crecimiento</h3>
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-black text-base-content">$990</span>
                      <span className="text-[10px] text-base-content/60">MXN/mes</span>
                    </div>
                    <ul className="text-[11px] space-y-1 text-base-content/70 pt-1">
                      <li>• Hasta <strong>1,500 órdenes / mes</strong></li>
                      <li>• De <strong>4 a 7 sedes</strong></li>
                      <li>• Interfaz Analizadores LIS</li>
                    </ul>
                  </div>
                  <div className="mt-3 text-right">
                    <input
                      type="radio"
                      name="onboarding-plan"
                      checked={selectedPlan === 'GROWTH'}
                      onChange={() => setSelectedPlan('GROWTH')}
                      className="radio radio-primary radio-sm"
                    />
                  </div>
                </div>

                {/* Plan Pro */}
                <div
                  onClick={() => setSelectedPlan('PRO')}
                  className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                    selectedPlan === 'PRO'
                      ? 'border-primary bg-primary/5 shadow-md'
                      : 'border-base-200 hover:border-base-300 bg-base-100'
                  }`}
                >
                  <div className="space-y-2">
                    <span className="badge badge-accent text-white text-[9px] uppercase font-bold">Hospitalario</span>
                    <h3 className="font-bold text-sm text-base-content">Red Hospitalaria</h3>
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-black text-base-content">$1,890</span>
                      <span className="text-[10px] text-base-content/60">MXN/mes</span>
                    </div>
                    <ul className="text-[11px] space-y-1 text-base-content/70 pt-1">
                      <li>• <strong>Órdenes Ilimitadas</strong></li>
                      <li>• <strong>Sedes Ilimitadas (8+)</strong></li>
                      <li>• Soporte VIP 24/7</li>
                    </ul>
                  </div>
                  <div className="mt-3 text-right">
                    <input
                      type="radio"
                      name="onboarding-plan"
                      checked={selectedPlan === 'PRO'}
                      onChange={() => setSelectedPlan('PRO')}
                      className="radio radio-primary radio-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Mensaje de Error si Polar reporta fallo de credenciales o de red */}
              {checkoutError && (
                <div className="alert alert-error text-white text-xs py-3 rounded-2xl shadow-sm flex items-start gap-2 animate-fade-in">
                  <IconAlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block">Aviso de la Pasarela de Pago:</span>
                    <span>{checkoutError}</span>
                  </div>
                </div>
              )}

              {/* Caja de Llamada a la Acción de Polar */}
              <div className="bg-gradient-to-r from-primary/10 via-base-200 to-base-200/50 p-4 rounded-2xl border border-primary/20 flex flex-col sm:flex-row items-center justify-between gap-3 mt-2">
                <div>
                  <span className="font-extrabold text-xs text-base-content flex items-center gap-1.5">
                    <IconCreditCard className="w-4 h-4 text-primary" />
                    Plan seleccionado: {selectedPlan === 'PRO' ? 'Red Hospitalaria ($1,890 MXN)' : selectedPlan === 'GROWTH' ? 'Clínico Crecimiento ($990 MXN)' : 'Esencial Clínico ($490 MXN)'}
                  </span>
                  <span className="text-[11px] text-success font-semibold flex items-center gap-1 mt-0.5">
                    <IconCheckCircle className="w-3.5 h-3.5" /> Incluye 14 días de prueba gratis. Tu tarjeta se registrará de forma segura en Polar.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleGoToPolarCheckout(selectedPlan)}
                  disabled={isRedirectingPolar}
                  className="btn btn-primary btn-sm text-primary-content font-bold rounded-xl gap-2 w-full sm:w-auto shrink-0 shadow-md shadow-primary/20"
                >
                  {isRedirectingPolar ? (
                    <>
                      <span className="loading loading-spinner loading-xs"></span>
                      Abriendo Polar...
                    </>
                  ) : (
                    <>
                      Ir a Polar Checkout (14d gratis) <IconArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>

              <div className="flex justify-center sm:justify-end pt-1">
                <button
                  type="button"
                  onClick={handleSkipCheckout}
                  disabled={isSavingPlan}
                  className="text-xs text-base-content/50 hover:text-primary transition-colors underline"
                >
                  Continuar sin registrar tarjeta por ahora (Modo de prueba local)
                </button>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="text-center space-y-4 animate-fade-in">
              <div className="inline-flex p-4 bg-secondary/10 text-secondary rounded-2xl mb-2">
                <IconBuilding className="w-12 h-12" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-base-content">
                Paso 2: Registra tus Sedes y Permisos COFEPRIS
              </h2>
              <p className="text-base-content/70 max-w-md mx-auto leading-relaxed text-sm">
                Ingresa los datos de tu establecimiento junto con tus permisos oficiales (Aviso de Funcionamiento ante COFEPRIS, Cédula del Responsable Sanitario y Contrato de RPBI).
              </p>
            </div>
          )}

          {currentStep === 4 && (
            <div className="space-y-4 text-center animate-fade-in">
              <div className="inline-flex p-4 bg-accent/10 text-accent rounded-2xl mb-2">
                <IconClipboardList className="w-12 h-12" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-base-content">
                Paso 3: Gestiona Órdenes y Resultados
              </h2>
              <p className="text-base-content/70 max-w-md mx-auto leading-relaxed text-sm">
                Podrás registrar pacientes, asignar análisis clínicos, consultar el estado de procesamiento en tiempo real y emitir reportes de laboratorio con firma digital.
              </p>
            </div>
          )}

          {currentStep === 5 && (
            <div className="space-y-4 text-center animate-fade-in">
              <div className="inline-flex p-4 bg-success/10 text-success rounded-2xl mb-2">
                <IconCheckCircle className="w-12 h-12" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-base-content">
                ¡Todo listo para comenzar!
              </h2>
              <p className="text-base-content/70 max-w-md mx-auto leading-relaxed text-sm">
                Has configurado tu plan inicial. Ahora da de alta tu primera sede para empezar a procesar estudios y emitir órdenes de trabajo.
              </p>
            </div>
          )}
        </div>

        {/* Acciones de Navegación */}
        <div className="flex items-center justify-between border-t border-base-200 pt-6 mt-4">
          <button
            onClick={handlePrev}
            className={`btn btn-ghost gap-2 rounded-xl font-semibold ${currentStep === 1 ? 'invisible' : ''}`}
          >
            <IconArrowLeft className="w-4 h-4" /> Anterior
          </button>

          {currentStep < totalSteps ? (
            <button
              onClick={handleNext}
              disabled={isSavingPlan || isRedirectingPolar}
              className="btn btn-primary text-primary-content font-bold rounded-xl gap-2 min-w-[120px]"
            >
              {isSavingPlan || isRedirectingPolar ? (
                <>
                  <span className="loading loading-spinner loading-xs"></span>
                  {currentStep === 2 ? 'Conectando a Polar...' : 'Guardando...'}
                </>
              ) : (
                <>
                  {currentStep === 2 ? 'Ir a Polar Checkout' : 'Siguiente'} <IconArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          ) : (
            <button
              onClick={handleFinishAndCreate}
              className="btn btn-primary text-primary-content font-bold rounded-xl gap-2 shadow-lg shadow-primary/25 hover:scale-[1.02] transition-all"
            >
              <IconPlus className="w-5 h-5" />
              Crear mi primer laboratorio
            </button>
          )}
        </div>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button onClick={onClose}>close</button>
      </form>
    </dialog>
  );
}
