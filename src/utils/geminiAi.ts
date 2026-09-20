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
 * Obtiene la API Key de Gemini configurada (desde .env con VITE_, o localStorage)
 */
export function getGeminiApiKey(): string {
  const envVite = import.meta.env.VITE_GEMINI_API_KEY;
  if (typeof envVite === 'string' && envVite.trim().length > 0) {
    return envVite.trim();
  }
  const envRaw = (import.meta.env as any).GEMINI_API_KEY;
  if (typeof envRaw === 'string' && envRaw.trim().length > 0) {
    return envRaw.trim();
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
 * Motor clínico conversacional de respaldo por si no hay API Key o falla la conexión
 * Entabla diálogo real con preguntas e instrucciones de contingencia.
 * NUNCA adjunta tarjeta de ticket a menos que el usuario lo solicite expresamente.
 */
export function runLocalClinicalDiagnosis(
  input: string,
  history: Array<{ sender: 'user' | 'bot'; text: string }> = []
): SynovaAnalysisResult {
  const text = input.toLowerCase().trim();

  // 1. Solicitud directa de levantar ticket
  if (
    text.includes('levantar ticket') ||
    text.includes('levantar un ticket') ||
    text.includes('abrir ticket') ||
    text.includes('crear ticket') ||
    text.includes('genera ticket') ||
    text.includes('sí levanta') ||
    text.includes('si levanta')
  ) {
    // Buscar contexto en los últimos mensajes para hacer un asunto preciso
    const lastUserIssue =
      history
        .filter((h) => h.sender === 'user' && !h.text.toLowerCase().includes('ticket'))
        .pop()?.text || input;

    let category: TicketCategory = 'SISTEMA';
    let priority: TicketPriority = 'ALTA';
    let likelyCause = 'Incidencia operativa reportada para atención por mesa técnica.';
    let suggestedAction = 'Revisión prioritaria por el departamento de soporte e ingeniería.';

    const lowerIssue = lastUserIssue.toLowerCase();
    if (lowerIssue.includes('analizador') || lowerIssue.includes('equipo') || lowerIssue.includes('alarma') || lowerIssue.includes('aguja')) {
      category = 'EQUIPOS';
      priority = 'CRITICA';
      likelyCause = 'Alarma o bloqueo mecánico en analizador analítico.';
      suggestedAction = 'Inspección electromecánica y revisión de sensor por ingeniería biomédica.';
    } else if (lowerIssue.includes('reactivo') || lowerIssue.includes('calibr') || lowerIssue.includes('westgard') || lowerIssue.includes('lote')) {
      category = 'CALIDAD';
      priority = 'ALTA';
      likelyCause = 'Desvío en control de calidad o lote de reactivo fuera de tolerancia.';
      suggestedAction = 'Auditoría de lote, verificación de blancos y recalibración.';
    }

    return {
      reply:
        'Con gusto. He estructurado los detalles para abrir formalmente tu ticket de soporte técnico ante nuestro equipo de ingeniería. Por favor revisa la tarjeta a continuación y confirma para enviarlo a la cola de atención inmediata:',
      suggestedTicket: {
        subject: `Incidencia: ${lastUserIssue.slice(0, 50)}...`,
        description: lastUserIssue,
        category,
        priority,
        likelyCause,
        suggestedAction,
      },
      source: 'clinical_engine',
    };
  }

  // 2. Saludos e introducciones
  if (text === 'hola' || text === 'buenos días' || text === 'buenas tardes' || text === 'buenas noches' || text === 'que tal' || text === 'buenas') {
    return {
      reply:
        '¡Hola! Qué gusto saludarte. ¿Cómo está marchando la jornada en tu laboratorio? Cuéntame con qué equipo, reactivo o módulo del sistema necesitas apoyo hoy.',
      source: 'clinical_engine',
    };
  }

  // 3. Alarmas o fallas en analizadores
  if (
    text.includes('analizador') ||
    text.includes('alarma') ||
    text.includes('falla mecanica') ||
    text.includes('falla mecánica') ||
    text.includes('aspiracion') ||
    text.includes('aspiración') ||
    text.includes('aguja') ||
    text.includes('motor') ||
    text.includes('bloqueo') ||
    text.includes('no enciende')
  ) {
    return {
      reply:
        'Las alertas en analizadores clínicos son de máxima prioridad para no detener la corrida de pacientes.\n\n¿Qué marca o modelo de equipo tienes (por ejemplo Mindray, Cobas, Beckman Coulter) y qué código o mensaje de alarma exacto te muestra en la pantalla?\n\nMientras me comentas, te sugiero verificar:\n1. Si la aguja de aspiración tiene algún obstáculo físico o coágulo de fibrina.\n2. Si los frascos de desecho y diluyente están en sus niveles correctos.\n3. Si la presión de vacío es normal.',
      source: 'clinical_engine',
    };
  }

  // 4. Fallas generales en el sistema
  if (
    text.includes('fallas en el sistema') ||
    text.includes('falla en el sistema') ||
    text.includes('el sistema falla') ||
    text.includes('no funciona el sistema') ||
    text.includes('se trabó') ||
    text.includes('se trabo') ||
    text.includes('no carga')
  ) {
    return {
      reply:
        'Lamento mucho el inconveniente con el sistema. Para apoyarte a solucionarlo de inmediato:\n\n¿En qué módulo o pantalla específica te está ocurriendo? (Por ejemplo: ¿en Recepción de Órdenes, en Captura de Resultados, en Catálogo o al imprimir PDF?)\n\n¿Te aparece algún mensaje de error en color rojo o la pantalla se queda congelada?',
      source: 'clinical_engine',
    };
  }

  // 5. Errores al guardar, captura o resultados
  if (
    text.includes('guardar') ||
    text.includes('error 500') ||
    text.includes('no me deja') ||
    text.includes('capturar') ||
    text.includes('resultados') ||
    text.includes('folio')
  ) {
    return {
      reply:
        'Entendido. Ese tipo de incidencia suele presentarse cuando algún valor contiene un carácter inesperado, o cuando hubo una micro-interrupción momentánea con la base de datos central.\n\n¿Te ocurre con un paciente o folio en particular, o con todas las órdenes? Si recargas la página (F5) e intentas guardar de nuevo, ¿persiste el error? Si persiste, dime y abrimos un ticket prioritario para que desarrollo revise los registros.',
      source: 'clinical_engine',
    };
  }

  // 6. Reactivos, calibraciones y control de calidad
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
        'En temas de calibración y control de calidad:\n\n¿Qué analito o prueba específica está mostrando desvío (por ejemplo Glucosa, Colesterol, TGO/TGP) y qué regla de Westgard infringió (1:3s o 2:2s)?\n\nTe recomiendo revisar la fecha de reconstitución del calibrador, verificar que esté a temperatura ambiente (22°C) y hacer un blanco con agua desionizada antes de repetir la corrida.',
      source: 'clinical_engine',
    };
  }

  // 7. Impresiones, PDF o etiquetas
  if (text.includes('impres') || text.includes('pdf') || text.includes('etiqueta') || text.includes('termica') || text.includes('térmica')) {
    return {
      reply:
        'Respecto a la impresión:\n\n¿El problema se presenta con las etiquetas térmicas de tubos (50x25 mm) o con el reporte clínico oficial membretado en PDF?\n\nVerifica que la impresora predeterminada esté encendida y conectada. Si el PDF no genera el membrete o la firma digital, podemos revisarlo de inmediato.',
      source: 'clinical_engine',
    };
  }

  // 8. Respuesta conversacional general
  return {
    reply:
      'Te escucho atentamente. Para darte la orientación más precisa, ¿podrías darme un poco más de detalle sobre lo que sucede o qué observas en el equipo o en pantalla? También puedes indicarme si prefieres que levantemos un ticket formal para que el área técnica te contacte.',
    source: 'clinical_engine',
  };
}

/**
 * Consulta unificada a Synova:
 * 1. Intenta Google Gemini en el cliente (si hay API Key en frontend).
 * 2. Si no, intenta consultar al backend /support/ai-chat (donde Render tiene las variables de entorno).
 * 3. Si no hay conexión con Gemini, utiliza el motor conversacional clínico local de Synova.
 */
export async function querySynovaGemini(
  userInput: string,
  history: Array<{ sender: 'user' | 'bot'; text: string }>,
  userName: string,
  apiClient?: { post: (url: string, data: any) => Promise<any> }
): Promise<SynovaAnalysisResult> {
  const apiKey = getGeminiApiKey();

  // CASO 1: Hay API Key en el Frontend
  if (apiKey) {
    const systemInstruction = `
Eres Synova, la especialista de soporte técnico clínico de LabSystem Clinique.
Estás conversando directamente con ${userName}, profesional del laboratorio clínico.
Tu función principal es entablar una conversación de soporte técnico real, empática, indagatoria y resolutiva.
DIRECTRICES ESENCIALES:
1. NUNCA digas que eres una inteligencia artificial, IA o modelo de lenguaje. Comunícate con calidez y seguridad técnica como una especialista de soporte humano.
2. ENTABLA UNA CONVERSACIÓN REAL: Haz preguntas de diagnóstico pertinentes (ej. marca/modelo de equipo, código de error en pantalla, reactivo, o módulo del sistema donde ocurre la falla).
3. Da sugerencias prácticas de contingencia inmediata según aplique.
4. NO ofrezcas levantar tickets en cada respuesta ni uses textos robóticos o repetitivos.
5. ÚNICAMENTE cuando el usuario pida explícitamente "levantar ticket", "crear ticket", "reportar problema", o cuando la conversación confirme una avería física/mecánica grave que requiera visita técnica, añade AL FINAL de tu respuesta el bloque delimitado exactamente por \`\`\`ticket_json y \`\`\`:
\`\`\`ticket_json
{
  "subject": "Título conciso y claro de la incidencia",
  "category": "EQUIPOS" | "CALIDAD" | "SISTEMA" | "FACTURACION",
  "priority": "BAJA" | "MEDIA" | "ALTA" | "CRITICA",
  "likelyCause": "Causa preliminar detectada",
  "suggestedAction": "Acción inmediata recomendada"
}
\`\`\`
Si es una consulta normal, saludo o diálogo indagatorio, NO agregues el bloque ticket_json.
Responde siempre en español.
`.trim();

    const contents: any[] = [];
    const recentHistory = history.slice(-8);
    for (const h of recentHistory) {
      contents.push({
        role: h.sender === 'user' ? 'user' : 'model',
        parts: [{ text: h.text }],
      });
    }
    contents.push({
      role: 'user',
      parts: [{ text: userInput }],
    });

    const modelCandidates = [
      'gemini-2.0-flash',
      'gemini-1.5-flash-latest',
      'gemini-1.5-flash',
      'gemini-2.5-flash',
    ];

    try {
      let res: Response | null = null;
      for (const modelName of modelCandidates) {
        try {
          const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
          const attempt = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              system_instruction: { parts: [{ text: systemInstruction }] },
              contents,
              generationConfig: { temperature: 0.5, maxOutputTokens: 900 },
            }),
          });
          if (attempt.ok) {
            res = attempt;
            break;
          } else if (attempt.status !== 404) {
            res = attempt;
            break;
          }
        } catch {}
      }

      if (res && res.ok) {
        const data = (await res.json()) as any;
        const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (rawText) {
          let cleanReply = rawText;
          let suggestedTicket: any = undefined;
          const match = rawText.match(/```ticket_json\s*([\s\S]*?)\s*```/);
          if (match && match[1]) {
            try {
              const parsed = JSON.parse(match[1]);
              suggestedTicket = {
                subject: parsed.subject || `Incidencia: ${userInput.slice(0, 45)}...`,
                description: userInput,
                category: parsed.category || 'SISTEMA',
                priority: parsed.priority || 'MEDIA',
                likelyCause: parsed.likelyCause || 'Diagnóstico de Synova.',
                suggestedAction: parsed.suggestedAction || 'Atención por mesa de ayuda.',
              };
              cleanReply = rawText.replace(/```ticket_json\s*([\s\S]*?)\s*```/, '').trim();
            } catch {}
          }
          return { reply: cleanReply, suggestedTicket, source: 'gemini' };
        }
      }
    } catch (err) {
      console.warn('Error llamando a Gemini desde frontend:', err);
    }
  }

  // CASO 2: Consultar al Backend (donde Render tiene las variables de entorno como GEMINI_API_KEY)
  if (apiClient) {
    try {
      const backendRes = await apiClient.post('/support/ai-chat', {
        message: userInput,
        history,
        userName,
      });

      if (backendRes?.data && backendRes.data.source === 'gemini' && backendRes.data.reply) {
        return {
          reply: backendRes.data.reply,
          suggestedTicket: backendRes.data.suggestedTicket,
          source: 'gemini',
        };
      }
    } catch (err) {
      console.warn('Backend ai-chat no disponible o sin API key, usando motor clínico local.');
    }
  }

  // CASO 3: Motor conversacional clínico local de Synova (respuestas naturales, indagatorias y resolutivas)
  return runLocalClinicalDiagnosis(userInput, history);
}
