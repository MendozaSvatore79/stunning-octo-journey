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
  source: 'bedrock' | 'gemini' | 'clinical_engine';
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

  // Detección automática de idioma Inglés
  const isEnglish =
    /(hello|hi\b|error|ticket|save|results|please|analyzer|broken|failing|issue|problem|help|not working|cannot|can't)/i.test(input) &&
    !/(hola|buenos|buenas|ayuda|falla|equipo|orden|reactivo|guardar|resultado)/i.test(input);

  if (isEnglish) {
    if (text.includes('ticket')) {
      return {
        reply:
          "I'd be glad to help you submit a technical support ticket to our engineering team.\n\nCould you please provide a few quick details:\n1. What specific error or symptom are you experiencing?\n2. Does it occur on a clinical analyzer (brand/model) or inside the LIS system (orders, results capture, catalog)?\n3. Is there an error code shown on your screen?\n\nOnce you confirm, I will format and submit your ticket immediately.",
        source: 'clinical_engine',
      };
    }
    if (text.includes('501') || text.includes('500') || text.includes('403') || text.includes('502') || text.includes('error')) {
      let errTxt = 'An error has been detected in your current session.';
      if (text.includes('501')) {
        errTxt = 'HTTP 501 (Not Implemented) indicates that the server or proxy rejected the requested route or method. This typically occurs after a pending deployment or route mismatch.';
      } else if (text.includes('500')) {
        errTxt = 'HTTP 500 (Internal Server Error) indicates an exception in the backend container or a database connectivity issue.';
      } else if (text.includes('403')) {
        errTxt = 'HTTP 403 (Forbidden) indicates the request was blocked due to permissions, expired session token, or AWS WAF rule.';
      }
      return {
        reply: `${errTxt}\n\n1. Try performing a hard browser refresh with **Ctrl+F5** (or **Cmd+Shift+R** on Mac) to renew your session token.\n2. If the issue persists, let me know if you would like me to open a technical support ticket right away.`,
        source: 'clinical_engine',
      };
    }
    if (text.includes('save') || text.includes('result') || text.includes('order')) {
      return {
        reply: "Understood. If you are having trouble saving results or orders:\n1. Does this happen with a specific patient/order, or across all orders in your session?\n2. Does hard refreshing with Ctrl+F5 resolve the issue?\n\nLet me know what error or alert appears so I can assist you or escalate to development.",
        source: 'clinical_engine',
      };
    }
    return {
      reply: "Hello! I'm Synova, your clinical technical support specialist. Please tell me more about what is happening on your analyzer or on screen, and I'll be glad to help you.",
      source: 'clinical_engine',
    };
  }

  // 1. Solicitud directa de levantar ticket (Español)
  if (
    text.includes('levantar ticket') ||
    text.includes('levantar un ticket') ||
    text.includes('abrir ticket') ||
    text.includes('crear ticket') ||
    text.includes('genera ticket') ||
    text.includes('sí levanta') ||
    text.includes('si levanta') ||
    text.includes('abrir un reporte') ||
    text.includes('levantar reporte')
  ) {
    // Buscar si en los mensajes previos el usuario ya describió un problema real
    const previousIssues = history.filter(
      (h) =>
        h.sender === 'user' &&
        !h.text.toLowerCase().includes('ticket') &&
        !h.text.toLowerCase().includes('reporte') &&
        !h.text.toLowerCase().includes('hola') &&
        !h.text.toLowerCase().includes('buenos') &&
        h.text.trim().length > 8
    );

    const hasSpecificPriorIssue = previousIssues.length > 0;
    const lastUserIssue = hasSpecificPriorIssue ? previousIssues[previousIssues.length - 1].text : '';

    // Si NO hay descripción previa de la falla, entablar diálogo para indagar antes de levantar el ticket
    if (!hasSpecificPriorIssue) {
      return {
        reply:
          'Con gusto te ayudo a registrar tu ticket formal ante nuestro equipo de ingeniería técnica.\n\nPara canalizarlo con la prioridad adecuada, por favor cuéntame brevemente:\n1. ¿Cuál es la falla o síntoma que estás experimentando?\n2. ¿Ocurre en algún analizador clínico (marca/modelo) o en un módulo del sistema (órdenes, resultados, catálogo)?\n3. ¿Aparece algún código de error o alarma en pantalla?\n\nEn cuanto me des estos detalles, te estructuro la propuesta de ticket al instante.',
        source: 'clinical_engine',
      };
    }

    let category: TicketCategory = 'SISTEMA';
    let priority: TicketPriority = 'ALTA';
    let likelyCause = 'Incidencia técnica reportada para atención especializada.';
    let suggestedAction = 'Revisión prioritaria por el departamento de soporte e ingeniería.';
    let subject = 'Incidencia operativa en laboratorio';

    const lowerIssue = lastUserIssue.toLowerCase();
    if (lowerIssue.includes('analizador') || lowerIssue.includes('equipo') || lowerIssue.includes('alarma') || lowerIssue.includes('aguja')) {
      category = 'EQUIPOS';
      priority = 'CRITICA';
      subject = 'Alarma o detención en analizador analítico';
      likelyCause = 'Alarma de sensor o bloqueo mecánico en analizador analítico.';
      suggestedAction = 'Inspección electromecánica y verificación de sensores por ingeniería biomédica.';
    } else if (lowerIssue.includes('reactivo') || lowerIssue.includes('calibr') || lowerIssue.includes('westgard') || lowerIssue.includes('lote')) {
      category = 'CALIDAD';
      priority = 'ALTA';
      subject = 'Desvío en calibración o lote de reactivo';
      likelyCause = 'Desvío en control de calidad o lote de reactivo fuera de tolerancia.';
      suggestedAction = 'Auditoría de lote, verificación de blancos y recalibración técnica.';
    } else {
      subject = `Falla reportada: ${lastUserIssue.slice(0, 45)}...`;
      likelyCause = 'Inconsistencia en módulo del sistema reportada por laboratorista.';
    }

    return {
      reply:
        'He recopilado los detalles de la falla reportada para estructurar tu ticket ante el equipo de ingeniería. Por favor revisa la tarjeta a continuación y confirma para enviarlo a la cola de atención inmediata:',
      suggestedTicket: {
        subject,
        description: `${lastUserIssue}\n\n[Instrucción de usuario]: ${input}`,
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
        '¡Hola! Qué gusto saludarte. ¿Cómo está marchando la jornada en tu laboratorio? Cuéntame si presentas alguna falla con analizadores, calibraciones, reactivos, folios o el sistema y te apoyo de inmediato.',
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
        'Las alertas en analizadores clínicos son de máxima prioridad para no detener la corrida de pacientes.\n\n¿Qué marca o modelo de equipo tienes (por ejemplo Mindray, Cobas, Beckman Coulter, Sysmex) y qué código o mensaje de alarma exacto te muestra en la pantalla?\n\nMientras me comentas, te sugiero verificar:\n1. Si la aguja de aspiración tiene algún obstáculo físico o coágulo de fibrina.\n2. Si los frascos de desecho y diluyente están en sus niveles correctos.\n3. Si la presión de vacío está dentro del rango seguro.\n\nCuéntame qué observas para guiarte o coordinar la asistencia técnica.',
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
        'Lamento mucho el inconveniente con el sistema. Para apoyarte a solucionarlo de inmediato:\n\n1. ¿En qué módulo o pantalla específica te está ocurriendo? (¿En Recepción de Órdenes, en Captura de Resultados, en Catálogo o al generar PDF?)\n2. ¿Te aparece algún mensaje de error en color rojo o la pantalla se queda congelada?\n3. ¿Sucede solo en tu equipo o en todas las computadoras del laboratorio?\n\nCuéntame qué notas y te oriento con los pasos de solución.',
      source: 'clinical_engine',
    };
  }

  // 4. Códigos de error específicos (501, 500, 403, 502, 504, 404)
  if (
    text.includes('501') ||
    text.includes('500') ||
    text.includes('403') ||
    text.includes('502') ||
    text.includes('504') ||
    text.includes('error')
  ) {
    let errorDetail = '';
    if (text.includes('501')) {
      errorDetail = 'El código **HTTP 501 (Not Implemented)** indica que el servicio o endpoint solicitado en el servidor no está implementado o el proxy/CloudFront bloqueó el método HTTP. Suele ocurrir tras un despliegue pendiente de backend o desincronización de rutas.';
    } else if (text.includes('500')) {
      errorDetail = 'El código **HTTP 500 (Internal Server Error)** indica una excepción en el contenedor del backend o un fallo de conexión transitorio con la base de datos PostgreSQL.';
    } else if (text.includes('403')) {
      errorDetail = 'El código **HTTP 403 (Forbidden)** indica que la petición fue rechazada por políticas de seguridad (permisos insuficientes, expiración de token de sesión o bloqueo perimetral de AWS WAF).';
    } else if (text.includes('502') || text.includes('504')) {
      errorDetail = 'El código **HTTP 502/504 (Bad Gateway / Gateway Timeout)** indica que el proxy no logró comunicarse a tiempo con el contenedor de la API en Lightsail.';
    } else {
      errorDetail = 'He detectado el mensaje de error reportado en la sesión de trabajo.';
    }

    // Revisar si en los mensajes anteriores ya veníamos hablando de un módulo o acción (guardar folios, resultados, etc.)
    const lastBotMsg = history.filter((h) => h.sender === 'bot').pop()?.text || '';
    const lastUserIssue = history.filter((h) => h.sender === 'user').slice(-2)[0]?.text || '';
    const hasPriorContext = lastBotMsg.includes('guardar') || lastBotMsg.includes('folio') || lastUserIssue.length > 5;

    return {
      reply:
        `${errorDetail}\n\n` +
        (hasPriorContext ? `Tomando en cuenta lo que me mencionabas sobre la dificultad para guardar o capturar:\n` : '') +
        `1. Intenta forzar una recarga limpia del navegador con **Ctrl+F5** (o **Cmd+Shift+R** en Mac) para renovar el token de sesión.\n` +
        `2. Si el problema persiste, ¿deseas que levantemos el ticket técnico con prioridad alta para que el equipo de desarrollo lo revise de inmediato?`,
      source: 'clinical_engine',
    };
  }

  // Respuesta conversacional guiada por el contexto previo
  const lastUserTopic = history.filter((h) => h.sender === 'user' && h.text.trim().length > 6).pop()?.text;
  if (lastUserTopic) {
    return {
      reply: `Entendido. Con respecto a lo que mencionas sobre "${lastUserTopic.slice(0, 50)}...": ¿El síntoma persiste tras recargar o deseas que canalicemos el reporte formalmente al equipo técnico?`,
      source: 'clinical_engine',
    };
  }

  return {
    reply: 'Te escucho atentamente. Cuéntame los detalles del error o síntoma que observas en el equipo o en pantalla para ayudarte a resolverlo.',
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
  // CASO 1 (PRIORITARIO): Consultar al Backend con Amazon Bedrock (Claude 3 Haiku)
  if (apiClient) {
    try {
      const backendRes = await apiClient.post('/support/ai-chat', {
        message: userInput,
        history,
        userName,
      });

      if (backendRes?.data && (backendRes.data.source === 'bedrock' || backendRes.data.source === 'gemini') && backendRes.data.reply) {
        return {
          reply: backendRes.data.reply,
          suggestedTicket: backendRes.data.suggestedTicket,
          source: backendRes.data.source,
        };
      }
    } catch (err) {
      console.warn('Backend ai-chat no disponible o sin credenciales, evaluando alternativa:', err);
    }
  }

  const apiKey = getGeminiApiKey();

  // CASO 2: Respaldo directo en Frontend si hay API Key de Gemini
  if (apiKey) {
    const systemInstruction = `
Eres Synova, la especialista de soporte técnico clínico del sistema y analizadores de LabSystem Clinique.
Estás conversando directamente con ${userName}, profesional de laboratorio clínico.

OBJETIVO PRINCIPAL:
Tu misión es brindar soporte técnico clínico empático, especializado, indagatorio y resolutivo. Mantén siempre una conversación humana y técnica fluida.

DIRECTRICES CRÍTICAS:
1. IDENTIDAD: Comunícate con calidez y seguridad técnica como especialista de soporte. NUNCA digas que eres una inteligencia artificial, bot o modelo de lenguaje.
2. CONVERSACIÓN E INDAGACIÓN: Si el usuario te saluda, indica una falla genérica ("falla el sistema", "problemas con analizador", "error", etc.) o escribe "levantar ticket" SIN detallar la avería, NO generes un ticket todavía. Pregúntale cordialmente:
   - ¿Qué analizador (marca/modelo) o módulo del sistema está involucrado?
   - ¿Qué código de alarma o síntoma específico observa en pantalla?
   - Si es software: ¿es en recepción de órdenes, captura de resultados o catálogo?
3. ASISTENCIA TÉCNICA GUIADA: Brinda recomendaciones prácticas de contingencia inmediata según corresponda.
4. GENERACIÓN DE TICKETS: ÚNICAMENTE cuando el usuario ya haya detallado el problema y confirme que desea abrir un ticket formal ("sí, levanta el ticket", "crea el ticket"), incluye AL FINAL de tu respuesta el bloque delimitado por \`\`\`ticket_json:
\`\`\`ticket_json
{
  "subject": "Título conciso y profesional del problema reportado",
  "category": "EQUIPOS" | "CALIDAD" | "SISTEMA" | "FACTURACION",
  "priority": "BAJA" | "MEDIA" | "ALTA" | "CRITICA",
  "likelyCause": "Diagnóstico preliminar",
  "suggestedAction": "Acción técnica recomendada"
}
\`\`\`
Si es una charla de soporte en curso, diagnóstico preliminar o preguntas de ayuda, NUNCA incluyas el bloque ticket_json.
Responde siempre en español.
`.trim();

    // Sanear y alternar roles estrictamente para Gemini API
    const contents: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];
    const recentHistory = history
      .filter((h) => typeof h.text === 'string' && h.text.trim().length > 0)
      .slice(-10);

    for (const h of recentHistory) {
      const role: 'user' | 'model' = h.sender === 'user' ? 'user' : 'model';
      if (contents.length === 0) {
        if (role === 'user') {
          contents.push({ role: 'user', parts: [{ text: h.text.trim() }] });
        }
        continue;
      }

      const prev = contents[contents.length - 1];
      if (prev.role === role) {
        prev.parts[0].text += `\n${h.text.trim()}`;
      } else {
        contents.push({ role, parts: [{ text: h.text.trim() }] });
      }
    }

    const currentMsg = userInput.trim();
    if (contents.length > 0 && contents[contents.length - 1].role === 'user') {
      contents[contents.length - 1].parts[0].text += `\n${currentMsg}`;
    } else {
      contents.push({ role: 'user', parts: [{ text: currentMsg }] });
    }

    const modelCandidates = [
      'gemini-2.0-flash',
      'gemini-1.5-flash-latest',
      'gemini-1.5-flash',
      'gemini-2.0-flash-lite',
      'gemini-2.5-flash',
    ];

    try {
      let res: Response | null = null;
      for (const modelName of modelCandidates) {
        try {
          const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${encodeURIComponent(apiKey)}`;
          const attempt = await fetch(url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-goog-api-key': apiKey,
            },
            body: JSON.stringify({
              system_instruction: { parts: [{ text: systemInstruction }] },
              contents,
              generationConfig: { temperature: 0.6, maxOutputTokens: 950 },
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

      // Si todos dieron 404, consultar la lista dinámica de modelos autorizados
      if (!res || res.status === 404) {
        try {
          const listUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(apiKey)}`;
          const listRes = await fetch(listUrl, {
            headers: { 'x-goog-api-key': apiKey },
          });
          if (listRes.ok) {
            const listData = (await listRes.json()) as any;
            const availableModel = listData?.models?.find(
              (m: any) =>
                Array.isArray(m.supportedGenerationMethods) &&
                m.supportedGenerationMethods.includes('generateContent') &&
                (m.name.includes('flash') || m.name.includes('pro'))
            );

            if (availableModel && availableModel.name) {
              const dynamicName = availableModel.name.replace('models/', '');
              const dynamicUrl = `https://generativelanguage.googleapis.com/v1beta/models/${dynamicName}:generateContent?key=${encodeURIComponent(apiKey)}`;
              res = await fetch(dynamicUrl, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'x-goog-api-key': apiKey,
                },
                body: JSON.stringify({
                  system_instruction: { parts: [{ text: systemInstruction }] },
                  contents,
                  generationConfig: { temperature: 0.6, maxOutputTokens: 950 },
                }),
              });
            }
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
              const previousContext = history
                .filter((h) => h.sender === 'user' && !h.text.toLowerCase().includes('ticket') && h.text.trim().length > 10)
                .pop()?.text;
              const fullDescription = previousContext ? `${previousContext}\n\n[Nota de usuario]: ${userInput}` : userInput;
              suggestedTicket = {
                subject: parsed.subject || 'Incidencia de soporte técnico clínico',
                description: fullDescription,
                category: parsed.category || 'SISTEMA',
                priority: parsed.priority || 'MEDIA',
                likelyCause: parsed.likelyCause || 'Diagnóstico preliminar de soporte.',
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

  // CASO 3: Motor conversacional clínico local de Synova (respuestas naturales, indagatorias y resolutivas)
  return runLocalClinicalDiagnosis(userInput, history);
}
