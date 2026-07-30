// src/pages/Dashboard.tsx
import { useState, useEffect, useCallback } from 'react';
import { UserButton, useUser } from '@clerk/clerk-react';
import Sidebar, { type DashboardViewType } from '../components/Sidebar';
import { useApi } from '../hooks/useApi';
import type { Laboratory } from '../types/lab';
import { useUserContext } from '../hooks/useUserContext';
import AdminDashboardView from '../components/AdminDashboardView';
import OperatorDashboardView from '../components/OperatorDashboardView';
import CreateLabModal from '../components/CreateLabModal';
import OnboardingModal from '../components/OnboardingModal';
import AddUserForm from '../components/AddUserForm';
import LabsDirectoryView from '../components/LabsDirectoryView';
import PatientsView from '../components/PatientsView';
import WorkOrdersView from '../components/WorkOrdersView';
import AnalysisCatalogView from '../components/AnalysisCatalogView';
import QualityControlView from '../components/QualityControlView';

export default function Dashboard() {
  const { user } = useUser();
  const { isAdmin, role, isLoading: isUserLoading } = useUserContext();
  const api = useApi();

  const [activeView, setActiveView] = useState<DashboardViewType>('dashboard');
  const [labs, setLabs] = useState<Laboratory[]>([]);
  const [isLoadingLabs, setIsLoadingLabs] = useState(true);
  const [isCreateLabOpen, setIsCreateLabOpen] = useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);

  // Cargar laboratorios
  const fetchLabs = useCallback(async () => {
    setIsLoadingLabs(true);
    try {
      const response = await api.get<Laboratory[]>('/lab');
      setLabs(response.data || []);
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
    setLabs((prev) => [newLab, ...prev]);
  };

  const handleLabDeleted = (deletedId: string) => {
    setLabs((prev) => prev.filter((lab) => lab.id !== deletedId));
  };

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
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsOnboardingOpen(true)}
            className="btn btn-sm btn-ghost gap-1.5 text-xs text-base-content/70 hover:text-primary rounded-xl"
            title="Ver Guía de Inicio Rápido"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="hidden md:inline">Guía de Inicio</span>
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

      {/* Contenido Principal condicional por Vista y Rol */}
      <main className="mx-auto max-w-7xl w-full px-4 py-8 lg:px-8">
        {isUserLoading ? (
          <div className="min-h-[400px] flex flex-col items-center justify-center gap-3">
            <span className="loading loading-spinner loading-lg text-primary"></span>
            <p className="text-sm font-semibold text-base-content/70">Cargando tu panel personalizado...</p>
          </div>
        ) : activeView === 'qc-controls' ? (
          /* Sub-vista: Controles (Catálogo) */
          <QualityControlView initialSubView="controls" />
        ) : activeView === 'qc-results' ? (
          /* Sub-vista: Resultados a Controles */
          <QualityControlView initialSubView="results" />
        ) : activeView === 'qc-levey-jennings' ? (
          /* Sub-vista: Gráfica de Levey Jennings */
          <QualityControlView initialSubView="levey-jennings" />
        ) : activeView === 'analysis-catalog' ? (
          /* Catálogo de Servicios / Estudios Clínicos */
          <AnalysisCatalogView />
        ) : activeView === 'create-order' ? (
          /* Crear Orden de Trabajo / Ficha de Paciente */
          <WorkOrdersView initialTab="create" />
        ) : activeView === 'pending-orders' ? (
          /* Órdenes Pendientes */
          <WorkOrdersView initialTab="pending" />
        ) : activeView === 'completed-orders' ? (
          /* Órdenes Completadas */
          <WorkOrdersView initialTab="completed" />
        ) : activeView === 'patients' ? (
          /* Directorio de Pacientes */
          <PatientsView initialTab="directory" />
        ) : activeView === 'add-patient' ? (
          /* Registrar Nuevo Paciente */
          <PatientsView initialTab="register" />
        ) : activeView === 'patient-history' ? (
          /* Historial Clínico de Pacientes */
          <PatientsView initialTab="history" />
        ) : activeView === 'labs' ? (
          /* Vista Exclusiva del Directorio de Sedes Clínicas */
          <LabsDirectoryView
            labs={labs}
            isLoadingLabs={isLoadingLabs}
            onOpenCreateLab={() => setIsCreateLabOpen(true)}
            onDeleteLabSuccess={handleLabDeleted}
          />
        ) : activeView === 'add-user' ? (
          /* Vista de Agregar Usuario al Laboratorio */
          <AddUserForm
            labs={labs}
            onCancel={() => setActiveView('dashboard')}
          />
        ) : isAdmin ? (
          /* Dashboard Exclusivo para ADMIN */
          <AdminDashboardView
            userName={user?.firstName || undefined}
            labs={labs}
            isLoadingLabs={isLoadingLabs}
            onOpenCreateLab={() => setIsCreateLabOpen(true)}
            onOpenOnboarding={() => setIsOnboardingOpen(true)}
            onDeleteLabSuccess={handleLabDeleted}
          />
        ) : (
          /* Dashboard Operativo para TECH y otros roles */
          <OperatorDashboardView
            userName={user?.firstName || undefined}
            role={role}
            labs={labs}
            isLoadingLabs={isLoadingLabs}
            onOpenCreateLab={() => setIsCreateLabOpen(true)}
            onOpenOnboarding={() => setIsOnboardingOpen(true)}
          />
        )}
      </main>

      {/* Modal de Guía de Onboarding */}
      <OnboardingModal
        isOpen={isOnboardingOpen}
        onClose={handleCloseOnboardingOnly}
        onStartCreateLab={handleFinishOnboarding}
      />

      {/* Modal de Crear Laboratorio */}
      <CreateLabModal
        isOpen={isCreateLabOpen}
        onClose={() => setIsCreateLabOpen(false)}
        onLabCreated={handleLabCreated}
      />
    </Sidebar>
  );
}