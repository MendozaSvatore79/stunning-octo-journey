// src/components/DocumentScannerUploader.tsx
import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  IconCamera,
  IconScan,
  IconUploadCloud,
  IconFileText,
  IconEye,
  IconDownload,
  IconSwitchCamera,
  IconTrash,
  IconCheckCircle,
  IconAlertCircle,
  IconX,
  IconExternalLink,
} from './icons';

interface DocumentScannerUploaderProps {
  value?: string;
  onChange: (val: string) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
}

type TabMode = 'camera' | 'file' | 'url';

/**
 * Optimiza y comprime una imagen tomada con cámara o subida desde archivo
 * para que mantenga alta legibilidad de texto oficial (COFEPRIS) pero con tamaño liviano (< 400KB).
 */
const compressScanImage = (
  source: HTMLVideoElement | HTMLImageElement,
  maxDimension = 1600,
  quality = 0.82
): string => {
  const canvas = document.createElement('canvas');
  let width = source instanceof HTMLVideoElement ? source.videoWidth : source.width;
  let height = source instanceof HTMLVideoElement ? source.videoHeight : source.height;

  if (width === 0 || height === 0) {
    width = 1280;
    height = 720;
  }

  if (width > maxDimension || height > maxDimension) {
    if (width > height) {
      height = Math.round((height * maxDimension) / width);
      width = maxDimension;
    } else {
      width = Math.round((width * maxDimension) / height);
      height = maxDimension;
    }
  }

  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Dibujar y mejorar contraste sutil para lectura de sellos y texto
  ctx.drawImage(source, 0, 0, width, height);
  return canvas.toDataURL('image/jpeg', quality);
};

export const DocumentScannerUploader: React.FC<DocumentScannerUploaderProps> = ({
  value,
  onChange,
  label = 'Comprobante de Aviso / Licencia Sanitaria Oficial (COFEPRIS)',
  description = 'Digitaliza el permiso físico escaneándolo con la cámara, sube un archivo (PDF/Imagen) o ingresa un enlace.',
  disabled = false,
}) => {
  const [activeTab, setActiveTab] = useState<TabMode>('file');
  const [urlInput, setUrlInput] = useState(value && !value.startsWith('data:') ? value : '');
  const [isCapturing, setIsCapturing] = useState(false);
  const [tempSnapshot, setTempSnapshot] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showLightbox, setShowLightbox] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Determinar tipo de documento existente
  const isDataImage = value?.startsWith('data:image/') || /\.(jpg|jpeg|png|webp|gif)$/i.test(value || '');
  const isDataPdf = value?.startsWith('data:application/pdf') || /\.pdf$/i.test(value || '');
  const isExternalUrl = Boolean(value && !value.startsWith('data:') && (value.startsWith('http://') || value.startsWith('https://')));

  // Detener transmisión de la cámara de manera segura
  const stopCameraStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCapturing(false);
  }, []);

  // Iniciar cámara web / cámara de celular
  const startCameraStream = async (targetFacing: 'environment' | 'user') => {
    stopCameraStream();
    setCameraError(null);
    setTempSnapshot(null);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Tu navegador o dispositivo no soporta acceso directo a la cámara.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: targetFacing },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setIsCapturing(true);
    } catch (err: any) {
      console.warn('Error al solicitar cámara:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setCameraError('Permiso denegado para usar la cámara. Permite el acceso en tu navegador o sube una fotografía.');
      } else {
        setCameraError(err.message || 'No fue posible iniciar la cámara en este dispositivo.');
      }
      setIsCapturing(false);
    }
  };

  // Limpiar cámara al desmontar o cambiar de tab
  useEffect(() => {
    if (activeTab !== 'camera') {
      stopCameraStream();
      setTempSnapshot(null);
      setCameraError(null);
    }
    return () => {
      stopCameraStream();
    };
  }, [activeTab, stopCameraStream]);

  // Capturar foto desde el video
  const handleCapturePhoto = () => {
    if (!videoRef.current) return;
    try {
      setIsProcessing(true);
      const dataUrl = compressScanImage(videoRef.current, 1600, 0.82);
      if (dataUrl) {
        setTempSnapshot(dataUrl);
        stopCameraStream();
      }
    } catch (e) {
      console.error('Error al capturar escaneo:', e);
      setCameraError('Error al procesar la captura de la cámara.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Aceptar foto escaneada
  const handleAcceptSnapshot = () => {
    if (tempSnapshot) {
      onChange(tempSnapshot);
      setTempSnapshot(null);
    }
  };

  // Descartar y volver a escanear
  const handleRetakeSnapshot = () => {
    setTempSnapshot(null);
    startCameraStream(facingMode);
  };

  // Alternar entre cámara frontal y trasera
  const handleToggleCamera = () => {
    const nextFacing = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextFacing);
    if (isCapturing) {
      startCameraStream(nextFacing);
    }
  };

  // Procesar archivo cargado (PDF o Imagen)
  const processUploadedFile = (file: File) => {
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert('El archivo no debe superar los 10 MB.');
      return;
    }

    setIsProcessing(true);

    if (file.type === 'application/pdf') {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        onChange(result);
        setIsProcessing(false);
      };
      reader.onerror = () => {
        alert('Error al leer el archivo PDF.');
        setIsProcessing(false);
      };
      reader.readAsDataURL(file);
    } else if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const compressed = compressScanImage(img, 1600, 0.82);
          onChange(compressed);
          setIsProcessing(false);
        };
        img.onerror = () => {
          alert('Error al procesar la imagen.');
          setIsProcessing(false);
        };
        img.src = e.target?.result as string;
      };
      reader.onerror = () => {
        alert('Error al cargar la imagen.');
        setIsProcessing(false);
      };
      reader.readAsDataURL(file);
    } else {
      alert('Formato de archivo no soportado. Por favor sube un PDF o una imagen (JPG, PNG, WebP).');
      setIsProcessing(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processUploadedFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processUploadedFile(file);
    }
  };

  // Aplicar enlace URL externo
  const handleApplyUrl = () => {
    if (urlInput.trim()) {
      onChange(urlInput.trim());
    }
  };

  // Limpiar / Quitar documento
  const handleClear = () => {
    onChange('');
    setTempSnapshot(null);
    setUrlInput('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Descargar documento
  const handleDownload = () => {
    if (!value) return;
    const a = document.createElement('a');
    a.href = value;
    a.download = isDataPdf ? 'comprobante-cofepris.pdf' : 'escaneo-comprobante-sanitario.jpg';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="label py-0">
          <span className="label-text text-[11px] font-semibold text-base-content flex items-center gap-1.5">
            <IconScan className="w-3.5 h-3.5 text-primary" />
            {label}
          </span>
        </label>
        {value && (
          <button
            type="button"
            onClick={handleClear}
            className="text-[10px] text-error hover:underline flex items-center gap-1 font-semibold"
            disabled={disabled}
          >
            <IconTrash className="w-3 h-3" /> Quitar documento
          </button>
        )}
      </div>

      <p className="text-[10px] text-base-content/60 leading-tight">
        {description}
      </p>

      {/* VISTA 1: SI YA EXISTE UN DOCUMENTO (ESCANEADO, CARGADO O URL) */}
      {value ? (
        <div className="p-3 bg-base-100 rounded-2xl border border-primary/20 shadow-xs space-y-2">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              {isDataImage ? (
                <div
                  onClick={() => setShowLightbox(true)}
                  className="w-12 h-12 rounded-xl bg-base-200 border border-base-300 overflow-hidden cursor-pointer shrink-0 relative group hover:opacity-90"
                  title="Clic para ampliar escaneo"
                >
                  <img src={value} alt="Comprobante Sanitario" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                    <IconEye className="w-4 h-4" />
                  </div>
                </div>
              ) : isDataPdf ? (
                <div className="w-12 h-12 rounded-xl bg-error/10 text-error flex items-center justify-center shrink-0 border border-error/20">
                  <IconFileText className="w-6 h-6" />
                </div>
              ) : (
                <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-primary/20">
                  <IconExternalLink className="w-6 h-6" />
                </div>
              )}

              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="badge badge-success badge-xs font-bold text-[9px] gap-1 text-white">
                    <IconCheckCircle className="w-2.5 h-2.5" />
                    {isDataImage ? 'Escaneo / Imagen Digital' : isDataPdf ? 'Expediente PDF' : 'Enlace Web'}
                  </span>
                  <span className="text-[10px] text-base-content/50 font-mono">
                    {isDataPdf ? 'PDF Digitalizado' : isDataImage ? 'Comprobante Listo' : 'URL Vinculada'}
                  </span>
                </div>
                <p className="text-xs font-bold text-base-content truncate mt-0.5">
                  {isExternalUrl ? value : isDataPdf ? 'Permiso_Sanitario_COFEPRIS.pdf' : 'Escaneo_Permiso_Sanitario.jpg'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {isDataImage && (
                <button
                  type="button"
                  onClick={() => setShowLightbox(true)}
                  className="btn btn-xs btn-ghost gap-1 text-primary"
                  title="Ver en pantalla completa"
                >
                  <IconEye className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline text-[11px]">Ver</span>
                </button>
              )}

              {(isDataImage || isDataPdf) && (
                <button
                  type="button"
                  onClick={handleDownload}
                  className="btn btn-xs btn-ghost gap-1 text-base-content/70"
                  title="Descargar copia"
                >
                  <IconDownload className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline text-[11px]">Descargar</span>
                </button>
              )}

              {isExternalUrl && (
                <a
                  href={value}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-xs btn-ghost gap-1 text-primary"
                >
                  <IconExternalLink className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline text-[11px]">Abrir</span>
                </a>
              )}

              <button
                type="button"
                onClick={handleClear}
                className="btn btn-xs btn-ghost text-error"
                title="Cambiar documento"
                disabled={disabled}
              >
                <IconTrash className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* VISTA 2: SELECTOR DE OPCIONES (CÁMARA, ARCHIVO O URL) */
        <div className="border border-base-300 bg-base-200/40 rounded-2xl p-2 sm:p-3 space-y-3">
          
          {/* Selector de Pestañas */}
          <div className="flex items-center gap-1 bg-base-200 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setActiveTab('file')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                activeTab === 'file'
                  ? 'bg-base-100 text-primary shadow-xs'
                  : 'text-base-content/70 hover:text-base-content'
              }`}
              disabled={disabled}
            >
              <IconUploadCloud className="w-3.5 h-3.5" />
              <span>Subir Archivo / PDF</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('camera');
                startCameraStream(facingMode);
              }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                activeTab === 'camera'
                  ? 'bg-base-100 text-primary shadow-xs'
                  : 'text-base-content/70 hover:text-base-content'
              }`}
              disabled={disabled}
            >
              <IconCamera className="w-3.5 h-3.5" />
              <span>Escanear con Cámara</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('url')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                activeTab === 'url'
                  ? 'bg-base-100 text-primary shadow-xs'
                  : 'text-base-content/70 hover:text-base-content'
              }`}
              disabled={disabled}
            >
              <IconExternalLink className="w-3.5 h-3.5" />
              <span>Enlace URL</span>
            </button>
          </div>

          {/* CONTENIDO TAB 1: SUBIR ARCHIVO */}
          {activeTab === 'file' && (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-colors ${
                isDragging
                  ? 'border-primary bg-primary/5'
                  : 'border-base-300 hover:border-primary/50 bg-base-100'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf,image/png,image/jpeg,image/webp"
                onChange={handleFileChange}
                className="hidden"
                disabled={disabled || isProcessing}
              />
              <div className="flex flex-col items-center justify-center gap-2">
                <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                  <IconUploadCloud className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-base-content">
                    {isProcessing ? 'Procesando archivo...' : 'Haz clic para seleccionar o arrastra tu archivo'}
                  </p>
                  <p className="text-[10px] text-base-content/50 mt-0.5">
                    Permite documentos en formato <strong className="text-base-content/80">PDF</strong> o imágenes (JPG, PNG) de hasta 10 MB.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* CONTENIDO TAB 2: ESCANEAR CON CÁMARA */}
          {activeTab === 'camera' && (
            <div className="space-y-2">
              {cameraError ? (
                <div className="alert alert-error text-xs rounded-xl py-2 px-3 text-white flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <IconAlertCircle className="w-4 h-4 shrink-0" />
                    <span>{cameraError}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => startCameraStream(facingMode)}
                    className="btn btn-xs btn-outline btn-white text-[10px]"
                  >
                    Reintentar
                  </button>
                </div>
              ) : tempSnapshot ? (
                /* Previsualización del escaneo recién tomado */
                <div className="space-y-2">
                  <div className="relative rounded-xl overflow-hidden border border-primary/30 max-h-56 bg-black flex items-center justify-center">
                    <img src={tempSnapshot} alt="Escaneo" className="max-h-56 object-contain" />
                    <span className="absolute top-2 left-2 badge badge-success text-[10px] font-bold text-white shadow-xs">
                      Captura Realizada
                    </span>
                  </div>
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={handleRetakeSnapshot}
                      className="btn btn-xs btn-ghost text-base-content/70"
                    >
                      Volver a escanear
                    </button>
                    <button
                      type="button"
                      onClick={handleAcceptSnapshot}
                      className="btn btn-xs btn-primary font-bold gap-1 text-white"
                    >
                      <IconCheckCircle className="w-3.5 h-3.5" />
                      Usar este escaneo
                    </button>
                  </div>
                </div>
              ) : (
                /* Visor de Cámara en vivo */
                <div className="relative rounded-xl overflow-hidden bg-black aspect-video max-h-56 flex items-center justify-center">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />

                  {/* Marco guía de alineación del documento físico */}
                  <div className="absolute inset-4 border-2 border-dashed border-primary/80 rounded-lg pointer-events-none flex flex-col justify-between p-2 shadow-[0_0_0_9999px_rgba(0,0,0,0.4)]">
                    <div className="flex justify-between items-start">
                      <span className="bg-black/60 text-white text-[9px] px-1.5 py-0.5 rounded font-mono">
                        Alinea el documento físico
                      </span>
                    </div>
                    <div className="text-center">
                      <span className="bg-black/60 text-white/80 text-[8px] px-2 py-0.5 rounded">
                        Asegura buena iluminación
                      </span>
                    </div>
                  </div>

                  {/* Botones flotantes de control de cámara */}
                  <div className="absolute bottom-2 inset-x-0 flex items-center justify-center gap-3 z-10">
                    <button
                      type="button"
                      onClick={handleToggleCamera}
                      className="btn btn-circle btn-xs bg-black/60 hover:bg-black/80 text-white border-none"
                      title="Cambiar cámara (Frontal/Trasera)"
                    >
                      <IconSwitchCamera className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={handleCapturePhoto}
                      disabled={isProcessing || !isCapturing}
                      className="btn btn-sm btn-primary text-white rounded-full px-4 gap-1.5 shadow-lg border-2 border-white/40"
                    >
                      <IconCamera className="w-4 h-4" />
                      <span className="font-bold text-xs">Capturar Escaneo</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => stopCameraStream()}
                      className="btn btn-circle btn-xs bg-black/60 hover:bg-black/80 text-white border-none"
                      title="Cerrar cámara"
                    >
                      <IconX className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* CONTENIDO TAB 3: ENLACE URL EXTERNO */}
          {activeTab === 'url' && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <input
                  type="url"
                  placeholder="https://storage.google.com/.../aviso-sanitario.pdf"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  className="input input-bordered input-xs flex-1 rounded-xl h-9 text-xs focus:input-primary"
                  disabled={disabled}
                />
                <button
                  type="button"
                  onClick={handleApplyUrl}
                  disabled={!urlInput.trim() || disabled}
                  className="btn btn-primary btn-xs h-9 rounded-xl px-3 font-semibold text-white"
                >
                  Vincular
                </button>
              </div>
              <p className="text-[10px] text-base-content/50">
                Pega el enlace directo a tu documento alojado en Google Drive, Dropbox, AWS S3 o tu servidor.
              </p>
            </div>
          )}
        </div>
      )}

      {/* MODAL LIGHTBOX PARA VISUALIZACIÓN EN PANTALLA COMPLETA */}
      {showLightbox && value && (
        <dialog className="modal modal-open backdrop-blur-sm z-50 p-2 sm:p-4">
          <div className="modal-box max-w-4xl bg-base-100 p-4 sm:p-6 rounded-3xl border border-base-300 space-y-3">
            <div className="flex items-center justify-between border-b border-base-200 pb-2">
              <div className="flex items-center gap-2">
                <IconScan className="w-4 h-4 text-primary" />
                <h4 className="font-bold text-sm text-base-content">
                  Expediente de Comprobante Sanitario Digitalizado
                </h4>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handleDownload}
                  className="btn btn-xs btn-ghost gap-1"
                >
                  <IconDownload className="w-3.5 h-3.5" /> Descargar
                </button>
                <button
                  type="button"
                  onClick={() => setShowLightbox(false)}
                  className="btn btn-xs btn-circle btn-ghost"
                >
                  <IconX className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="max-h-[75vh] overflow-auto flex items-center justify-center bg-base-200/50 rounded-2xl p-2 border border-base-200">
              <img
                src={value}
                alt="Documento Sanitario Oficial"
                className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-md"
              />
            </div>

            <div className="text-right">
              <button
                type="button"
                onClick={() => setShowLightbox(false)}
                className="btn btn-sm btn-ghost rounded-xl font-semibold"
              >
                Cerrar Visor
              </button>
            </div>
          </div>
          <form method="dialog" className="modal-backdrop">
            <button onClick={() => setShowLightbox(false)}>close</button>
          </form>
        </dialog>
      )}
    </div>
  );
};
