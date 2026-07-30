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
  } | null>(null);

  const [isInCall, setIsInCall] = useState<boolean>(false);
  const [isCameraOn, setIsCameraOn] = useState<boolean>(true);
  const [isMicOn, setIsMicOn] = useState<boolean>(true);
  const [isScreenSharing, setIsScreenSharing] = useState<boolean>(false);
  const [mediaError, setMediaError] = useState<string | null>(null);

  // Referencias a elementos de Video HTML5 para Stream WebRTC Real
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  // Canales de soporte predeterminados
  const channelsList: SupportChannelItem[] = [
    {
      id: 'soporte-general',
      name: '#Soporte General',
      desc: 'Asistencia operativa y dudas de uso en tiempo real',
      userCount: 4,
    },
    {
      id: 'consultas-tecnicas',
      name: '#Consultas Técnicas',
      desc: 'Asesoría para calibración de equipos y reactivos',
      userCount: 2,
    },
    {
      id: 'facturacion-licencias',
      name: '#Facturación y Licencias',
      desc: 'Gestión de planes, sedes y suscripción del sistema',
      userCount: 1,
    },
  ];

  // 1. Polling de Sincronización de Llamadas en Vivo entre Múltiples Dispositivos (Laptop <-> Celular)
  const fetchActiveCall = useCallback(async () => {
    try {
      const res = await api.get(`/support/call/${activeChannelId}`);
      if (res.data && res.data.active) {
        setActiveCallRoom({
          id: res.data.callId,
          url: res.data.url,
          createdByName: res.data.createdByName,
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
    const interval = setInterval(fetchActiveCall, 2000);
    return () => clearInterval(interval);
  }, [fetchActiveCall]);

  // 2. Inicialización de Stream Chat SDK en Segundo Plano
  useEffect(() => {
    let client: StreamChat | null = null;

    const initStreamChat = async () => {
      try {
        const streamApiKey = import.meta.env.VITE_STREAM_API_KEY || 'b5f4y9r5x6zz';
        client = StreamChat.getInstance(streamApiKey);

        const userId = user?.id ? user.id.replace(/[^\w]/g, '_') : `user_${Date.now()}`;
        const userName = user?.fullName || `${user?.firstName || 'Usuario'} ${user?.lastName || ''}`.trim() || 'Usuario Clínico';
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
  }, [user?.id, activeChannelId, isAdmin]);

  // 3. Activación Real de Cámara y Micrófono WebRTC del Navegador
  useEffect(() => {
    if (isInCall && isCameraOn && !isScreenSharing) {
      setMediaError(null);
      navigator.mediaDevices
        .getUserMedia({ video: true, audio: true })
        .then((stream) => {
          mediaStreamRef.current = stream;
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

  // 4. Compartir Pantalla en Vivo (Screen Sharing)
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
      const creatorName = user?.firstName ? `${user.firstName} ${user.lastName || ''}` : 'Administrador de Soporte';
      const res = await api.post('/support/call', {
        channelId: activeChannelId,
        createdByName: creatorName,
      });

      if (res.data) {
        setActiveCallRoom({
          id: res.data.callId,
          url: res.data.url,
          createdByName: res.data.createdByName,
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

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Banner Superior de Soporte Técnico y Modo Admin */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 rounded-3xl text-white shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300 shadow-inner shrink-0">
            <IconHeadphones className="w-8 h-8 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black tracking-tight">Centro de Soporte Técnico y Videollamadas</h1>
              {isAdmin ? (
                <span className="badge badge-warning gap-1 font-extrabold text-xs uppercase px-2.5 py-2">
                  <IconShield className="w-3.5 h-3.5" />
                  Modo Agente Administrador
                </span>
              ) : (
                <span className="badge badge-accent text-slate-950 font-bold text-xs uppercase tracking-wider">
                  Stream Chat & Video SDK
                </span>
              )}
            </div>
            <p className="text-xs text-indigo-200/80 font-medium mt-1">
              Atención directa en chat interactivo y videollamada en vivo con compartir pantalla
            </p>
          </div>
        </div>

        {/* Botón de Acción según Rol (Solo Admin inicia llamadas) */}
        <div className="flex flex-wrap items-center gap-3">
          {isAdmin ? (
            <button
              onClick={handleAdminGenerateStreamCall}
              className="btn btn-accent text-slate-950 font-black rounded-2xl gap-2 shadow-lg hover:scale-105 transition-all text-xs py-2.5 px-4"
            >
              <IconVideo className="w-4 h-4 text-slate-950" />
              🎥 Iniciar Videollamada de Soporte
            </button>
          ) : activeCallRoom ? (
            <button
              onClick={() => setIsInCall(true)}
              className="btn btn-emerald bg-emerald-500 text-slate-950 font-black rounded-2xl gap-2 shadow-lg hover:scale-105 transition-all text-xs py-2.5 px-4 animate-bounce"
            >
              <IconVideo className="w-4 h-4" />
              📹 Unirse a Videollamada Activa del Agente
            </button>
          ) : (
            <span className="badge badge-ghost text-xs text-indigo-200 py-2 px-3 border border-indigo-500/30">
              💬 Escribe en el chat para atención
            </span>
          )}
        </div>
      </div>

      {/* SALA DE VIDEOLLAMADA EN VIVO STREAM (Sincronizada Multi-Dispositivo) */}
      {isInCall && activeCallRoom && (
        <div className="bg-slate-950 rounded-3xl border border-indigo-500/30 p-6 text-white shadow-2xl space-y-4 animate-scale-in">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-3">
              <span className="w-3 h-3 rounded-full bg-red-500 animate-ping"></span>
              <div>
                <h3 className="font-black text-sm text-indigo-300">
                  Videollamada en Vivo de Soporte Stream • Sala #{activeCallRoom.id}
                </h3>
                <p className="text-xs text-slate-400">Generada por Agente Admin: {activeCallRoom.createdByName}</p>
              </div>
            </div>

            <a
              href={activeCallRoom.url}
              target="_blank"
              rel="noreferrer"
              className="btn btn-xs btn-outline btn-info gap-1 text-[11px]"
            >
              Abrir URL Externa Stream Video
            </a>
          </div>

          {mediaError && (
            <div className="alert alert-warning text-xs font-bold py-2 rounded-xl">
              <span>⚠️ {mediaError}</span>
            </div>
          )}

          {/* Grid de Transmisión WebRTC Stream */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 min-h-[320px]">
            {/* Pantalla Usuario / Químico */}
            <div className="relative bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 flex items-center justify-center min-h-[260px]">
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

              <div className="absolute bottom-3 left-3 bg-slate-950/80 backdrop-blur-md px-3 py-1 rounded-xl text-[11px] font-bold text-slate-200 border border-slate-700/50">
                {isScreenSharing ? '🖥️ Tu Pantalla Compartida' : `${user?.firstName || 'Usuario'} (Tu Transmisión)`}
              </div>
            </div>

            {/* Pantalla del Administrador / Agente de Soporte */}
            <div className="relative bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 flex items-center justify-center min-h-[260px]">
              <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-900 p-6 text-center">
                <div className="w-20 h-20 rounded-full bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300 font-black text-2xl mb-2 shadow-lg">
                  {isAdmin ? 'QU' : 'ADM'}
                </div>
                <span className="text-sm font-bold text-slate-200">
                  {isAdmin ? 'Químico Conectado en Vivo' : activeCallRoom.createdByName}
                </span>
                <span className="text-xs text-indigo-300 font-mono mt-1">
                  {isAdmin ? 'Usuario en Canal' : 'Agente Administrador en Vivo'}
                </span>
              </div>
              <div className="absolute bottom-3 left-3 bg-slate-950/80 backdrop-blur-md px-3 py-1 rounded-xl text-[11px] font-bold text-emerald-400 border border-slate-700/50">
                {isAdmin ? 'Usuario Conectado' : 'Agente / Admin de Soporte'}
              </div>
            </div>
          </div>

          {/* Barra de Controles */}
          <div className="flex flex-wrap items-center justify-center gap-3 bg-slate-900/90 p-3.5 rounded-2xl border border-slate-800 shadow-xl">
            <button
              onClick={() => setIsCameraOn(!isCameraOn)}
              className={`btn btn-circle ${isCameraOn ? 'btn-neutral text-white' : 'btn-error text-white'}`}
              title={isCameraOn ? 'Apagar Cámara' : 'Encender Cámara'}
            >
              {isCameraOn ? <IconVideo className="w-5 h-5" /> : <IconVideoOff className="w-5 h-5" />}
            </button>

            <button
              onClick={() => setIsMicOn(!isMicOn)}
              className={`btn btn-circle ${isMicOn ? 'btn-neutral text-white' : 'btn-error text-white'}`}
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
              className="btn btn-error rounded-2xl gap-2 font-bold text-white px-5 shadow-lg"
            >
              <IconPhoneOff className="w-5 h-5" />
              Finalizar Videollamada
            </button>
          </div>
        </div>
      )}

      {/* Interfaz de Chat Sincronizado Multi-Dispositivo */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[580px]">
        {/* Selector de Canales */}
        <div className="lg:col-span-4 bg-base-100 rounded-3xl border border-base-200 shadow-sm p-4 space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <h2 className="text-xs font-black uppercase text-base-content/70 tracking-wider px-2 flex items-center justify-between">
              <span>Canales de Atención</span>
              {isAdmin && <span className="badge badge-warning text-[10px]">Agente Admin</span>}
            </h2>

            <div className="space-y-1">
              {channelsList.map((ch) => (
                <button
                  key={ch.id}
                  onClick={() => setActiveChannelId(ch.id)}
                  className={`w-full text-left p-3.5 rounded-2xl transition-all border flex flex-col gap-1 ${
                    activeChannelId === ch.id
                      ? 'bg-primary/10 border-primary/30 text-primary font-bold shadow-xs'
                      : 'border-transparent text-base-content/80 hover:bg-base-200/60'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-black tracking-tight">{ch.name}</span>
                    <span className="badge badge-xs badge-success text-white">{ch.userCount} en línea</span>
                  </div>
                  <span className="text-xs font-normal text-base-content/60 leading-tight">
                    {ch.desc}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Ficha de Estado */}
          <div className="bg-base-200/60 p-4 rounded-2xl border border-base-200 space-y-2">
            <div className="flex items-center gap-3">
              <div className="avatar online">
                <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white font-black flex items-center justify-center text-sm shadow-md">
                  {isAdmin ? 'ADM' : 'ST'}
                </div>
              </div>
              <div>
                <span className="text-xs font-black text-base-content block">
                  {isAdmin ? 'Panel del Administrador de Soporte' : 'Ing. Soporte Clínico'}
                </span>
                <span className="text-[11px] text-emerald-600 font-bold block">En Línea • Canal Activo</span>
              </div>
            </div>
            <p className="text-[11px] text-base-content/60">
              {isAdmin
                ? 'Solo tú como administrador tienes permisos para crear enlaces e iniciar videollamadas de soporte.'
                : 'Solicita ayuda en el chat. El administrador generará el enlace de videollamada si es necesario.'}
            </p>
          </div>
        </div>

        {/* Ventana Principal de Chat Sincronizado */}
        <div className="lg:col-span-8 bg-base-100 rounded-3xl border border-base-200 shadow-sm overflow-hidden flex flex-col">
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
            <SynchronizedMultiDeviceChat
              channelId={activeChannelId}
              channelName={channelsList.find((c) => c.id === activeChannelId)?.name || '#Soporte General'}
              isAdmin={isAdmin}
              onAdminStartVideoCall={handleAdminGenerateStreamCall}
              activeCallRoom={activeCallRoom}
              onJoinCall={() => setIsInCall(true)}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// Componente de Chat Sincronizado en Tiempo Real Servidor (Laptop <-> Celular)
function SynchronizedMultiDeviceChat({
  channelId,
  channelName,
  isAdmin,
  onAdminStartVideoCall,
  activeCallRoom,
  onJoinCall,
}: {
  channelId: string;
  channelName: string;
  isAdmin: boolean;
  onAdminStartVideoCall: () => void;
  activeCallRoom: any;
  onJoinCall: () => void;
}) {
  const { user } = useUser();
  const api = useApi();

  const [messages, setMessages] = useState<ChatMessageItem[]>([]);
  const [inputText, setInputText] = useState('');

  // Polling de mensajes en tiempo real desde el Servidor (Laptop <-> Celular)
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

    const senderName = isAdmin ? `Admin: ${user?.firstName || 'Soporte'}` : (user?.firstName || 'Usuario');

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
    <div className="flex flex-col h-full min-h-[500px]">
      {/* Header del Chat */}
      <div className="p-4 border-b border-base-200 bg-base-200/40 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="font-black text-base-content text-base">{channelName}</span>
          <span className="badge badge-sm badge-success text-white font-bold">En Vivo • Sync Servidor</span>
          {isAdmin && <span className="badge badge-sm badge-warning font-bold">Modo Agente Admin</span>}
        </div>

        <div className="flex items-center gap-2">
          {activeCallRoom ? (
            <button
              onClick={onJoinCall}
              className="btn btn-xs btn-accent text-slate-950 font-bold gap-1 animate-pulse"
            >
              <IconVideo className="w-3.5 h-3.5" />
              Unirse a Videollamada Activa
            </button>
          ) : isAdmin ? (
            <button
              onClick={onAdminStartVideoCall}
              className="btn btn-xs btn-primary font-bold gap-1"
            >
              <IconVideo className="w-3.5 h-3.5" />
              🎥 Crear Videollamada de Soporte
            </button>
          ) : (
            <span className="text-xs text-base-content/60 font-semibold">Atención en línea del Administrador</span>
          )}
        </div>
      </div>

      {/* Alerta de Videollamada Iniciada por el Admin */}
      {activeCallRoom && (
        <div className="bg-indigo-600/10 border-b border-indigo-500/20 p-3 px-4 flex items-center justify-between text-xs font-semibold text-indigo-600">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-indigo-600 animate-ping"></span>
            <span>El Administrador ({activeCallRoom.createdByName}) inició una Videollamada de Soporte</span>
          </div>
          <button onClick={onJoinCall} className="btn btn-xs btn-primary font-bold text-white rounded-xl">
            Ingresar a la Llamada ➔
          </button>
        </div>
      )}

      {/* Lista de Mensajes Sincronizados entre Dispositivos */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-base-100">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center p-6 text-center text-base-content/50 space-y-1">
            <IconHeadphones className="w-8 h-8 text-primary/40" />
            <p className="text-xs font-bold">Sin mensajes aún en {channelName}</p>
            <p className="text-[11px]">Escribe un mensaje para iniciar la conversación en tiempo real.</p>
          </div>
        ) : (
          messages.map((m) => (
            <div key={m.id} className={`chat ${m.isAgent ? 'chat-start' : 'chat-end'}`}>
              <div className="chat-header text-xs text-base-content/60 mb-1">
                {m.sender} <time className="text-[10px] opacity-70 ml-1">{m.time}</time>
              </div>
              <div
                className={`chat-bubble text-sm font-medium ${
                  m.isAgent ? 'chat-bubble-primary text-white shadow-sm' : 'bg-base-200 text-base-content'
                }`}
              >
                {m.text}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Input de Envío Sincronizado */}
      <form onSubmit={handleSendMessage} className="p-3 border-t border-base-200 bg-base-100 flex items-center gap-2">
        <input
          type="text"
          placeholder={
            isAdmin
              ? `Responder a los usuarios como Administrador en ${channelName}...`
              : `Escribe tu consulta para el soporte en ${channelName}...`
          }
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          className="input input-bordered w-full rounded-2xl text-sm focus:input-primary"
        />
        <button type="submit" className="btn btn-primary text-white font-bold rounded-2xl gap-2 shadow-md shrink-0">
          <IconSend className="w-4 h-4" />
          {isAdmin ? 'Responder' : 'Enviar'}
        </button>
      </form>
    </div>
  );
}
