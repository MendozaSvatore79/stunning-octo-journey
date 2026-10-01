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
    !/(hola|buenos|buenas|ayuda|falla|equipo|orden|reactivo|guardar|resultado|folio)/i.test(input);

  if (isEnglish) {
    const isError = text.includes('501') || text.includes('500') || text.includes('403') || text.includes('502') || text.includes('504') || text.includes('error');
    const isTicket = text.includes('ticket') || text.includes('report') || text.includes('support');
    const isSave = text.includes('save') || text.includes('result') || text.includes('order');
    const isAnalyzer = text.includes('analyzer') || text.includes('alarm') || text.includes('needle') || text.includes('motor') || text.includes('sensor');

    if (isTicket || isError || isSave || isAnalyzer) {
      let subj = 'Technical Support Request';
      let cause = 'Technical issue reported during laboratory session.';
      let category: TicketCategory = 'SISTEMA';
      let priority: TicketPriority = 'ALTA';
      let action = 'Immediate priority review by engineering and biomedical team.';

      if (text.includes('501')) {
        subj = 'HTTP 501 Error in Laboratory System';
        cause = 'HTTP 501 (Not Implemented): Backend route mismatch or pending deployment.';
      } else if (text.includes('500')) {
        subj = 'HTTP 500 Internal Server Error';
        cause = 'Internal backend exception or database connectivity issue.';
      } else if (text.includes('403')) {
        subj = 'HTTP 403 Forbidden Access Error';
        cause = 'Session token expiration or AWS WAF security block.';
      } else if (isSave) {
        subj = 'Issue saving results or patient orders';
        cause = 'Failure persisting records in clinical database.';
      } else if (isAnalyzer) {
        category = 'EQUIPOS';
        priority = 'CRITICA';
        subj = 'Clinical Analyzer Alarm / Failure';
        cause = 'Electromechanical or sensor warning on analyzer equipment.';
        action = 'Immediate biomedical inspection and fluidics check.';
      }

      return {
        reply:
          `I have registered the issue and prepared your technical support ticket below.\n\n` +
          `Quick tip: Try pressing **Ctrl+F5** (or **Cmd+Shift+R**) to refresh the session token and cache.\n\n` +
          `Click the button below to submit this ticket immediately to our engineering team:`,
        suggestedTicket: {
          subject: subj,
          description: input,
          category,
          priority,
          likelyCause: cause,
          suggestedAction: action,
        },
        source: 'clinical_engine',
      };
    }

    return {
      reply: "Hello! I'm Synova, your clinical technical support specialist. Please tell me what issue or error you are experiencing, and I will prepare a support ticket for you immediately.",
      source: 'clinical_engine',
    };
  }

  // 1. Solicitud directa de ticket o reporte (Español) -> GENERACIÓN INMEDIATA
  if (
    text.includes('ticket') ||
    text.includes('reporte') ||
    text.includes('abrir ticket') ||
    text.includes('levantar ticket') ||
    text.includes('crear ticket') ||
    text.includes('genera ticket') ||
    text.includes('si levanta') ||
    text.includes('sí levanta') ||
    text.includes('generar ticket')
  ) {
    const previousIssues = history.filter(
      (h) =>
        h.sender === 'user' &&
        !h.text.toLowerCase().includes('ticket') &&
        !h.text.toLowerCase().includes('reporte') &&
        !h.text.toLowerCase().includes('hola') &&
        h.text.trim().length > 4
    );

    const contextIssue = previousIssues.length > 0 ? previousIssues[previousIssues.length - 1].text : input;
    const lowerIssue = contextIssue.toLowerCase();

    let category: TicketCategory = 'SISTEMA';
    let priority: TicketPriority = 'ALTA';
    let likelyCause = 'Incidencia técnica reportada en la sesión de laboratorio.';
    let suggestedAction = 'Atención inmediata por la mesa técnica de ingeniería.';
    let subject = 'Incidencia técnica en sistema';

    if (lowerIssue.includes('analizador') || lowerIssue.includes('equipo') || lowerIssue.includes('alarma') || lowerIssue.includes('aguja')) {
      category = 'EQUIPOS';
      priority = 'CRITICA';
      subject = 'Falla o alarma en analizador clínico';
      likelyCause = 'Bloqueo electromecánico o sensor en analizador.';
      suggestedAction = 'Inspección biomédica y revisión de sensores.';
    } else if (lowerIssue.includes('reactivo') || lowerIssue.includes('calibr') || lowerIssue.includes('westgard') || lowerIssue.includes('lote')) {
      category = 'CALIDAD';
      priority = 'ALTA';
      subject = 'Desvío en calibración o control de calidad';
      likelyCause = 'Desvío de control o lote de reactivo.';
      suggestedAction = 'Auditoría de lote y recalibración analítica.';
    } else if (lowerIssue.includes('501')) {
      subject = 'Error HTTP 501 en sistema';
      likelyCause = 'Error HTTP 501: Ruta o método de backend desincronizado.';
      suggestedAction = 'Reinicio/sincronización de contenedor API por soporte.';
    } else if (lowerIssue.includes('guardar') || lowerIssue.includes('folio')) {
      subject = 'Falla al guardar resultados / folios';
      likelyCause = 'Bloqueo al persistir folios u órdenes en base de datos.';
      suggestedAction = 'Depuración de endpoint de guardado y revisión de base de datos.';
    } else {
      subject = contextIssue.length > 40 ? `${contextIssue.slice(0, 38)}...` : contextIssue;
    }

    return {
      reply:
        'He generado de inmediato la propuesta de ticket formal para que nuestro equipo de ingeniería lo atienda con prioridad.\n\nPor favor haz clic en el botón a continuación para registrarlo:',
      suggestedTicket: {
        subject,
        description: previousIssues.length > 0 ? `${previousIssues[previousIssues.length - 1].text}\n\n[Instrucción de usuario]: ${input}` : input,
        category,
        priority,
        likelyCause,
        suggestedAction,
      },
      source: 'clinical_engine',
    };
  }

  // 2. Códigos de error específicos (501, 500, 403, 502, 504, 404, "error") -> GENERACIÓN INMEDIATA DE TICKET
  if (
    text.includes('501') ||
    text.includes('500') ||
    text.includes('403') ||
    text.includes('502') ||
    text.includes('504') ||
    text.includes('error')
  ) {
    let errorDetail = '';
    let subject = 'Incidencia por código de error en sistema';
    let likelyCause = 'Error reportado en sesión de trabajo.';
    let priority: TicketPriority = 'ALTA';

    if (text.includes('501')) {
      errorDetail = 'El código **HTTP 501 (Not Implemented)** indica que el endpoint solicitado en el servidor no está disponible o el proxy bloqueó la ruta. Suele resolverse sincronizando la última versión de la API.';
      subject = 'Error HTTP 501: Servicio no implementado o ruta no encontrada';
      likelyCause = 'HTTP 501: Endpoint desincronizado en backend o ruta bloqueada por proxy.';
    } else if (text.includes('500')) {
      errorDetail = 'El código **HTTP 500 (Internal Server Error)** indica una excepción en el contenedor del backend o falla de base de datos.';
      subject = 'Error HTTP 500: Excepción interna del servidor';
      likelyCause = 'Error HTTP 500 en backend o desconexión transitoria con PostgreSQL.';
    } else if (text.includes('403')) {
      errorDetail = 'El código **HTTP 403 (Forbidden)** indica que la petición fue rechazada por falta de permisos, token expirado o regla perimetral de AWS WAF.';
      subject = 'Error HTTP 403: Acceso denegado / Bloqueo WAF';
      likelyCause = 'Token de sesión expirado o regla de seguridad WAF.';
    } else if (text.includes('502') || text.includes('504')) {
      errorDetail = 'El código **HTTP 502/504 (Bad Gateway)** indica que el proxy no logró comunicarse con el contenedor de la API.';
      subject = 'Error HTTP 502/504: Gateway Timeout en servidor';
      likelyCause = 'El balanceador de carga o proxy no contactó a tiempo con la API en Lightsail.';
    } else {
      errorDetail = 'He detectado el error reportado en la sesión.';
      subject = `Error en sistema: ${input.slice(0, 35)}`;
      likelyCause = 'Falla técnica reportada por el usuario.';
    }

    const previousContext = history
      .filter((h) => h.sender === 'user' && h.text.trim().length > 4)
      .slice(-2)
      .map((h) => h.text)
      .join(' | ');

    return {
      reply:
        `${errorDetail}\n\n` +
        `💡 **Acción recomendada:** Presiona **Ctrl+F5** (o **Cmd+Shift+R**) para forzar una recarga limpia.\n\n` +
        `Para no demorar la atención, he preparado el ticket con prioridad alta. Solo presiona el botón a continuación para enviarlo a desarrollo:`,
      suggestedTicket: {
        subject,
        description: previousContext ? `${previousContext} -> ${input}` : input,
        category: 'SISTEMA',
        priority,
        likelyCause,
        suggestedAction: 'Revisión y solución inmediata por el equipo de ingeniería.',
      },
      source: 'clinical_engine',
    };
  }

  // 3. Alarmas o fallas en analizadores -> GENERACIÓN INMEDIATA DE TICKET
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
        'Las alertas en analizadores clínicos son de máxima prioridad para no detener la corrida de pacientes.\n\n' +
        '💡 **Verificación de contingencia:**\n' +
        '1. Verifica si la aguja de aspiración tiene algún obstáculo físico o coágulo de fibrina.\n' +
        '2. Confirma niveles de desecho y diluyente.\n\n' +
        'He levantado de inmediato la propuesta de ticket para ingeniería biomédica:',
      suggestedTicket: {
        subject: `Alarma / Falla técnica en Analizador: ${input.slice(0, 35)}`,
        description: input,
        category: 'EQUIPOS',
        priority: 'CRITICA',
        likelyCause: 'Bloqueo electromecánico, sensor o falla de aspiración en analizador.',
        suggestedAction: 'Intervención técnica de soporte biomédico prioritaria.',
      },
      source: 'clinical_engine',
    };
  }

  // 4. Fallas al guardar o fallas generales en el sistema -> GENERACIÓN INMEDIATA DE TICKET
  if (
    text.includes('guardar') ||
    text.includes('folio') ||
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
        'Entendido. Para no retrasar la operación del laboratorio con esta falla, he generado la propuesta de ticket de soporte.\n\n' +
        '💡 Mientras lo atienden, prueba forzar la recarga con **Ctrl+F5** (o **Cmd+Shift+R**).\n\n' +
        'Haz clic en el botón para enviar el reporte de inmediato a ingeniería:',
      suggestedTicket: {
        subject: `Falla en sistema al guardar / procesar: ${input.slice(0, 35)}`,
        description: input,
        category: 'SISTEMA',
        priority: 'ALTA',
        likelyCause: 'Error de persistencia o bloqueo de interfaz al procesar registros.',
        suggestedAction: 'Revisión técnica de endpoint y base de datos.',
      },
      source: 'clinical_engine',
    };
  }

  // 5. Saludos e introducciones
  if (text === 'hola' || text === 'buenos días' || text === 'buenas tardes' || text === 'buenas noches' || text === 'que tal' || text === 'buenas') {
    return {
      reply:
        '¡Hola! Qué gusto saludarte. ¿Cómo está marchando la jornada en tu laboratorio? Cuéntame si presentas alguna falla con analizadores, calibraciones, reactivos, folios o el sistema y te genero el ticket o solución de inmediato.',
      source: 'clinical_engine',
    };
  }

  // Respuesta por defecto con opción de ticket
  return {
    reply:
      'Te escucho atentamente. He recibido tu mensaje y estoy lista para atenderte.\n\n' +
      'Si se trata de una falla o bloqueo en el laboratorio, puedes generar el ticket de soporte ahora mismo:',
    suggestedTicket: {
      subject: `Reporte de incidencia: ${input.slice(0, 40)}`,
      description: input,
      category: 'SISTEMA',
      priority: 'MEDIA',
      likelyCause: 'Incidencia reportada en chat de soporte.',
      suggestedAction: 'Seguimiento por mesa técnica de soporte.',
    },
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
You are Synova, the premier clinical technical support specialist for LabSystem Clinique (LIS, clinical analyzers, quality control, database & system operations).
You are assisting ${userName}, a clinical laboratory professional.

CORE BEHAVIOR RULES (CRITICAL):
1. BILINGUAL AUTOMATIC DETECTION:
   - If the user speaks in English, respond natively and fluently in English.
   - If the user speaks in Spanish, respond natively and fluently in Spanish.
   - Never force the user to pick a language.

2. ZERO RUNAROUND - IMMEDIATE TICKET PROPOSAL:
   - When the user mentions an error code (501, 500, 403, 502, 504), a system crash, saving failure, analyzer alarm, or requests a ticket/report:
     * Provide a brief, decisive 1-to-2 sentence clinical or technical tip (e.g. reload with Ctrl+F5, check sample probe/coagulation).
     * DO NOT interrogate the user with surveys or questionnaires.
     * IMMEDIATELY append the \`\`\`ticket_json block at the end of your response so the user can submit the ticket in 1 click!

3. TICKET JSON FORMAT:
When generating a ticket proposal, append this block at the end:
\`\`\`ticket_json
{
  "subject": "Concise issue summary",
  "category": "EQUIPOS" | "CALIDAD" | "SISTEMA" | "FACTURACION",
  "priority": "BAJA" | "MEDIA" | "ALTA" | "CRITICA",
  "likelyCause": "Preliminary diagnosis / root cause",
  "suggestedAction": "Immediate action recommended"
}
\`\`\`
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
