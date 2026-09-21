// src/components/PlanSelectionModal.tsx
import React, { useState, useEffect } from 'react';
import { useApi } from '../hooks/useApi';
import type { PlanType, UserSubscription } from '../types/subscription';
import {
  IconCheckCircle,
  IconSparkles,
  IconX,
  IconAlertCircle,
} from './icons';

interface PlanSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPlanChanged?: () => void;
  initialPlan?: PlanType;
}

export const PlanSelectionModal: React.FC<PlanSelectionModalProps> = ({
  isOpen,
  onClose,
  onPlanChanged,
  initialPlan,
}) => {
  const api = useApi();
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<PlanType>(initialPlan || 'BASIC');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const fetchSub = async () => {
      try {
        setIsLoading(true);
        const res = await api.get<UserSubscription>('/subscription/me');
        setSubscription(res.data);
        if (res.data?.plan?.type) {
          setSelectedPlan(res.data.plan.type);
        }
      } catch (e) {
        console.warn('Error al obtener suscripción:', e);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSub();
  }, [isOpen, api]);

  if (!isOpen) return null;

  const handleSelectAndActivate = async (plan: PlanType) => {
    try {
      setIsSubmitting(true);
      setErrorMsg(null);

      // 1. Intentar generar sesión de Checkout segura en Polar (con 14 días de prueba gratis)
      const checkoutRes = await api.post<{ checkoutUrl: string }>('/subscription/checkout', {
        planType: plan,
        clientOrigin: window.location.origin,
      });

      if (checkoutRes.data?.checkoutUrl) {
        setSuccessMsg('Redirigiendo a la pasarela segura de Polar (14 días gratis)...');
        setTimeout(() => {
          window.location.href = checkoutRes.data.checkoutUrl;
        }, 600);
        return;
      }
      setSelectedPlan(plan);
      setSuccessMsg(`¡Plan ${plan} activado exitosamente! Tu cuenta ha sido actualizada.`);

      if (onPlanChanged) {
        onPlanChanged();
      }

      setTimeout(() => {
        setSuccessMsg(null);
        onClose();
      }, 1500);
    } catch (err: any) {
      console.error('Error al cambiar de plan:', err);
      setErrorMsg(
        err?.response?.data?.message || 'No se pudo actualizar el plan. Intenta nuevamente.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const plans = [
    {
      type: 'BASIC' as PlanType,
      name: 'Esencial Clínico',
      badge: 'Más Accesible',
      badgeClass: 'badge-ghost',
      price: '$490',
      period: 'MXN / mes',
      ordersText: 'Hasta 400 órdenes al mes',
      labsText: 'Hasta 3 sedes clínicas',
      features: [
        'Notificaciones ilimitadas',
        'Catálogo de estudios completo',
        'Gestión de pacientes y resultados',
        'Bot de soporte clínico Synova',
        'Subida y escaneo de avisos sanitarios',
      ],
      highlight: false,
    },
    {
      type: 'GROWTH' as PlanType,
      name: 'Clínico Crecimiento',
      badge: 'Recomendado',
      badgeClass: 'badge-primary text-white font-bold',
      price: '$990',
      period: 'MXN / mes',
      ordersText: 'Hasta 1,500 órdenes al mes',
      labsText: 'De 4 a 7 sedes clínicas',
      features: [
        'Todo lo del Plan Esencial',
        'Conexión LIS con analizadores automáticos',
        'Control de Calidad (Levey-Jennings)',
        'Personalización de membretes oficiales',
        'Soporte técnico prioritario',
      ],
      highlight: true,
    },
    {
      type: 'PRO' as PlanType,
      name: 'Red Hospitalaria',
      badge: 'Empresarial',
      badgeClass: 'badge-accent text-white font-bold',
      price: '$1,890',
      period: 'MXN / mes',
      ordersText: 'Órdenes Ilimitadas',
      labsText: 'Sedes Ilimitadas (8+)',
      features: [
        'Todo lo del Plan Crecimiento',
        'Multi-analizadores en paralelo',
        'Expediente COFEPRIS en 1 clic',
        'Convenios y listas de precios corporativos',
        'Atención VIP y soporte 24/7 dedicado',
      ],
      highlight: false,
    },
  ];

  return (
    <dialog className="modal modal-open backdrop-blur-md p-2 sm:p-4 z-[9999]">
      <div className="modal-box w-full max-w-[96vw] sm:max-w-5xl border border-base-300 bg-base-100 p-4 sm:p-7 shadow-2xl rounded-3xl max-h-[92vh] overflow-y-auto">
        {/* Cabecera */}
        <div className="flex items-center justify-between border-b border-base-200 pb-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold">
              <IconSparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base sm:text-xl text-base-content tracking-tight">
                Planes y Suscripción del Sistema Clínico
              </h3>
              <p className="text-xs text-base-content/60">
                Selecciona el esquema accesible que mejor se adapte a tu volumen de laboratorio.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="btn btn-sm btn-circle btn-ghost text-base-content/60"
            disabled={isSubmitting}
          >
            <IconX className="w-5 h-5" />
          </button>
        </div>

        {/* Alertas */}
        {errorMsg && (
          <div className="alert alert-error mb-4 text-xs font-semibold py-2.5 rounded-2xl text-white">
            <IconAlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="alert alert-success mb-4 text-xs font-semibold py-2.5 rounded-2xl text-white">
            <IconCheckCircle className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {isLoading ? (
          <div className="py-12 flex flex-col items-center justify-center gap-3">
            <span className="loading loading-spinner loading-lg text-primary"></span>
            <span className="text-xs text-base-content/60 font-semibold">
              Consultando estado de suscripción...
            </span>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Grid de Planes */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 pt-2">
              {plans.map((p) => {
                const isCurrent = subscription?.plan?.type === p.type;
                const isChosen = selectedPlan === p.type;

                return (
                  <div
                    key={p.type}
                    className={`card rounded-3xl transition-all relative flex flex-col justify-between border-2 ${
                      p.highlight
                        ? 'border-primary shadow-xl bg-base-100 ring-2 ring-primary/20'
                        : isChosen
                        ? 'border-primary/60 bg-base-100 shadow-md'
                        : 'border-base-200 bg-base-100/70 hover:border-base-300 shadow-xs'
                    }`}
                  >
                    {/* Badge superior */}
                    <div className="absolute -top-3 right-4">
                      <span className={`badge ${p.badgeClass} text-[10px] uppercase tracking-wider py-2 px-3 shadow-sm`}>
                        {p.badge}
                      </span>
                    </div>

                    <div className="p-5 sm:p-6 space-y-4 flex-1">
                      <div>
                        <h4 className="font-extrabold text-lg text-base-content">{p.name}</h4>
                        <div className="flex items-baseline gap-1 mt-2">
                          <span className="text-3xl sm:text-4xl font-black text-base-content tracking-tight">
                            {p.price}
                          </span>
                          <span className="text-xs font-medium text-base-content/60">
                            {p.period}
                          </span>
                        </div>
                      </div>

                      {/* Límites Destacados */}
                      <div className="p-3.5 bg-base-200/60 rounded-2xl border border-base-200 space-y-2 text-xs">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[10px] text-base-content/60 uppercase font-bold tracking-wider">
                            Órdenes / mes:
                          </span>
                          <span className="text-primary font-black text-sm tracking-tight">
                            {p.ordersText}
                          </span>
                        </div>
                        <div className="flex flex-col gap-0.5 pt-1.5 border-t border-base-200">
                          <span className="text-[10px] text-base-content/60 uppercase font-bold tracking-wider">
                            Sedes permitidas:
                          </span>
                          <span className="text-secondary font-black text-sm tracking-tight">
                            {p.labsText}
                          </span>
                        </div>
                      </div>

                      {/* Lista de Características */}
                      <ul className="space-y-2 text-xs text-base-content/80 pt-2">
                        {p.features.map((feat, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <IconCheckCircle className="w-4 h-4 text-success shrink-0 mt-0.5" />
                            <span>{feat}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Botón de Selección */}
                    <div className="p-5 sm:p-6 pt-0 border-t border-base-200/60 mt-4">
                      {isCurrent ? (
                        <button
                          type="button"
                          className="btn btn-sm btn-outline btn-success w-full rounded-xl font-bold cursor-default"
                          disabled
                        >
                          <IconCheckCircle className="w-4 h-4" /> Plan Actual Activo
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleSelectAndActivate(p.type)}
                          disabled={isSubmitting}
                          className={`btn btn-sm w-full rounded-xl font-bold shadow-xs transition-all ${
                            p.highlight
                              ? 'btn-primary text-white'
                              : 'btn-outline border-base-300 hover:bg-primary hover:text-white'
                          }`}
                        >
                          {isSubmitting && selectedPlan === p.type ? (
                            <span className="loading loading-spinner loading-xs"></span>
                          ) : (
                            'Activar este Plan'
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Aviso sobre Pasarela Polar y Soporte en México */}
            <div className="p-3.5 sm:p-4 bg-base-200/60 rounded-2xl border border-base-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-base-content/75 text-center sm:text-left">
                <span className="w-2.5 h-2.5 rounded-full bg-success shrink-0"></span>
                <span>
                  Pagos seguros procesados con <strong>Polar</strong> (Tarjeta de Débito/Crédito) o transferencia interbancaria (SPEI). Incluye 14 días de prueba gratis.
                </span>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="btn btn-xs btn-ghost text-base-content/70 hover:text-base-content font-semibold"
              >
                Cerrar
              </button>
            </div>
          </div>
        )}
      </div>
      <form method="dialog" className="modal-backdrop">
        <button onClick={onClose}>close</button>
      </form>
    </dialog>
  );
};

export default PlanSelectionModal;
