// src/utils/geminiAi.ts
import type { TicketCategory, TicketPriority } from '../components/SupportChatView';

export interface SynovaAnalysisResult {
  reply: string;
  suggestedTicket?: {
    subject: string;
    description: string;
    category: TicketCategory;
    priority: TicketPriority;
    likelyCause: string;
    suggestedAction: string;
  };
  source: 'gemini' | 'clinical_engine';
}

const STORAGE_KEY = 'synova_gemini_api_key';

/**
 * Obtiene la API Key de Gemini configurada (desde .env o localStorage)
 */
export function getGeminiApiKey(): string {
  const envKey = import.meta.env.GEMINI_API_KEY;
  if (typeof envKey === 'string' && envKey.trim().length > 0) {
    return envKey.trim();
  }
  return localStorage.getItem(STORAGE_KEY)?.trim() || '';
}

/**
 * Guarda o borra la API Key de Gemini en localStorage
 */
export function saveGeminiApiKey(key: string): void {
  const trimmed = key.trim();
  if (trimmed) {
    localStorage.setItem(STORAGE_KEY, trimmed);
  } else {
    localStorage.removeItem(STORAGE_KEY);
  }
}

/**
 * Valida si hay una API Key presente
 */
export function hasGeminiApiKey(): boolean {
  return getGeminiApiKey().length > 0;
}

/**
 * Motor clínico de respaldo por si no hay API Key o falla la conexión con Google AI
 */
export function runLocalClinicalDiagnosis(input: string): SynovaAnalysisResult {
  const text = input.toLowerCase();

  if (
    text.includes('analizador') ||
    text.includes('equipo') ||
    text.includes('alarma') ||
    text.includes('aspiracion') ||
    text.includes('aspiración') ||
    text.includes('aguja') ||
    text.includes('motor') ||
    text.includes('bloqueo') ||
    text.includes('no enciende') ||
    text.includes('quimica') ||
    text.includes('química') ||
    text.includes('hematologia') ||
    text.includes('hematología')
  ) {
    return {
      reply:
        'He revisado la situación con el analizador. Te aconsejo inspeccionar la aguja de aspiración, verificar el circuito de fluidos y purgar el sistema. Si la alarma persiste por más de 60 segundos tras el reinicio, generemos un ticket de soporte técnico.\n\n¿Deseas que levante el ticket oficial ahora mismo para que el equipo de ingeniería atienda el equipo prioritariamente?',
      suggestedTicket: {
        subject: `Alarma o Falla en Analizador: ${input.slice(0, 50)}...`,
        description: input,
        category: 'EQUIPOS',
        priority: 'CRITICA',
        likelyCause: 'Obstrucción en sonda de aspiración o descalibración en motor de movimiento.',
        suggestedAction: '1. Desconectar y purgar línea hidráulica.\n2. Limpiar aguja con solución desproteinizante.\n3. Ejecutar ciclo de autoprueba.',
      },
      source: 'clinical_engine',
    };
  }

  if (
    text.includes('reactivo') ||
    text.includes('lote') ||
    text.includes('control') ||
    text.includes('calibr') ||
    text.includes('caduc') ||
    text.includes('westgard') ||
    text.includes('levey') ||
    text.includes('sesgo')
  ) {
    return {
      reply:
        'Parece ser un problema con reactivos o calibración analítica. Si los controles violan las reglas de Westgard (1:3s o 2:2s), te recomiendo atemperar un vial nuevo a 22°C y repetir el blanco de calibración.\n\n¿Gustas que levante un ticket de soporte para auditar este lote y calibración?',
      suggestedTicket: {
        subject: `Incidencia en Reactivos o Calibración: ${input.slice(0, 50)}...`,
        description: input,
        category: 'CALIDAD',
        priority: 'ALTA',
        likelyCause: 'Pérdida de estabilidad en reactivo a bordo o desvío fotométrico sistemático.',
        suggestedAction: '1. Verificar lote y fecha de vencimiento.\n2. Reconstituir nuevo frasco de calibrador.\n3. Validar blanco con agua desionizada.',
      },
      source: 'clinical_engine',
    };
  }

  if (
    text.includes('orden') ||
    text.includes('folio') ||
    text.includes('paciente') ||
    text.includes('resultado') ||
    text.includes('pdf') ||
    text.includes('impresion') ||
    text.includes('impresión') ||
    text.includes('ultramsg') ||
    text.includes('whatsapp')
  ) {
    return {
      reply:
        'Entiendo tu consulta sobre folios, pacientes o reportes de laboratorio. Puedo ayudarte a sincronizar el estado o podemos levantar un ticket de soporte técnico si requieres una corrección directa en el sistema.\n\n¿Te gustaría que levante un ticket para que el personal técnico le dé seguimiento?',
      suggestedTicket: {
        subject: `Consulta sobre Folio / Resultados: ${input.slice(0, 50)}...`,
        description: input,
        category: 'SISTEMA',
        priority: 'MEDIA',
        likelyCause: 'Ajuste de datos o estado en módulo de recepción y resultados.',
        suggestedAction: 'Revisar folios generados y sincronizar con base de datos central.',
      },
      source: 'clinical_engine',
    };
  }

  return {
    reply:
      'He tomado nota de lo que necesitas. Puedo ofrecerte una solución guiada o podemos levantar un ticket de soporte técnico oficial para que nuestro equipo lo resuelva de inmediato.\n\n¿Deseas que levante el ticket con estos detalles?',
    suggestedTicket: {
      subject: `Solicitud de Soporte: ${input.slice(0, 50)}...`,
      description: input,
      category: 'SISTEMA',
      priority: 'MEDIA',
      likelyCause: 'Requerimiento o incidencia operativa reportada por el personal de la sede.',
      suggestedAction: 'Asignar a un asesor técnico para atención directa.',
    },
    source: 'clinical_engine',
  };
}

/**
 * Consulta a la API de Google Gemini (modelo gratuito gemini-1.5-flash / gemini-2.0-flash)
 */
export async function querySynovaGemini(
  userInput: string,
  history: Array<{ sender: 'user' | 'bot'; text: string }>,
  userName: string
): Promise<SynovaAnalysisResult> {
  const apiKey = getGeminiApiKey();

  // Si no hay API Key configurada, usar el motor clínico local
  if (!apiKey) {
    return runLocalClinicalDiagnosis(userInput);
  }

  const systemInstruction = `
Eres Synova, la especialista de soporte técnico clínico de LabSystem Clinique.
Estás conversando directamente con ${userName}, personal del laboratorio.
Tu función es exclusiva: brindar soporte técnico y operativo experto sobre el sistema de laboratorio, analizadores clínicos (química, hematología, electrolitos), reactivos, curvas de calibración, control de calidad (Westgard, Levey-Jennings), órdenes y resultados.

DIRECTRICES:
1. Conversa de manera natural, empática, profesional y concisa, como una ingeniera o especialista de mesa de ayuda clínica de primer nivel.
2. NUNCA menciones que eres una inteligencia artificial, modelo de lenguaje o IA. Habla como una compañera especialista de soporte.
3. Brinda recomendaciones prácticas y directas (pasos de reinicio, lavado con desproteinizante, verificación de blancos, control de temperatura, verificación de folios).
4. Si el usuario reporta una falla o problema técnico que requiera seguimiento formal, o solicita "levantar ticket":
   - Explícale brevemente el diagnóstico o contingencia y proponle levantar un ticket de soporte oficial.
   - Incluye al final de tu respuesta el bloque delimitado exactamente por \`\`\`ticket_json y \`\`\` con la estructura:
\`\`\`ticket_json
{
  "subject": "Título conciso y claro del problema",
  "category": "EQUIPOS" | "CALIDAD" | "SISTEMA" | "FACTURACION",
  "priority": "BAJA" | "MEDIA" | "ALTA" | "CRITICA",
  "likelyCause": "Causa probable según los datos proporcionados",
  "suggestedAction": "Acción inmediata recomendada"
}
\`\`\`
5. Si es un saludo, una pregunta general o una consulta sin fallo, responde cálidamente y no agregues el bloque ticket_json.
Responde siempre en español de forma directa y profesional.
`.trim();

  // Armar historial de conversación para Gemini
  const contents = [];

  // Agregar últimos turnos de contexto (máximo 6 para agilidad)
  const recentHistory = history.slice(-6);
  for (const h of recentHistory) {
    contents.push({
      role: h.sender === 'user' ? 'user' : 'model',
      parts: [{ text: h.text }],
    });
  }

  // Turno actual del usuario
  contents.push({
    role: 'user',
    parts: [{ text: userInput }],
  });

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        system_instruction: {
          parts: [{ text: systemInstruction }],
        },
        contents,
        generationConfig: {
          temperature: 0.4,
          maxOutputTokens: 800,
        },
      }),
    });

    if (!res.ok) {
      console.warn('Google Gemini API respondió con código:', res.status);
      return runLocalClinicalDiagnosis(userInput);
    }

    const data = await res.json();
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!rawText || typeof rawText !== 'string') {
      return runLocalClinicalDiagnosis(userInput);
    }

    // Extraer bloque ticket_json si viene incluido
    let cleanReply = rawText;
    let suggestedTicket: SynovaAnalysisResult['suggestedTicket'] | undefined;

    const ticketBlockRegex = /```ticket_json\s*([\s\S]*?)\s*```/;
    const match = rawText.match(ticketBlockRegex);

    if (match && match[1]) {
      try {
        const parsed = JSON.parse(match[1]);
        suggestedTicket = {
          subject: parsed.subject || `Incidencia: ${userInput.slice(0, 45)}...`,
          description: userInput,
          category: (['EQUIPOS', 'CALIDAD', 'SISTEMA', 'FACTURACION'].includes(parsed.category)
            ? parsed.category
            : 'SISTEMA') as TicketCategory,
          priority: (['BAJA', 'MEDIA', 'ALTA', 'CRITICA'].includes(parsed.priority)
            ? parsed.priority
            : 'MEDIA') as TicketPriority,
          likelyCause: parsed.likelyCause || 'Análisis preliminar de Synova.',
          suggestedAction: parsed.suggestedAction || 'Revisar por soporte técnico.',
        };
        // Quitar el bloque JSON del texto visible al usuario
        cleanReply = rawText.replace(ticketBlockRegex, '').trim();
      } catch (err) {
        console.warn('Error al parsear bloque ticket_json de Gemini:', err);
      }
    }

    return {
      reply: cleanReply,
      suggestedTicket,
      source: 'gemini',
    };
  } catch (err) {
    console.error('Error al conectar con Google Gemini:', err);
    return runLocalClinicalDiagnosis(userInput);
  }
}
