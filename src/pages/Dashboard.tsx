// src/pages/Dashboard.tsx
import { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { UserButton, useUser } from '@clerk/clerk-react';
import Sidebar, { type DashboardViewType } from '../components/Sidebar';
import { useApi } from '../hooks/useApi';
import type { Laboratory } from '../types/lab';
import { useUserContext } from '../hooks/useUserContext';
import { useMaintenance } from '../context/MaintenanceContext';
import AdminDashboardView from '../components/AdminDashboardView';
import OperatorDashboardView from '../components/OperatorDashboardView';
import ModuleMaintenanceView from '../components/ModuleMaintenanceView';
import { IconSparkles, IconMenu, IconSettings, IconFlask } from '../components/icons';

// Carga perezosa (Code Splitting) de vistas pesadas
const CreateLabModal = lazy(() => import('../components/CreateLabModal'));
const OnboardingModal = lazy(() => import('../components/OnboardingModal'));
const AddUserForm = lazy(() => import('../components/AddUserForm'));
const LabsDirectoryView = lazy(() => import('../components/LabsDirectoryView'));
const PatientsView = lazy(() => import('../components/PatientsView'));
const WorkOrdersView = lazy(() => import('../components/WorkOrdersView'));
const AnalysisCatalogView = lazy(() => import('../components/AnalysisCatalogView'));
const QualityControlView = lazy(() => import('../components/QualityControlView'));
const SupportChatView = lazy(() => import('../components/SupportChatView'));
const MaintenanceControlModal = lazy(() => import('../components/MaintenanceControlModal'));
const ReagentsInventoryView = lazy(() => import('../components/ReagentsInventoryView'));
const AnalyzerInterfaceView = lazy(() => import('../components/AnalyzerInterfaceView'));
const GeneralSettingsView = lazy(() => import('../components/GeneralSettingsView'));
const SupportTicketsView = lazy(() => import('../components/SupportTicketsView'));
const SupportBotBubble = lazy(() => import('../components/SupportBotBubble'));
const AuditLogsView = lazy(() => import('../components/AuditLogsView'));
const SystemHealthView = lazy(() => import('../components/SystemHealthView'));
const BroadcastAnnouncementsView = lazy(() => import('../components/BroadcastAnnouncementsView'));
const PriceAgreementsView = lazy(() => import('../components/PriceAgreementsView'));
const ReportTemplateConfigView = lazy(() => import('../components/ReportTemplateConfigView'));
const GlobalAnnouncementBanner = lazy(() => import('../components/GlobalAnnouncementBanner'));
const NetworkMetricsView = lazy(() => import('../components/NetworkMetricsView'));
const SubscriptionsAdminView = lazy(() => import('../components/SubscriptionsAdminView'));
const PlanSelectionModal = lazy(() => import('../components/PlanSelectionModal'));
import { useLabBranding } from '../context/LabBrandingContext';

const LABS_CACHE_KEY = 'lab_labs_list_cache';

export default function Dashboard() {
  const { user } = useUser();
  const { isAdmin, role, isLoading: isUserLoading } = useUserContext();
  const { config, isVipPassed } = useMaintenance();
  const { activeBranding } = useLabBranding();
  const api = useApi();

  const [activeView, setActiveView] = useState<DashboardViewType>('dashboard');
  
  // Carga optimista inmediata de laboratorios desde sessionStorage
  const [labs, setLabs] = useState<Laboratory[]>(() => {
    try {
      const cached = sessionStorage.getItem(LABS_CACHE_KEY);
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });

  const [isLoadingLabs, setIsLoadingLabs] = useState<boolean>(() => labs.length === 0);
  const [isCreateLabOpen, setIsCreateLabOpen] = useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [isMaintenanceControlOpen, setIsMaintenanceControlOpen] = useState(false);
  const [isPlanSelectionOpen, setIsPlanSelectionOpen] = useState(false);

  // Cargar laboratorios de forma silenciosa e hiper rápida
  const fetchLabs = useCallback(async () => {
    try {
      const response = await api.get<Laboratory[]>('/lab');
      const data = response.data || [];
      setLabs(data);
      sessionStorage.setItem(LABS_CACHE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Error al cargar la lista de laboratorios:', error);
    } finally {
      setIsLoadingLabs(false);
    }
  }, [api]);

  useEffect(() => {
    fetchLabs();

    // Detección de retorno de pasarela de pago Polar Checkout
    const params = new URLSearchParams(window.location.search);
    if (params.get('checkout_success') === 'true') {
      const plan = params.get('plan') || '';
      alert(`🎉 ¡Pago procesado con éxito! Tu plan ${plan} está activo con tus 14 días de prueba gratis.`);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [fetchLabs]);

  // Detección de onboarding para primer ingreso
  useEffect(() => {
    if (user?.id) {
      const onboardingKey = `lab_onboarding_completed_${user.id}`;
      const completed = localStorage.getItem(onboardingKey);
      if (!completed) {
        setIsOnboardingOpen(true);
      }
    }
  }, [user?.id]);

  useEffect(() => {
    if (activeView === 'create-lab') {
      setIsCreateLabOpen(true);
      setActiveView('dashboard');
    } else if (activeView === 'my-subscription') {
      setIsPlanSelectionOpen(true);
      setActiveView('dashboard');
    }
  }, [activeView]);

  const handleFinishOnboarding = () => {
    if (user?.id) {
      localStorage.setItem(`lab_onboarding_completed_${user.id}`, 'true');
    }
    setIsOnboardingOpen(false);
    setIsCreateLabOpen(true);
  };

  const handleCloseOnboardingOnly = () => {
    if (user?.id) {
      localStorage.setItem(`lab_onboarding_completed_${user.id}`, 'true');
    }
    setIsOnboardingOpen(false);
  };

  const handleLabCreated = (newLab: Laboratory) => {
    setLabs((prev) => {
      const next = [newLab, ...prev];
      sessionStorage.setItem(LABS_CACHE_KEY, JSON.stringify(next));
      return next;
    });
  };

  const handleLabDeleted = (deletedId: string) => {
    setLabs((prev) => {
      const next = prev.filter((lab) => lab.id !== deletedId);
      sessionStorage.setItem(LABS_CACHE_KEY, JSON.stringify(next));
      return next;
    });
  };

  const handleLabUpdated = (updatedLab: Laboratory) => {
    setLabs((prev) => {
      const next = prev.map((lab) => (lab.id === updatedLab.id ? updatedLab : lab));
      sessionStorage.setItem(LABS_CACHE_KEY, JSON.stringify(next));
      return next;
    });
  };

  // Verificadores de Mantenimiento por Módulo
  const isPatientsDisabled = config.modules.patients && !isVipPassed;
  const isCatalogDisabled = config.modules.catalog && !isVipPassed;
  const isWorkOrdersDisabled = config.modules.workOrders && !isVipPassed;
  const isQCDisabled = config.modules.qualityControl && !isVipPassed;
  const isLabsDisabled = config.modules.labsDirectory && !isVipPassed;
  const isSupportDisabled = config.modules.supportChat && !isVipPassed;
  const isReagentsDisabled = config.modules.reagents && !isVipPassed;
  const isAnalyzersDisabled = config.modules.analyzers && !isVipPassed;
  const isUsersDisabled = config.modules.users && !isVipPassed;
  const isSettingsDisabled = config.modules.settings && !isVipPassed;

  return (
    <>
      <Sidebar
        activeView={activeView}
        onSelectView={setActiveView}
        onOpenCreateLab={() => setIsCreateLabOpen(true)}
      >
      {/* Navbar Superior */}
      <header className="navbar bg-base-100 shadow-sm border-b border-base-200 px-2 sm:px-4 lg:px-8 sticky top-0 z-30 min-h-[3.5rem]">
        <div className="flex-none lg:hidden">
          <label htmlFor="main-drawer" className="btn btn-square btn-ghost btn-sm sm:btn-md" aria-label="Abrir menú">
            <IconMenu className="w-5 h-5" />
          </label>
        </div>

        <div className="flex-1 items-center gap-1.5 sm:gap-3 min-w-0">
          <a className="btn btn-ghost btn-sm sm:btn-md text-base sm:text-lg font-black text-primary normal-case lg:hidden gap-1.5 sm:gap-2 px-1 sm:px-3 max-w-[180px] sm:max-w-xs">
            {activeBranding.logo ? (
              <img src={activeBranding.logo} alt="Logo" className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg object-contain bg-white shrink-0" />
            ) : (
              <span className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-primary text-primary-content flex items-center justify-center shadow-xs shrink-0">
                <IconFlask className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary-content" />
              </span>
            )}
            <span className="truncate max-w-[95px] sm:max-w-[140px] text-xs sm:text-sm font-bold">{activeBranding.name || 'LabSystem'}</span>
          </a>

          <span className="hidden sm:inline-flex badge badge-ghost border border-base-200 py-2.5 px-3 text-xs font-semibold text-base-content/80 gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
            Rol: {role || 'Cargando...'}
          </span>

          {isVipPassed && !isAdmin && (
            <span className="badge badge-accent badge-outline badge-xs sm:badge-sm font-bold gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 sm:py-2 rounded-xl">
              <IconSparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              <span className="hidden xs:inline">Acceso VIP</span>
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 sm:gap-3 shrink-0">
          {/* Botón exclusivo de Administrador para Control de Mantenimiento */}
          {isAdmin && (
            <button
              onClick={() => setIsMaintenanceControlOpen(true)}
              className={`btn btn-xs sm:btn-sm text-xs font-semibold rounded-xl gap-1 sm:gap-1.5 transition-all px-2 sm:px-3 ${
                config.globalMaintenance
                  ? 'btn-error text-error-content shadow-xs animate-pulse font-bold'
                  : 'btn-ghost border border-base-200 hover:bg-base-200 text-base-content/80'
              }`}
              title="Gestor de Mantenimiento y Acceso VIP"
            >
              <IconSettings className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Mantenimiento</span>
            </button>
          )}

          <button
            onClick={() => setIsOnboardingOpen(true)}
            className="btn btn-xs sm:btn-sm btn-ghost border border-base-200 hover:bg-base-200 gap-1 sm:gap-1.5 text-xs text-base-content/80 rounded-xl px-2 sm:px-3"
            title="Ver Guía de Inicio Rápido"
          >
            <IconSparkles className="w-3.5 h-3.5 text-primary" />
            <span className="hidden md:inline">Guía</span>
          </button>

          {/* Botón de Acceso Directo a Synova Soporte Clínico */}
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('open-synova-bot'))}
            className="btn btn-xs sm:btn-sm btn-ghost border border-teal-600/30 text-teal-700 dark:text-teal-400 hover:bg-teal-500/10 gap-1 sm:gap-1.5 text-xs rounded-xl px-2 sm:px-3 font-bold"
            title="Abrir Asistente Synova y Mesa de Ayuda"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="font-serif italic font-black text-xs sm:text-sm">S</span>
            <span className="hidden sm:inline">Synova</span>
          </button>

          <div className="shrink-0 flex items-center">
            <UserButton
              afterSignOutUrl="/"
              appearance={{
                elements: {
                  userButtonAvatarBox: {
                    width: '2.1rem',
                    height: '2.1rem',
                  },
                },
              }}
            />
          </div>
        </div>
      </header>

      {/* Contenido Principal condicional por Vista, Rol y Mantenimiento con React Suspense */}
      <main className={`w-full px-2.5 py-4 sm:px-6 lg:px-8 mx-auto transition-all max-w-full overflow-x-hidden pb-28 sm:pb-32 ${
        activeView === 'support' ? 'max-w-none' : 'max-w-7xl'
      }`}>
        <Suspense fallback={null}>
          <GlobalAnnouncementBanner />
        </Suspense>

        {isUserLoading ? (
          <div className="min-h-[400px] flex flex-col items-center justify-center gap-3">
            <span className="loading loading-spinner loading-lg text-primary"></span>
            <p className="text-sm font-semibold text-base-content/70">Cargando tu panel personalizado...</p>
          </div>
        ) : (
          <Suspense
            fallback={
              <div className="min-h-[350px] flex flex-col items-center justify-center gap-3">
                <span className="loading loading-spinner loading-md text-primary"></span>
                <p className="text-xs font-bold text-base-content/60">Cargando vista del sistema...</p>
              </div>
            }
          >
            {activeView === 'qc-controls' || activeView === 'qc-results' || activeView === 'qc-levey-jennings' ? (
              isQCDisabled ? (
                <ModuleMaintenanceView moduleTitle="Control de Calidad" moduleKeyName="qualityControl" />
              ) : (
                <QualityControlView
                  initialSubView={
                    activeView === 'qc-results'
                      ? 'results'
                      : activeView === 'qc-levey-jennings'
                      ? 'levey-jennings'
                      : 'controls'
                  }
                />
              )
            ) : activeView === 'support' ? (
              isSupportDisabled ? (
                <ModuleMaintenanceView moduleTitle="Soporte Técnico Live" moduleKeyName="supportChat" />
              ) : (
                <SupportChatView />
              )
            ) : activeView === 'analysis-catalog' ? (
              isCatalogDisabled ? (
                <ModuleMaintenanceView moduleTitle="Catálogo de Servicios" moduleKeyName="catalog" />
              ) : (
                <AnalysisCatalogView />
              )
            ) : activeView === 'reagents' ? (
              isReagentsDisabled ? (
                <ModuleMaintenanceView moduleTitle="Inventario de Reactivos e Insumos" moduleKeyName="reagents" />
              ) : (
                <ReagentsInventoryView />
              )
            ) : activeView === 'analyzers' ? (
              isAnalyzersDisabled ? (
                <ModuleMaintenanceView moduleTitle="Analizadores Clínicos LIS" moduleKeyName="analyzers" />
              ) : (
                <AnalyzerInterfaceView />
              )
            ) : activeView === 'create-order' || activeView === 'pending-orders' || activeView === 'completed-orders' ? (
              isWorkOrdersDisabled ? (
                <ModuleMaintenanceView moduleTitle="Órdenes de Trabajo" moduleKeyName="workOrders" />
              ) : (
                <WorkOrdersView
                  initialTab={
                    activeView === 'pending-orders'
                      ? 'pending'
                      : activeView === 'completed-orders'
                      ? 'completed'
                      : 'create'
                  }
                />
              )
            ) : activeView === 'patients' || activeView === 'add-patient' || activeView === 'patient-history' ? (
              isPatientsDisabled ? (
                <ModuleMaintenanceView moduleTitle="Pacientes y Expedientes" moduleKeyName="patients" />
              ) : (
                <PatientsView
                  initialTab={
                    activeView === 'add-patient'
                      ? 'register'
                      : activeView === 'patient-history'
                      ? 'history'
                      : 'directory'
                  }
                />
              )
            ) : activeView === 'labs' ? (
              isLabsDisabled ? (
                <ModuleMaintenanceView moduleTitle="Directorio de Sedes" moduleKeyName="labsDirectory" />
              ) : (
                <LabsDirectoryView
                  labs={labs}
                  isLoadingLabs={isLoadingLabs}
                  onOpenCreateLab={() => setIsCreateLabOpen(true)}
                  onDeleteLabSuccess={handleLabDeleted}
                  onLabUpdated={handleLabUpdated}
                />
              )
            ) : activeView === 'add-user' ? (
              isUsersDisabled ? (
                <ModuleMaintenanceView moduleTitle="Gestión de Usuarios" moduleKeyName="users" />
              ) : (
                <AddUserForm labs={labs} onCancel={() => setActiveView('dashboard')} />
              )
            ) : activeView === 'general-settings' ? (
              isSettingsDisabled ? (
                <ModuleMaintenanceView moduleTitle="Configuración General" moduleKeyName="settings" />
              ) : (
                <GeneralSettingsView labs={labs} />
              )
            ) : activeView === 'tickets' ? (
              isAdmin ? (
                <SupportTicketsView />
              ) : (
                <OperatorDashboardView
                  userName={user?.firstName || undefined}
                  role={role}
                  labs={labs}
                  isLoadingLabs={isLoadingLabs}
                  onOpenCreateLab={() => setIsCreateLabOpen(true)}
                  onOpenOnboarding={() => setIsOnboardingOpen(true)}
                  onDeleteLabSuccess={handleLabDeleted}
                  onNavigate={setActiveView}
                />
              )
            ) : activeView === 'audit-logs' ? (
              isAdmin ? (
                <AuditLogsView />
              ) : (
                <OperatorDashboardView
                  userName={user?.firstName || undefined}
                  role={role}
                  labs={labs}
                  isLoadingLabs={isLoadingLabs}
                  onOpenCreateLab={() => setIsCreateLabOpen(true)}
                  onOpenOnboarding={() => setIsOnboardingOpen(true)}
                  onDeleteLabSuccess={handleLabDeleted}
                  onNavigate={setActiveView}
                />
              )
            ) : activeView === 'system-health' ? (
              isAdmin ? (
                <SystemHealthView />
              ) : (
                <OperatorDashboardView
                  userName={user?.firstName || undefined}
                  role={role}
                  labs={labs}
                  isLoadingLabs={isLoadingLabs}
                  onOpenCreateLab={() => setIsCreateLabOpen(true)}
                  onOpenOnboarding={() => setIsOnboardingOpen(true)}
                  onDeleteLabSuccess={handleLabDeleted}
                  onNavigate={setActiveView}
                />
              )
            ) : activeView === 'announcements' ? (
              isAdmin ? (
                <BroadcastAnnouncementsView />
              ) : (
                <OperatorDashboardView
                  userName={user?.firstName || undefined}
                  role={role}
                  labs={labs}
                  isLoadingLabs={isLoadingLabs}
                  onOpenCreateLab={() => setIsCreateLabOpen(true)}
                  onOpenOnboarding={() => setIsOnboardingOpen(true)}
                  onDeleteLabSuccess={handleLabDeleted}
                  onNavigate={setActiveView}
                />
              )
            ) : activeView === 'price-agreements' ? (
              isAdmin ? (
                <PriceAgreementsView />
              ) : (
                <OperatorDashboardView
                  userName={user?.firstName || undefined}
                  role={role}
                  labs={labs}
                  isLoadingLabs={isLoadingLabs}
                  onOpenCreateLab={() => setIsCreateLabOpen(true)}
                  onOpenOnboarding={() => setIsOnboardingOpen(true)}
                  onDeleteLabSuccess={handleLabDeleted}
                  onNavigate={setActiveView}
                />
              )
            ) : activeView === 'report-templates' ? (
              isAdmin ? (
                <ReportTemplateConfigView />
              ) : (
                <OperatorDashboardView
                  userName={user?.firstName || undefined}
                  role={role}
                  labs={labs}
                  isLoadingLabs={isLoadingLabs}
                  onOpenCreateLab={() => setIsCreateLabOpen(true)}
                  onOpenOnboarding={() => setIsOnboardingOpen(true)}
                  onDeleteLabSuccess={handleLabDeleted}
                  onNavigate={setActiveView}
                />
              )
            ) : activeView === 'network-metrics' ? (
              isAdmin ? (
                <NetworkMetricsView />
              ) : (
                <OperatorDashboardView
                  userName={user?.firstName || undefined}
                  role={role}
                  labs={labs}
                  isLoadingLabs={isLoadingLabs}
                  onOpenCreateLab={() => setIsCreateLabOpen(true)}
                  onOpenOnboarding={() => setIsOnboardingOpen(true)}
                  onDeleteLabSuccess={handleLabDeleted}
                  onNavigate={setActiveView}
                />
              )
            ) : activeView === 'subscriptions-billing' ? (
              isAdmin ? (
                <SubscriptionsAdminView />
              ) : (
                <OperatorDashboardView
                  userName={user?.firstName || undefined}
                  role={role}
                  labs={labs}
                  isLoadingLabs={isLoadingLabs}
                  onOpenCreateLab={() => setIsCreateLabOpen(true)}
                  onOpenOnboarding={() => setIsOnboardingOpen(true)}
                  onDeleteLabSuccess={handleLabDeleted}
                  onNavigate={setActiveView}
                />
              )
            ) : isAdmin ? (
              <AdminDashboardView
                userName={user?.firstName || undefined}
                labs={labs}
                isLoadingLabs={isLoadingLabs}
                onOpenCreateLab={() => setIsCreateLabOpen(true)}
                onOpenOnboarding={() => setIsOnboardingOpen(true)}
                onDeleteLabSuccess={handleLabDeleted}
                onNavigate={setActiveView}
              />
            ) : (
              <OperatorDashboardView
                userName={user?.firstName || undefined}
                role={role}
                labs={labs}
                isLoadingLabs={isLoadingLabs}
                onOpenCreateLab={() => setIsCreateLabOpen(true)}
                onOpenOnboarding={() => setIsOnboardingOpen(true)}
                onDeleteLabSuccess={handleLabDeleted}
                onNavigate={setActiveView}
              />
            )}
          </Suspense>
        )}
      </main>
    </Sidebar>

    {/* Modales cargados perezosamente fuera del Sidebar para superposición y centrado correcto */}
    <Suspense fallback={null}>
      {isOnboardingOpen && (
        <OnboardingModal
          isOpen={isOnboardingOpen}
          onClose={handleCloseOnboardingOnly}
          onStartCreateLab={handleFinishOnboarding}
        />
      )}

      {isCreateLabOpen && (
        <CreateLabModal
          isOpen={isCreateLabOpen}
          onClose={() => setIsCreateLabOpen(false)}
          onLabCreated={handleLabCreated}
        />
      )}

      {isMaintenanceControlOpen && (
        <MaintenanceControlModal
          isOpen={isMaintenanceControlOpen}
          onClose={() => setIsMaintenanceControlOpen(false)}
        />
      )}

      {isPlanSelectionOpen && (
        <PlanSelectionModal
          isOpen={isPlanSelectionOpen}
          onClose={() => setIsPlanSelectionOpen(false)}
          onPlanChanged={() => {
            fetchLabs();
          }}
        />
      )}

      {/* Bot Flotante de Soporte Técnico y Levantamiento de Tickets */}
      <SupportBotBubble onNavigateToFullSupport={() => setActiveView('support')} />
    </Suspense>
  </>
  );
}