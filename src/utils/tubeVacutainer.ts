// src/utils/tubeVacutainer.ts
import type { WorkOrder } from '../types/order';

export interface VacutainerTube {
  id: string;
  name: string;
  capColorName: string;
  capColorHex: string;
  badgeClass: string;
  additive: string;
  inversions: string;
  sampleType: string;
  volumeNeeded: string;
  matchedAnalyses: string[];
}

// Catálogo de asociación analito -> tubo
const TUBE_CATALOG = [
  {
    type: 'lila',
    name: 'Tubo Lila (EDTA K2)',
    capColorName: 'Lila / Lavanda',
    capColorHex: '#8b5cf6',
    badgeClass: 'badge-primary',
    additive: 'K2 EDTA (Anticoagulante)',
    inversions: '8 a 10 inversiones suaves',
    sampleType: 'Sangre Total',
    volumeNeeded: '3.0 mL',
    keywords: ['citometria', 'hematica', 'biometria', 'hemoglobina', 'plaquetas', 'frotis', 'leucocitos', 'edta', 'vsg'],
  },
  {
    type: 'amarillo',
    name: 'Tubo Amarillo / Oro (Gel Separador)',
    capColorName: 'Amarillo / Oro',
    capColorHex: '#eab308',
    badgeClass: 'badge-warning',
    additive: 'Gel separador y activador de coagulación',
    inversions: '5 inversiones suaves (reposar 30m antes de centrifugar)',
    sampleType: 'Suero',
    volumeNeeded: '5.0 mL',
    keywords: ['quimica', 'glucosa', 'colesterol', 'trigliceridos', 'urea', 'creatinina', 'acido urico', 'perfil', 'lipidico', 'enzimas', 'suero', 'serologia', 'tiroideo'],
  },
  {
    type: 'azul',
    name: 'Tubo Azul Celeste (Citrato 3.2%)',
    capColorName: 'Azul Celeste',
    capColorHex: '#0284c7',
    badgeClass: 'badge-info',
    additive: 'Citrato de sodio al 3.2% (1:9)',
    inversions: '3 a 4 inversiones inmediatas',
    sampleType: 'Plasma Citratado',
    volumeNeeded: '2.7 mL (Llenado exacto)',
    keywords: ['coagulacion', 'tp', 'ttp', 'tiempo de protrombina', 'fibrinogeno', 'dimero d', 'inr'],
  },
  {
    type: 'verde',
    name: 'Tubo Verde (Heparina)',
    capColorName: 'Verde',
    capColorHex: '#10b981',
    badgeClass: 'badge-success',
    additive: 'Heparina de Litio / Sodio',
    inversions: '8 a 10 inversiones suaves',
    sampleType: 'Plasma heparinizado',
    volumeNeeded: '4.0 mL',
    keywords: ['gasometria', 'electrolitos', 'amonio', 'heparina'],
  },
  {
    type: 'orina',
    name: 'Frasco Estéril para Muestra Biológica',
    capColorName: 'Tapa Amarilla / Frasco Transparente',
    capColorHex: '#f59e0b',
    badgeClass: 'badge-warning',
    additive: 'Sin aditivo (Contenedor aséptico)',
    inversions: 'No requiere inversión',
    sampleType: 'Orina / Líquido',
    volumeNeeded: '30 - 50 mL',
    keywords: ['orina', 'ego', 'sedimento', 'copro', 'urocultivo', 'esputo'],
  },
];

/**
 * Determina qué tubos y cuántas alícuotas necesita una orden de trabajo
 */
export function getRequiredTubesForOrder(order: WorkOrder): VacutainerTube[] {
  const analyses = order.analyses || [];
  const requiredMap = new Map<string, VacutainerTube>();

  // Si no hay análisis específicos listados, por defecto se asume panel estándar (Lila + Amarillo)
  if (analyses.length === 0) {
    const lila = TUBE_CATALOG[0];
    const amarillo = TUBE_CATALOG[1];
    requiredMap.set(lila.type, {
      id: `${order.id}-${lila.type}`,
      name: lila.name,
      capColorName: lila.capColorName,
      capColorHex: lila.capColorHex,
      badgeClass: lila.badgeClass,
      additive: lila.additive,
      inversions: lila.inversions,
      sampleType: lila.sampleType,
      volumeNeeded: lila.volumeNeeded,
      matchedAnalyses: ['Citometría Hemática Completa'],
    });
    requiredMap.set(amarillo.type, {
      id: `${order.id}-${amarillo.type}`,
      name: amarillo.name,
      capColorName: amarillo.capColorName,
      capColorHex: amarillo.capColorHex,
      badgeClass: amarillo.badgeClass,
      additive: amarillo.additive,
      inversions: amarillo.inversions,
      sampleType: amarillo.sampleType,
      volumeNeeded: amarillo.volumeNeeded,
      matchedAnalyses: ['Química Sanguínea y Metabolismo'],
    });
    return Array.from(requiredMap.values());
  }

  for (const item of analyses) {
    const nameStr = (item.analysis?.name || '').toLowerCase();
    let matched = false;

    for (const tubeDef of TUBE_CATALOG) {
      if (tubeDef.keywords.some((k) => nameStr.includes(k))) {
        matched = true;
        if (!requiredMap.has(tubeDef.type)) {
          requiredMap.set(tubeDef.type, {
            id: `${order.id}-${tubeDef.type}`,
            name: tubeDef.name,
            capColorName: tubeDef.capColorName,
            capColorHex: tubeDef.capColorHex,
            badgeClass: tubeDef.badgeClass,
            additive: tubeDef.additive,
            inversions: tubeDef.inversions,
            sampleType: tubeDef.sampleType,
            volumeNeeded: tubeDef.volumeNeeded,
            matchedAnalyses: [item.analysis?.name || 'Estudio'],
          });
        } else {
          requiredMap.get(tubeDef.type)!.matchedAnalyses.push(item.analysis?.name || 'Estudio');
        }
        break;
      }
    }

    // Si ningún filtro coincidió, asignamos por defecto a Suero Amarillo
    if (!matched) {
      const yellow = TUBE_CATALOG[1];
      if (!requiredMap.has(yellow.type)) {
        requiredMap.set(yellow.type, {
          id: `${order.id}-${yellow.type}`,
          name: yellow.name,
          capColorName: yellow.capColorName,
          capColorHex: yellow.capColorHex,
          badgeClass: yellow.badgeClass,
          additive: yellow.additive,
          inversions: yellow.inversions,
          sampleType: yellow.sampleType,
          volumeNeeded: yellow.volumeNeeded,
          matchedAnalyses: [item.analysis?.name || 'Estudio General'],
        });
      } else {
        requiredMap.get(yellow.type)!.matchedAnalyses.push(item.analysis?.name || 'Estudio General');
      }
    }
  }

  return Array.from(requiredMap.values());
}

/**
 * Genera un código de barras lineal representativo en SVG
 * Utiliza patrones precisos para simular Code-128 estándar de laboratorio
 */
export function generateBarcodeSVG(code: string, width = 220, height = 45): string {
  // Generador determinista de barras basado en caracteres del folio
  const bars: { x: number; w: number }[] = [];
  let currentX = 10;
  const unit = 2;

  // Quiet zone inicial
  bars.push({ x: currentX, w: unit * 2 });
  currentX += unit * 3;

  for (let i = 0; i < code.length; i++) {
    const charCode = code.charCodeAt(i);
    const pattern = [(charCode % 3) + 1, ((charCode >> 1) % 2) + 1, ((charCode >> 2) % 3) + 1, 1];
    for (let p = 0; p < pattern.length; p++) {
      const w = pattern[p] * unit;
      if (p % 2 === 0) {
        bars.push({ x: currentX, w });
      }
      currentX += w + unit;
    }
  }

  // Quiet zone final
  bars.push({ x: currentX, w: unit * 2 });

  const totalWidth = Math.max(width, currentX + 15);

  const rects = bars
    .map((b) => `<rect x="${b.x}" y="2" width="${b.w}" height="${height - 4}" fill="#000" />`)
    .join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalWidth} ${height}" class="w-full h-full">${rects}</svg>`;
}
