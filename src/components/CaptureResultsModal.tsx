import { useState, useMemo } from 'react';
import { useApi } from '../hooks/useApi';
import type { WorkOrder } from '../types/order';
import {
  IconClipboardList,
  IconCheckCircle,
  IconCheck,
  IconAlertCircle,
  IconAlertTriangle,
  IconPrinter,
  IconX,
  IconPlus,
  IconPhone,
  IconSend,
  IconMail,
  IconFlask,
  IconSparkles,
  IconShieldCheck,
  IconAward,
} from './icons';
import {
  evaluatePanicValues,
  generateAICorrelationNote,
} from '../utils/panicValues';
import {
  getSanitarySignatureConfig,
  type SanitarySignatureConfig,
} from '../utils/cryptoSecurity';
import DigitalSignatureModal from './DigitalSignatureModal';
import { useLabBranding } from '../context/LabBrandingContext';

interface CaptureResultsModalProps {
  order: WorkOrder;
  onClose: () => void;
  onSuccess: () => void;
  onOpenPDF: (order: WorkOrder) => void;
}

export interface ClinicalField {
  id: string;
  category: string;
  name: string;
  value: string;
  units: string;
  refVal: string;
}

// PLANTILLA MAESTRA COMPLETA SIN OMISIONES (Páginas 1, 2, 3 y 4 del PDF)
const MASTER_UNIFIED_TEMPLATE: ClinicalField[] = [
  // 1. CITOMETRIA HEMATICA (Página 1)
  { id: 'bhc-1', category: 'CITOMETRIA HEMATICA (Fórmula Roja)', name: 'Eritrocitos', value: '5.0', units: 'mm3', refVal: '4.2 - 5.4' },
  { id: 'bhc-2', category: 'CITOMETRIA HEMATICA (Fórmula Roja)', name: 'Hemoglobina', value: '15.2', units: 'g/dL', refVal: '12.5 - 16.5' },
  { id: 'bhc-3', category: 'CITOMETRIA HEMATICA (Fórmula Roja)', name: 'Hematocrito', value: '46.1', units: '%', refVal: '37 - 50' },
  { id: 'bhc-4', category: 'CITOMETRIA HEMATICA (Fórmula Roja)', name: 'VCM', value: '92.2', units: 'fL', refVal: '78 - 103' },
  { id: 'bhc-5', category: 'CITOMETRIA HEMATICA (Fórmula Roja)', name: 'HCM', value: '30.4', units: 'pg', refVal: '27 - 34' },
  { id: 'bhc-6', category: 'CITOMETRIA HEMATICA (Fórmula Roja)', name: 'CMHC', value: '33.0', units: 'g/dL', refVal: '30 - 35' },
  { id: 'bhc-7', category: 'CITOMETRIA HEMATICA (Fórmula Blanca)', name: 'Leucocitos', value: '6240.0', units: 'mm3', refVal: '4000 - 12000' },
  { id: 'bhc-8', category: 'CITOMETRIA HEMATICA (Diferencial)', name: 'Neutrófilos totales', value: '69', units: '%', refVal: '49 - 79 (Abs. 1800-7700)' },
  { id: 'bhc-9', category: 'CITOMETRIA HEMATICA (Diferencial)', name: 'Neutrófilos segmentados', value: '69', units: '%', refVal: '40 - 70 (Abs. 1800-7000)' },
  { id: 'bhc-10', category: 'CITOMETRIA HEMATICA (Diferencial)', name: 'Neutrófilos en banda', value: '0', units: '%', refVal: '0 - 11 (Abs. 0-700)' },
  { id: 'bhc-11', category: 'CITOMETRIA HEMATICA (Diferencial)', name: 'Linfocitos', value: '29', units: '%', refVal: '13 - 46 (Abs. 1000-4800)' },
  { id: 'bhc-12', category: 'CITOMETRIA HEMATICA (Diferencial)', name: 'Monocitos', value: '1', units: '%', refVal: '0 - 13 (Abs. 0-800)' },
  { id: 'bhc-13', category: 'CITOMETRIA HEMATICA (Diferencial)', name: 'Eosinófilos', value: '1', units: '%', refVal: '0 - 4 (Abs. 0-450)' },
  { id: 'bhc-14', category: 'CITOMETRIA HEMATICA (Diferencial)', name: 'Basófilos', value: '0', units: '%', refVal: '0 - 3 (Abs. 0-200)' },
  { id: 'bhc-15', category: 'CITOMETRIA HEMATICA (Diferencial)', name: 'Metamielocitos', value: '0', units: '%', refVal: '0 - 3' },
  { id: 'bhc-16', category: 'CITOMETRIA HEMATICA (Diferencial)', name: 'Mielocitos', value: '0', units: '%', refVal: '0 - 2' },
  { id: 'bhc-17', category: 'CITOMETRIA HEMATICA (Diferencial)', name: 'Promielocitos', value: '0', units: '%', refVal: '0 - 5' },
  { id: 'bhc-18', category: 'CITOMETRIA HEMATICA (Diferencial)', name: 'Blastos', value: '0', units: '%', refVal: '0 - 3' },
  { id: 'bhc-19', category: 'CITOMETRIA HEMATICA (Plaquetas y VSG)', name: 'Plaquetas', value: '234.0', units: 'mm3', refVal: '150 - 450' },
  { id: 'bhc-20', category: 'CITOMETRIA HEMATICA (Plaquetas y VSG)', name: 'VSG', value: '22.0', units: 'mm/hrs', refVal: '0 - 13' },

  // 2. QUIMICA SANGUINEA COMPLETA (Página 2)
  { id: 'qs-1', category: 'QUIMICA SANGUINEA COMPLETA', name: 'GLUCOSA', value: '261.0', units: 'mg/dL', refVal: '60 - 110' },
  { id: 'qs-2', category: 'QUIMICA SANGUINEA COMPLETA', name: 'UREA', value: '32.0', units: 'mg/dL', refVal: '10 - 50' },
  { id: 'qs-3', category: 'QUIMICA SANGUINEA COMPLETA', name: 'NITROGENO UREICO', value: '14.9', units: 'mg/dL', refVal: '5 - 21' },
  { id: 'qs-4', category: 'QUIMICA SANGUINEA COMPLETA', name: 'CREATININA', value: '0.9', units: 'mg/dL', refVal: '0.5 - 1.4' },
  { id: 'qs-5', category: 'QUIMICA SANGUINEA COMPLETA', name: 'ACIDO URICO', value: '5.2', units: 'mg/dL', refVal: '2.4 - 5.7' },
  { id: 'qs-6', category: 'QUIMICA SANGUINEA COMPLETA', name: 'COLESTEROL TOTAL', value: '182.0', units: 'mg/dL', refVal: '100 - 200' },
  { id: 'qs-7', category: 'QUIMICA SANGUINEA COMPLETA', name: 'TRIGLICERIDOS', value: '136.0', units: 'mg/dL', refVal: '25 - 160' },

  // 3. HEMOGLOBINA GLICOSILADA (Página 3)
  { id: 'hb-1', category: 'HEMOGLOBINA GLICOSILADA', name: 'HEMOGLOBINA GLICOSILADA', value: '8.7', units: '%', refVal: 'NO DIABETICO < 6.5 | DIABETES < 7.5' },
  { id: 'hb-2', category: 'HEMOGLOBINA GLICOSILADA', name: 'ESTIMACION MEDIA DE GLICEMIA', value: '205', units: 'mg/dL', refVal: '70 - 140' },

  // 4. EXAMEN GENERAL DE ORINA (Página 4)
  { id: 'ego-1', category: 'EXAMEN GENERAL DE ORINA (Examen Físico)', name: 'COLOR', value: 'AMARILLO', units: '', refVal: 'AMARILLO' },
  { id: 'ego-2', category: 'EXAMEN GENERAL DE ORINA (Examen Físico)', name: 'ASPECTO', value: 'LIGERAMENTE TURBIO', units: '', refVal: 'TRANSPARENTE' },
  { id: 'ego-3', category: 'EXAMEN GENERAL DE ORINA (Examen Físico)', name: 'DENSIDAD', value: '1.025', units: '', refVal: '1.000 - 1.030' },
  { id: 'ego-4', category: 'EXAMEN GENERAL DE ORINA (Examen Físico)', name: 'SEDIMENTO', value: 'ABUNDANTE', units: '', refVal: 'ESCASO' },
  { id: 'ego-5', category: 'EXAMEN GENERAL DE ORINA (Examen Químico)', name: 'LEUCOCITOS', value: 'NEGATIVO', units: '', refVal: 'NEGATIVO' },
  { id: 'ego-6', category: 'EXAMEN GENERAL DE ORINA (Examen Químico)', name: 'NITRITOS', value: 'NEGATIVO', units: '', refVal: 'NEGATIVO' },
  { id: 'ego-7', category: 'EXAMEN GENERAL DE ORINA (Examen Químico)', name: 'UROBILINOGENO', value: 'NORMAL (0.2)', units: 'mg/dL', refVal: '0 - 0.2 mg/dL' },
  { id: 'ego-8', category: 'EXAMEN GENERAL DE ORINA (Examen Químico)', name: 'PROTEINAS', value: 'POSITIVO (+)', units: '', refVal: 'NEGATIVO' },
  { id: 'ego-9', category: 'EXAMEN GENERAL DE ORINA (Examen Químico)', name: 'HEMOGLOBINA', value: 'NEGATIVO', units: '', refVal: 'NEGATIVO' },
  { id: 'ego-10', category: 'EXAMEN GENERAL DE ORINA (Examen Químico)', name: 'CUERPO CETONICOS', value: 'NEGATIVO', units: '', refVal: 'NEGATIVO' },
  { id: 'ego-11', category: 'EXAMEN GENERAL DE ORINA (Examen Químico)', name: 'BILIRRUBINAS', value: 'NEGATIVO', units: '', refVal: 'NEGATIVO' },
  { id: 'ego-12', category: 'EXAMEN GENERAL DE ORINA (Examen Químico)', name: 'GLUCOSA', value: 'POSITIVO (++)', units: '', refVal: 'NEGATIVO' },
  { id: 'ego-13', category: 'EXAMEN GENERAL DE ORINA (Examen Químico)', name: 'PH', value: '5.0', units: '', refVal: '5.0 - 9.0' },
  { id: 'ego-14', category: 'EXAMEN GENERAL DE ORINA (Sedimento)', name: 'LEUCOCITOS MICROSCOPICO', value: '1 - 2 P/CAMPO', units: '', refVal: '0 - 2 P/CAMPO' },
  { id: 'ego-15', category: 'EXAMEN GENERAL DE ORINA (Sedimento)', name: 'ERITROCITOS', value: 'NO SE OBSERVO', units: '', refVal: 'NO SE OBSERVO' },
  { id: 'ego-16', category: 'EXAMEN GENERAL DE ORINA (Sedimento)', name: 'CRISTALES', value: 'NO SE OBSERVO', units: '', refVal: 'NO SE OBSERVO' },
  { id: 'ego-17', category: 'EXAMEN GENERAL DE ORINA (Sedimento)', name: 'CELULAS ESPERMATICAS', value: 'NO SE OBSERVO', units: '', refVal: 'NO SE OBSERVO' },
  { id: 'ego-18', category: 'EXAMEN GENERAL DE ORINA (Sedimento)', name: 'TRICHOMONAS VAGINALES', value: 'NO SE OBSERVO', units: '', refVal: 'NO SE OBSERVO' },
  { id: 'ego-19', category: 'EXAMEN GENERAL DE ORINA (Sedimento)', name: 'CILINDROS', value: 'NO SE OBSERVO', units: '', refVal: 'NO SE OBSERVO' },
  { id: 'ego-20', category: 'EXAMEN GENERAL DE ORINA (Sedimento)', name: 'BACTERIAS', value: '(+)', units: '', refVal: 'NO SE OBSERVO' },
  { id: 'ego-21', category: 'EXAMEN GENERAL DE ORINA (Sedimento)', name: 'PIOCITOS', value: 'NO SE OBSERVO', units: '', refVal: 'NO SE OBSERVO' },
  { id: 'ego-22', category: 'EXAMEN GENERAL DE ORINA (Sedimento)', name: 'CELULAS EPITELIALES', value: 'SUPERFICIALES (++)', units: '', refVal: 'INTERMEDIAS (+)' },
  { id: 'ego-23', category: 'EXAMEN GENERAL DE ORINA (Sedimento)', name: 'LEVADURAS', value: '(+++)', units: '', refVal: 'NO SE OBSERVO' },
  { id: 'ego-24', category: 'EXAMEN GENERAL DE ORINA (Sedimento)', name: 'OTROS', value: 'NO SE OBSERVO', units: '', refVal: 'NO SE OBSERVO' },
];

export default function CaptureResultsModal({
  order,
  onClose,
  onSuccess,
  onOpenPDF,
}: CaptureResultsModalProps) {
  const api = useApi();
  const patient = order.patient;
  const { activeBranding } = useLabBranding();

  const [signatureConfig, setSignatureConfig] = useState<SanitarySignatureConfig>(getSanitarySignatureConfig);
  const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);

  // Estado ÚNICO para la plantilla maestra con todos los campos
  const [fields, setFields] = useState<ClinicalField[]>(() => {
    return MASTER_UNIFIED_TEMPLATE.map((field) => ({ ...field }));
  });

  // Campos globales del reporte médico
  const [method, setMethod] = useState<string>('( Citometría de flujo / Cinético / Espectrofotometría / Físico / Químico / Microscópico )');
  const [responsibleName, setResponsibleName] = useState<string>(() => {
    const savedConfig = getSanitarySignatureConfig();
    return (
      savedConfig.responsibleName ||
      activeBranding?.responsibleName ||
      (order.laboratory?.createdBy
        ? `Q.F.B. ${order.laboratory.createdBy.firstName || ''} ${order.laboratory.createdBy.lastName || ''}`.trim()
        : 'Q.F.B. JUAN CARLOS MENDOZA HERNÁNDEZ')
    );
  });
  const [professionalId, setProfessionalId] = useState<string>(() => {
    const savedConfig = getSanitarySignatureConfig();
    return savedConfig.professionalLicense || activeBranding?.sanitaryLicense || '5518954';
  });
  const [generalNotes, setGeneralNotes] = useState<string>(
    order.notes?.includes('Observaciones:')
      ? order.notes.split('Observaciones:')?.[1]?.trim()
      : 'NO SE OBSERVO ANOMALIAS EN EL FROTIS PERIFERICO. SUERO NORMAL, ESTUDIO RATIFICADO Y VALIDADO CLINICAMENTE.'
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [savedOrderData, setSavedOrderData] = useState<WorkOrder | null>(null);
  const [showNotificationModal, setShowNotificationModal] = useState<boolean>(false);
  const [copiedSuccess, setCopiedSuccess] = useState<boolean>(false);

  // Detección en tiempo real de Valores de Pánico
  const panicAlerts = useMemo(() => {
    return evaluatePanicValues(fields);
  }, [fields]);

  const [isPanicConfirmOpen, setIsPanicConfirmOpen] = useState(false);
  const [isPanicRatified, setIsPanicRatified] = useState(false);
  const [hasRecheckedSample, setHasRecheckedSample] = useState(false);
  const [isGeneratingCorrelation, setIsGeneratingCorrelation] = useState(false);

  const handleSuggestCorrelation = () => {
    setIsGeneratingCorrelation(true);
    setTimeout(() => {
      const aiNote = generateAICorrelationNote(fields, patient?.dateOfBirth, patient?.gender);
      setGeneralNotes(aiNote);
      setIsGeneratingCorrelation(false);
    }, 350);
  };

  // Formatear datos de contacto del paciente
  const patientPhone = (patient?.phone || '').trim() || '9211234567';
  const patientEmail = (patient?.email || '').trim() || 'paciente@ejemplo.com';
  const folioNumber = order.folio || order.id.slice(0, 6);
  const appOrigin = window.location.origin.includes('localhost')
    ? window.location.origin.replace('https://', 'http://')
    : window.location.origin;
  const verificationUrl = `${appOrigin}/results/${order.id}`;

  // Formatear número para WhatsApp con prefijo de México +52 si no tiene otro prefijo
  const rawDigits = patientPhone.replace(/[^\d]/g, '');
  const cleanPhone = rawDigits.length === 10 ? `52${rawDigits}` : rawDigits;

  const surveyUrl = `${window.location.origin}/survey/${order.id}`;
  const labName = (order.laboratory?.name || 'LABORATORIO CLÍNICO CENTRAL').toUpperCase();
  const whatsappMsg = panicAlerts.length > 0
    ? `🚨 *AVISO DE VALOR CRÍTICO - ${labName}*\n\nHola *${patient?.firstName || 'Paciente'} ${patient?.lastName || ''}*:\nSe han emitido tus resultados del *Folio #${folioNumber}* con parámetros de atención prioritaria:\n${panicAlerts.map(p => `• *${p.paramName}*: ${p.value} ${p.units} (${p.panicThresholdDescription})`).join('\n')}\n\n📄 Consulta tu informe médico validado aquí:\n${verificationUrl}\n\n⭐ Tu opinión es importante. Califícanos aquí:\n👉 ${surveyUrl}\n\n_Por favor ponte en contacto con tu médico tratante a la brevedad._`
    : `🏥 *${labName}*\n\nHola *${patient?.firstName || 'Paciente'} ${patient?.lastName || ''}*,\n\nTus resultados del *Folio #${folioNumber}* ya han sido validados clínicamente.\n\n📄 Consulta o descarga tu reporte en PDF aquí:\n${verificationUrl}\n\n⭐ *¿Cómo fue tu experiencia hoy?*\nTu opinión nos ayuda a brindarte la mejor atención. Califícanos en 30 segundos aquí:\n👉 ${surveyUrl}\n\n_Atentamente: Q.F.B. Juan Carlos Mendoza_`;

  const whatsappUrl = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(whatsappMsg)}`;
  const mailtoUrl = `mailto:${patientEmail}?subject=Resultados%20de%20Laboratorio%20-%20Folio%20%23${folioNumber}&body=${encodeURIComponent(whatsappMsg)}`;

  // Actualizar un campo individual de la plantilla
  const handleFieldChange = (id: string, property: keyof ClinicalField, value: string) => {
    setFields((prev) =>
      prev.map((f) => (f.id === id ? { ...f, [property]: value } : f))
    );
  };

  // Añadir un nuevo campo personalizado a la plantilla
  const handleAddField = () => {
    const newField: ClinicalField = {
      id: `custom-${Date.now()}`,
      category: 'CAMPOS ADICIONALES',
      name: 'Nuevo Parámetro Clínico',
      value: '',
      units: 'mg/dL',
      refVal: '100 - 200',
    };
    setFields((prev) => [...prev, newField]);
  };

  // Guardar y Cerrar Orden + Abrir Panel de Notificaciones
  const handleSaveAndCloseOrder = async (bypassPanicCheck = false) => {
    if (panicAlerts.length > 0 && !isPanicRatified && !bypassPanicCheck) {
      setIsPanicConfirmOpen(true);
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      // Guardar el 100% de los campos sin filtrar ni omitir ninguno
      const consolidatedResult = JSON.stringify(
        fields.map((f) => ({
          cat: f.category,
          name: f.name,
          val: f.value || 'Sin dato',
          units: f.units || '',
          ref: f.refVal || 'NORMAL',
        }))
      );

      const analysesList = order.analyses && order.analyses.length > 0 ? order.analyses : [{ analysisId: order.id }];
      const resultsPayload = analysesList.map((item) => ({
        analysisId: item.analysisId,
        resultValue: consolidatedResult,
        reagent: 'Desglose Completo PDF',
        units: 'Varios',
      }));

      const payload = {
        results: resultsPayload,
        method: method.trim() || undefined,
        responsibleName: responsibleName.trim() || undefined,
        professionalId: professionalId.trim() || undefined,
        notes: generalNotes.trim() || undefined,
      };

      let resData: WorkOrder;
      try {
        const res = await api.post<WorkOrder>(`/orders/${order.id}/results`, payload);
        resData = res.data;
      } catch (err: any) {
        if (err?.response?.status === 404) {
          const res = await api.patch<WorkOrder>(`/orders/${order.id}/results`, payload);
          resData = res.data;
        } else {
          throw err;
        }
      }

      setSavedOrderData(resData);
      setShowNotificationModal(true);

      onSuccess();
    } catch (err: any) {
      console.error('Error al capturar resultados:', err);
      const rawMsg = err?.response?.data?.message || err?.message;
      setErrorMsg(Array.isArray(rawMsg) ? rawMsg.join(', ') : rawMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Copiar mensaje al portapapeles
  const handleCopyMessage = () => {
    navigator.clipboard.writeText(whatsappMsg);
    setCopiedSuccess(true);
    setTimeout(() => setCopiedSuccess(false), 3000);
  };

  const [isSendingAutoWA, setIsSendingAutoWA] = useState(false);
  const [autoWASuccessMsg, setAutoWASuccessMsg] = useState<string | null>(null);

  // Disparo 100% Automático por UltraMsg desde el modal
  const handleTriggerAutoWhatsApp = async () => {
    setIsSendingAutoWA(true);
    setAutoWASuccessMsg(null);
    try {
      const res = await api.post<{ success: boolean; phone: string; folio: string | number; message: string }>(
        `/orders/${order.id}/whatsapp`
      );
      setAutoWASuccessMsg(
        `✅ Notificación enviada automáticamente a +${res.data?.phone || cleanPhone} vía UltraMsg.`
      );
    } catch (err: any) {
      console.error('Error re-enviando WhatsApp automático:', err);
      alert('No se pudo re-enviar el WhatsApp automático con UltraMsg. Puedes usar la opción de respaldo.');
    } finally {
      setIsSendingAutoWA(false);
    }
  };

  const [isSendingSms, setIsSendingSms] = useState(false);
  const [smsSuccessMsg, setSmsSuccessMsg] = useState<string | null>(null);

  // Disparo por SMS mediante AWS SNS
  const handleTriggerSms = async () => {
    setIsSendingSms(true);
    setSmsSuccessMsg(null);
    try {
      const res = await api.post<{ success: boolean; phone: string; folio: string | number; message: string }>(
        `/orders/${order.id}/sms`
      );
      setSmsSuccessMsg(
        `✅ SMS de AWS SNS enviado exitosamente a +${res.data?.phone || cleanPhone}.`
      );
    } catch (err: any) {
      console.error('Error enviando SMS de AWS:', err);
      alert('No se pudo enviar el SMS con AWS SNS.');
    } finally {
      setIsSendingSms(false);
    }
  };

  const categories = Array.from(new Set(fields.map((f) => f.category)));

  return (
    <>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-6 bg-slate-900/60 backdrop-blur-sm overflow-y-auto animate-fade-in">
        <div className="bg-base-100 text-base-content max-w-5xl w-full max-w-[96vw] rounded-2xl p-3.5 sm:p-7 shadow-2xl border border-base-200 relative my-auto max-h-[94vh] flex flex-col">
          
          {/* ENCABEZADO SUPERIOR */}
          <div className="flex items-center justify-between border-b border-base-200 pb-4 mb-4 shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-primary/10 text-primary rounded-xl shrink-0">
                <IconClipboardList className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg sm:text-xl font-black text-base-content">Captura de Resultados Clínicos</h2>
                  <span className="badge badge-primary text-primary-content font-mono text-xs font-bold">
                    FOLIO #{folioNumber}
                  </span>
                </div>
                <p className="text-xs text-base-content/60 font-medium">
                  Paciente: <strong className="text-base-content">{patient?.firstName} {patient?.lastName}</strong> ({patient?.gender === 'M' ? 'Masculino' : 'Femenino'}) | Formato Clínico Integrado
                </p>
              </div>
            </div>

            <button onClick={onClose} className="btn btn-sm btn-circle btn-ghost text-base-content/50">
              <IconX className="w-5 h-5" />
            </button>
          </div>

          {/* BANNER INFORMATIVO DE ENVÍO DE NOTIFICACIONES */}
          <div className="bg-base-200/60 border border-base-300 text-base-content p-3 rounded-xl mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-semibold shrink-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-success inline-block"></span>
              <span>Despacho de Notificaciones:</span>
              <span className="bg-base-300/80 px-2 py-0.5 rounded-md text-[11px] font-mono">📱 {patientPhone}</span>
              <span className="bg-base-300/80 px-2 py-0.5 rounded-md text-[11px] font-mono">📧 {patientEmail}</span>
            </div>
            <span className="text-[10px] text-primary font-bold uppercase">Apertura Automática al Guardar</span>
          </div>

          {/* BANNER DE VALORES DE PÁNICO DETECTADOS */}
          {panicAlerts.length > 0 && (
            <div className="alert alert-error text-white shadow-md rounded-2xl py-3 px-4 mb-4 shrink-0 flex items-start gap-3 border-2 border-red-300 animate-pulse">
              <IconAlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
              <div className="flex-1 text-xs space-y-1">
                <div className="font-black text-sm uppercase tracking-wide flex items-center justify-between">
                  <span>⚠️ ¡Atención! {panicAlerts.length} Valor(es) Crítico(s) de Pánico Detectado(s)</span>
                  {isPanicRatified && (
                    <span className="badge badge-sm bg-white text-error font-bold gap-1">
                      <IconShieldCheck className="w-3.5 h-3.5" /> Ratificado
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                  {panicAlerts.map((pa) => (
                    <span key={pa.paramId} className="bg-black/20 px-2 py-1 rounded-lg font-mono text-[11px] font-bold">
                      {pa.paramName}: {pa.value} {pa.units} ({pa.panicThresholdDescription})
                    </span>
                  ))}
                </div>
                <p className="text-[11px] opacity-90 leading-tight pt-0.5">
                  Protocolo ISO 15189: Requiere verificación en segundo analizador o frotis antes de liberar resultados.
                </p>
              </div>
            </div>
          )}

          {errorMsg && (
            <div className="alert alert-error text-white shadow-sm rounded-xl py-2.5 mb-4 shrink-0 animate-fade-in text-xs font-medium">
              <IconAlertCircle className="w-5 h-5 shrink-0" />
              <div>{errorMsg}</div>
            </div>
          )}

          {/* CUERPO CON DESPLAZAMIENTO VERTICAL */}
          <div className="flex-1 overflow-y-auto pr-1 space-y-6">
            {categories.map((catName) => {
              const catFields = fields.filter((f) => f.category === catName);
              return (
                <div key={catName} className="bg-base-200/50 p-4 sm:p-5 rounded-2xl border border-base-200 space-y-3">
                  <div className="flex items-center justify-between border-b border-base-300 pb-2">
                    <h3 className="text-sm font-black uppercase text-primary tracking-wider flex items-center gap-2">
                      <IconFlask className="w-4 h-4" />
                      {catName}
                    </h3>
                    <span className="badge badge-sm badge-neutral font-mono font-bold">
                      {catFields.length} parámetros
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {catFields.map((field) => (
                      <div key={field.id} className="bg-base-100 p-3 rounded-xl border border-base-200 flex flex-col justify-between gap-1 shadow-xs hover:border-primary/40 transition-all">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold uppercase text-base-content/90 truncate max-w-[200px]" title={field.name}>
                            {field.name}
                          </span>
                          <span className="text-[10px] font-mono font-semibold text-base-content/50 truncate max-w-[140px]">
                            Ref: {field.refVal}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 mt-1">
                          <input
                            type="text"
                            value={field.value}
                            onChange={(e) => handleFieldChange(field.id, 'value', e.target.value)}
                            className="input input-sm input-bordered font-mono font-bold text-sm w-full rounded-lg focus:input-primary bg-base-200/30"
                            placeholder="Ingrese resultado..."
                          />
                          <span className="text-xs font-mono font-semibold text-base-content/60 shrink-0 min-w-[45px] text-right">
                            {field.units}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}

            {/* SECCIÓN DE METODOLOGÍA, RESPONSABLE, FIRMA Y OBSERVACIONES GLOBALES */}
            <div className="bg-base-200/50 p-5 rounded-2xl border border-base-200 space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <h3 className="text-xs font-black uppercase text-base-content/80 tracking-wider">
                    Datos Clínicos Complementarios & Firma Sanitaria
                  </h3>
                  <p className="text-[11px] text-base-content/60 font-medium">
                    Aparecerán impresos al pie del informe médico con validez oficial
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsSignatureModalOpen(true)}
                  className="btn btn-xs sm:btn-sm btn-outline btn-primary rounded-xl gap-1.5 font-bold shadow-xs hover:scale-[1.02] transition-transform"
                  title="Configurar o dibujar la firma del Responsable Sanitario"
                >
                  <IconAward className="w-4 h-4 text-primary" />
                  <span>{signatureConfig.signatureDataUrl ? 'Editar Firma Sanitaria' : 'Dibujar / Asignar Firma'}</span>
                </button>
              </div>

              {/* Tarjeta Visual de Estado de Firma Digital del Responsable */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-base-100 p-3.5 rounded-2xl border border-base-300/80 shadow-xs">
                <div className="flex items-center gap-3">
                  {signatureConfig.signatureDataUrl ? (
                    <div className="p-1.5 bg-white rounded-xl border border-slate-200 shadow-xs shrink-0">
                      <img
                        src={signatureConfig.signatureDataUrl}
                        alt="Firma Digital"
                        className="h-9 max-w-[130px] object-contain"
                      />
                    </div>
                  ) : (
                    <div className="w-11 h-11 rounded-xl bg-base-200/80 border border-dashed border-base-content/20 flex items-center justify-center text-base-content/40 shrink-0">
                      <IconAward className="w-5 h-5 text-base-content/40" />
                    </div>
                  )}
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-black text-base-content uppercase">
                        {signatureConfig.responsibleName || responsibleName}
                      </span>
                      {signatureConfig.signatureDataUrl ? (
                        <span className="badge badge-xs badge-success text-white font-bold gap-1 py-1 px-1.5">
                          <IconCheck className="w-2.5 h-2.5" /> Firma Lista
                        </span>
                      ) : (
                        <span className="badge badge-xs badge-warning text-white font-bold py-1 px-1.5">
                          Pendiente de Firma
                        </span>
                      )}
                    </div>
                    <p className="text-[10.5px] text-base-content/70 font-mono font-semibold">
                      CÉD. PROF. {signatureConfig.professionalLicense || professionalId} {signatureConfig.digitalCertificateId ? `• ${signatureConfig.digitalCertificateId}` : ''}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsSignatureModalOpen(true)}
                  className="btn btn-xs btn-ghost text-primary font-bold hover:bg-primary/10 rounded-xl"
                >
                  {signatureConfig.signatureDataUrl ? 'Cambiar Trazo' : '+ Dibujar Firma Ahora'}
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="label text-[11px] font-bold text-base-content/70">Métodos Analíticos</label>
                  <input
                    type="text"
                    value={method}
                    onChange={(e) => setMethod(e.target.value)}
                    className="input input-sm input-bordered w-full rounded-xl text-xs font-semibold"
                  />
                </div>
                <div>
                  <label className="label text-[11px] font-bold text-base-content/70">Químico Responsable</label>
                  <input
                    type="text"
                    value={responsibleName}
                    onChange={(e) => {
                      setResponsibleName(e.target.value);
                      setSignatureConfig((prev) => ({ ...prev, responsibleName: e.target.value }));
                    }}
                    className="input input-sm input-bordered w-full rounded-xl text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="label text-[11px] font-bold text-base-content/70">Cédula Profesional</label>
                  <input
                    type="text"
                    value={professionalId}
                    onChange={(e) => {
                      setProfessionalId(e.target.value);
                      setSignatureConfig((prev) => ({ ...prev, professionalLicense: e.target.value }));
                    }}
                    className="input input-sm input-bordered w-full rounded-xl text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-bold text-base-content/70">Observaciones y Dictamen Clínico</label>
                  <button
                    type="button"
                    onClick={handleSuggestCorrelation}
                    disabled={isGeneratingCorrelation}
                    className="btn btn-xs btn-outline btn-primary rounded-lg font-bold gap-1 shadow-xs"
                    title="Generar dictamen orientativo preliminar con Synova IA"
                  >
                    {isGeneratingCorrelation ? (
                      <span className="loading loading-spinner loading-xs"></span>
                    ) : (
                      <IconSparkles className="w-3.5 h-3.5 text-primary" />
                    )}
                    Dictamen con Synova IA
                  </button>
                </div>
                <textarea
                  rows={3}
                  value={generalNotes}
                  onChange={(e) => setGeneralNotes(e.target.value)}
                  placeholder="Observaciones clínicas, notas del frotis o dictamen diagnóstico..."
                  className="textarea textarea-bordered w-full rounded-xl text-xs font-medium leading-relaxed"
                ></textarea>
              </div>
            </div>
          </div>

          {/* BARRA DE ACCIONES INFERIOR */}
          <div className="border-t border-base-200 pt-4 mt-4 flex items-center justify-between shrink-0">
            <button
              onClick={handleAddField}
              className="btn btn-sm btn-outline btn-neutral rounded-2xl gap-1 text-xs"
            >
              <IconPlus className="w-4 h-4" />
              Añadir Campo Personalizado
            </button>

            <div className="flex items-center gap-3">
              <button onClick={onClose} className="btn btn-ghost rounded-2xl text-xs">
                Cancelar
              </button>
              <button
                onClick={() => handleSaveAndCloseOrder(false)}
                disabled={isSubmitting}
                className="btn btn-primary text-white font-bold rounded-2xl shadow-lg gap-2"
              >
                {isSubmitting ? (
                  <>
                    <span className="loading loading-spinner loading-xs"></span>
                    Guardando y Notificando...
                  </>
                ) : (
                  <>
                    <IconCheckCircle className="w-5 h-5" />
                    Guardar, Notificar y Cerrar Orden
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL DE CONTROL Y DESPACHO MANUAL DE NOTIFICACIONES */}
      {showNotificationModal && savedOrderData && (
        <dialog className="modal modal-open backdrop-blur-md z-[120]">
          <div className="modal-box w-full max-w-[95vw] sm:max-w-lg bg-base-100 rounded-3xl p-4 sm:p-8 border border-base-200 shadow-2xl text-center space-y-4 sm:space-y-5 animate-fade-in max-h-[90vh] overflow-y-auto">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-3xl bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 flex items-center justify-center mx-auto shadow-inner shrink-0">
              <IconCheckCircle className="w-8 h-8 sm:w-10 sm:h-10" />
            </div>

            <div>
              <h3 className="text-2xl font-black text-base-content">¡Resultados Guardados Exitosamente!</h3>
              <p className="text-xs text-base-content/60 mt-1">
                La orden de trabajo del paciente <strong className="text-base-content">{patient?.firstName} {patient?.lastName}</strong> cambió a estatus <span className="badge badge-success text-white font-bold text-xs">COMPLETADA</span>.
              </p>
            </div>

            {/* Opciones de Despacho Inmediato */}
            <div className="bg-base-200/60 p-4 rounded-2xl border border-base-200 text-left space-y-3">
              <div className="flex items-center justify-between border-b border-base-300 pb-2">
                <span className="text-xs font-black uppercase text-base-content/70">
                  Despacho Automático al Paciente (UltraMsg)
                </span>
                <span className="badge badge-success text-white font-mono text-[10px] font-bold">Auto-Dispatch</span>
              </div>

              {/* Banner informativo de envío automático */}
              <div className="bg-success/10 border border-success/30 rounded-xl p-3 flex items-start gap-2.5 text-xs text-base-content">
                <IconCheckCircle className="w-5 h-5 text-success shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block text-success text-xs sm:text-sm">
                    {smsSuccessMsg || autoWASuccessMsg || '¡Notificación automática despachada en segundo plano!'}
                  </span>
                  <p className="text-[11px] text-base-content/70 mt-0.5">
                    El sistema notificó a <strong>+{patientPhone}</strong> con el folio #{folioNumber} y el enlace al reporte oficial.
                  </p>
                </div>
              </div>

              {/* Botón Envío por SMS de AWS SNS */}
              <button
                type="button"
                onClick={handleTriggerSms}
                disabled={isSendingSms}
                className="btn btn-info text-white w-full rounded-2xl font-bold gap-2 shadow-md hover:scale-[1.01] transition-transform"
              >
                {isSendingSms ? (
                  <span className="loading loading-spinner loading-sm"></span>
                ) : (
                  <IconSend className="w-5 h-5" />
                )}
                <span>Enviar Notificación por SMS (AWS SNS)</span>
              </button>

              {/* Botón Re-enviar Automático por UltraMsg */}
              <button
                type="button"
                onClick={handleTriggerAutoWhatsApp}
                disabled={isSendingAutoWA}
                className="btn btn-success text-white w-full rounded-2xl font-bold gap-2 shadow-md hover:scale-[1.01] transition-transform"
              >
                {isSendingAutoWA ? (
                  <span className="loading loading-spinner loading-sm"></span>
                ) : (
                  <IconPhone className="w-5 h-5" />
                )}
                <span>Re-enviar WhatsApp Automático (UltraMsg)</span>
              </button>

              {/* Botón Correo Electrónico */}
              <a
                href={mailtoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-neutral text-white w-full rounded-2xl font-bold gap-2 shadow-sm"
              >
                <IconMail className="w-5 h-5" />
                Enviar Reporte por Correo ({patientEmail})
              </a>

              {/* Opciones secundarias de respaldo */}
              <div className="pt-1 flex items-center justify-between text-xs text-base-content/60">
                <button
                  type="button"
                  onClick={handleCopyMessage}
                  className="link link-hover inline-flex items-center gap-1 font-semibold"
                >
                  <IconClipboardList className="w-3.5 h-3.5" />
                  {copiedSuccess ? '¡Texto Copiado!' : 'Copiar Texto'}
                </button>

                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="link link-hover inline-flex items-center gap-1 font-semibold text-primary"
                  title="Abrir WhatsApp Web manualmente como respaldo si UltraMsg no estuviera disponible"
                >
                  <IconPhone className="w-3.5 h-3.5" />
                  Abrir WhatsApp Web (Respaldo manual)
                </a>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-center gap-3">
              <button
                onClick={() => {
                  setShowNotificationModal(false);
                  onOpenPDF(savedOrderData);
                  onClose();
                }}
                className="btn btn-primary text-white font-bold rounded-2xl gap-2 w-full shadow-lg"
              >
                <IconPrinter className="w-5 h-5" />
                Ver e Imprimir Reporte PDF
              </button>
            </div>
          </div>
        </dialog>
      )}

      {/* MODAL DE CONFIRMACIÓN DE VALORES DE PÁNICO (ISO 15189) */}
      {isPanicConfirmOpen && (
        <dialog className="modal modal-open z-[65]">
          <div className="modal-box w-full max-w-[95vw] sm:max-w-lg bg-base-100 rounded-3xl p-4 sm:p-6 border-2 border-error/40 shadow-2xl space-y-4 sm:space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start gap-3 sm:gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-error/15 text-error flex items-center justify-center shrink-0">
                <IconAlertTriangle className="w-6 h-6 sm:w-7 sm:h-7 animate-pulse" />
              </div>
              <div>
                <div className="badge badge-error text-white font-bold text-xs uppercase tracking-wider mb-1">
                  Protocolo Crítico ISO 15189
                </div>
                <h3 className="font-extrabold text-lg text-base-content leading-tight">
                  Ratificación de Valores Críticos (Pánico)
                </h3>
                <p className="text-xs text-base-content/70 mt-1">
                  Se detectaron analitos que comprometen el estado fisiológico inmediato del paciente.
                </p>
              </div>
            </div>

            <div className="bg-error/5 border border-error/20 rounded-2xl p-4 space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-error block">
                Analitos Fuera de Rango Vital:
              </span>
              <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                {panicAlerts.map((a, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs bg-base-100/80 p-2 rounded-xl border border-error/20">
                    <span className="font-bold text-base-content">{a.paramName}</span>
                    <div className="text-right">
                      <span className="font-mono font-black text-error text-sm">{a.value} {a.units}</span>
                      <span className="block text-[10px] text-base-content/60 font-semibold">{a.panicThresholdDescription}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-warning/10 border border-warning/30 rounded-2xl p-3.5 flex items-start gap-3">
              <input
                type="checkbox"
                id="panic-recheck"
                checked={hasRecheckedSample}
                onChange={(e) => setHasRecheckedSample(e.target.checked)}
                className="checkbox checkbox-error mt-0.5 rounded-lg"
              />
              <label htmlFor="panic-recheck" className="text-xs text-base-content/80 font-medium cursor-pointer leading-relaxed select-none">
                <strong className="text-base-content font-bold">Certificación Obligatoria:</strong> He verificado la integridad de la muestra y ratifico que los valores fueron comprobados o correlacionados en el equipo analizador antes de su liberación al expediente.
              </label>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsPanicConfirmOpen(false)}
                className="btn btn-ghost rounded-2xl text-xs font-bold"
              >
                Volver a Revisar Analitos
              </button>
              <button
                type="button"
                disabled={!hasRecheckedSample}
                onClick={() => {
                  setIsPanicRatified(true);
                  setIsPanicConfirmOpen(false);
                  handleSaveAndCloseOrder(true);
                }}
                className="btn btn-error text-white font-bold rounded-2xl text-xs gap-2 shadow-lg hover:scale-[1.02] transition-transform disabled:opacity-50"
              >
                <IconShieldCheck className="w-4 h-4" />
                Ratificar y Liberar Orden
              </button>
            </div>
          </div>
        </dialog>
      )}

      {/* MODAL PARA DIBUJAR O CARGAR FIRMA SANITARIA DIGITAL */}
      <DigitalSignatureModal
        isOpen={isSignatureModalOpen}
        onClose={() => setIsSignatureModalOpen(false)}
        onSaved={(newCfg) => {
          setSignatureConfig(newCfg);
          setResponsibleName(newCfg.responsibleName);
          setProfessionalId(newCfg.professionalLicense);
        }}
      />
    </>
  );
}
