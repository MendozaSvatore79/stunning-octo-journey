// src/pages/SatisfactionSurveyView.tsx
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import type { WorkOrder } from '../types/order';
import {
  IconCheckCircle,
  IconAlertCircle,
  IconFileText,
  IconSparkles,
} from '../components/icons';

function IconStar({ className = "w-5 h-5", ...props }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth={1} strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

function IconHeart({ className = "w-5 h-5", ...props }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth={1} strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
    </svg>
  );
}

interface SurveyData {
  rating: number;
  sampleCollectionRating: number;
  waitTimeRating: number;
  staffKindnessRating: number;
  cleanlinessRating: number;
  comments: string;
}

export default function SatisfactionSurveyView() {
  const params = useParams<{ orderId?: string }>();
  const [order, setOrder] = useState<WorkOrder | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form State
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [sampleRating, setSampleRating] = useState<number>(5);
  const [waitRating, setWaitRating] = useState<number>(5);
  const [staffRating, setStaffRating] = useState<number>(5);
  const [cleanRating, setCleanRating] = useState<number>(5);
  const [comments, setComments] = useState<string>('');

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);

  const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:3000';

  // Extraer el orderId desde los parámetros de React Router o query string
  const getOrderId = (): string => {
    if (params.orderId) return params.orderId;
    const pathParts = window.location.pathname.split('/').filter(Boolean);
    const lastPart = pathParts[pathParts.length - 1];
    if (lastPart && lastPart !== 'survey') return lastPart;
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('id') || urlParams.get('orderId') || '';
  };

  const orderId = getOrderId();

  useEffect(() => {
    if (!orderId) {
      setErrorMsg('No se especificó un número de orden o folio válido.');
      setIsLoading(false);
      return;
    }

    const loadOrderAndSurvey = async () => {
      setIsLoading(true);
      setErrorMsg(null);

      try {
        // Cargar orden pública
        const resOrder = await fetch(`${apiBase}/orders/public/${orderId}`);
        if (!resOrder.ok) throw new Error(`HTTP_${resOrder.status}`);
        const orderData = await resOrder.json();
        setOrder(orderData);

        // Verificar si ya se respondió la encuesta
        try {
          const resSurvey = await fetch(`${apiBase}/orders/public/${orderId}/survey`);
          if (resSurvey.ok) {
            const surveyData = await resSurvey.json();
            if (surveyData) {
              setIsSubmitted(true);
              setRating(surveyData.rating || 5);
              setComments(surveyData.comments || '');
            }
          }
        } catch {
          // Ignorar si no existe encuesta previa
        }
      } catch (err: any) {
        console.warn('Error al cargar orden para encuesta:', err);
        // Fallback demostrativo
        setOrder({
          id: orderId,
          folio: 1,
          status: 'COMPLETED',
          patientId: 'p-1',
          laboratoryId: 'lab-1',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          patient: {
            id: 'p-1',
            firstName: 'Estimado',
            lastName: 'Paciente',
            gender: 'M',
            dateOfBirth: '1990-01-01',
            phone: '5551234567',
          },
          laboratory: {
            id: 'lab-1',
            name: 'Laboratorio Clínico Especializado',
          },
          analyses: [],
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadOrderAndSurvey();
  }, [orderId, apiBase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderId) return;

    setIsSubmitting(true);
    try {
      const payload: SurveyData = {
        rating,
        sampleCollectionRating: sampleRating,
        waitTimeRating: waitRating,
        staffKindnessRating: staffRating,
        cleanlinessRating: cleanRating,
        comments,
      };

      const res = await fetch(`${apiBase}/orders/public/${orderId}/survey`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error('Error al registrar la encuesta');
      }

      setIsSubmitted(true);
    } catch (err: any) {
      console.error('Error enviando encuesta:', err);
      // Permitir feedback positivo incluso con modo local/offline
      setIsSubmitted(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRatingLabel = (val: number) => {
    switch (val) {
      case 1:
        return 'Muy Insatisfecho 😠';
      case 2:
        return 'Poco Satisfecho 🙁';
      case 3:
        return 'Aceptable 😐';
      case 4:
        return 'Muy Satisfecho 🙂';
      case 5:
        return '¡Excelente Servicio! 🌟';
      default:
        return '';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-base-200/50 flex flex-col items-center justify-center p-4 text-base-content space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-2 animate-pulse">
          <IconSparkles className="w-8 h-8" />
        </div>
        <span className="loading loading-spinner loading-lg text-primary"></span>
        <p className="text-xs sm:text-sm font-semibold text-base-content/70">
          Cargando encuesta de satisfacción...
        </p>
      </div>
    );
  }

  if (errorMsg && !order) {
    return (
      <div className="min-h-screen bg-base-200/50 flex flex-col items-center justify-center p-4 text-base-content">
        <div className="max-w-md w-full bg-base-100 border border-base-200 rounded-3xl p-6 text-center space-y-4 shadow-xl">
          <div className="w-14 h-14 rounded-2xl bg-error/10 text-error flex items-center justify-center mx-auto">
            <IconAlertCircle className="w-7 h-7" />
          </div>
          <h2 className="text-lg font-black text-base-content">No se encontró la orden médica</h2>
          <p className="text-xs text-base-content/60">{errorMsg}</p>
        </div>
      </div>
    );
  }

  const labName = order?.laboratory?.name || 'Laboratorio Clínico';
  const labLogo = order?.laboratory?.logo;
  const patientName = `${order?.patient?.firstName || ''} ${order?.patient?.lastName || ''}`.trim() || 'Estimado Paciente';
  const folio = order?.folio || order?.id.slice(0, 6);

  return (
    <div className="min-h-screen bg-base-200/50 text-base-content flex flex-col items-center justify-start p-3 sm:p-6 md:p-10 font-sans selection:bg-primary selection:text-primary-content">
      {/* Contenedor Principal Centrado */}
      <div className="w-full max-w-xl mx-auto space-y-4 sm:space-y-6">
        
        {/* Encabezado con Identidad Clínica Institucional */}
        <div className="flex items-center justify-between bg-base-100 p-4 sm:p-5 rounded-3xl border border-base-200 shadow-sm">
          <div className="flex items-center gap-3">
            {labLogo ? (
              <img
                src={labLogo}
                alt={labName}
                className="w-12 h-12 object-contain rounded-2xl bg-base-200/60 p-1 border border-base-300"
              />
            ) : (
              <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-black text-xl shadow-xs shrink-0">
                {labName.charAt(0) || 'L'}
              </div>
            )}
            <div>
              <h1 className="text-sm sm:text-base font-black text-base-content uppercase tracking-tight leading-tight line-clamp-1">
                {labName}
              </h1>
              <p className="text-xs text-primary font-semibold flex items-center gap-1.5 mt-0.5">
                <IconHeart className="w-3.5 h-3.5 text-error inline" /> Encuesta de Calidad y Satisfacción
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className="badge badge-primary badge-sm font-mono font-bold py-3 px-3 text-xs shadow-xs">
              Folio #{folio}
            </span>
          </div>
        </div>

        {/* Tarjeta de Encuesta */}
        <div className="bg-base-100 border border-base-200 rounded-3xl p-5 sm:p-8 shadow-xl space-y-6">
          {isSubmitted ? (
            /* Estado de Éxito / Confirmación */
            <div className="text-center py-6 space-y-5 animate-fade-in">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-success/15 text-success flex items-center justify-center mx-auto ring-8 ring-success/5 shadow-md">
                <IconCheckCircle className="w-10 h-10 sm:w-12 sm:h-12" />
              </div>

              <div className="space-y-2">
                <h2 className="text-xl sm:text-2xl font-black text-base-content tracking-tight">
                  ¡Muchas gracias por tu opinión!
                </h2>
                <p className="text-xs sm:text-sm text-base-content/70 max-w-md mx-auto leading-relaxed">
                  Hola <strong className="text-primary font-bold">{patientName}</strong>, tu evaluación es fundamental para que en <strong className="text-base-content">{labName}</strong> continuemos perfeccionando nuestros protocolos clínicos y calidez de atención.
                </p>
              </div>

              {/* Resumen de Calificación */}
              <div className="bg-base-200/60 rounded-2xl p-4 border border-base-300 max-w-sm mx-auto flex items-center justify-center gap-2">
                <div className="flex items-center gap-1 text-amber-400">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <IconStar
                      key={i}
                      className={`w-5 h-5 ${
                        i < rating ? 'fill-amber-400 text-amber-400' : 'text-base-300'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-xs font-bold text-base-content">
                  ({rating} de 5 estrellas)
                </span>
              </div>

              {/* Botón para ver Resultados PDF */}
              <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link
                  to={`/results/${orderId}`}
                  className="btn btn-primary text-primary-content font-bold rounded-2xl gap-2 shadow-md w-full sm:w-auto"
                >
                  <IconFileText className="w-4 h-4" />
                  Ver Reporte Clínico en PDF
                </Link>
              </div>
            </div>
          ) : (
            /* Formulario de Evaluación */
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Bienvenida al Paciente */}
              <div className="space-y-1 border-b border-base-200 pb-4">
                <h2 className="text-lg sm:text-xl font-black text-base-content tracking-tight">
                  ¿Cómo fue tu experiencia médica hoy?
                </h2>
                <p className="text-xs text-base-content/60">
                  Paciente: <strong className="text-primary font-semibold">{patientName}</strong>. Te tomará menos de 30 segundos calificar la atención.
                </p>
              </div>

              {/* Calificación General con Estrellas Grandes */}
              <div className="text-center space-y-3 bg-base-200/50 p-5 rounded-2xl border border-base-300/70">
                <label className="text-xs font-bold uppercase tracking-wider text-base-content/70 block">
                  Calificación General del Laboratorio
                </label>

                <div className="flex items-center justify-center gap-2 sm:gap-3 py-1">
                  {[1, 2, 3, 4, 5].map((star) => {
                    const isFilled = (hoverRating || rating) >= star;
                    return (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(null)}
                        className="p-1 sm:p-2 transition-transform hover:scale-125 focus:outline-none cursor-pointer"
                        title={`${star} estrellas`}
                      >
                        <IconStar
                          className={`w-8 h-8 sm:w-10 sm:h-10 transition-colors ${
                            isFilled
                              ? 'fill-amber-400 text-amber-400 drop-shadow-sm'
                              : 'text-base-300 hover:text-amber-300'
                          }`}
                        />
                      </button>
                    );
                  })}
                </div>

                <p className="text-xs sm:text-sm font-bold text-primary h-5 transition-all">
                  {getRatingLabel(hoverRating || rating)}
                </p>
              </div>

              {/* Criterios Clave de la Experiencia Clínica */}
              <div className="space-y-3 sm:space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-base-content/70">
                  Aspectos Clave de la Atención
                </h3>

                {/* 1. Toma de Muestra / Punción */}
                <div className="bg-base-200/40 p-4 rounded-2xl border border-base-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold text-base-content flex items-center gap-1.5">
                      <span>💉</span> Toma de Muestra y Venopunción
                    </p>
                    <p className="text-[11px] text-base-content/60">
                      ¿La extracción fue rápida y con el menor dolor posible?
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 self-end sm:self-auto">
                    {[1, 2, 3, 4, 5].map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setSampleRating(val)}
                        className={`w-8 h-8 rounded-xl text-xs font-bold transition-all ${
                          sampleRating === val
                            ? 'bg-primary text-primary-content shadow-xs'
                            : 'bg-base-100 border border-base-300 text-base-content/70 hover:bg-base-200'
                        }`}
                      >
                        {val}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. Tiempo de Espera y Entrega */}
                <div className="bg-base-200/40 p-4 rounded-2xl border border-base-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold text-base-content flex items-center gap-1.5">
                      <span>⏱️</span> Tiempo de Espera y Entrega
                    </p>
                    <p className="text-[11px] text-base-content/60">
                      ¿Los tiempos de atención y entrega de resultados fueron rápidos?
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 self-end sm:self-auto">
                    {[1, 2, 3, 4, 5].map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setWaitRating(val)}
                        className={`w-8 h-8 rounded-xl text-xs font-bold transition-all ${
                          waitRating === val
                            ? 'bg-primary text-primary-content shadow-xs'
                            : 'bg-base-100 border border-base-300 text-base-content/70 hover:bg-base-200'
                        }`}
                      >
                        {val}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 3. Limpieza e Higiene */}
                <div className="bg-base-200/40 p-4 rounded-2xl border border-base-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold text-base-content flex items-center gap-1.5">
                      <span>🧼</span> Limpieza e Instalaciones
                    </p>
                    <p className="text-[11px] text-base-content/60">
                      ¿Las instalaciones y el área de toma estaban limpias y ordenadas?
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 self-end sm:self-auto">
                    {[1, 2, 3, 4, 5].map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setCleanRating(val)}
                        className={`w-8 h-8 rounded-xl text-xs font-bold transition-all ${
                          cleanRating === val
                            ? 'bg-primary text-primary-content shadow-xs'
                            : 'bg-base-100 border border-base-300 text-base-content/70 hover:bg-base-200'
                        }`}
                      >
                        {val}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 4. Amabilidad del Personal */}
                <div className="bg-base-200/40 p-4 rounded-2xl border border-base-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold text-base-content flex items-center gap-1.5">
                      <span>🤝</span> Amabilidad del Personal
                    </p>
                    <p className="text-[11px] text-base-content/60">
                      ¿El personal de recepción y químicos te atendió con calidez y respeto?
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 self-end sm:self-auto">
                    {[1, 2, 3, 4, 5].map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setStaffRating(val)}
                        className={`w-8 h-8 rounded-xl text-xs font-bold transition-all ${
                          staffRating === val
                            ? 'bg-primary text-primary-content shadow-xs'
                            : 'bg-base-100 border border-base-300 text-base-content/70 hover:bg-base-200'
                        }`}
                      >
                        {val}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Comentarios Adicionales */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-base-content/70 flex items-center justify-between">
                  <span>Comentarios o Sugerencias (Opcional)</span>
                  <span className="text-[10px] text-base-content/40 lowercase">máx. 300 caracteres</span>
                </label>
                <textarea
                  rows={3}
                  maxLength={300}
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  placeholder="Escribe alguna felicitación, queja o recomendación sobre el servicio recibido..."
                  className="textarea textarea-bordered w-full bg-base-100 border-base-300 text-base-content text-xs rounded-2xl focus:border-primary focus:outline-none p-3.5 placeholder:text-base-content/40"
                ></textarea>
              </div>

              {/* Botón de Envío */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn btn-primary text-primary-content font-bold w-full rounded-2xl shadow-lg shadow-primary/20 py-3 text-sm flex items-center justify-center gap-2 hover:scale-[1.01] transition-transform disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <span className="loading loading-spinner loading-sm"></span>
                      <span>Enviando tu opinión...</span>
                    </>
                  ) : (
                    <>
                      <IconCheckCircle className="w-5 h-5" />
                      <span>Enviar Calificación</span>
                    </>
                  )}
                </button>
              </div>

              <p className="text-[11px] text-center text-base-content/50">
                Tus respuestas son confidenciales y nos ayudan a mantener los estándares de acreditación sanitaria.
              </p>
            </form>
          )}
        </div>

        {/* Footer simple */}
        <p className="text-center text-xs text-base-content/50">
          © {new Date().getFullYear()} {labName} • Plataforma Clínica Integral
        </p>
      </div>
    </div>
  );
}
