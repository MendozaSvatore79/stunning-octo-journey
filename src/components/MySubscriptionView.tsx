// src/components/MySubscriptionView.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { useApi } from '../hooks/useApi';
import type { UserSubscription, PlanType } from '../types/subscription';
import type { Laboratory } from '../types/lab';
import {
  IconSparkles,
  IconCheckCircle,
  IconAlertCircle,
  IconBuilding,
  IconClipboardList,
  IconCreditCard,
  IconClock,
  IconShieldCheck,
  IconLock,
} from './icons';

interface MySubscriptionViewProps {
  labs?: Laboratory[];
  onOpenUpgradeModal?: () => void;
}

export const MySubscriptionView: React.FC<MySubscriptionViewProps> = ({ labs = [] }) => {
  const api = useApi();
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState<PlanType | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fetchSubscription = useCallback(async () => {
    try {
      setIsLoading(true);
      setErrorMsg(null);
      const res = await api.get<UserSubscription>('/subscription/me');
      setSubscription(res.data);
    } catch (err: any) {
      console.error('Error al cargar suscripción:', err);
      setErrorMsg(
        err?.response?.data?.message || 'No fue posible cargar los datos de tu suscripción.'
      );
    } finally {
      setIsLoading(false);
    }
  }, [api]);

  useEffect(() => {
    fetchSubscription();
  }, [fetchSubscription]);

  const [isLoadingPortal, setIsLoadingPortal] = useState(false);

  const PLAN_TIER: Record<PlanType, number> = {
    BASIC: 1,
    GROWTH: 2,
    PRO: 3,
  };

  const handlePlanChange = async (targetPlan: PlanType, isDowngrade: boolean) => {
    if (subscription?.plan?.type === targetPlan) return;

    if (isDowngrade) {
      const targetConfig = planCards.find((p) => p.type === targetPlan);
      const ordersLimitStr =
        targetConfig && targetConfig.ordersLimit >= 999999
          ? 'ilimitadas'
          : `${targetConfig?.ordersLimit} órdenes`;
      const labsLimitStr =
        targetConfig && targetConfig.labsLimit >= 999999
          ? 'ilimitadas'
          : `${targetConfig?.labsLimit} sedes`;

      const confirmed = window.confirm(
        `¿Deseas cambiar tu suscripción al plan "${targetConfig?.name || targetPlan}"?\n\n` +
          `• Límite mensual: ${ordersLimitStr}\n` +
          `• Sedes clínicas permitidas: ${labsLimitStr}\n\n` +
          `Polar ajustará automáticamente tu facturación y prorrateo correspondiente.`
      );
      if (!confirmed) return;
    }

    try {
      setIsSubmitting(targetPlan);
      setErrorMsg(null);
      setSuccessMsg(null);

      const res = await api.post<{
        checkoutUrl?: string;
        upgradedDirectly?: boolean;
        newPlan?: PlanType;
        message?: string;
      }>('/subscription/checkout', {
        planType: targetPlan,
        clientOrigin: window.location.origin,
      });

      // Si se actualizó directamente en Polar vía API (Upgrade o Downgrade sincrónico)
      if (res.data?.upgradedDirectly) {
        setSuccessMsg(
          res.data.message ||
            `¡Tu suscripción ha sido cambiada exitosamente al plan ${targetPlan}!`
        );
        await fetchSubscription();
        return;
      }

      if (res.data?.checkoutUrl) {
        setSuccessMsg(`Redirigiendo a la pasarela segura de Polar para el Plan ${targetPlan}...`);
        setTimeout(() => {
          window.location.href = res.data.checkoutUrl!;
        }, 500);
      } else {
        setErrorMsg('No se recibió la respuesta esperada de Polar. Intenta nuevamente.');
      }
    } catch (err: any) {
      console.error('Error al cambiar de plan con Polar:', err);
      setErrorMsg(
        err?.response?.data?.message || 'No se pudo conectar con la pasarela de Polar.'
      );
    } finally {
      setIsSubmitting(null);
    }
  };

  const handleOpenCustomerPortal = async () => {
    try {
      setIsLoadingPortal(true);
      setErrorMsg(null);
      const res = await api.get<{ portalUrl: string }>('/subscription/customer-portal');
      if (res.data?.portalUrl) {
        window.open(res.data.portalUrl, '_blank', 'noopener,noreferrer');
      } else {
        setErrorMsg('No se recibió el enlace del portal de Polar.');
      }
    } catch (err: any) {
      console.error('Error al abrir portal de Polar:', err);
      setErrorMsg(
        err?.response?.data?.message || 'No fue posible abrir el portal de facturación de Polar.'
      );
    } finally {
      setIsLoadingPortal(false);
    }
  };

  const planCards = [
    {
      type: 'BASIC' as PlanType,
      name: 'Esencial Clínico',
      badge: 'Más Accesible',
      badgeClass: 'badge-ghost',
      price: '$490',
      period: 'MXN / mes',
      ordersLimit: 400,
      labsLimit: 3,
      features: [
        'Hasta 400 órdenes de trabajo al mes',
        'Hasta 3 sedes o sucursales clínicas',
        'Expediente completo de pacientes y resultados',
        'Impresión de reportes oficiales y etiquetas térmicas',
        'Catálogo de análisis clínicos y reactivos',
        'Asistente y Bot clínico Synova 24/7',
      ],
      highlight: false,
    },
    {
      type: 'GROWTH' as PlanType,
      name: 'Clínico Crecimiento',
      badge: 'Más Popular',
      badgeClass: 'badge-primary text-white font-bold',
      price: '$990',
      period: 'MXN / mes',
      ordersLimit: 1500,
      labsLimit: 7,
      features: [
        'Hasta 1,500 órdenes de trabajo al mes',
        'De 4 a 7 sedes clínicas autorizadas',
        'Control de Calidad (Levey-Jennings y Westgard)',
        'Interfaz LIS para analizadores (HL7/ASTM)',
        'Personalización de membretes y logos oficiales',
        'Gestión de convenios y descuentos multisede',
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
      ordersLimit: 999999,
      labsLimit: 999999,
      features: [
        'Órdenes de trabajo ILIMITADAS',
        'Sedes y sucursales ILIMITADAS (8+ sedes)',
        'Conexión LIS multi-analizador en paralelo sin límite',
        'Control de calidad avanzado multi-nivel y auditorías',
        'Personalización completa de formatos clínicos corporativos',
        'Convenios y listas de precios corporativas ilimitadas',
        'Atención VIP y soporte 24/7 dedicado',
      ],
      highlight: false,
    },
  ];

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <span className="loading loading-spinner loading-lg text-primary"></span>
        <span className="text-xs text-base-content/60 font-semibold">
          Consultando estado de tu plan y cuotas...
        </span>
      </div>
    );
  }

  const currentPlanType = subscription?.plan?.type || 'BASIC';
  const usage = subscription?.usage || {
    ordersCountThisMonth: 0,
    maxOrders: 400,
    ordersPercent: 0,
    labsCount: labs.length,
    maxLabs: 3,
    isExceededOrders: false,
    isExceededLabs: false,
  };

  const statusLabel =
    subscription?.status === 'ACTIVE'
      ? 'Suscripción Activa'
      : subscription?.status === 'TRIAL'
      ? 'Periodo de Prueba (14 días)'
      : subscription?.status === 'PAST_DUE'
      ? 'Pago Pendiente'
      : subscription?.status === 'CANCELED'
      ? 'Cancelada'
      : 'Activa';

  const statusBadgeClass =
    subscription?.status === 'ACTIVE'
      ? 'badge-success text-white'
      : subscription?.status === 'TRIAL'
      ? 'badge-info text-white'
      : subscription?.status === 'PAST_DUE'
      ? 'badge-warning text-white'
      : 'badge-error text-white';

  return (
    <div className="space-y-6 pb-12">
      {/* Cabecera de la Vista */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-base-200 pb-5">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-500/20 shadow-xs">
            <IconCreditCard className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-base-content tracking-tight">
                Mi Plan y Cuota
              </h1>
              <span className={`badge ${statusBadgeClass} text-[10px] font-black uppercase px-2.5 py-1`}>
                {statusLabel}
              </span>
            </div>
            <p className="text-xs text-base-content/60 mt-0.5">
              Administra tu esquema de facturación mensual, monitorea límites de órdenes y actualiza tu plan en Polar.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          <button
            onClick={handleOpenCustomerPortal}
            disabled={isLoadingPortal}
            className="btn btn-sm btn-outline border-base-300 hover:border-primary hover:text-primary rounded-xl font-semibold gap-2 text-xs"
            title="Ver facturas oficiales, cambiar método de pago o administrar cuenta en Polar"
          >
            {isLoadingPortal ? (
              <span className="loading loading-spinner loading-xs"></span>
            ) : (
              <>
                <IconCreditCard className="w-4 h-4 text-primary" />
                <span>Portal Polar (Facturas y Tarjeta)</span>
              </>
            )}
          </button>

          <button
            onClick={fetchSubscription}
            className="btn btn-sm btn-outline border-base-300 rounded-xl font-semibold gap-2 text-xs"
          >
            <IconClock className="w-4 h-4" />
            <span>Actualizar Datos</span>
          </button>
        </div>
      </div>

      {/* Alertas informativas */}
      {errorMsg && (
        <div className="alert alert-error text-white text-xs font-semibold py-3 rounded-2xl shadow-sm">
          <IconAlertCircle className="w-5 h-5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="alert alert-success text-white text-xs font-semibold py-3 rounded-2xl shadow-sm">
          <IconCheckCircle className="w-5 h-5 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Resumen del Plan Activo y Cuotas de Consumo */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Tarjeta de Plan Actual */}
        <div className="card bg-gradient-to-br from-base-100 to-base-200/50 border border-base-200 shadow-sm rounded-3xl p-6 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black tracking-wider uppercase text-base-content/50">
                Plan Contratado
              </span>
              <span className="badge badge-primary badge-outline text-[10px] font-bold">
                {currentPlanType}
              </span>
            </div>

            <div>
              <h2 className="text-2xl font-black text-base-content">
                {subscription?.plan?.name || 'Plan Esencial Clínico'}
              </h2>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-3xl font-black text-primary">
                  ${subscription?.plan?.priceMxn || 490}
                </span>
                <span className="text-xs font-medium text-base-content/60">MXN / mes</span>
              </div>
            </div>

            <div className="p-3.5 bg-base-100 rounded-2xl border border-base-200 space-y-1.5 text-xs text-base-content/75">
              <div className="flex justify-between items-center">
                <span>Estado de pago:</span>
                <span className="font-bold text-base-content">{statusLabel}</span>
              </div>
              {subscription?.currentPeriodEnd && (
                <div className="flex justify-between items-center">
                  <span>Próximo corte:</span>
                  <span className="font-bold text-base-content">
                    {new Date(subscription.currentPeriodEnd).toLocaleDateString('es-MX', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-base-200 flex items-center gap-2 text-[11px] text-base-content/60">
            <IconShieldCheck className="w-4 h-4 text-success shrink-0" />
            <span>Facturación respaldada por pasarela segura Polar.</span>
          </div>
        </div>

        {/* Medidor de Órdenes Mensuales */}
        <div className="card bg-base-100 border border-base-200 shadow-sm rounded-3xl p-6 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <IconClipboardList className="w-4 h-4 text-primary" />
                <span className="text-xs font-extrabold uppercase tracking-wider text-base-content/70">
                  Órdenes del Mes
                </span>
              </div>
              <span
                className={`badge badge-sm font-black text-[10px] ${
                  usage.isExceededOrders
                    ? 'badge-error text-white'
                    : usage.ordersPercent >= 80
                    ? 'badge-warning text-white'
                    : 'badge-ghost text-base-content/70'
                }`}
              >
                {usage.ordersPercent}% utilizado
              </span>
            </div>

            <div className="flex items-baseline justify-between pt-1">
              <span className="text-3xl font-black text-base-content">
                {usage.ordersCountThisMonth.toLocaleString()}
              </span>
              <span className="text-xs font-semibold text-base-content/60">
                de {usage.maxOrders >= 999999 ? 'Ilimitadas' : `${usage.maxOrders.toLocaleString()} límite`}
              </span>
            </div>

            {/* Barra de progreso */}
            <div className="w-full bg-base-200 rounded-full h-3 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  usage.isExceededOrders
                    ? 'bg-error'
                    : usage.ordersPercent >= 80
                    ? 'bg-warning'
                    : 'bg-primary'
                }`}
                style={{
                  width: `${Math.min(100, usage.maxOrders >= 999999 ? 5 : usage.ordersPercent)}%`,
                }}
              ></div>
            </div>

            {usage.isExceededOrders ? (
              <p className="text-[11px] text-error font-semibold flex items-center gap-1.5 mt-2">
                <IconAlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>Has alcanzado el límite mensual. Haz upgrade para seguir emitiendo órdenes.</span>
              </p>
            ) : (
              <p className="text-[11px] text-base-content/50 mt-1">
                El contador se reinicia automáticamente el día 1 de cada mes natural.
              </p>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-base-200 text-[11px] text-base-content/60 flex items-center justify-between">
            <span>Disponibles este mes:</span>
            <span className="font-bold text-base-content">
              {usage.maxOrders >= 999999
                ? 'Ilimitadas'
                : Math.max(0, usage.maxOrders - usage.ordersCountThisMonth).toLocaleString()}{' '}
              órdenes
            </span>
          </div>
        </div>

        {/* Medidor de Sedes Clínicas */}
        <div className="card bg-base-100 border border-base-200 shadow-sm rounded-3xl p-6 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <IconBuilding className="w-4 h-4 text-secondary" />
                <span className="text-xs font-extrabold uppercase tracking-wider text-base-content/70">
                  Sedes Clínicas
                </span>
              </div>
              <span
                className={`badge badge-sm font-black text-[10px] ${
                  usage.isExceededLabs ? 'badge-error text-white' : 'badge-ghost text-base-content/70'
                }`}
              >
                {usage.labsCount} / {usage.maxLabs >= 999999 ? '∞' : usage.maxLabs} sedes
              </span>
            </div>

            <div className="flex items-baseline justify-between pt-1">
              <span className="text-3xl font-black text-base-content">
                {usage.labsCount}
              </span>
              <span className="text-xs font-semibold text-base-content/60">
                {usage.maxLabs >= 999999
                  ? 'Sedes Ilimitadas'
                  : `de ${usage.maxLabs} sedes permitidas`}
              </span>
            </div>

            {/* Barra de progreso de sedes */}
            <div className="w-full bg-base-200 rounded-full h-3 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  usage.isExceededLabs ? 'bg-error' : 'bg-secondary'
                }`}
                style={{
                  width: `${Math.min(
                    100,
                    usage.maxLabs >= 999999 ? 5 : Math.round((usage.labsCount / usage.maxLabs) * 100)
                  )}%`,
                }}
              ></div>
            </div>

            {usage.isExceededLabs ? (
              <p className="text-[11px] text-error font-semibold flex items-center gap-1.5 mt-2">
                <IconAlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>Tope de sedes alcanzado. Actualiza a Crecimiento o Pro para dar de alta más.</span>
              </p>
            ) : (
              <p className="text-[11px] text-base-content/50 mt-1">
                Cada sede cuenta con su propio expediente sanitario COFEPRIS y folios de órdenes.
              </p>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-base-200 text-[11px] text-base-content/60 flex items-center justify-between">
            <span>Sedes disponibles:</span>
            <span className="font-bold text-base-content">
              {usage.maxLabs >= 999999 ? 'Ilimitadas' : Math.max(0, usage.maxLabs - usage.labsCount)} sucursales
            </span>
          </div>
        </div>
      </div>

      {/* Matriz de Funciones del Plan Actual */}
      <div className="card bg-base-100 border border-base-200 shadow-sm rounded-3xl p-5 sm:p-6 space-y-4">
        <h3 className="text-sm sm:text-base font-extrabold text-base-content flex items-center gap-2">
          <IconSparkles className="w-4 h-4 text-primary" /> Módulos y Capacidades de tu Plan Actual
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          {/* Control de Calidad */}
          <div
            className={`p-3.5 rounded-2xl border flex items-start gap-2.5 ${
              subscription?.plan?.hasQualityControl
                ? 'bg-success/5 border-success/20 text-base-content'
                : 'bg-base-200/50 border-base-200 text-base-content/50'
            }`}
          >
            {subscription?.plan?.hasQualityControl ? (
              <IconCheckCircle className="w-4 h-4 text-success shrink-0 mt-0.5" />
            ) : (
              <IconLock className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            )}
            <div>
              <span className="font-bold block">Control de Calidad (QC)</span>
              <span className="text-[11px]">
                {subscription?.plan?.hasQualityControl
                  ? 'Levey-Jennings y reglas Westgard activo'
                  : 'Requiere Plan Crecimiento o Pro'}
              </span>
            </div>
          </div>

          {/* Interfaz LIS */}
          <div
            className={`p-3.5 rounded-2xl border flex items-start gap-2.5 ${
              subscription?.plan?.hasAnalyzerLis
                ? 'bg-success/5 border-success/20 text-base-content'
                : 'bg-base-200/50 border-base-200 text-base-content/50'
            }`}
          >
            {subscription?.plan?.hasAnalyzerLis ? (
              <IconCheckCircle className="w-4 h-4 text-success shrink-0 mt-0.5" />
            ) : (
              <IconLock className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            )}
            <div>
              <span className="font-bold block">Interfaz LIS Analizadores</span>
              <span className="text-[11px]">
                {subscription?.plan?.hasAnalyzerLis
                  ? 'Conexión HL7/ASTM automatizada'
                  : 'Requiere Plan Crecimiento o Pro'}
              </span>
            </div>
          </div>

          {/* Membretes Personalizados */}
          <div
            className={`p-3.5 rounded-2xl border flex items-start gap-2.5 ${
              subscription?.plan?.hasCustomReportTemplates
                ? 'bg-success/5 border-success/20 text-base-content'
                : 'bg-base-200/50 border-base-200 text-base-content/50'
            }`}
          >
            {subscription?.plan?.hasCustomReportTemplates ? (
              <IconCheckCircle className="w-4 h-4 text-success shrink-0 mt-0.5" />
            ) : (
              <IconLock className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            )}
            <div>
              <span className="font-bold block">Membretes Oficiales</span>
              <span className="text-[11px]">
                {subscription?.plan?.hasCustomReportTemplates
                  ? 'Diseño y logos corporativos habilitado'
                  : 'Membrete estándar predeterminado'}
              </span>
            </div>
          </div>

          {/* Convenios Multisede */}
          <div
            className={`p-3.5 rounded-2xl border flex items-start gap-2.5 ${
              subscription?.plan?.hasAdvancedAgreements
                ? 'bg-success/5 border-success/20 text-base-content'
                : 'bg-base-200/50 border-base-200 text-base-content'
            }`}
          >
            <IconCheckCircle className="w-4 h-4 text-success shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block">Convenios y Descuentos</span>
              <span className="text-[11px]">
                {subscription?.plan?.hasAdvancedAgreements
                  ? 'Convenios ilimitados multisede'
                  : 'Convenios locales habilitados'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Sección de Comparativa y Upgrade/Downgrade con Polar */}
      <div className="space-y-4 pt-2">
        <div className="text-center sm:text-left">
          <h2 className="text-lg sm:text-xl font-black text-base-content tracking-tight">
            Planes Disponibles y Gestión de Suscripción (Upgrade / Downgrade)
          </h2>
          <p className="text-xs text-base-content/60">
            Cambia entre cualquiera de los 3 planes de forma sincronizada con Polar. Ajustes inmediatos de órdenes, sedes y analizadores.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2">
          {planCards.map((p) => {
            const isCurrent = currentPlanType === p.type;
            const currentTier = PLAN_TIER[currentPlanType] || 1;
            const cardTier = PLAN_TIER[p.type] || 1;
            const isUpgrade = cardTier > currentTier;
            const isDowngrade = cardTier < currentTier;
            const isSubmittingThis = isSubmitting === p.type;

            return (
              <div
                key={p.type}
                className={`card rounded-3xl transition-all relative flex flex-col justify-between border-2 ${
                  isCurrent
                    ? 'border-success/80 shadow-lg bg-base-100 ring-2 ring-success/20'
                    : p.highlight
                    ? 'border-primary shadow-xl bg-base-100 ring-2 ring-primary/20'
                    : 'border-base-200 bg-base-100 shadow-xs hover:border-base-300'
                }`}
              >
                {/* Badge superior */}
                <div className="absolute -top-3 right-4">
                  <span
                    className={`badge ${
                      isCurrent
                        ? 'badge-success text-white font-black'
                        : p.badgeClass
                    } text-[10px] uppercase tracking-wider py-2 px-3 shadow-xs`}
                  >
                    {isCurrent ? '⭐ Tu Plan Actual' : p.badge}
                  </span>
                </div>

                <div className="p-6 space-y-4 flex-1">
                  <div>
                    <h4 className="font-extrabold text-lg text-base-content">{p.name}</h4>
                    <div className="flex items-baseline gap-1 mt-2">
                      <span className="text-3xl sm:text-4xl font-black text-base-content tracking-tight">
                        {p.price}
                      </span>
                      <span className="text-xs font-medium text-base-content/60">{p.period}</span>
                    </div>
                  </div>

                  {/* Límites Destacados */}
                  <div className="p-3.5 bg-base-200/60 rounded-2xl border border-base-200 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-base-content/60 uppercase font-bold tracking-wider">
                        Órdenes / mes:
                      </span>
                      <span className="text-primary font-black text-xs tracking-tight">
                        {p.ordersLimit >= 999999 ? 'Ilimitadas' : `Hasta ${p.ordersLimit.toLocaleString()}`}
                      </span>
                    </div>
                    <div className="flex items-center justify-between pt-1.5 border-t border-base-200">
                      <span className="text-[10px] text-base-content/60 uppercase font-bold tracking-wider">
                        Sedes permitidas:
                      </span>
                      <span className="text-secondary font-black text-xs tracking-tight">
                        {p.labsLimit >= 999999 ? 'Ilimitadas (8+)' : `Hasta ${p.labsLimit} sedes`}
                      </span>
                    </div>
                  </div>

                  {/* Lista de Características */}
                  <ul className="space-y-2.5 text-xs text-base-content/85 pt-2">
                    {p.features.map((feat, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <IconCheckCircle className="w-4 h-4 text-success shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Botón de Acción */}
                <div className="p-6 pt-0 border-t border-base-200/60 mt-4">
                  {isCurrent ? (
                    <button
                      type="button"
                      disabled
                      className="btn btn-sm btn-outline btn-success w-full rounded-xl font-bold cursor-default opacity-90"
                    >
                      <IconCheckCircle className="w-4 h-4" /> Plan Actual Activo
                    </button>
                  ) : isUpgrade ? (
                    <button
                      type="button"
                      onClick={() => handlePlanChange(p.type, false)}
                      disabled={Boolean(isSubmitting)}
                      className={`btn btn-sm w-full rounded-xl font-bold shadow-xs transition-all gap-2 ${
                        p.highlight
                          ? 'btn-primary text-white'
                          : 'btn-outline border-base-300 hover:bg-primary hover:text-white'
                      }`}
                    >
                      {isSubmittingThis ? (
                        <span className="loading loading-spinner loading-xs"></span>
                      ) : (
                        <>
                          <IconSparkles className="w-4 h-4 text-amber-300" />
                          <span>Mejorar a este Plan (Upgrade)</span>
                        </>
                      )}
                    </button>
                  ) : isDowngrade ? (
                    <button
                      type="button"
                      onClick={() => handlePlanChange(p.type, true)}
                      disabled={Boolean(isSubmitting)}
                      className="btn btn-sm w-full rounded-xl font-bold border border-base-300 bg-base-200/80 hover:bg-base-300 text-base-content shadow-xs transition-all gap-2"
                    >
                      {isSubmittingThis ? (
                        <span className="loading loading-spinner loading-xs"></span>
                      ) : (
                        <>
                          <IconClock className="w-4 h-4 text-base-content/60" />
                          <span>Cambiar a este Plan (Downgrade)</span>
                        </>
                      )}
                    </button>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>

        {/* Nota al pie sobre Polar Checkout */}
        <div className="p-4 bg-base-200/50 rounded-2xl border border-base-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-base-content/75 mt-4">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-success shrink-0"></span>
            <span>
              Procesamiento de pagos 100% seguro con <strong>Polar</strong>.{' '}
              {subscription?.status === 'ACTIVE'
                ? 'Las actualizaciones de plan son inmediatas con prorrateo directo sin prueba gratuita repetida.'
                : 'Todos los planes nuevos incluyen 14 días de prueba sin cargo.'}
            </span>
          </div>
          <span className="text-[11px] font-semibold text-base-content/50">
            Precios en Pesos Mexicanos (MXN)
          </span>
        </div>
      </div>
    </div>
  );
};

export default MySubscriptionView;
