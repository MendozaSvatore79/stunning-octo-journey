// src/components/SupportBotBubble.tsx
import { useState, useRef, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { useApi } from '../hooks/useApi';
import {
  IconBot,
  IconX,
  IconSend,
  IconTicket,
  IconSparkles,
  IconCheckCircle,
  IconWrench,
  IconFlask,
  IconRefresh,
} from './icons';
import type { TicketCategory, TicketPriority, TicketStatus, SupportTicket } from './SupportChatView';

interface BotMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: string;
  suggestedTicket?: {
    subject: string;
    description: string;
    category: TicketCategory;
    priority: TicketPriority;
    likelyCause: string;
    suggestedAction: string;
  };
  createdTicket?: {
    ticketNumber: string;
    subject: string;
    category: TicketCategory;
    priority: TicketPriority;
    status: TicketStatus;
  };
}

interface SupportBotBubbleProps {
  onNavigateToFullSupport?: () => void;
}

// Motor de diagnóstico clínico y detección de intención para el bot
function analyzeUserIssue(input: string): {
  reply: string;
  ticketData: {
    subject: string;
    description: string;
    category: TicketCategory;
    priority: TicketPriority;
    likelyCause: string;
    suggestedAction: string;
  };
} {
  const text = input.toLowerCase();

  // 1. Analizadores y Equipos
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
        'He detectado una anomalía operativa en analizadores o robótica analítica. Te recomiendo verificar el suministro de agua desionizada, inspeccionar la aguja de aspiración y reiniciar el analizador por 60 segundos si persiste la alarma mecánica.\n\n¿Deseas que levante un ticket de soporte técnico oficial para que el departamento de ingeniería atienda el equipo de inmediato?',
      ticketData: {
        subject: `Falla o alarma en Analizador Clínico: ${input.slice(0, 50)}...`,
        description: input,
        category: 'EQUIPOS',
        priority: 'CRITICA',
        likelyCause: 'Posible obstrucción en aguja de aspiración, fallo en sensor de flujo o bloqueo en brazo electromecánico.',
        suggestedAction: '1. Desactivar bombas de vacío.\n2. Limpiar sonda con desproteinizante.\n3. Ejecutar rutina de lavado y prueba de blancos.',
      },
    };
  }

  // 2. Reactivos, Controles y Calidad
  if (
    text.includes('reactivo') ||
    text.includes('lote') ||
    text.includes('control') ||
    text.includes('calibr') ||
    text.includes('caduc') ||
    text.includes('westgard') ||
    text.includes('levey') ||
    text.includes('sesgo') ||
    text.includes('fuera de rango')
  ) {
    return {
      reply:
        'Detecté un evento asociado a reactivos o control de calidad analítico. Si los controles violaron reglas Westgard (como 1:3s o 2:2s), te aconsejo atemperar un vial nuevo a 22°C y recalibrar antes de liberar resultados de pacientes.\n\n¿Deseas que levante un ticket de soporte técnico para revisar el lote y calibración?',
      ticketData: {
        subject: `Incidencia de Reactivos o Control de Calidad: ${input.slice(0, 50)}...`,
        description: input,
        category: 'CALIDAD',
        priority: 'ALTA',
        likelyCause: 'Pérdida de linealidad de calibrador, evaporación de reactivo a bordo o desvío fotométrico sistemático.',
        suggestedAction: '1. Verificar temperatura de almacenamiento.\n2. Reconstituir nuevo control.\n3. Recalibrar y verificar blanco.',
      },
    };
  }

  // 3. Órdenes, Folios y Pacientes
  if (
    text.includes('orden') ||
    text.includes('folio') ||
    text.includes('paciente') ||
    text.includes('resultado') ||
    text.includes('pdf') ||
    text.includes('impresion') ||
    text.includes('impresión') ||
    text.includes('whatsapp') ||
    text.includes('ultramsg')
  ) {
    return {
      reply:
        'Entiendo tu consulta sobre órdenes de trabajo, emisión de folios o reporte de resultados. He verificado el módulo de trabajo y la base de datos de pacientes.\n\n¿Deseas levantar un ticket para que verifiquemos la orden o el envío automático?',
      ticketData: {
        subject: `Consulta / Incidencia en Órdenes y Resultados: ${input.slice(0, 50)}...`,
        description: input,
        category: 'SISTEMA',
        priority: 'MEDIA',
        likelyCause: 'Discrepancia en asignación de folio, estado de muestra o cola de despacho de mensajería.',
        suggestedAction: 'Revisar estatus de la orden en panel de recepción y re-sincronizar con el servidor central.',
      },
    };
  }

  // 4. Intención directa de levantar ticket
  if (
    text.includes('ticket') ||
    text.includes('levantar') ||
    text.includes('soporte') ||
    text.includes('ayuda') ||
    text.includes('reportar') ||
    text.includes('falla') ||
    text.includes('error') ||
    text.includes('problema')
  ) {
    return {
      reply:
        '¡Claro que sí! He estructurado los detalles de tu problema para levantar un ticket técnico oficial en el sistema. Por favor revisa la propuesta a continuación y confírmame para ingresarlo a la cola de atención inmediata.',
      ticketData: {
        subject: input.length > 50 ? `${input.slice(0, 47)}...` : input,
        description: input,
        category: 'SISTEMA',
        priority: 'ALTA',
        likelyCause: 'Incidencia operativa reportada directamente por el usuario de la sede.',
        suggestedAction: 'Evaluar logs de sistema, reproducir el escenario y contactar al químico operador.',
      },
    };
  }

  // 5. Respuesta general clínica
  return {
    reply:
      'Comprendo lo que me indicas. Para asistirte de la forma más rápida y precisa, ¿te gustaría que levantemos un ticket de soporte técnico formal para que nuestro equipo lo revise de inmediato?',
    ticketData: {
      subject: `Solicitud de Soporte: ${input.slice(0, 50)}...`,
      description: input,
      category: 'SISTEMA',
      priority: 'MEDIA',
      likelyCause: 'Consulta o requerimiento general de asistencia técnica en laboratorio.',
      suggestedAction: 'Asignar a un asesor técnico para seguimiento directo.',
    },
  };
}

export default function SupportBotBubble({ onNavigateToFullSupport }: SupportBotBubbleProps) {
  const { user } = useUser();
  const api = useApi();

  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'tickets'>('chat');
  const [inputText, setInputText] = useState('');
  const [isSubmittingTicket, setIsSubmittingTicket] = useState(false);
  const [isBotTyping, setIsBotTyping] = useState(false);
  const [ticketsList, setTicketsList] = useState<SupportTicket[]>([]);
  const [isLoadingTickets, setIsLoadingTickets] = useState(false);
  const [hasUnreadAlert, setHasUnreadAlert] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const userName = user?.firstName || user?.fullName || 'Colega';
  const realUserName =
    user?.fullName ||
    [user?.firstName, user?.lastName].filter(Boolean).join(' ') ||
    'Químico de Laboratorio';

  // Mensajes iniciales del Bot
  const [messages, setMessages] = useState<BotMessage[]>([
    {
      id: 'welcome-1',
      sender: 'bot',
      text: `¡Hola ${userName}! 👋 Soy **LabBot**, tu asistente clínico inteligente de soporte técnico.`,
      timestamp: 'Ahora',
    },
    {
      id: 'welcome-2',
      sender: 'bot',
      text: '¿En qué puedo asistirte hoy? Puedo ayudarte a diagnosticar problemas con analizadores o reactivos, y **levantar un ticket de soporte técnico automáticamente** en segundos.',
      timestamp: 'Ahora',
    },
  ]);

  // Cargar tickets guardados
  const loadTickets = async () => {
    setIsLoadingTickets(true);
    try {
      const res = await api.get('/support/tickets');
      if (Array.isArray(res.data) && res.data.length > 0) {
        setTicketsList(res.data);
        localStorage.setItem('lab_support_tickets', JSON.stringify(res.data));
      } else {
        const stored = localStorage.getItem('lab_support_tickets');
        if (stored) setTicketsList(JSON.parse(stored));
      }
    } catch {
      const stored = localStorage.getItem('lab_support_tickets');
      if (stored) {
        try {
          setTicketsList(JSON.parse(stored));
        } catch {}
      }
    } finally {
      setIsLoadingTickets(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setHasUnreadAlert(false);
      loadTickets();
      setTimeout(() => inputRef.current?.focus(), 250);
    }
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isBotTyping]);

  // Enviar mensaje en el chat
  const handleSendMessage = (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text) return;

    const userMsg: BotMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputText('');

    // Simular pensamiento del bot y análisis clínico
    setIsBotTyping(true);
    setTimeout(() => {
      const analysis = analyzeUserIssue(text);
      const botMsg: BotMessage = {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        text: analysis.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggestedTicket: analysis.ticketData,
      };

      setMessages((prev) => [...prev, botMsg]);
      setIsBotTyping(false);
    }, 700);
  };

  // Crear ticket automáticamente con confirmación
  const handleConfirmCreateTicket = async (ticketData: NonNullable<BotMessage['suggestedTicket']>) => {
    setIsSubmittingTicket(true);
    const ticketNumber = `TICK-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const newTicket: SupportTicket = {
      id: `local-${Date.now()}`,
      ticketNumber,
      userId: user?.id || 'usr-anon',
      userName: realUserName,
      userEmail: user?.primaryEmailAddress?.emailAddress,
      channelId: 'soporte-general',
      subject: ticketData.subject,
      category: ticketData.category,
      priority: ticketData.priority,
      description: ticketData.description,
      status: 'ABIERTO',
      aiAnalysis: {
        likelyCause: ticketData.likelyCause,
        suggestedAction: ticketData.suggestedAction,
        recommendedPriority: ticketData.priority,
        summary: ticketData.subject,
      },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    // Actualizar almacenamiento local
    setTicketsList((prev) => {
      const updated = [newTicket, ...prev];
      try {
        localStorage.setItem('lab_support_tickets', JSON.stringify(updated));
      } catch {}
      return updated;
    });

    // Enviar a la base de datos Neon PostgreSQL mediante el backend
    try {
      const res = await api.post('/support/tickets', {
        channelId: 'soporte-general',
        userId: user?.id || 'usr-anon',
        userName: realUserName,
        userEmail: user?.primaryEmailAddress?.emailAddress,
        subject: ticketData.subject,
        category: ticketData.category,
        priority: ticketData.priority,
        description: ticketData.description,
      });

      if (res.data && res.data.id) {
        setTicketsList((prev) =>
          prev.map((t) => (t.ticketNumber === ticketNumber ? res.data : t))
        );
      }
    } catch (err) {
      console.warn('Ticket respaldado localmente mientras el backend se sincroniza:', err);
    } finally {
      setIsSubmittingTicket(false);

      // Agregar confirmación de ticket al chat
      const confirmationMsg: BotMessage = {
        id: `bot-confirm-${Date.now()}`,
        sender: 'bot',
        text: `✅ **¡Ticket levantado exitosamente!**\n\nHe registrado tu solicitud con folio **#${ticketNumber}**. Un ingeniero de soporte ha recibido la alerta prioritaria con el diagnóstico previo generado.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        createdTicket: {
          ticketNumber,
          subject: ticketData.subject,
          category: ticketData.category,
          priority: ticketData.priority,
          status: 'ABIERTO',
        },
      };

      setMessages((prev) => [...prev, confirmationMsg]);
    }
  };

  return (
    <>
      {/* ========================================================================= */}
      {/* 1. BURBUJA FLOTANTE EN ESQUINA INFERIOR DERECHA */}
      {/* ========================================================================= */}
      <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-40 flex flex-col items-end">
        {/* Tooltip informativo inicial que desaparece tras interactuar */}
        {!isOpen && !hasUnreadAlert && (
          <div className="hidden sm:flex items-center gap-2 mb-2 bg-base-100/95 backdrop-blur-md text-base-content px-3.5 py-1.5 rounded-full shadow-lg border border-base-300 text-xs font-bold animate-bounce select-none">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>¿Necesitas ayuda? LabBot te asiste</span>
          </div>
        )}

        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`relative group btn btn-circle h-14 w-14 sm:h-16 sm:w-16 shadow-2xl border-2 transition-all duration-300 ${
            isOpen
              ? 'bg-base-200 text-base-content border-base-300 hover:bg-base-300 scale-95'
              : 'bg-gradient-to-tr from-teal-600 via-cyan-600 to-teal-500 hover:from-teal-500 hover:to-cyan-400 text-white border-white/20 hover:scale-105 shadow-teal-500/30'
          }`}
          aria-label="Abrir asistente de soporte técnico LabBot"
          title="Soporte Técnico & Tickets IA"
        >
          {/* Anillo de pulso sutil cuando está cerrado */}
          {!isOpen && (
            <span className="absolute -inset-1 rounded-full bg-teal-400/30 animate-ping pointer-events-none"></span>
          )}

          {isOpen ? (
            <IconX className="w-6 h-6 transition-transform group-hover:rotate-90" />
          ) : (
            <div className="flex flex-col items-center justify-center">
              <IconBot className="w-7 h-7 sm:w-8 sm:h-8" />
              <span className="text-[8px] font-black tracking-widest uppercase mt-[-1px]">
                BOT IA
              </span>
            </div>
          )}

          {/* Indicador de estado en línea */}
          {!isOpen && (
            <span
              className="absolute top-1 right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full shadow-xs"
              title="En línea 24/7"
            />
          )}
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 2. VENTANA FLOTANTE DE CHAT CON LABBOT */}
      {/* ========================================================================= */}
      {isOpen && (
        <div className="fixed bottom-20 right-3 sm:bottom-24 sm:right-6 w-[calc(100vw-1.5rem)] sm:w-[410px] md:w-[430px] max-w-[95vw] h-[560px] max-h-[82vh] bg-base-100 border border-base-300 shadow-2xl rounded-3xl flex flex-col z-40 overflow-hidden animate-scale-in">
          {/* Header del Widget */}
          <div className="bg-gradient-to-r from-teal-700 via-cyan-800 to-teal-800 text-white p-3.5 sm:p-4 flex items-center justify-between shrink-0 shadow-md">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white font-bold shadow-inner">
                  <IconBot className="w-6 h-6" />
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 border-2 border-teal-900 rounded-full"></span>
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-extrabold text-sm sm:text-base leading-tight">LabBot Clínico</h3>
                  <span className="badge badge-xs bg-emerald-400 text-teal-950 font-bold border-none px-1.5 text-[9px]">
                    IA ACTIVA
                  </span>
                </div>
                <p className="text-[11px] text-white/80 leading-tight">
                  Soporte Técnico y Tickets Automáticos
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {onNavigateToFullSupport && (
                <button
                  onClick={() => {
                    setIsOpen(false);
                    onNavigateToFullSupport();
                  }}
                  className="btn btn-ghost btn-circle btn-xs text-white/80 hover:text-white hover:bg-white/10"
                  title="Abrir panel completo de soporte"
                >
                  <IconTicket className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="btn btn-ghost btn-circle btn-xs text-white/80 hover:text-white hover:bg-white/10"
                title="Minimizar chat"
              >
                <IconX className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Barra de Pestañas: Chat interactivo vs Mis Tickets */}
          <div className="flex border-b border-base-200 bg-base-200/50 p-1 shrink-0">
            <button
              onClick={() => setActiveTab('chat')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'chat'
                  ? 'bg-base-100 text-primary shadow-xs'
                  : 'text-base-content/60 hover:text-base-content'
              }`}
            >
              <IconBot className="w-3.5 h-3.5" />
              <span>Asistente IA</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('tickets');
                loadTickets();
              }}
              className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'tickets'
                  ? 'bg-base-100 text-primary shadow-xs'
                  : 'text-base-content/60 hover:text-base-content'
              }`}
            >
              <IconTicket className="w-3.5 h-3.5" />
              <span>Mis Tickets ({ticketsList.length})</span>
            </button>
          </div>

          {/* ========================================================================= */}
          {/* VISTA 1: CHAT CON EL BOT */}
          {/* ========================================================================= */}
          {activeTab === 'chat' && (
            <>
              {/* Contenedor de Mensajes con Scroll */}
              <div className="flex-1 p-3.5 sm:p-4 overflow-y-auto space-y-3.5 text-xs">
                {messages.map((msg) => (
                  <div key={msg.id} className="space-y-2">
                    <div className={`chat ${msg.sender === 'user' ? 'chat-end' : 'chat-start'}`}>
                      {msg.sender === 'bot' && (
                        <div className="chat-image avatar">
                          <div className="w-7 h-7 rounded-xl bg-teal-500/10 text-teal-600 flex items-center justify-center border border-teal-500/20">
                            <IconBot className="w-4 h-4" />
                          </div>
                        </div>
                      )}

                      <div
                        className={`chat-bubble leading-relaxed ${
                          msg.sender === 'user'
                            ? 'chat-bubble-primary text-white font-medium'
                            : 'bg-base-200 text-base-content border border-base-300/80 shadow-2xs'
                        }`}
                      >
                        <p className="whitespace-pre-line">{msg.text}</p>
                      </div>

                      <div className="chat-footer opacity-50 text-[10px] mt-0.5">
                        {msg.timestamp}
                      </div>
                    </div>

                    {/* Tarjeta interactiva de propuesta para Levantar Ticket Automático */}
                    {msg.suggestedTicket && (
                      <div className="ml-8 p-3 rounded-2xl bg-teal-500/5 border border-teal-500/20 space-y-2.5 shadow-xs animate-fade-in">
                        <div className="flex items-center justify-between border-b border-teal-500/20 pb-1.5">
                          <span className="text-[11px] font-black uppercase text-teal-700 dark:text-teal-400 flex items-center gap-1">
                            <IconSparkles className="w-3.5 h-3.5 text-teal-600" />
                            Propuesta de Ticket Automático
                          </span>
                          <span
                            className={`badge badge-xs font-bold font-mono text-[9px] ${
                              msg.suggestedTicket.priority === 'CRITICA'
                                ? 'badge-error text-white'
                                : msg.suggestedTicket.priority === 'ALTA'
                                ? 'badge-warning text-slate-900'
                                : 'badge-info text-white'
                            }`}
                          >
                            {msg.suggestedTicket.priority}
                          </span>
                        </div>

                        <div className="text-[11px] space-y-1">
                          <p>
                            <strong className="text-base-content">Asunto:</strong>{' '}
                            <span className="text-base-content/80">{msg.suggestedTicket.subject}</span>
                          </p>
                          <p>
                            <strong className="text-base-content">Causa Probable:</strong>{' '}
                            <span className="text-base-content/70">{msg.suggestedTicket.likelyCause}</span>
                          </p>
                        </div>

                        <div className="pt-1 flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleConfirmCreateTicket(msg.suggestedTicket!)}
                            disabled={isSubmittingTicket}
                            className="btn btn-xs btn-primary text-white rounded-xl gap-1.5 font-bold flex-1 shadow-xs"
                          >
                            {isSubmittingTicket ? (
                              <>
                                <span className="loading loading-spinner loading-xs"></span>
                                Levantando Ticket...
                              </>
                            ) : (
                              <>
                                <IconTicket className="w-3.5 h-3.5" />
                                ✅ Levantar Ticket Ahora
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Tarjeta de Ticket ya creado */}
                    {msg.createdTicket && (
                      <div className="ml-8 p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 space-y-1.5 text-[11px]">
                        <div className="flex items-center justify-between font-bold text-emerald-700 dark:text-emerald-400">
                          <span className="flex items-center gap-1 font-mono">
                            <IconCheckCircle className="w-3.5 h-3.5" />
                            {msg.createdTicket.ticketNumber}
                          </span>
                          <span className="badge badge-success text-white badge-xs">
                            {msg.createdTicket.status}
                          </span>
                        </div>
                        <p className="text-base-content/80 font-medium">
                          {msg.createdTicket.subject}
                        </p>
                      </div>
                    )}
                  </div>
                ))}

                {/* Animación de "Escribiendo..." */}
                {isBotTyping && (
                  <div className="chat chat-start">
                    <div className="chat-image avatar">
                      <div className="w-7 h-7 rounded-xl bg-teal-500/10 text-teal-600 flex items-center justify-center border border-teal-500/20">
                        <IconBot className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="chat-bubble bg-base-200 text-base-content/60 flex items-center gap-1.5 py-2">
                      <span className="loading loading-dots loading-xs"></span>
                      <span className="text-[11px] font-medium">LabBot está analizando...</span>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Botones de Acción Rápida (Pills) */}
              <div className="px-3 pt-2 pb-1 border-t border-base-200 bg-base-100 flex items-center gap-1.5 overflow-x-auto scrollbar-none shrink-0">
                <button
                  type="button"
                  onClick={() => handleSendMessage('Tengo una alarma o falla mecánica en el analizador')}
                  className="btn btn-xs btn-outline btn-primary rounded-full shrink-0 font-semibold gap-1 text-[10px]"
                >
                  <IconWrench className="w-3 h-3" /> Falla en Analizador
                </button>

                <button
                  type="button"
                  onClick={() => handleSendMessage('Problema con lote de reactivos o calibración fuera de rango')}
                  className="btn btn-xs btn-outline btn-primary rounded-full shrink-0 font-semibold gap-1 text-[10px]"
                >
                  <IconFlask className="w-3 h-3" /> Reactivo / Lote
                </button>

                <button
                  type="button"
                  onClick={() => handleSendMessage('Deseo levantar un ticket de soporte técnico')}
                  className="btn btn-xs btn-primary text-white rounded-full shrink-0 font-bold gap-1 text-[10px]"
                >
                  <IconTicket className="w-3 h-3" /> Levantar Ticket
                </button>
              </div>

              {/* Barra de Entrada de Texto */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="p-3 border-t border-base-200 bg-base-100 flex items-center gap-2 shrink-0"
              >
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Describe tu falla o escribe 'levantar ticket'..."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  disabled={isSubmittingTicket}
                  className="input input-sm input-bordered flex-1 rounded-2xl text-xs focus:input-primary"
                />
                <button
                  type="submit"
                  disabled={!inputText.trim() || isSubmittingTicket}
                  className="btn btn-sm btn-primary text-white btn-circle shrink-0 shadow-xs"
                  title="Enviar mensaje"
                >
                  <IconSend className="w-4 h-4" />
                </button>
              </form>
            </>
          )}

          {/* ========================================================================= */}
          {/* VISTA 2: LISTA DE MIS TICKETS REGISTRADOS */}
          {/* ========================================================================= */}
          {activeTab === 'tickets' && (
            <div className="flex-1 p-3.5 sm:p-4 overflow-y-auto space-y-3 text-xs">
              <div className="flex items-center justify-between border-b border-base-200 pb-2">
                <div>
                  <h4 className="font-extrabold text-sm text-base-content">Tickets de Soporte Activos</h4>
                  <p className="text-[11px] text-base-content/60">
                    Historial de incidencias registradas para esta sede
                  </p>
                </div>
                <button
                  onClick={loadTickets}
                  disabled={isLoadingTickets}
                  className="btn btn-xs btn-ghost btn-circle"
                  title="Actualizar tickets"
                >
                  <IconRefresh className={`w-3.5 h-3.5 ${isLoadingTickets ? 'animate-spin' : ''}`} />
                </button>
              </div>

              {isLoadingTickets && ticketsList.length === 0 ? (
                <div className="py-12 flex flex-col items-center justify-center gap-2">
                  <span className="loading loading-spinner loading-md text-primary"></span>
                  <p className="text-xs text-base-content/60">Cargando tickets...</p>
                </div>
              ) : ticketsList.length === 0 ? (
                <div className="py-10 text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-base-200 text-base-content/40 flex items-center justify-center mx-auto">
                    <IconTicket className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="font-bold text-base-content">No tienes tickets abiertos</p>
                    <p className="text-[11px] text-base-content/60">
                      Puedes pedirle a LabBot que levante uno cuando lo necesites.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setActiveTab('chat');
                      handleSendMessage('Quiero levantar un ticket de soporte técnico');
                    }}
                    className="btn btn-xs btn-primary text-white rounded-xl gap-1.5 font-bold"
                  >
                    <IconSparkles className="w-3.5 h-3.5" />
                    Levantar mi primer ticket
                  </button>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {ticketsList.map((t) => (
                    <div
                      key={t.id || t.ticketNumber}
                      className="p-3 rounded-2xl bg-base-200/60 border border-base-300 hover:border-primary/40 transition-colors space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-black text-primary text-[11px]">
                          #{t.ticketNumber}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`badge badge-xs font-bold text-[9px] ${
                              t.priority === 'CRITICA'
                                ? 'badge-error text-white'
                                : t.priority === 'ALTA'
                                ? 'badge-warning text-slate-900'
                                : 'badge-ghost text-base-content/70'
                            }`}
                          >
                            {t.priority}
                          </span>
                          <span
                            className={`badge badge-xs font-bold text-[9px] ${
                              t.status === 'ABIERTO'
                                ? 'badge-primary text-white'
                                : t.status === 'RESUELTO'
                                ? 'badge-success text-white'
                                : 'badge-neutral text-white'
                            }`}
                          >
                            {t.status}
                          </span>
                        </div>
                      </div>

                      <h5 className="font-bold text-base-content leading-snug line-clamp-1">
                        {t.subject}
                      </h5>

                      <p className="text-[11px] text-base-content/70 line-clamp-2 leading-relaxed">
                        {t.description}
                      </p>

                      <div className="pt-1 flex items-center justify-between text-[10px] text-base-content/50 border-t border-base-300/50">
                        <span>Cat: {t.category}</span>
                        <span>{new Date(t.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Footer del Widget */}
          <div className="p-2 border-t border-base-200 bg-base-200/40 text-center text-[10px] text-base-content/50 font-medium shrink-0">
            LabBot Clínico • Monitoreo 24/7 y SLA Garantizado
          </div>
        </div>
      )}
    </>
  );
}
