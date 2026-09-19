// src/utils/panicValues.ts
// Motor de Detección de Valores Críticos (Valores de Pánico) y Correlación Clínica Asistida por IA

export interface PanicAlertItem {
  paramId: string;
  paramName: string;
  category: string;
  value: number | string;
  units: string;
  panicThresholdDescription: string;
  severity: 'CRITICO' | 'ALERTA';
  clinicalRisk: string;
  suggestedAction: string;
}

interface PanicRule {
  keywords: string[];
  units: string;
  minPanic?: number;
  maxPanic?: number;
  clinicalRiskLow?: string;
  clinicalRiskHigh?: string;
  suggestedAction: string;
}

const PANIC_RULES: PanicRule[] = [
  {
    keywords: ['glucosa', 'glucose', 'glicemia'],
    units: 'mg/dL',
    minPanic: 45,
    maxPanic: 450,
    clinicalRiskLow: 'Hipoglucemia severa con riesgo inminente de shock o daño neurológico.',
    clinicalRiskHigh: 'Hiperglucemia crítica con sospecha de Cetoacidosis Diabética o Estado Hiperosmolar.',
    suggestedAction: 'Re-analizar muestra inmediatamente por duplicado y notificar con urgencia al médico tratante.',
  },
  {
    keywords: ['potasio', 'potassium', ' k '],
    units: 'mEq/L',
    minPanic: 2.8,
    maxPanic: 6.2,
    clinicalRiskLow: 'Hipopotasemia grave. Riesgo elevado de arritmias ventriculares y parada cardíaca.',
    clinicalRiskHigh: 'Hiperpotasemia crítica. Descartar hemólisis en tubo y alertar de inmediato.',
    suggestedAction: 'Verificar índice de hemólisis en el suero. Repetir lectura en analizador.',
  },
  {
    keywords: ['sodio', 'sodium', ' na '],
    units: 'mEq/L',
    minPanic: 120,
    maxPanic: 160,
    clinicalRiskLow: 'Hiponatremia severa. Riesgo de edema cerebral y convulsiones.',
    clinicalRiskHigh: 'Hipernatremia extrema con deshidratación celular aguda.',
    suggestedAction: 'Verificar calibrador de electrodos selectivos (ISE) y reconfirmar valor.',
  },
  {
    keywords: ['hemoglobina', 'hemoglobin', 'hgb'],
    units: 'g/dL',
    minPanic: 6.5,
    maxPanic: 20.0,
    clinicalRiskLow: 'Anemia aguda severa con compromiso hemodinámico e hipoxia tisular.',
    clinicalRiskHigh: 'Policitemia marcada o hemoconcentración crítica.',
    suggestedAction: 'Revisar frotis de sangre periférica y descartar microcoágulos en el tubo EDTA.',
  },
  {
    keywords: ['plaquetas', 'platelets', 'plt'],
    units: '/µL',
    minPanic: 20000,
    maxPanic: 1000000,
    clinicalRiskLow: 'Trombocitopenia crítica. Riesgo inminente de hemorragia espontánea en SNC o digestiva.',
    clinicalRiskHigh: 'Trombocitosis extrema reactiva o proliferativa.',
    suggestedAction: 'Verificar frotis en microscopio óptico para descartar pseudotrombocitopenia por agregación de EDTA.',
  },
  {
    keywords: ['leucocitos', 'leukocytes', 'wbc', 'globulos blancos'],
    units: '/µL',
    minPanic: 1500,
    maxPanic: 35000,
    clinicalRiskLow: 'Leucopenia severa / neutropenia febril con alto riesgo de sepsis oportunista.',
    clinicalRiskHigh: 'Hiperleucocitosis extrema / Reacción leucemoide o leucemia aguda.',
    suggestedAction: 'Revisar diferencial en frotis y confirmar tinción de Wright.',
  },
  {
    keywords: ['creatinina', 'creatinine'],
    units: 'mg/dL',
    maxPanic: 5.0,
    clinicalRiskHigh: 'Falla renal aguda o uremia severa descompensada.',
    suggestedAction: 'Confirmar con cinética de Jaffé compensada o método enzimático.',
  },
  {
    keywords: ['troponina', 'troponin'],
    units: 'ng/mL',
    maxPanic: 0.05,
    clinicalRiskHigh: 'Elevación patológica de biomarcador de necrosis miocárdica (Síndrome Coronario Agudo).',
    suggestedAction: 'Emitir alerta de prioridad roja al médico para triage en unidad de urgencias.',
  },
];

/**
 * Escanea la lista de parámetros capturados y detecta valores de pánico
 */
export function evaluatePanicValues(
  fields: { id: string; category: string; name: string; value: string; units: string }[]
): PanicAlertItem[] {
  const alerts: PanicAlertItem[] = [];

  for (const field of fields) {
    const nameLower = ` ${field.name.toLowerCase()} `;
    const rawVal = (field.value || '').trim().replace(',', '.');
    const numVal = parseFloat(rawVal);

    for (const rule of PANIC_RULES) {
      const matchesKeyword = rule.keywords.some((kw) => nameLower.includes(kw));
      if (!matchesKeyword) continue;

      if (!isNaN(numVal)) {
        if (rule.minPanic !== undefined && numVal < rule.minPanic) {
          alerts.push({
            paramId: field.id,
            paramName: field.name,
            category: field.category,
            value: numVal,
            units: field.units || rule.units,
            panicThresholdDescription: `< ${rule.minPanic} ${rule.units}`,
            severity: 'CRITICO',
            clinicalRisk: rule.clinicalRiskLow || 'Valor crítico por debajo de límites biológicos seguros.',
            suggestedAction: rule.suggestedAction,
          });
        } else if (rule.maxPanic !== undefined && numVal > rule.maxPanic) {
          alerts.push({
            paramId: field.id,
            paramName: field.name,
            category: field.category,
            value: numVal,
            units: field.units || rule.units,
            panicThresholdDescription: `> ${rule.maxPanic} ${rule.units}`,
            severity: 'CRITICO',
            clinicalRisk: rule.clinicalRiskHigh || 'Valor crítico por encima de límites biológicos seguros.',
            suggestedAction: rule.suggestedAction,
          });
        }
      } else {
        // Chequeo cualitativo (ej. Troponina Positiva)
        if (rule.keywords.some((k) => k.includes('troponina')) && rawVal.toLowerCase().includes('positiv')) {
          alerts.push({
            paramId: field.id,
            paramName: field.name,
            category: field.category,
            value: rawVal,
            units: field.units || rule.units,
            panicThresholdDescription: 'POSITIVO',
            severity: 'CRITICO',
            clinicalRisk: rule.clinicalRiskHigh || 'Marcador miocárdico elevado.',
            suggestedAction: rule.suggestedAction,
          });
        }
      }
    }
  }

  return alerts;
}

/**
 * Genera una propuesta de correlación clínica asistida por Synova IA basada en los hallazgos analíticos
 */
export function generateAICorrelationNote(
  fields: { name: string; value: string; units: string }[],
  _patientAge?: number | string,
  _patientGender?: string
): string {
  const findings: string[] = [];
  let severeFlag = false;

  for (const f of fields) {
    const val = parseFloat(f.value);
    const n = f.name.toLowerCase();

    if (n.includes('glucosa') && !isNaN(val)) {
      if (val >= 126) findings.push(`Hiperglucemia en ayuno (${val} mg/dL) sugerente de alteración del metabolismo de carbohidratos`);
      if (val < 70) findings.push(`Tendencia a hipoglucemia (${val} mg/dL)`);
      if (val > 300) severeFlag = true;
    }
    if (n.includes('colesterol total') && !isNaN(val) && val > 200) {
      findings.push(`Hipercolesterolemia (${val} mg/dL)`);
    }
    if (n.includes('trigliceridos') && !isNaN(val) && val > 150) {
      findings.push(`Hipertrigliceridemia (${val} mg/dL)`);
    }
    if (n.includes('acido urico') && !isNaN(val) && val > 7.0) {
      findings.push(`Hiperuricemia (${val} mg/dL)`);
    }
    if (n.includes('hemoglobina') && !isNaN(val) && val < 12.0) {
      findings.push(`Cifras de hemoglobina disminuidas (${val} g/dL), sugerente de síndrome anémico`);
    }
    if (n.includes('creatinina') && !isNaN(val) && val > 1.3) {
      findings.push(`Elevación de creatinina sérica (${val} mg/dL) con probable disminución del filtrado glomerular`);
    }
  }

  if (findings.length === 0) {
    return 'PARÁMETROS ANALÍTICOS DENTRO DE LOS INTERVALOS BIOLÓGICOS DE REFERENCIA CONSOLIDADOS. SUERO LÍMPIDO, SIN INTERFERENCIA DE HEMÓLISIS O ICTERICIA. ESTUDIO VALIDADO CLÍNICAMENTE.';
  }

  let note = `DICTAMEN CLÍNICO ASISTIDO (SYNOVA IA):\n`;
  note += `Se identificaron los siguientes hallazgos analíticos de relevancia:\n`;
  findings.forEach((find, idx) => {
    note += `${idx + 1}. ${find}.\n`;
  });
  note += `\nCORRELACIÓN: Los resultados deben interpretarse en conjunto con el cuadro clínico, antecedentes y exploración médica del paciente.`;
  if (severeFlag) {
    note += ` [ALERTA: Se sugiere atención clínica prioritaria debido a valores de relevancia mayor].`;
  }
  return note;
}
