// src/components/ReportTemplateConfigView.tsx
import { useState, useEffect, useCallback } from 'react';
import { useApi } from '../hooks/useApi';
import { useUserContext } from '../hooks/useUserContext';
import { useLabBranding } from '../context/LabBrandingContext';
import type { ReportTemplateConfig, OrderVerificationResult } from '../types/report-template';
import { toast } from 'react-toastify';
import {
  IconQrCode,
  IconShield,
  IconRefresh,
  IconCheckCircle,
  IconFileText,
  IconEye,
  IconX,
} from './icons';

export default function ReportTemplateConfigView() {
  const api = useApi();
  const { isAdmin } = useUserContext();
  const { activeBranding } = useLabBranding();

  const [config, setConfig] = useState<ReportTemplateConfig>({
    id: 'default_template',
    headerText: 'INFORME OFICIAL DE RESULTADOS CLÍNICOS',
    footerText: 'Los resultados fuera de los límites de referencia deben ser evaluados por el médico tratante.',
    showQrCode: true,
    showDigitalSeal: true,
    sanitaryLegalText: 'Laboratorio de Diagnóstico Clínico acreditado y certificado conforme a normas sanitarias oficiales vigentes.',
    signatureTitle: 'Responsable Sanitario de la Sede',
    signatureName: 'Q.F.B. Especialista en Análisis Clínicos',
    licenseNumber: 'CED. PROF. FEDERAL 98745612',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesterOpen, setIsTesterOpen] = useState(false);
  const [testFolio, setTestFolio] = useState('');
  const [verificationResult, setVerificationResult] = useState<OrderVerificationResult | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  const fetchConfig = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/report-template/config');
      if (res.data) {
        setConfig(res.data);
      }
    } catch (err) {
      console.error('Error fetching template config:', err);
      toast.error('No se pudo cargar la configuración de plantillas');
    } finally {
      setIsLoading(false);
    }
  }, [api]);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await api.put('/report-template/config', config);
      if (res.data) {
        setConfig(res.data);
      }
      toast.success('Plantilla oficial y firma sanitaria guardadas correctamente');
    } catch {
      toast.error('Error al guardar la configuración de plantilla');
    } finally {
      setIsSaving(false);
    }
  };

  const handleVerifyTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testFolio.trim()) {
      toast.warning('Ingresa un folio u orden para probar la validación');
      return;
    }

    setIsVerifying(true);
    try {
      const res = await api.get(`/report-template/verify/${testFolio.trim()}`);
      setVerificationResult(res.data);
    } catch {
      toast.error('Folio u orden no encontrada en el registro oficial');
      setVerificationResult(null);
    } finally {
      setIsVerifying(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="card bg-base-100 border border-base-200 p-8 text-center rounded-2xl shadow-xs">
        <IconShield className="w-12 h-12 text-warning mx-auto mb-3" />
        <h2 className="text-lg font-bold text-base-content">Acceso Exclusivo de Administrador</h2>
        <p className="text-xs text-base-content/70 mt-1">
          La personalización de la plantilla médica institucional y sellos sanitarios está reservada al Administrador Global.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 1. Cabecera */}
      <section className="card bg-base-100 border border-base-200 p-5 sm:p-6 shadow-xs rounded-2xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="badge badge-sm badge-outline text-primary border-primary/30 font-semibold gap-1.5 py-2.5 px-3">
                <IconQrCode className="w-3.5 h-3.5" />
                Validez Legal y Trazabilidad
              </span>
              <span className="badge badge-sm badge-ghost text-base-content/60 font-medium">
                ISO 15189 §5.8
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-base-content tracking-tight">
              Configurador de Plantilla Oficial y Código QR
            </h1>
            <p className="text-xs sm:text-sm text-base-content/70 max-w-2xl leading-relaxed">
              Personaliza el membrete, leyenda sanitaria y firmas electrónicas que acompañan a los informes médicos de los pacientes.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setIsTesterOpen(true)}
              className="btn btn-outline border-base-300 hover:bg-base-200 btn-sm gap-2 font-semibold rounded-xl text-xs"
            >
              <IconEye className="w-4 h-4 text-primary" />
              Probar Validador QR
            </button>
            <button
              onClick={fetchConfig}
              className="btn btn-ghost btn-sm border border-base-200 hover:bg-base-200 gap-1.5 rounded-xl text-xs font-semibold"
              disabled={isLoading}
            >
              <IconRefresh className={`w-4 h-4 ${isLoading ? 'animate-spin text-primary' : ''}`} />
              Recargar
            </button>
          </div>
        </div>
      </section>

      {/* 2. Cuadrícula: Formulario a la Izquierda, Previsualización a la Derecha */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Formulario de Configuración (7 Columnas) */}
        <div className="lg:col-span-7 space-y-4">
          <form onSubmit={handleSave} className="card bg-base-100 border border-base-200 p-5 sm:p-6 rounded-2xl shadow-xs space-y-4 text-xs">
            <h2 className="text-sm font-bold text-base-content uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-base-200">
              <IconFileText className="w-4 h-4 text-primary" />
              Parámetros de la Plantilla Médica
            </h2>

            <div>
              <label className="text-[11px] font-bold text-base-content/70 block mb-1">
                Encabezado Principal del Informe *
              </label>
              <input
                type="text"
                value={config.headerText}
                onChange={(e) => setConfig({ ...config, headerText: e.target.value })}
                className="input input-sm input-bordered w-full rounded-xl text-xs font-semibold"
                required
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-base-content/70 block mb-1">
                Leyenda Legal y Acreditación Sanitaria (COFEPRIS / ISO)
              </label>
              <textarea
                value={config.sanitaryLegalText}
                onChange={(e) => setConfig({ ...config, sanitaryLegalText: e.target.value })}
                rows={2}
                className="textarea textarea-bordered w-full rounded-xl text-xs"
              ></textarea>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-base-content/70 block mb-1">
                  Nombre del Responsable Sanitario *
                </label>
                <input
                  type="text"
                  value={config.signatureName}
                  onChange={(e) => setConfig({ ...config, signatureName: e.target.value })}
                  className="input input-sm input-bordered w-full rounded-xl text-xs font-semibold"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-base-content/70 block mb-1">
                  Cédula Profesional Oficial *
                </label>
                <input
                  type="text"
                  value={config.licenseNumber}
                  onChange={(e) => setConfig({ ...config, licenseNumber: e.target.value })}
                  className="input input-sm input-bordered w-full rounded-xl text-xs font-mono uppercase"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-base-content/70 block mb-1">
                Título o Cargo Sanitario
              </label>
              <input
                type="text"
                value={config.signatureTitle}
                onChange={(e) => setConfig({ ...config, signatureTitle: e.target.value })}
                className="input input-sm input-bordered w-full rounded-xl text-xs"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-base-content/70 block mb-1">
                Pie de Página / Advertencia Clínica al Paciente
              </label>
              <textarea
                value={config.footerText}
                onChange={(e) => setConfig({ ...config, footerText: e.target.value })}
                rows={2}
                className="textarea textarea-bordered w-full rounded-xl text-xs"
              ></textarea>
            </div>

            <div className="p-4 bg-base-200/50 rounded-xl space-y-3 border border-base-200">
              <span className="text-[11px] font-bold text-base-content/80 uppercase block">
                Candados de Seguridad y Autenticidad
              </span>

              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <span className="font-semibold text-base-content text-xs block">
                    Código QR de Verificación
                  </span>
                  <span className="text-[10px] text-base-content/60 block">
                    Permite a médicos y pacientes validar la autenticidad del estudio desde su smartphone
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={config.showQrCode}
                  onChange={(e) => setConfig({ ...config, showQrCode: e.target.checked })}
                  className="toggle toggle-primary toggle-sm"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer pt-2 border-t border-base-200">
                <div>
                  <span className="font-semibold text-base-content text-xs block">
                    Sello Digital Criptográfico
                  </span>
                  <span className="text-[10px] text-base-content/60 block">
                    Imprime una firma digital con marca temporal única para evitar falsificaciones
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={config.showDigitalSeal}
                  onChange={(e) => setConfig({ ...config, showDigitalSeal: e.target.checked })}
                  className="toggle toggle-primary toggle-sm"
                />
              </label>
            </div>

            <div className="flex justify-end pt-3">
              <button
                type="submit"
                className="btn btn-primary btn-sm rounded-xl font-semibold gap-2 shadow-xs"
                disabled={isSaving}
              >
                <IconCheckCircle className="w-4 h-4" />
                {isSaving ? 'Guardando...' : 'Guardar Configuración'}
              </button>
            </div>
          </form>
        </div>

        {/* Previsualización en Vivo de la Hoja Clínica (5 Columnas) */}
        <div className="lg:col-span-5 space-y-2">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold text-base-content uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-success animate-pulse"></span>
              Vista Previa en Vivo (Simulación de Impresión)
            </span>
            <span className="text-[10px] text-base-content/50">Hoja Membretada</span>
          </div>

          <div className="bg-white text-slate-900 p-6 rounded-2xl shadow-md border border-base-300 font-sans text-xs space-y-4 min-h-[580px] flex flex-col justify-between">
            {/* Membrete Superior */}
            <div className="border-b-2 border-slate-800 pb-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  {activeBranding?.logo ? (
                    <img
                      src={activeBranding.logo}
                      alt="Logo"
                      className="w-10 h-10 object-contain rounded-lg"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-teal-700 text-white font-black text-base flex items-center justify-center">
                      {activeBranding?.name?.charAt(0) || 'S'}
                    </div>
                  )}
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-900 uppercase tracking-tight">
                      {activeBranding?.name || 'SYNOVA LAB DIAGNOSTICS'}
                    </h3>
                    <p className="text-[10px] text-slate-500 font-medium">
                      {activeBranding?.address || 'Ciudad de México, México'}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[9px] font-bold text-teal-700 tracking-wider uppercase block">
                    FOLIO CLÍNICO
                  </span>
                  <span className="font-mono text-sm font-extrabold text-slate-900">#004821</span>
                </div>
              </div>

              <div className="mt-3 text-center bg-slate-100 py-1 rounded">
                <span className="text-[11px] font-bold text-slate-800 tracking-wide uppercase">
                  {config.headerText}
                </span>
              </div>
            </div>

            {/* Datos Simulados del Paciente */}
            <div className="grid grid-cols-2 gap-2 text-[10px] p-2.5 bg-slate-50 rounded border border-slate-200">
              <div>
                <span className="text-slate-400 block font-semibold">PACIENTE:</span>
                <span className="font-bold text-slate-800">JUAN CARLOS PÉREZ LÓPEZ</span>
              </div>
              <div>
                <span className="text-slate-400 block font-semibold">EDAD / GÉNERO:</span>
                <span className="font-bold text-slate-800">38 Años • Masculino</span>
              </div>
              <div>
                <span className="text-slate-400 block font-semibold">MÉDICO TRATANTE:</span>
                <span className="font-bold text-slate-800">DR. ROBERTO SALAS M.</span>
              </div>
              <div>
                <span className="text-slate-400 block font-semibold">FECHA DE EMISIÓN:</span>
                <span className="font-bold text-slate-800">
                  {new Date().toLocaleDateString('es-MX')}
                </span>
              </div>
            </div>

            {/* Tabla de Resultados Simulados */}
            <div className="space-y-1 flex-1">
              <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 border-b border-slate-300 pb-1">
                <span>ESTUDIO / PARÁMETRO</span>
                <span>RESULTADO</span>
                <span>REFERENCIA</span>
              </div>

              <div className="flex items-center justify-between text-[11px] py-1 border-b border-slate-100">
                <span className="font-semibold text-slate-800">Glucosa en Suero</span>
                <span className="font-mono font-bold text-slate-900">92.4 mg/dL</span>
                <span className="text-[10px] text-slate-500">70.0 - 100.0</span>
              </div>

              <div className="flex items-center justify-between text-[11px] py-1 border-b border-slate-100">
                <span className="font-semibold text-slate-800">Colesterol Total</span>
                <span className="font-mono font-bold text-amber-700">208.1 mg/dL *</span>
                <span className="text-[10px] text-slate-500">&lt; 200.0</span>
              </div>

              <div className="flex items-center justify-between text-[11px] py-1 border-b border-slate-100">
                <span className="font-semibold text-slate-800">Triglicéridos</span>
                <span className="font-mono font-bold text-slate-900">134.0 mg/dL</span>
                <span className="text-[10px] text-slate-500">&lt; 150.0</span>
              </div>
            </div>

            {/* Leyenda Sanitaria */}
            <div className="text-[9px] text-slate-500 text-center italic border-t border-slate-200 pt-2">
              {config.sanitaryLegalText}
            </div>

            {/* Bloque de Firmas y QR */}
            <div className="border-t-2 border-slate-800 pt-3 flex items-center justify-between gap-3">
              {/* QR y Sello */}
              {config.showQrCode ? (
                <div className="flex items-center gap-2">
                  <div className="p-1 border border-slate-300 rounded bg-white shrink-0">
                    <IconQrCode className="w-10 h-10 text-slate-900" />
                  </div>
                  {config.showDigitalSeal && (
                    <div className="text-[8px] text-slate-500 font-mono leading-tight">
                      <span className="font-bold text-teal-800 block">SELLO DIGITAL CLÍNICO:</span>
                      <span>SHA256: 8f9b7c...a241</span>
                      <span className="block text-slate-400">Escanea para verificar autenticidad</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-[9px] text-slate-400 italic">Sin código QR impreso</div>
              )}

              {/* Firma */}
              <div className="text-right">
                <div className="w-36 border-b border-slate-400 mb-1 ml-auto"></div>
                <p className="font-bold text-[10px] text-slate-900">{config.signatureName}</p>
                <p className="text-[9px] text-slate-600">{config.signatureTitle}</p>
                <p className="font-mono text-[8px] text-slate-500">{config.licenseNumber}</p>
              </div>
            </div>

            {/* Footer Text */}
            <div className="text-[8px] text-slate-400 text-center pt-1 border-t border-slate-100">
              {config.footerText}
            </div>
          </div>
        </div>
      </div>

      {/* Modal Tester de Validación QR */}
      {isTesterOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="card bg-base-100 border border-base-200 shadow-2xl rounded-2xl w-full max-w-lg animate-scale-up">
            <div className="p-4 sm:p-5 border-b border-base-200 flex items-center justify-between">
              <h3 className="font-bold text-sm text-base-content flex items-center gap-2">
                <IconQrCode className="w-4 h-4 text-primary" />
                Validador Público de Autenticidad QR
              </h3>
              <button
                onClick={() => {
                  setIsTesterOpen(false);
                  setVerificationResult(null);
                }}
                className="btn btn-ghost btn-xs btn-circle"
              >
                <IconX className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 sm:p-5 space-y-4 text-xs">
              <p className="text-base-content/70">
                Esta es la pantalla oficial de verificación que un paciente o médico observa al escanear el código QR con su celular:
              </p>

              <form onSubmit={handleVerifyTest} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Ingresa un folio de prueba (ej: 1, 2, o ID)"
                  value={testFolio}
                  onChange={(e) => setTestFolio(e.target.value)}
                  className="input input-sm input-bordered flex-1 rounded-xl text-xs font-mono"
                />
                <button
                  type="submit"
                  disabled={isVerifying}
                  className="btn btn-primary btn-sm rounded-xl font-semibold text-xs"
                >
                  {isVerifying ? 'Verificando...' : 'Verificar'}
                </button>
              </form>

              {verificationResult && (
                <div className="p-4 bg-success/10 border border-success/30 rounded-xl space-y-2.5 animate-fade-in">
                  <div className="flex items-center gap-2 text-success font-bold text-xs">
                    <IconCheckCircle className="w-4 h-4" />
                    <span>DOCUMENTO AUTÉNTICO VERIFICADO</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] pt-2 border-t border-success/20">
                    <div>
                      <span className="text-base-content/50 block font-semibold">Folio Oficial:</span>
                      <span className="font-mono font-bold text-base-content">
                        #{verificationResult.folio}
                      </span>
                    </div>
                    <div>
                      <span className="text-base-content/50 block font-semibold">Paciente:</span>
                      <span className="font-bold text-base-content">
                        {verificationResult.patientInitials}
                      </span>
                    </div>
                    <div>
                      <span className="text-base-content/50 block font-semibold">Laboratorio Emisor:</span>
                      <span className="font-bold text-base-content">
                        {verificationResult.laboratoryName}
                      </span>
                    </div>
                    <div>
                      <span className="text-base-content/50 block font-semibold">Estado:</span>
                      <span className="badge badge-success text-white badge-xs font-bold">
                        {verificationResult.status}
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-success/20 text-[10px] text-base-content/60 font-mono">
                    Estudios ({verificationResult.studyCount}): {verificationResult.studies.join(', ')}
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-base-200 flex justify-end">
              <button
                onClick={() => {
                  setIsTesterOpen(false);
                  setVerificationResult(null);
                }}
                className="btn btn-sm btn-ghost rounded-xl text-xs"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
