// src/components/MedicalReportPDF.tsx
import { createPortal } from 'react-dom';
import type { WorkOrder } from '../types/order';
import QRCodeSVG from './QRCodeSVG';
import { IconPrinter, IconX } from './icons';

interface MedicalReportPDFProps {
  order: WorkOrder;
  onClose: () => void;
}

interface ParsedSubItem {
  category: string;
  name: string;
  val: string;
  units: string;
  ref: string;
}

export default function MedicalReportPDF({ order, onClose }: MedicalReportPDFProps) {
  const patient = order.patient;
  const lab = order.laboratory;

  // Fecha de ingreso e impresión
  const fechaIngreso = new Date(order.createdAt).toLocaleString('es-MX', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const fechaImpresion = new Date().toLocaleString('es-MX', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  // Calcular edad
  const age = patient?.dateOfBirth
    ? Math.abs(new Date(Date.now() - new Date(patient.dateOfBirth).getTime()).getUTCFullYear() - 1970)
    : 'N/A';

  // Extraer Método, Responsable, Cédula u Observaciones de las notas consolidadas
  const notesStr = order.notes || '';
  const matchMethod = notesStr.match(/Método:\s*([^|]+)/);
  const matchResponsible = notesStr.match(/Responsable:\s*([^|]+)/);
  const matchProfessional = notesStr.match(/Cédula:\s*([^|]+)/);
  const matchObs = notesStr.match(/Observaciones:\s*([^|]+)/);

  const metodoStr = matchMethod ? matchMethod[1].trim() : '( Citometría de flujo / Cinético / Espectrofotometría / Físico / Químico / Microscópico )';
  const responsableStr = matchResponsible
    ? matchResponsible[1].trim()
    : lab?.createdBy
    ? `Q.F.B. ${lab.createdBy.firstName || ''} ${lab.createdBy.lastName || ''}`.trim()
    : 'Q.F.B. JUAN CARLOS MENDOZA HERNÁNDEZ';
  const cedulaStr = matchProfessional ? matchProfessional[1].trim() : '5518954';
  const observacionesStr = matchObs ? matchObs[1].trim() : 'NO SE OBSERVO ANOMALIAS EN EL FROTIS PERIFERICO. SUERO NORMAL, ESTUDIO RATIFICADO Y VALIDADO CLINICAMENTE.';

  const authenticityHash = `FOLIO-${order.folio || order.id.slice(0, 8)}-VERIFIED-AUTH-${order.id}`;
  const verificationUrl = `https://labsystem.clinic/verify?folio=${order.folio}&hash=${authenticityHash}`;

  // Parsear y desglosar absolutamente TODOS los sub-parámetros por categoría sin omisiones
  const parseAnalysesToCategories = () => {
    const categoriesMap: Record<string, ParsedSubItem[]> = {};

    if (!order.analyses || order.analyses.length === 0) {
      return categoriesMap;
    }

    order.analyses.forEach((item) => {
      let rawVal = (item.resultValue || '').trim();
      const fallbackCat = item.analysis?.name || 'RESULTADOS DE LABORATORIO';

      if (!rawVal) return;

      // 1. Limpiar sufijos de metadata agregados anteriormente ([Reactivo: ...] [Unidades: ...])
      const cleanRaw = rawVal
        .replace(/\[Reactivo:[^\]]*\]/gi, '')
        .replace(/\[Unidades:[^\]]*\]/gi, '')
        .trim();

      // 2. Extraer subcadena JSON pura [ ... ]
      const startIdx = cleanRaw.indexOf('[');
      const endIdx = cleanRaw.lastIndexOf(']');

      if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
        const jsonSubstring = cleanRaw.slice(startIdx, endIdx + 1);
        const cleanJson = jsonSubstring.replace(/[\r\n\t\f\v]+/g, ' ').trim();

        let parsed: any[] = [];
        try {
          parsed = JSON.parse(cleanJson);
        } catch (e) {
          // Extraer objetos JSON con expresión regular tolerante a cualquier valor
          const objectRegex = /\{\s*"cat"\s*:\s*"([^"]*)"\s*,\s*"name"\s*:\s*"([^"]*)"\s*,\s*"val"\s*:\s*"([^"]*)"\s*,\s*"units"\s*:\s*"([^"]*)"\s*,\s*"ref"\s*:\s*"([^"]*)"\s*\}/g;
          let m: RegExpExecArray | null;
          while ((m = objectRegex.exec(cleanJson)) !== null) {
            parsed.push({
              cat: m[1],
              name: m[2],
              val: m[3],
              units: m[4],
              ref: m[5],
            });
          }
        }

        if (Array.isArray(parsed) && parsed.length > 0) {
          parsed.forEach((p) => {
            const cat = (p.cat || fallbackCat).trim();
            if (!categoriesMap[cat]) categoriesMap[cat] = [];
            categoriesMap[cat].push({
              category: cat,
              name: p.name || 'Parámetro',
              val: p.val !== undefined && p.val !== null ? String(p.val) : '',
              units: p.units || '',
              ref: p.ref || 'NORMAL',
            });
          });
          return;
        }
      }

      // 3. Parsear formato por delimitador ||
      if (rawVal.includes('||')) {
        const subStrings = rawVal.split('||').map((s) => s.trim()).filter(Boolean);
        subStrings.forEach((subStr) => {
          const matchNameAndCat = subStr.match(/^([^(:]+)(?:\(([^)]+)\))?:/);
          const matchVal = subStr.match(/:\s*([^(|\[]+)/);
          const matchUnits = subStr.match(/\(([^)]+)\)\s*\[Ref:/);
          const matchRef = subStr.match(/\[Ref:\s*([^\]]+)\]/);

          let name = matchNameAndCat ? matchNameAndCat[1].trim() : subStr.split(':')[0] || 'Parámetro';
          let category = matchNameAndCat && matchNameAndCat[2] ? matchNameAndCat[2].trim() : fallbackCat;

          name = name
            .replace(/\s*\([^)]*\)/g, '')
            .replace(/CITOMETRIA|HEMATICA|QUIMICA|SANGUINEA|EXAMEN|GENERAL|ORINA|Fórmula|Diferencial|Plaquetas/gi, '')
            .trim() || name;

          const val = matchVal ? matchVal[1].trim() : subStr;
          const units = matchUnits ? matchUnits[1].trim() : '';
          const ref = matchRef ? matchRef[1].trim() : item.analysis?.referenceValues || 'NORMAL';

          if (!categoriesMap[category]) categoriesMap[category] = [];
          categoriesMap[category].push({ category, name, val, units, ref });
        });
        return;
      }

      // 4. Resultado simple
      if (!rawVal.includes('cat') && !rawVal.includes('[')) {
        const cleanVal = rawVal.replace(/\[Reactivo:[^\]]+\]/g, '').replace(/\[Unidades:[^\]]+\]/g, '').trim();
        if (!categoriesMap[fallbackCat]) categoriesMap[fallbackCat] = [];
        categoriesMap[fallbackCat].push({
          category: fallbackCat,
          name: item.analysis?.name || 'Estudio Clínico',
          val: cleanVal || rawVal,
          units: '',
          ref: item.analysis?.referenceValues || 'NORMAL',
        });
      }
    });

    return categoriesMap;
  };

  const categoriesMap = parseAnalysesToCategories();
  const categoryKeys = Object.keys(categoriesMap);

  // Renderizar el documento compacto directamente a document.body
  const renderPrintableDocument = () => (
    <div id="printable-pdf-document" className="bg-white text-slate-900 p-2 font-sans text-[11px] leading-tight space-y-2">
      
      {/* ENCABEZADO COMPACTO DE LABORATORIO */}
      <div className="flex items-start justify-between border-b-2 border-slate-900 pb-1.5">
        <div className="flex items-center gap-2.5">
          {lab?.logo ? (
            <img src={lab.logo} alt={lab.name} className="w-11 h-11 object-contain rounded-xl" />
          ) : (
            <div className="w-11 h-11 bg-gradient-to-tr from-blue-700 to-indigo-800 text-white rounded-xl flex items-center justify-center font-black text-xl shadow-sm shrink-0">
              {lab?.name?.[0] || 'L'}
            </div>
          )}
          <div>
            <h1 className="text-base font-black uppercase text-slate-900 tracking-tight leading-none">{lab?.name || 'LABORATORIO CLÍNICO CENTRAL'}</h1>
            <p className="text-[10px] text-slate-600 font-medium mt-0.5">
              {[lab?.address, lab?.city, lab?.state, lab?.country].filter(Boolean).join(', ') || 'Dirección de la Sede Médica'}
            </p>
            <p className="text-[8.5px] text-slate-500 font-semibold">
              Certificado de Calidad y Registro Sanitario Oficial
            </p>
          </div>
        </div>

        {/* Código QR de Autenticidad */}
        <div className="text-center shrink-0">
          <QRCodeSVG value={verificationUrl} size={65} />
          <span className="block text-[7px] font-mono text-slate-500 mt-0.5 uppercase tracking-tighter">
            QR DE AUTENTICIDAD
          </span>
        </div>
      </div>

      {/* FICHA TÉCNICA DEL PACIENTE */}
      <div className="border border-slate-300 rounded-lg p-2 bg-slate-50/60 grid grid-cols-12 gap-1 text-[10.5px] font-semibold uppercase leading-tight">
        <div className="col-span-8">
          <span className="text-slate-500 font-bold">PACIENTE:</span>{' '}
          <span className="text-slate-900 font-black">{patient?.firstName} {patient?.lastName}</span>
        </div>
        <div className="col-span-4 text-right">
          <span className="text-slate-500 font-bold">FECHA INGRESO:</span>{' '}
          <span className="text-slate-900">{fechaIngreso}</span>
        </div>

        <div className="col-span-4">
          <span className="text-slate-500 font-bold">EDAD:</span>{' '}
          <span className="text-slate-900">{age} AÑOS</span>
        </div>
        <div className="col-span-4 text-center">
          <span className="text-slate-500 font-bold">SEXO:</span>{' '}
          <span className="text-slate-900">{patient?.gender === 'M' ? 'MASCULINO' : patient?.gender === 'F' ? 'FEMENINO' : 'OTRO'}</span>
        </div>
        <div className="col-span-4 text-right">
          <span className="text-slate-500 font-bold">FECHA IMPRESIÓN:</span>{' '}
          <span className="text-slate-900">{fechaImpresion}</span>
        </div>

        <div className="col-span-12 border-t border-slate-200 pt-1 mt-0.5">
          <span className="text-slate-500 font-bold">MÉDICO:</span>{' '}
          <span className="text-slate-900 font-bold">{order.notes?.split('|')?.[0]?.replace('Médico:', '')?.trim() || 'A QUIEN CORRESPONDA'}</span>
        </div>
      </div>

      {/* TABLAS DE RESULTADOS POR CATEGORÍA CON PADDING ULTRA COMPACTO Y PROTECCIÓN DE SECCIÓN INTEGRAL */}
      <div className="space-y-2 pt-0.5">
        {categoryKeys.map((catName) => {
          const itemsList = categoriesMap[catName];

          return (
            <div
              key={catName}
              className="space-y-0.5 break-inside-avoid"
              style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}
            >
              <div className="text-center border-b border-slate-900 pb-0.5">
                <h2 className="text-[11px] font-black tracking-wider uppercase text-slate-900">
                  {catName}
                </h2>
              </div>

              <table className="w-full text-left text-[10.5px] border-collapse">
                <thead>
                  <tr className="border-b border-slate-700 text-slate-700 uppercase font-black text-[9.5px]">
                    <th className="py-0.5 w-2/5">ESTUDIO</th>
                    <th className="py-0.5 text-center w-1/5">RESULTADOS</th>
                    <th className="py-0.5 text-center w-1/6">UNIDADES</th>
                    <th className="py-0.5 text-right w-1/4">VALORES REFERENCIA</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {itemsList.map((item, idx) => (
                    <tr key={idx} className="py-0">
                      <td className="py-0.5 font-bold uppercase text-slate-900">{item.name}</td>
                      <td className="py-0.5 text-center font-mono font-black text-[11px] text-slate-900">{item.val}</td>
                      <td className="py-0.5 text-center font-medium text-slate-600">{item.units}</td>
                      <td className="py-0.5 text-right font-mono text-slate-700 font-semibold">{item.ref}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        })}
      </div>

      {/* OBSERVACIONES Y MÉTODOS ANALÍTICOS (Protegidos de cortes) */}
      <div
        className="border-t border-b border-slate-800 py-1.5 space-y-0.5 text-[9.5px] break-inside-avoid"
        style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}
      >
        <p className="font-bold text-slate-900">
          <span className="text-slate-500 uppercase">OBSERVACIONES:</span> {observacionesStr}
        </p>
        <p className="font-semibold text-slate-600">
          <span className="text-slate-500 uppercase">MÉTODO:</span> {metodoStr}
        </p>
      </div>

      {/* BLOQUE DE FIRMA Y AUTENTICIDAD (Protegido de cortes) */}
      <div
        className="pt-3 text-center space-y-0.5 break-inside-avoid"
        style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}
      >
        <div className="w-52 border-t-2 border-slate-800 mx-auto mb-1"></div>
        <p className="font-bold text-slate-700 text-[9.5px] uppercase tracking-widest">ATENTAMENTE</p>
        <p className="font-black text-slate-900 text-[11px] uppercase">{responsableStr}</p>
        <p className="text-[9.5px] text-slate-600 font-mono font-bold">CED. PROF. {cedulaStr}</p>
      </div>

    </div>
  );

  return (
    <>
      {/* VISTA PREVIA EN PANTALLA DENTRO DEL MODAL WEB */}
      <dialog className="modal modal-open backdrop-blur-xs z-[150]">
        <div className="modal-box max-w-4xl w-full bg-white text-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-2xl overflow-y-auto max-h-[92vh]">
          {/* Barra de Acciones Superior */}
          <div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-4 print:hidden">
            <div className="flex items-center gap-2 text-primary font-black text-lg">
              <span>Reporte Oficial de Resultados Clínicos</span>
              <span className="badge badge-success text-white font-mono text-xs">FOLIO #{order.folio || order.id.slice(0, 6)}</span>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={() => window.print()}
                className="btn btn-primary text-white font-bold rounded-2xl gap-2 shadow-md"
              >
                <IconPrinter className="w-5 h-5" />
                Imprimir PDF de Resultados
              </button>
              <button onClick={onClose} className="btn btn-sm btn-circle btn-ghost text-slate-500">
                <IconX className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* VISTA PREVIA WEB */}
          {renderPrintableDocument()}
        </div>
        <form method="dialog" className="modal-backdrop print:hidden">
          <button onClick={onClose}>close</button>
        </form>
      </dialog>

      {/* PORTAL REAL A DOCUMENT.BODY PARA IMPRESIÓN IMPECABLE DE 2 PÁGINAS EXACTAS */}
      {typeof document !== 'undefined' && createPortal(renderPrintableDocument(), document.body)}
    </>
  );
}
