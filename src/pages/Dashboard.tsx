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

          <span className="hidden sm:inline-flex badge badge-outline text-xs font-semibold">
            Rol: {role || 'Cargando...'}
          </span>

          {isVipPassed && !isAdmin && (
            <span className="badge badge-accent text-xs font-extrabold gap-1 px-3 py-2 rounded-xl">
              ✨ Acceso VIP de Mantenimiento
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Botón exclusivo de Administrador para Control de Mantenimiento */}
          {isAdmin && (
            <button
              onClick={() => setIsMaintenanceControlOpen(true)}
              className={`btn btn-sm text-xs font-black rounded-xl gap-1.5 border-none shadow-sm ${
                config.globalMaintenance
                  ? 'bg-rose-600 text-white hover:bg-rose-700 animate-pulse'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white'
              }`}
              title="Gestor de Mantenimiento y Acceso VIP"
            >
              🛠️ <span className="hidden sm:inline">Mantenimiento</span>
            </button>
          )}

          <button
            onClick={() => setIsOnboardingOpen(true)}
            className="btn btn-sm btn-ghost gap-1.5 text-xs text-base-content/70 hover:text-primary rounded-xl"
            title="Ver Guía de Inicio Rápido"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
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
      <main className="mx-auto max-w-7xl w-full px-4 py-8 lg:px-8">
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
              />
            ) : (
              <OperatorDashboardView
                userName={user?.firstName || undefined}
                role={role}
                labs={labs}
                isLoadingLabs={isLoadingLabs}
                onOpenCreateLab={() => setIsCreateLabOpen(true)}
                onOpenOnboarding={() => setIsOnboardingOpen(true)}
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