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
import { IconSparkles } from '../components/icons';

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

const LABS_CACHE_KEY = 'lab_labs_list_cache';

export default function Dashboard() {
  const { user } = useUser();
  const { isAdmin, role, isLoading: isUserLoading } = useUserContext();
  const { config, isVipPassed } = useMaintenance();
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

  // Verificadores de Mantenimiento por Módulo
  const isPatientsDisabled = config.modules.patients && !isVipPassed;
  const isCatalogDisabled = config.modules.catalog && !isVipPassed;
  const isWorkOrdersDisabled = config.modules.workOrders && !isVipPassed;
  const isQCDisabled = config.modules.qualityControl && !isVipPassed;
  const isLabsDisabled = config.modules.labsDirectory && !isVipPassed;
  const isSupportDisabled = config.modules.supportChat && !isVipPassed;

  return (
    <Sidebar activeView={activeView} onSelectView={setActiveView}>
      {/* Navbar Superior */}
      <header className="navbar bg-base-100 shadow-sm border-b border-base-200 px-4 lg:px-8 sticky top-0 z-30">
        <div className="flex-none lg:hidden">
          <label htmlFor="main-drawer" className="btn btn-square btn-ghost">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="inline-block w-6 h-6 stroke-current">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path>
            </svg>
          </label>
        </div>

        <div className="flex-1 items-center gap-3">
          <a className="btn btn-ghost text-xl font-black text-primary normal-case lg:hidden">
            LabSystem
          </a>

          <span className="hidden sm:inline-flex badge badge-ghost border border-base-200 py-2.5 px-3 text-xs font-semibold text-base-content/80 gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
            Rol: {role || 'Cargando...'}
          </span>

          {isVipPassed && !isAdmin && (
            <span className="badge badge-accent badge-sm font-bold gap-1 px-3 py-2 rounded-xl">
              ✨ Acceso VIP
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* Botón exclusivo de Administrador para Control de Mantenimiento */}
          {isAdmin && (
            <button
              onClick={() => setIsMaintenanceControlOpen(true)}
              className={`btn btn-sm text-xs font-semibold rounded-xl gap-1.5 transition-all ${
                config.globalMaintenance
                  ? 'btn-error text-error-content shadow-xs animate-pulse font-bold'
                  : 'btn-ghost border border-base-200 hover:bg-base-200 text-base-content/80'
              }`}
              title="Gestor de Mantenimiento y Acceso VIP"
            >
              🛠️ <span className="hidden sm:inline">Mantenimiento</span>
            </button>
          )}

          <button
            onClick={() => setIsOnboardingOpen(true)}
            className="btn btn-sm btn-ghost border border-base-200 hover:bg-base-200 gap-1.5 text-xs text-base-content/80 rounded-xl"
            title="Ver Guía de Inicio Rápido"
          >
            <IconSparkles className="w-3.5 h-3.5 text-primary" />
            <span className="hidden md:inline">Guía</span>
          </button>

          <UserButton
            afterSignOutUrl="/"
            appearance={{
              elements: {
                userButtonAvatarBox: {
                  width: '2.5rem',
                  height: '2.5rem',
                },
              },
            }}
          />
        </div>
      </header>

      {/* Contenido Principal condicional por Vista, Rol y Mantenimiento con React Suspense */}
      <main className={`w-full px-4 py-6 sm:px-6 lg:px-8 mx-auto transition-all ${
        activeView === 'support' ? 'max-w-none' : 'max-w-7xl'
      }`}>
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
                />
              )
            ) : activeView === 'add-user' ? (
              <AddUserForm labs={labs} onCancel={() => setActiveView('dashboard')} />
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

      {/* Modales cargados perezosamente */}
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
      </Suspense>
    </Sidebar>
  );
}