// src/components/OnboardingModal.tsx
import { useState } from 'react';
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
  const [currentStep, setCurrentStep] = useState(1);

  if (!isOpen) return null;

  const totalSteps = 4;

  const handleNext = () => {
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
    <dialog className="modal modal-open backdrop-blur-md">
      <div className="modal-box max-w-2xl border border-base-300 bg-base-100 p-6 sm:p-8 shadow-2xl rounded-3xl">
        {/* Cabecera y botón omitir */}
        <div className="flex items-center justify-between mb-6">
          <div className="badge badge-primary badge-outline px-3 py-2 text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5">
            <IconSparkles className="w-4 h-4 text-primary" />
            Guía de Inicio Rápido
          </div>
          <button
            onClick={onClose}
            className="btn btn-sm btn-ghost text-base-content/60 hover:text-base-content"
          >
            Saltar guía <IconX className="w-4 h-4" />
          </button>
        </div>

        {/* Indicador de pasos con DaisyUI Steps */}
        <div className="w-full mb-8">
          <ul className="steps steps-horizontal w-full text-xs sm:text-sm font-semibold">
            <li className={`step ${currentStep >= 1 ? 'step-primary' : ''}`}>Bienvenida</li>
            <li className={`step ${currentStep >= 2 ? 'step-primary' : ''}`}>Laboratorio</li>
            <li className={`step ${currentStep >= 3 ? 'step-primary' : ''}`}>Operaciones</li>
            <li className={`step ${currentStep >= 4 ? 'step-primary' : ''}`}>¡Listo!</li>
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
            <div className="text-center space-y-4 animate-fade-in">
              <div className="inline-flex p-4 bg-secondary/10 text-secondary rounded-2xl mb-2">
                <IconBuilding className="w-12 h-12" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-base-content">
                Paso 1: Registra tu Laboratorio
              </h2>
              <p className="text-base-content/70 max-w-md mx-auto leading-relaxed">
                Todo comienza registrando la información básica de tu laboratorio o sede (Nombre, Dirección, Ciudad y País). Esto permitirá asociar pacientes y órdenes de trabajo a tu entidad.
              </p>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-4 text-center animate-fade-in">
              <div className="inline-flex p-4 bg-accent/10 text-accent rounded-2xl mb-2">
                <IconClipboardList className="w-12 h-12" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-base-content">
                Paso 2: Gestiona Órdenes y Resultados
              </h2>
              <p className="text-base-content/70 max-w-md mx-auto leading-relaxed">
                Podrás registrar pacientes, asignar análisis clínicos, consultar el estado de procesamiento en tiempo real y emitir reportes de laboratorio de forma segura.
              </p>
            </div>
          )}

          {currentStep === 4 && (
            <div className="text-center space-y-4 animate-fade-in">
              <div className="inline-flex p-4 bg-success/10 text-success rounded-2xl mb-2">
                <IconCheckCircle className="w-12 h-12" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-base-content">
                ¡Todo listo para comenzar!
              </h2>
              <p className="text-base-content/70 max-w-md mx-auto leading-relaxed">
                Estás a un paso de configurar tu plataforma. Haz clic abajo para dar de alta tu primer laboratorio ahora mismo.
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
              className="btn btn-primary text-primary-content font-bold rounded-xl gap-2 min-w-[120px]"
            >
              Siguiente <IconArrowRight className="w-4 h-4" />
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
