// src/components/SubscriptionsAdminView.tsx
import React, { useState, useEffect } from 'react';
import { useApi } from '../hooks/useApi';
import type { AdminSubscriptionItem, PlanType, SubscriptionStatus } from '../types/subscription';
import {
  IconCheckCircle,
  IconAlertCircle,
  IconHistory,
  IconSparkles,
  IconX,
} from './icons';

export const SubscriptionsAdminView: React.FC = () => {
  const api = useApi();
  const [subscriptions, setSubscriptions] = useState<AdminSubscriptionItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [editingItem, setEditingItem] = useState<AdminSubscriptionItem | null>(null);
  const [editPlan, setEditPlan] = useState<PlanType>('BASIC');
  const [editStatus, setEditStatus] = useState<SubscriptionStatus>('TRIAL');
  const [isUpdating, setIsUpdating] = useState(false);

  const fetchSubscriptions = async () => {
    try {
      setIsLoading(true);
      setErrorMsg(null);
      const res = await api.get<AdminSubscriptionItem[]>('/subscription/admin/all');
      setSubscriptions(res.data);
    } catch (e: any) {
      console.error('Error al cargar suscripciones:', e);
      setErrorMsg(
        e?.response?.data?.message || 'Error al consultar las suscripciones de los laboratorios.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const handleOpenEdit = (item: AdminSubscriptionItem) => {
    setEditingItem(item);
    setEditPlan(item.planType);
    setEditStatus(item.status);
  };

  const handleSaveEdit = async () => {
    if (!editingItem) return;

    try {
      setIsUpdating(true);
      setErrorMsg(null);
      await api.patch(`/subscription/admin/${editingItem.id}`, {
        planType: editPlan,
        subscriptionStatus: editStatus,
      });

      setSuccessMsg(`Suscripción actualizada exitosamente para ${editingItem.email}`);
      setEditingItem(null);
      fetchSubscriptions();
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (e: any) {
      setErrorMsg(e?.response?.data?.message || 'Error al actualizar suscripción');
    } finally {
      setIsUpdating(false);
    }
  };

  // Cálculo de MRR y estadísticas rápidas
  const activeSubs = subscriptions.filter((s) => s.status === 'ACTIVE' || s.status === 'TRIAL');
  const estimatedMrr = subscriptions.reduce((sum, s) => {
    if (s.status === 'ACTIVE') {
      return sum + s.priceMxn;
    }
    return sum;
  }, 0);

  return (
    <div className="p-4 sm:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-base-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-base-content tracking-tight">
              Gestión de Suscripciones y Facturación SaaS
            </h1>
            <span className="badge badge-primary text-white font-bold text-[10px]">
              ADMIN GLOBAL
            </span>
          </div>
          <p className="text-xs text-base-content/60 mt-1">
            Control de clientes, planes contratados, cuotas mensuales de órdenes y estado de cobranza.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchSubscriptions}
            className="btn btn-sm btn-ghost border border-base-300 rounded-xl gap-1 text-xs"
          >
            <IconHistory className="w-4 h-4" /> Actualizar
          </button>
        </div>
      </div>

      {/* Alertas */}
      {errorMsg && (
        <div className="alert alert-error text-white rounded-2xl shadow-sm text-xs">
          <IconAlertCircle className="w-4 h-4" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="alert alert-success text-white rounded-2xl shadow-sm text-xs">
          <IconCheckCircle className="w-4 h-4" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Tarjetas de Resumen Financiero */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-3xl bg-base-100 border border-base-200 shadow-xs space-y-1">
          <span className="text-[11px] font-bold text-base-content/50 uppercase tracking-wider">
            Ingresos Mensuales Estimados (MRR)
          </span>
          <div className="text-2xl sm:text-3xl font-black text-success">
            ${estimatedMrr.toLocaleString()} <span className="text-sm font-semibold">MXN</span>
          </div>
          <p className="text-[10px] text-base-content/60">
            Calculado en base a suscripciones activas al corriente
          </p>
        </div>

        <div className="p-5 rounded-3xl bg-base-100 border border-base-200 shadow-xs space-y-1">
          <span className="text-[11px] font-bold text-base-content/50 uppercase tracking-wider">
            Laboratorios / Cuentas Registradas
          </span>
          <div className="text-2xl sm:text-3xl font-black text-base-content">
            {subscriptions.length}
          </div>
          <p className="text-[10px] text-base-content/60">
            {activeSubs.length} con acceso vigente o en periodo de prueba
          </p>
        </div>

        <div className="p-5 rounded-3xl bg-base-100 border border-base-200 shadow-xs space-y-1">
          <span className="text-[11px] font-bold text-base-content/50 uppercase tracking-wider">
            Planes Disponibles
          </span>
          <div className="flex items-center gap-1.5 pt-1">
            <span className="badge badge-ghost badge-sm text-[10px] font-bold">$490 Básico</span>
            <span className="badge badge-primary text-white badge-sm text-[10px] font-bold">$990 Pro</span>
            <span className="badge badge-accent text-white badge-sm text-[10px] font-bold">$1,890 Plus</span>
          </div>
          <p className="text-[10px] text-base-content/60 mt-1">
            Planes accesibles para democratizar software clínico en México
          </p>
        </div>
      </div>

      {/* Tabla de Suscripciones */}
      <div className="bg-base-100 rounded-3xl border border-base-200 p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-base-200 pb-3">
          <div>
            <h3 className="font-bold text-sm sm:text-base text-base-content">
              Directorio de Clientes y Suscripciones
            </h3>
            <p className="text-[11px] text-base-content/60">
              Monitorea el consumo de órdenes del mes corriente y aplica ajustes administrativos
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="py-10 text-center">
            <span className="loading loading-spinner loading-md text-primary"></span>
          </div>
        ) : subscriptions.length === 0 ? (
          <div className="py-8 text-center text-xs text-base-content/40 italic">
            No se encontraron usuarios o laboratorios registrados en la base de datos.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table table-xs w-full">
              <thead>
                <tr className="text-base-content/50 border-b border-base-200">
                  <th>Cliente / Usuario</th>
                  <th>Plan Actual</th>
                  <th>Estado de Cuenta</th>
                  <th>Órdenes este Mes</th>
                  <th>Sedes Registradas</th>
                  <th className="text-right">Acción</th>
                </tr>
              </thead>
              <tbody>
                {subscriptions.map((s) => (
                  <tr key={s.id} className="hover:bg-base-200/40 border-b border-base-100">
                    <td>
                      <div className="font-bold text-base-content">{s.name}</div>
                      <div className="text-[10px] text-base-content/50 font-mono">{s.email}</div>
                    </td>
                    <td>
                      <div className="font-bold text-primary">{s.planName}</div>
                      <div className="text-[10px] text-base-content/60 font-mono">
                        ${s.priceMxn} MXN / mes
                      </div>
                    </td>
                    <td>
                      {s.status === 'ACTIVE' && (
                        <span className="badge badge-success text-white font-bold badge-xs">
                          Al Corriente
                        </span>
                      )}
                      {s.status === 'TRIAL' && (
                        <span className="badge badge-info text-white font-bold badge-xs">
                          Prueba de Cortesía
                        </span>
                      )}
                      {s.status === 'PAST_DUE' && (
                        <span className="badge badge-warning text-warning-content font-bold badge-xs">
                          Pago Pendiente
                        </span>
                      )}
                      {s.status === 'CANCELED' && (
                        <span className="badge badge-error text-white font-bold badge-xs">
                          Suspendido / Cancelado
                        </span>
                      )}
                    </td>
                    <td>
                      <div className="font-mono font-bold text-base-content">
                        {s.ordersThisMonth} / {s.maxOrders > 900000 ? '∞' : s.maxOrders}
                      </div>
                      <div className="w-20 bg-base-200 rounded-full h-1.5 mt-1 overflow-hidden">
                        <div
                          className={`h-full ${
                            s.ordersThisMonth >= s.maxOrders ? 'bg-error' : 'bg-primary'
                          }`}
                          style={{
                            width: `${Math.min(100, Math.round((s.ordersThisMonth / s.maxOrders) * 100))}%`,
                          }}
                        ></div>
                      </div>
                    </td>
                    <td>
                      <span className="font-bold text-base-content">
                        {s.labsCount} / {s.maxLabs > 900000 ? '∞' : s.maxLabs}
                      </span>
                    </td>
                    <td className="text-right">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(s)}
                        className="btn btn-xs btn-ghost text-primary font-bold"
                      >
                        Gestionar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de Edición de Suscripción */}
      {editingItem && (
        <dialog className="modal modal-open backdrop-blur-sm z-50 p-2 sm:p-4">
          <div className="modal-box max-w-md bg-base-100 p-5 rounded-3xl border border-base-200 space-y-4">
            <div className="flex items-center justify-between border-b border-base-200 pb-3">
              <div className="flex items-center gap-2">
                <IconSparkles className="w-4 h-4 text-primary" />
                <h3 className="font-bold text-sm text-base-content">
                  Modificar Plan y Estatus del Cliente
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="btn btn-xs btn-circle btn-ghost"
              >
                <IconX className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs space-y-3">
              <div className="p-2.5 bg-base-200/50 rounded-xl">
                <span className="text-[10px] text-base-content/50 uppercase font-bold block">Cliente</span>
                <span className="font-bold text-base-content">{editingItem.name}</span>
                <span className="block text-[11px] text-base-content/60 font-mono">{editingItem.email}</span>
              </div>

              {/* Selector de Plan */}
              <div className="form-control">
                <label className="label py-0.5">
                  <span className="label-text text-xs font-semibold">Plan Asignado</span>
                </label>
                <select
                  value={editPlan}
                  onChange={(e) => setEditPlan(e.target.value as PlanType)}
                  className="select select-bordered select-xs rounded-xl h-9 text-xs focus:select-primary"
                >
                  <option value="BASIC">Plan Esencial Clínico ($490 MXN / 400 órdenes / 3 sedes)</option>
                  <option value="GROWTH">Plan Clínico Crecimiento ($990 MXN / 1,500 órdenes / 7 sedes)</option>
                  <option value="PRO">Plan Red Hospitalaria ($1,890 MXN / Ilimitado)</option>
                </select>
              </div>

              {/* Selector de Estado de Suscripción */}
              <div className="form-control">
                <label className="label py-0.5">
                  <span className="label-text text-xs font-semibold">Estado de Cobranza</span>
                </label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as SubscriptionStatus)}
                  className="select select-bordered select-xs rounded-xl h-9 text-xs focus:select-primary"
                >
                  <option value="ACTIVE">🟢 Al Corriente (Pagado / Activo)</option>
                  <option value="TRIAL">🔵 Prueba de Cortesía (Vigente)</option>
                  <option value="PAST_DUE">🟡 Pago Pendiente (Periodo de Gracia)</option>
                  <option value="CANCELED">🔴 Suspendido por Falta de Pago</option>
                </select>
              </div>
            </div>

            <div className="modal-action border-t border-base-200 pt-3">
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="btn btn-ghost btn-xs rounded-xl"
                disabled={isUpdating}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                className="btn btn-primary text-white btn-xs rounded-xl font-bold px-4"
                disabled={isUpdating}
              >
                {isUpdating ? <span className="loading loading-spinner loading-xs"></span> : 'Guardar Cambios'}
              </button>
            </div>
          </div>
          <form method="dialog" className="modal-backdrop">
            <button onClick={() => setEditingItem(null)}>close</button>
          </form>
        </dialog>
      )}
    </div>
  );
};

export default SubscriptionsAdminView;
