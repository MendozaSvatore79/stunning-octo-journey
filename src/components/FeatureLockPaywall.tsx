// src/components/FeatureLockPaywall.tsx
import React, { useState } from 'react';
import { useApi } from '../hooks/useApi';
import { IconLock, IconSparkles, IconCheckCircle, IconAlertCircle } from './icons';
import type { PlanType } from '../types/subscription';

interface FeatureLockPaywallProps {
  title: string;
  moduleName: string;
  description: string;
  benefits: string[];
  requiredPlan?: PlanType;
  onNavigateToSubscription?: () => void;
}

export const FeatureLockPaywall: React.FC<FeatureLockPaywallProps> = ({
  title,
  moduleName,
  description,
  benefits,
  requiredPlan = 'GROWTH',
  onNavigateToSubscription,
}) => {
  const api = useApi();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const planName = requiredPlan === 'PRO' ? 'Plan Red Hospitalaria (PRO)' : 'Plan Clínico Crecimiento';
  const planPrice = requiredPlan === 'PRO' ? '$1,890 MXN / mes' : '$990 MXN / mes';

  const handleUpgradeNow = async () => {
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      const res = await api.post<{
        checkoutUrl?: string;
        upgradedDirectly?: boolean;
        message?: string;
      }>('/subscription/checkout', {
        planType: requiredPlan,
        clientOrigin: window.location.origin,
      });

      if (res.data?.upgradedDirectly) {
        window.location.reload();
        return;
      }

      if (res.data?.checkoutUrl) {
        window.location.href = res.data.checkoutUrl;
      } else {
        setErrorMsg('No se recibió la URL de pago de Polar. Intenta desde "Mi Plan y Cuota".');
      }
    } catch (err: any) {
      console.error('Error al generar checkout de Polar:', err);
      setErrorMsg(
        err?.response?.data?.message || 'No fue posible conectar con Polar Checkout. Intenta de nuevo.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="card bg-base-100 border border-base-200 shadow-md rounded-3xl p-6 sm:p-10 max-w-3xl mx-auto my-6 text-center space-y-6">
      {/* Icono de Candado y Badge */}
      <div className="flex flex-col items-center gap-3">
        <div className="w-16 h-16 rounded-3xl bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center justify-center shadow-inner">
          <IconLock className="w-8 h-8" />
        </div>
        <div className="flex flex-wrap items-center justify-center gap-2">
          <span className="badge badge-warning text-white font-black tracking-wider text-[11px] px-3 py-2 uppercase">
            Función de {planName}
          </span>
          {moduleName && (
            <span className="badge badge-outline text-base-content/70 text-[11px] font-bold">
              {moduleName}
            </span>
          )}
        </div>
      </div>

      {/* Título y Descripción */}
      <div className="space-y-2">
        <h2 className="text-xl sm:text-2xl font-black text-base-content tracking-tight">
          {title}
        </h2>
        <p className="text-sm text-base-content/70 max-w-xl mx-auto leading-relaxed">
          {description}
        </p>
      </div>

      {/* Tarjeta de Beneficios y Desbloqueo */}
      <div className="bg-base-200/60 border border-base-200 rounded-2xl p-5 text-left space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold uppercase text-primary tracking-wider">
          <IconSparkles className="w-4 h-4 text-primary" />
          <span>Lo que desbloqueas con {planName}:</span>
        </div>
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-base-content/85">
          {benefits.map((b, idx) => (
            <li key={idx} className="flex items-start gap-2">
              <IconCheckCircle className="w-4 h-4 text-success shrink-0 mt-0.5" />
              <span>{b}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Alerta de Error si ocurre */}
      {errorMsg && (
        <div className="alert alert-error text-white text-xs font-semibold py-2.5 rounded-2xl text-left">
          <IconAlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Botones de Acción */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
        <button
          onClick={handleUpgradeNow}
          disabled={isSubmitting}
          className="btn btn-primary rounded-xl w-full sm:w-auto font-bold shadow-md text-white gap-2 px-6"
        >
          {isSubmitting ? (
            <span className="loading loading-spinner loading-xs"></span>
          ) : (
            <>
              <IconSparkles className="w-4 h-4" />
              <span>Desbloquear con {planName} ({planPrice})</span>
            </>
          )}
        </button>

        {onNavigateToSubscription && (
          <button
            onClick={onNavigateToSubscription}
            className="btn btn-outline border-base-300 hover:border-base-400 rounded-xl w-full sm:w-auto font-semibold text-xs text-base-content/75"
          >
            Ver Mi Plan y Comparativa
          </button>
        )}
      </div>

      <p className="text-[11px] text-base-content/50">
        Incluye 14 días de prueba gratis gestionados con la pasarela segura de Polar. Cancela o cambia en cualquier momento.
      </p>
    </div>
  );
};

export default FeatureLockPaywall;
