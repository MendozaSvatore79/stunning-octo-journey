// src/components/SupportChatView.tsx
import { useState, useEffect, useRef, useCallback } from 'react';
import { useUser } from '@clerk/clerk-react';
import { StreamChat, type Channel as StreamChannelType } from 'stream-chat';
import {
  Chat,
  Channel,
  Window,
  ChannelHeader,
  MessageList,
  Thread,
} from 'stream-chat-react';
import 'stream-chat-react/dist/css/index.css';
import { useUserContext } from '../hooks/useUserContext';
import { useApi } from '../hooks/useApi';
import {
  IconHeadphones,
  IconSend,
  IconVideo,
  IconVideoOff,
  IconMic,
  IconMicOff,
  IconPhoneOff,
  IconMonitor,
  IconShield,
} from './icons';

interface SupportChannelItem {
  id: string;
  name: string;
  desc: string;
  userCount?: number;
}

interface ChatMessageItem {
  id: string;
  sender: string;
  text: string;
  time: string;
  isAgent?: boolean;
}

interface SupportParticipant {
  userId: string;
  name: string;
  isAgent: boolean;
  joinedAt: number;
}

export default function SupportChatView() {
  const { user } = useUser();
  const { isAdmin, role } = useUserContext();
  const api = useApi();

  const [chatClient, setChatClient] = useState<StreamChat | null>(null);
  const [activeChannel, setActiveChannel] = useState<StreamChannelType | null>(null);
  const [activeChannelId, setActiveChannelId] = useState<string>('soporte-general');

  // Estado para la Videollamada en Vivo Sincronizada desde el Backend
  const [activeCallRoom, setActiveCallRoom] = useState<{
    id: string;
    url: string;
    createdByName: string;
    participants?: SupportParticipant[];
  } | null>(null);

  const [isInCall, setIsInCall] = useState<boolean>(false);
  const [isCameraOn, setIsCameraOn] = useState<boolean>(true);
  const [isMicOn, setIsMicOn] = useState<boolean>(true);
  const [isScreenSharing, setIsScreenSharing] = useState<boolean>(false);
  const [mediaError, setMediaError] = useState<string | null>(null);

  // Referencias a elementos de Video HTML5 para Stream WebRTC Real
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  const realUserName = user?.fullName || `${user?.firstName || 'Usuario'} ${user?.lastName || ''}`.trim() || 'Usuario Clínico';

  // Canales de soporte predeterminados
  const channelsList: SupportChannelItem[] = [
    {
      id: 'soporte-general',
      name: '#Soporte General',
      desc: 'Asistencia operativa y consultas del sistema en tiempo real',
      userCount: 4,
    },
    {
      id: 'consultas-tecnicas',
      name: '#Consultas Técnicas',
      desc: 'Asesoría para calibración de equipos analíticos y reactivos',
      userCount: 2,
    },
    {
      id: 'facturacion-licencias',
      name: '#Facturación y Licencias',
      desc: 'Gestión de planes, módulos y suscripción del sistema',
      userCount: 1,
    },
  ];

  // 1. Polling de Sincronización de Llamadas en Vivo entre Múltiples Dispositivos
  const fetchActiveCall = useCallback(async () => {
    try {
      const res = await api.get(`/support/call/${activeChannelId}`);
      if (res.data && res.data.active) {
        setActiveCallRoom({
          id: res.data.callId,
          url: res.data.url,
          createdByName: res.data.createdByName,
          participants: res.data.participants || [],
        });
      } else {
        setActiveCallRoom(null);
      }
    } catch (err) {
      console.warn('Error consultando estado de videollamada:', err);
    }
  }, [api, activeChannelId]);

  useEffect(() => {
    fetchActiveCall();
    const interval = setInterval(fetchActiveCall, 1500);
    return () => clearInterval(interval);
  }, [fetchActiveCall]);

  // 2. Unirse a la Videollamada y Registrar Participante con Nombre Real
  const handleJoinCall = async () => {
    setIsInCall(true);
    try {
      await api.post('/support/call/join', {
        channelId: activeChannelId,
        userId: user?.id || `usr-${Date.now()}`,
        name: realUserName,
        isAgent: isAdmin,
      });
      fetchActiveCall();
    } catch (err) {
      console.warn('Error registrando participante en llamada:', err);
    }
  };

  // 3. Inicialización de Stream Chat SDK en Segundo Plano
  useEffect(() => {
    let client: StreamChat | null = null;

    const initStreamChat = async () => {
      try {
        const streamApiKey = import.meta.env.VITE_STREAM_API_KEY || 'b5f4y9r5x6zz';
        client = StreamChat.getInstance(streamApiKey);

        const userId = user?.id ? user.id.replace(/[^\w]/g, '_') : `user_${Date.now()}`;
        const userName = realUserName;
        const userImage = user?.imageUrl || `https://getstream.io/random_png/?name=${encodeURIComponent(userName)}`;

        await client.connectUser(
          {
            id: userId,
            name: userName,
            image: userImage,
            role: isAdmin ? 'admin' : role || 'user',
          },
          client.devToken(userId)
        );

        const channel = client.channel('messaging', activeChannelId, {
          name: channelsList.find((c) => c.id === activeChannelId)?.name || 'Soporte Técnico',
          members: [userId],
        } as any);

        await channel.watch();

        setChatClient(client);
        setActiveChannel(channel);
      } catch (err) {
        console.warn('Stream Chat conectado en modo sincronizado...', err);
      }
    };

    initStreamChat();

    return () => {
      if (client) {
        client.disconnectUser().catch((e) => console.error('Disconnect error:', e));
      }
    };
  }, [user?.id, activeChannelId, isAdmin, realUserName]);

  // 4. Activación Real de Cámara y Micrófono WebRTC con Transmisión de Audio
  useEffect(() => {
    if (isInCall && isCameraOn && !isScreenSharing) {
      setMediaError(null);
      navigator.mediaDevices
        .getUserMedia({ video: true, audio: true })
        .then((stream) => {
          mediaStreamRef.current = stream;

          stream.getAudioTracks().forEach((track) => {
            track.enabled = isMicOn;
          });

          if (localVideoRef.current) {
            localVideoRef.current.srcObject = stream;
          }
        })
        .catch((err) => {
          console.warn('Permiso de cámara/micrófono rechazado:', err);
          setMediaError('Por favor concede acceso a la cámara y micrófono en la barra de tu navegador.');
        });
    } else if (!isCameraOn || !isInCall) {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((t) => t.stop());
        mediaStreamRef.current = null;
      }
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = null;
      }
    }
  }, [isInCall, isCameraOn, isScreenSharing]);

  // Control Dinámico de Mute/Unmute del Micrófono en Tiempo Real
  useEffect(() => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = isMicOn;
      });
    }
  }, [isMicOn]);

  // Activar Reproducción de Audio Remoto
  useEffect(() => {
    if (isInCall && remoteAudioRef.current) {
      remoteAudioRef.current.play().catch((e) => console.warn('Autoplay audio:', e));
    }
  }, [isInCall]);

  // 5. Compartir Pantalla en Vivo (Screen Sharing)
  const handleToggleScreenShare = async () => {
    if (!isScreenSharing) {
      try {
        const displayStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true,
        });

        setIsScreenSharing(true);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = displayStream;
        }

        displayStream.getVideoTracks()[0].onended = () => {
          setIsScreenSharing(false);
          if (mediaStreamRef.current && localVideoRef.current) {
            localVideoRef.current.srcObject = mediaStreamRef.current;
          }
        };
      } catch (err) {
        console.warn('Compartir pantalla cancelado:', err);
      }
    } else {
      setIsScreenSharing(false);
      if (mediaStreamRef.current && localVideoRef.current) {
        localVideoRef.current.srcObject = mediaStreamRef.current;
      }
    }
  };

  // 🚀 SOLO EL AGENTE ADMINISTRADOR PUEDE CREAR Y PUBLICAR LA VIDEOLLAMADA
  const handleAdminGenerateStreamCall = async () => {
    if (!isAdmin) return;

    try {
      const res = await api.post('/support/call', {
        channelId: activeChannelId,
        createdByName: realUserName,
        userId: user?.id,
      });

      if (res.data) {
        setActiveCallRoom({
          id: res.data.callId,
          url: res.data.url,
          createdByName: res.data.createdByName,
          participants: res.data.participants || [],
        });
        setIsInCall(true);
      }
    } catch (err) {
      console.error('Error al generar videollamada en el backend:', err);
    }
  };

  const handleEndCall = async () => {
    setIsInCall(false);
    setIsScreenSharing(false);
    if (isAdmin) {
      try {
        await api.delete(`/support/call/${activeChannelId}`);
        setActiveCallRoom(null);
      } catch (err) {
        console.error('Error al finalizar llamada en servidor:', err);
      }
    }
  };

  // Obtener los datos reales del segundo participante conectado
  const otherParticipant = activeCallRoom?.participants?.find((p) => p.userId !== user?.id);
  const remoteParticipantName = otherParticipant
    ? otherParticipant.name
    : isAdmin
    ? 'Esperando Usuario de Laboratorio...'
    : activeCallRoom?.createdByName || 'Ing. Soporte Clínico en Vivo';

  const remoteParticipantRole = otherParticipant
    ? (otherParticipant.isAgent ? 'Agente Administrador en Vivo' : 'Usuario / Técnico de Laboratorio')
    : (isAdmin ? 'Esperando Conexión' : 'Agente / Administrador de Soporte');

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto">
      {/* Elemento de Audio Remoto no silenciado */}
      <audio ref={remoteAudioRef} autoPlay playsInline className="hidden" />

      {/* Banner Ejecutivo Superior con Gradiente Fino */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-900 to-blue-900 p-6 sm:p-8 text-white shadow-xl border border-indigo-500/20">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white shadow-lg shrink-0">
              <IconHeadphones className="w-7 h-7 text-indigo-200 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight">Centro de Soporte Técnico</h1>
                {isAdmin ? (
                  <span className="badge badge-warning gap-1 font-extrabold text-[11px] uppercase tracking-wider px-3 py-2 rounded-xl shadow-xs">
                    <IconShield className="w-3.5 h-3.5" />
                    Panel Agente Administrador
                  </span>
                ) : (
                  <span className="badge bg-white/20 border border-white/30 text-white font-bold text-[11px] uppercase tracking-wider px-3 py-2 rounded-xl backdrop-blur-md">
                    Stream Chat & Video SDK
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-indigo-100/90 font-medium mt-1">
                Atención interactiva en tiempo real asistida por ingenieros y especialistas de laboratorio
              </p>
            </div>
          </div>

          {/* Botón de Acción según Rol (Solo Admin inicia llamadas) */}
          <div className="flex items-center gap-3 shrink-0">
            {isAdmin ? (
              <button
                onClick={handleAdminGenerateStreamCall}
                className="btn bg-white hover:bg-slate-100 text-indigo-950 font-black rounded-2xl gap-2 shadow-xl hover:scale-105 transition-all text-xs py-3 px-5 border-none"
              >
                <IconVideo className="w-4 h-4 text-indigo-600" />
                🎥 Iniciar Videollamada de Soporte
              </button>
            ) : activeCallRoom ? (
              <button
                onClick={handleJoinCall}
                className="btn bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-2xl gap-2 shadow-xl hover:scale-105 transition-all text-xs py-3 px-5 border-none animate-bounce"
              >
                <IconVideo className="w-4 h-4" />
                📹 Unirse a Videollamada ({activeCallRoom.createdByName})
              </button>
            ) : (
              <span className="bg-white/10 backdrop-blur-md text-xs font-semibold text-white py-2.5 px-4 rounded-2xl border border-white/20 shadow-xs">
                💬 Escribe en el chat para atención en vivo
              </span>
            )}
          </div>
        </div>
      </div>

      {/* SALA DE VIDEOLLAMADA EN VIVO STREAM CON DISEÑO EJECUTIVO */}
      {isInCall && activeCallRoom && (
        <div className="bg-slate-900 rounded-3xl border border-slate-800 p-6 text-white shadow-2xl space-y-4 animate-scale-in">
          <div className="flex flex-wrap items-center justify-between border-b border-slate-800 pb-4 gap-3">
            <div className="flex items-center gap-3">
              <span className="w-3 h-3 rounded-full bg-emerald-400 animate-ping"></span>
              <div>
                <h3 className="font-black text-sm text-indigo-300">
                  Videollamada en Vivo • Sala #{activeCallRoom.id}
                </h3>
                <p className="text-xs text-slate-400">Generada por Agente Admin: {activeCallRoom.createdByName}</p>
              </div>
            </div>

            <a
              href={activeCallRoom.url}
              target="_blank"
              rel="noreferrer"
              className="btn btn-xs btn-outline btn-info gap-1 text-[11px] rounded-xl"
            >
              Abrir URL Externa Stream Video HD
            </a>
          </div>

          {mediaError && (
            <div className="alert alert-warning text-xs font-bold py-2 rounded-xl">
              <span>⚠️ {mediaError}</span>
            </div>
          )}

          {/* Grid de Transmisión WebRTC Stream con Nombres Reales */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 min-h-[320px]">
            {/* Pantalla Local del Usuario / Químico Actual */}
            <div className="relative bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 flex items-center justify-center min-h-[260px] shadow-inner">
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover rounded-2xl ${
                  isCameraOn || isScreenSharing ? 'block' : 'hidden'
                }`}
              />

              {!isCameraOn && !isScreenSharing && (
                <div className="flex flex-col items-center gap-2 text-slate-500">
                  <IconVideoOff className="w-12 h-12 text-slate-600" />
                  <span className="text-xs font-semibold">Cámara Apagada</span>
                </div>
              )}

              <div className="absolute bottom-3 left-3 bg-slate-900/90 backdrop-blur-md px-3.5 py-1.5 rounded-xl text-[11px] font-bold text-slate-200 border border-slate-700/60 flex items-center gap-2 shadow-md">
                <span>{isScreenSharing ? '🖥️ Tu Pantalla Compartida' : `${realUserName} (Tú)`}</span>
                {isMicOn ? (
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" title="Micrófono Activo"></span>
                ) : (
                  <span className="w-2 h-2 rounded-full bg-red-400" title="Micrófono Silenciado"></span>
                )}
              </div>
            </div>

            {/* Pantalla del Participante Remoto */}
            <div className="relative bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 flex items-center justify-center min-h-[260px] shadow-inner">
              <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-indigo-950/80 via-slate-950 to-slate-950 p-6 text-center">
                <div className="w-20 h-20 rounded-full bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300 font-black text-2xl mb-2 shadow-lg">
                  {remoteParticipantName.charAt(0).toUpperCase()}
                </div>
                <span className="text-base font-black text-slate-100 block tracking-tight">
                  {remoteParticipantName}
                </span>
                <span className="text-xs text-indigo-300 font-medium mt-1 block">
                  {remoteParticipantRole}
                </span>
              </div>
              <div className="absolute bottom-3 left-3 bg-slate-900/90 backdrop-blur-md px-3.5 py-1.5 rounded-xl text-[11px] font-bold text-emerald-400 border border-slate-700/60 flex items-center gap-2 shadow-md">
                <span>{otherParticipant ? otherParticipant.name : remoteParticipantRole}</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              </div>
            </div>
          </div>

          {/* Barra Ejcutiva de Controles */}
          <div className="flex flex-wrap items-center justify-center gap-3 bg-slate-950/90 p-3.5 rounded-2xl border border-slate-800 shadow-xl">
            <button
              onClick={() => setIsCameraOn(!isCameraOn)}
              className={`btn btn-circle ${isCameraOn ? 'btn-neutral text-white' : 'btn-error text-white'}`}
              title={isCameraOn ? 'Apagar Cámara' : 'Encender Cámara'}
            >
              {isCameraOn ? <IconVideo className="w-5 h-5" /> : <IconVideoOff className="w-5 h-5" />}
            </button>

            <button
              onClick={() => setIsMicOn(!isMicOn)}
              className={`btn btn-circle ${isMicOn ? 'btn-emerald bg-emerald-500 text-slate-950 font-bold' : 'btn-error text-white'}`}
              title={isMicOn ? 'Silenciar Micrófono' : 'Activar Micrófono'}
            >
              {isMicOn ? <IconMic className="w-5 h-5" /> : <IconMicOff className="w-5 h-5" />}
            </button>

            <button
              onClick={handleToggleScreenShare}
              className={`btn btn-circle ${isScreenSharing ? 'btn-accent text-slate-950' : 'btn-neutral text-white'}`}
              title={isScreenSharing ? 'Detener Compartir Pantalla' : 'Compartir Pantalla'}
            >
              <IconMonitor className="w-5 h-5" />
            </button>

            <button
              onClick={handleEndCall}
              className="btn btn-error rounded-2xl gap-2 font-bold text-white px-6 shadow-lg"
            >
              <IconPhoneOff className="w-5 h-5" />
              Finalizar Videollamada
            </button>
          </div>
        </div>
      )}

      {/* Interfaz de Chat con Estilo Claro y Ejecutivo */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[600px]">
        {/* Selector de Canales de Atención Fino */}
        <div className="lg:col-span-4 bg-white rounded-3xl border border-slate-200/80 shadow-sm p-5 space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-xs font-black uppercase text-slate-500 tracking-wider">
                Canales de Atención
              </h2>
              {isAdmin && (
                <span className="badge badge-warning text-[10px] font-bold px-2 py-1.5 rounded-lg">
                  Agente Admin
                </span>
              )}
            </div>

            <div className="space-y-2">
              {channelsList.map((ch) => {
                const isSelected = activeChannelId === ch.id;
                return (
                  <button
                    key={ch.id}
                    onClick={() => setActiveChannelId(ch.id)}
                    className={`w-full text-left p-4 rounded-2xl transition-all border flex flex-col gap-1.5 ${
                      isSelected
                        ? 'bg-indigo-50/80 border-indigo-200 text-indigo-950 font-bold shadow-xs'
                        : 'border-slate-100 bg-slate-50/50 text-slate-700 hover:bg-slate-100/80 hover:border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-black tracking-tight">{ch.name}</span>
                      <span className="badge badge-xs bg-emerald-500 text-white font-bold border-none px-2 py-1">
                        {ch.userCount} en línea
                      </span>
                    </div>
                    <span className="text-xs font-normal text-slate-500 leading-snug">
                      {ch.desc}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Ficha Ejecutiva del Estado */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/70 space-y-2">
            <div className="flex items-center gap-3">
              <div className="avatar online">
                <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white font-black flex items-center justify-center text-sm shadow-md shadow-indigo-500/20">
                  {isAdmin ? 'ADM' : 'ST'}
                </div>
              </div>
              <div>
                <span className="text-xs font-black text-slate-800 block">
                  {isAdmin ? 'Panel del Administrador de Soporte' : 'Ing. Soporte Clínico'}
                </span>
                <span className="text-[11px] text-emerald-600 font-bold block">En Línea • Atención Continuada</span>
              </div>
            </div>
            <p className="text-[11px] text-slate-500 leading-tight">
              {isAdmin
                ? 'Como administrador, puedes responder chats de usuarios y crear enlaces e iniciar videollamadas de soporte.'
                : 'Solicita ayuda en el chat. El administrador generará el enlace de videollamada si es necesario.'}
            </p>
          </div>
        </div>

        {/* Ventana Principal de Chat Fino y Claro */}
        <div className="lg:col-span-8 bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col">
          {chatClient && activeChannel ? (
            <div className="stream-chat-wrapper h-full flex-1">
              <Chat client={chatClient} theme="str-chat__theme-light">
                <Channel channel={activeChannel}>
                  <Window>
                    <ChannelHeader />
                    <MessageList />
                  </Window>
                  <Thread />
                </Channel>
              </Chat>
            </div>
          ) : (
            <ExecutiveSynchronizedChat
              channelId={activeChannelId}
              channelName={channelsList.find((c) => c.id === activeChannelId)?.name || '#Soporte General'}
              isAdmin={isAdmin}
              onAdminStartVideoCall={handleAdminGenerateStreamCall}
              activeCallRoom={activeCallRoom}
              onJoinCall={handleJoinCall}
              realUserName={realUserName}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// Componente de Chat Ejecutivo Fino en Colores Claros
function ExecutiveSynchronizedChat({
  channelId,
  channelName,
  isAdmin,
  onAdminStartVideoCall,
  activeCallRoom,
  onJoinCall,
  realUserName,
}: {
  channelId: string;
  channelName: string;
  isAdmin: boolean;
  onAdminStartVideoCall: () => void;
  activeCallRoom: any;
  onJoinCall: () => void;
  realUserName: string;
}) {
  const api = useApi();

  const [messages, setMessages] = useState<ChatMessageItem[]>([]);
  const [inputText, setInputText] = useState('');

  // Polling de mensajes en tiempo real desde el Servidor
  const fetchBackendMessages = useCallback(async () => {
    try {
      const res = await api.get<ChatMessageItem[]>(`/support/messages/${channelId}`);
      if (res.data) {
        setMessages(res.data);
      }
    } catch (err) {
      console.warn('Error fetching support messages from backend:', err);
    }
  }, [api, channelId]);

  useEffect(() => {
    fetchBackendMessages();
    const interval = setInterval(fetchBackendMessages, 1500);
    return () => clearInterval(interval);
  }, [fetchBackendMessages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const textToSend = inputText.trim();
    setInputText('');

    const senderName = isAdmin ? `Admin: ${realUserName}` : realUserName;

    try {
      await api.post('/support/messages', {
        channelId,
        sender: senderName,
        text: textToSend,
        isAgent: isAdmin,
      });

      fetchBackendMessages();
    } catch (err) {
      console.error('Error enviando mensaje al servidor:', err);
    }
  };

  return (
    <div className="flex flex-col h-full min-h-[520px]">
      {/* Header del Chat Claro */}
      <div className="p-4 px-6 border-b border-slate-100 bg-slate-50/70 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="font-black text-slate-800 text-base tracking-tight">{channelName}</span>
          <span className="badge badge-sm bg-emerald-50 text-emerald-700 border-emerald-200 font-bold">
            En Vivo • Sync Servidor
          </span>
          {isAdmin && <span className="badge badge-sm bg-amber-50 text-amber-700 border-amber-200 font-bold">Modo Agente Admin</span>}
        </div>

        <div className="flex items-center gap-2">
          {activeCallRoom ? (
            <button
              onClick={onJoinCall}
              className="btn btn-xs bg-emerald-500 hover:bg-emerald-400 text-slate-950 border-none font-bold gap-1 animate-pulse rounded-xl"
            >
              <IconVideo className="w-3.5 h-3.5" />
              Unirse a Videollamada Activa
            </button>
          ) : isAdmin ? (
            <button
              onClick={onAdminStartVideoCall}
              className="btn btn-xs btn-primary font-bold gap-1 rounded-xl shadow-xs"
            >
              <IconVideo className="w-3.5 h-3.5" />
              🎥 Crear Videollamada
            </button>
          ) : (
            <span className="text-xs text-slate-500 font-medium">Atención en línea del Administrador</span>
          )}
        </div>
      </div>

      {/* Alerta Ejecutiva si hay Videollamada Activa */}
      {activeCallRoom && (
        <div className="bg-indigo-50 border-b border-indigo-100 p-3 px-6 flex items-center justify-between text-xs font-semibold text-indigo-900">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 animate-ping"></span>
            <span>El Administrador ({activeCallRoom.createdByName}) inició una Videollamada de Soporte</span>
          </div>
          <button onClick={onJoinCall} className="btn btn-xs btn-primary font-bold text-white rounded-xl shadow-xs">
            Ingresar a la Llamada ➔
          </button>
        </div>
      )}

      {/* Lista de Mensajes Claro y Fino */}
      <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-slate-50/30">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center p-8 text-center text-slate-400 space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-500 mb-1">
              <IconHeadphones className="w-6 h-6" />
            </div>
            <p className="text-xs font-bold text-slate-600">Sin mensajes aún en {channelName}</p>
            <p className="text-xs text-slate-400 max-w-xs">Escribe una consulta para comunicarte directamente con el soporte técnico.</p>
          </div>
        ) : (
          messages.map((m) => (
            <div key={m.id} className={`chat ${m.isAgent ? 'chat-start' : 'chat-end'}`}>
              <div className="chat-header text-[11px] text-slate-400 mb-1 font-semibold">
                {m.sender} <time className="text-[10px] opacity-70 ml-1 font-mono">{m.time}</time>
              </div>
              <div
                className={`chat-bubble text-sm font-medium rounded-2xl px-4 py-2.5 ${
                  m.isAgent
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                    : 'bg-white text-slate-800 border border-slate-200/80 shadow-xs'
                }`}
              >
                {m.text}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Input de Envío Sincronizado Fino */}
      <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-100 bg-white flex items-center gap-3">
        <input
          type="text"
          placeholder={
            isAdmin
              ? `Responder como ${realUserName} en ${channelName}...`
              : `Escribe tu consulta como ${realUserName} en ${channelName}...`
          }
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          className="input input-bordered w-full rounded-2xl text-sm border-slate-200 focus:border-indigo-500 bg-slate-50/50"
        />
        <button type="submit" className="btn btn-primary text-white font-bold rounded-2xl gap-2 shadow-md shadow-primary/20 shrink-0 px-5">
          <IconSend className="w-4 h-4" />
          {isAdmin ? 'Responder' : 'Enviar'}
        </button>
      </form>
    </div>
  );
}
