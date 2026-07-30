// src/components/CaptureResultsModal.tsx
import { useState } from 'react';
import { useApi } from '../hooks/useApi';
import type { WorkOrder } from '../types/order';
import {
  IconClipboardList,
  IconCheckCircle,
  IconAlertCircle,
  IconPrinter,
  IconX,
  IconPlus,
  IconPhone,
  IconMail,
  IconFlask,
} from './icons';

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

  // Estado ÚNICO para la plantilla maestra con todos los campos
  const [fields, setFields] = useState<ClinicalField[]>(() => {
    return MASTER_UNIFIED_TEMPLATE.map((field) => ({ ...field }));
  });

  // Campos globales del reporte médico
  const [method, setMethod] = useState<string>('( Citometría de flujo / Cinético / Espectrofotometría / Físico / Químico / Microscópico )');
  const [responsibleName, setResponsibleName] = useState<string>(
    order.laboratory?.createdBy
      ? `Q.F.B. ${order.laboratory.createdBy.firstName || ''} ${order.laboratory.createdBy.lastName || ''}`.trim()
      : 'Q.F.B. JUAN CARLOS MENDOZA HERNÁNDEZ'
  );
  const [professionalId, setProfessionalId] = useState<string>('5518954');
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

  const whatsappMsg = `🏥 *LABORATORIO CLÍNICO CENTRAL*\n\nHola *${patient?.firstName || 'Paciente'} ${patient?.lastName || ''}*,\n\nTus resultados del *Folio #${folioNumber}* ya han sido validados clínicamente.\n\n📄 Consulta o descarga tu reporte en PDF de forma pública aquí:\n${verificationUrl}\n\n_Atentamente: Q.F.B. Juan Carlos Mendoza_`;

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
  const handleSaveAndCloseOrder = async () => {
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

  const categories = Array.from(new Set(fields.map((f) => f.category)));

  return (
    <>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm overflow-y-auto animate-fade-in">
        <div className="bg-base-100 text-base-content max-w-5xl w-full rounded-3xl p-6 sm:p-8 shadow-2xl border border-base-200 relative my-auto max-h-[94vh] flex flex-col">
          
          {/* ENCABEZADO SUPERIOR */}
          <div className="flex items-center justify-between border-b border-base-200 pb-4 mb-5 shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary/10 text-primary rounded-2xl shrink-0">
                <IconClipboardList className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-black text-base-content">Captura de Resultados Clínicos</h2>
                  <span className="badge badge-primary text-white font-mono text-xs font-bold">
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
          <div className="bg-gradient-to-r from-emerald-900/90 via-teal-900/90 to-slate-900 text-white p-3 rounded-2xl mb-4 flex items-center justify-between text-xs font-semibold shadow-inner shrink-0">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              <span>Despacho de Notificaciones:</span>
              <span className="bg-white/10 px-2 py-0.5 rounded-lg text-[11px] font-mono">📱 WhatsApp: {patientPhone}</span>
              <span className="bg-white/10 px-2 py-0.5 rounded-lg text-[11px] font-mono">📧 Email: {patientEmail}</span>
            </div>
            <span className="text-[10px] text-emerald-300 font-bold uppercase">Apertura Automática al Guardar</span>
          </div>

          {errorMsg && (
            <div className="alert alert-error text-white shadow-md rounded-2xl py-3 mb-4 shrink-0 animate-fade-in">
              <IconAlertCircle className="w-6 h-6 shrink-0" />
              <div className="font-semibold text-sm">{errorMsg}</div>
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

            {/* SECCIÓN DE METODOLOGÍA, RESPONSABLE Y OBSERVACIONES GLOBALES */}
            <div className="bg-base-200/50 p-5 rounded-2xl border border-base-200 space-y-4">
              <h3 className="text-xs font-black uppercase text-base-content/70 tracking-wider">
                Datos Clínicos Complementarios para el PDF
              </h3>

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
                    onChange={(e) => setResponsibleName(e.target.value)}
                    className="input input-sm input-bordered w-full rounded-xl text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="label text-[11px] font-bold text-base-content/70">Cédula Profesional</label>
                  <input
                    type="text"
                    value={professionalId}
                    onChange={(e) => setProfessionalId(e.target.value)}
                    className="input input-sm input-bordered w-full rounded-xl text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="label text-[11px] font-bold text-base-content/70">Observaciones y Diagnóstico Periférico</label>
                <textarea
                  rows={2}
                  value={generalNotes}
                  onChange={(e) => setGeneralNotes(e.target.value)}
                  className="textarea textarea-bordered w-full rounded-xl text-xs font-medium"
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
                onClick={handleSaveAndCloseOrder}
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
          <div className="modal-box max-w-lg bg-base-100 rounded-3xl p-6 sm:p-8 border border-base-200 shadow-2xl text-center space-y-5 animate-fade-in">
            <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 flex items-center justify-center mx-auto shadow-inner">
              <IconCheckCircle className="w-10 h-10" />
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
                  Despacho de Notificaciones al Paciente
                </span>
                <span className="badge badge-accent font-mono text-[10px] font-bold">1-Click Dispatch</span>
              </div>

              {/* Botón WhatsApp Directo */}
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-success text-white w-full rounded-2xl font-bold gap-2 shadow-md hover:scale-[1.01] transition-transform"
              >
                <IconPhone className="w-5 h-5" />
                Abrir y Enviar por WhatsApp Web/App ({patientPhone})
              </a>

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

              {/* Botón Copiar Mensaje */}
              <button
                onClick={handleCopyMessage}
                className="btn btn-sm btn-ghost w-full rounded-xl text-xs font-semibold text-base-content/70"
              >
                {copiedSuccess ? '✓ Mensaje Copiado al Portapapeles' : '📋 Copiar Texto del Mensaje'}
              </button>
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
    </>
  );
}
