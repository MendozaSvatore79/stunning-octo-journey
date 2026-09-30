// src/components/PrescriptionScannerModal.tsx
import React, { useState, useRef, useCallback } from 'react';
import { useApi } from '../hooks/useApi';
import type { ClinicalAnalysis } from '../types/order';
import {
  IconScan,
  IconSparkles,
  IconCamera,
  IconUploadCloud,
  IconCheckCircle,
  IconAlertCircle,
  IconX,
  IconTrash,
} from './icons';

interface PrescriptionScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableStudies?: ClinicalAnalysis[];
  onApplyPrescription: (data: {
    doctorName?: string;
    patientName?: string;
    selectedStudyIds: string[];
  }) => void;
}

interface ScanResponse {
  success: boolean;
  rawText: string;
  detectedDoctor?: string;
  detectedPatient?: string;
  detectedStudies: {
    id: string;
    name: string;
    matchedText: string;
    confidence: number;
  }[];
  extractedLines: string[];
}

export default function PrescriptionScannerModal({
  isOpen,
  onClose,
  onApplyPrescription,
}: PrescriptionScannerModalProps) {
  const api = useApi();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Campos editables del resultado del escaneo
  const [doctorName, setDoctorName] = useState('');
  const [patientName, setPatientName] = useState('');
  const [selectedStudyIds, setSelectedStudyIds] = useState<string[]>([]);

  // Limpiar y resetear estado
  const handleReset = () => {
    setImagePreview(null);
    setScanResult(null);
    setErrorMessage(null);
    setDoctorName('');
    setPatientName('');
    setSelectedStudyIds([]);
    stopCamera();
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  // Comprimir imagen para optimizar el envío a Textract y evitar exceder límites de WAF
  const compressImage = (dataUrl: string, maxDim = 1280, quality = 0.8): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', quality));
        } else {
          resolve(dataUrl);
        }
      };
      img.onerror = () => resolve(dataUrl);
      img.src = dataUrl;
    });
  };

  // Manejar selección de archivo
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
      setErrorMessage('Por favor selecciona una imagen de la receta médica (JPG o PNG).');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      const rawBase64 = event.target?.result as string;
      const optimized = await compressImage(rawBase64);
      setImagePreview(optimized);
      setErrorMessage(null);
    };
    reader.readAsDataURL(file);
  };

  // Iniciar Cámara Web / Celular
  const startCamera = async () => {
    try {
      setIsCameraActive(true);
      setErrorMessage(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch {
      setIsCameraActive(false);
      setErrorMessage('No se pudo acceder a la cámara. Revisa los permisos de tu navegador o sube una imagen.');
    }
  };

  const stopCamera = useCallback(() => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  }, []);

  // Capturar foto desde la cámara
  const capturePhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    const sourceW = videoRef.current.videoWidth || 1280;
    const sourceH = videoRef.current.videoHeight || 720;
    const maxDim = 1280;
    let targetW = sourceW;
    let targetH = sourceH;

    if (sourceW > maxDim || sourceH > maxDim) {
      if (sourceW > sourceH) {
        targetH = Math.round((sourceH * maxDim) / sourceW);
        targetW = maxDim;
      } else {
        targetW = Math.round((sourceW * maxDim) / sourceH);
        targetH = maxDim;
      }
    }

    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(videoRef.current, 0, 0, targetW, targetH);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.80);
    setImagePreview(dataUrl);
    stopCamera();
  };

  // Enviar a Amazon Textract vía Backend
  const handleProcessWithTextract = async () => {
    if (!imagePreview) return;

    setIsScanning(true);
    setErrorMessage(null);

    try {
      const res = await api.post<ScanResponse>('/ai/scan-prescription', {
        imageBase64: imagePreview,
      });

      if (res.data && res.data.success) {
        setScanResult(res.data);
        setDoctorName(res.data.detectedDoctor || '');
        setPatientName(res.data.detectedPatient || '');

        // Seleccionar por defecto los estudios identificados
        const ids = res.data.detectedStudies.map((s) => s.id);
        setSelectedStudyIds(ids);
      } else {
        setErrorMessage('No se pudieron extraer datos de la receta.');
      }
    } catch (err: any) {
      setErrorMessage(err?.response?.data?.message || 'Error al conectar con Amazon Textract.');
    } finally {
      setIsScanning(false);
    }
  };

  const toggleStudySelection = (studyId: string) => {
    setSelectedStudyIds((prev) =>
      prev.includes(studyId) ? prev.filter((id) => id !== studyId) : [...prev, studyId]
    );
  };

  // Aplicar a la orden en WorkOrdersView
  const handleApply = () => {
    onApplyPrescription({
      doctorName: doctorName.trim() || undefined,
      patientName: patientName.trim() || undefined,
      selectedStudyIds,
    });
    handleClose();
  };

  if (!isOpen) return null;

  return (
    <dialog className="modal modal-open backdrop-blur-sm z-[110]">
      <div className="modal-box w-full max-w-[95vw] sm:max-w-2xl bg-base-100 rounded-3xl p-5 sm:p-7 border border-base-200 shadow-2xl space-y-5 max-h-[92vh] overflow-y-auto">
        
        {/* Cabecera del Modal */}
        <div className="flex items-center justify-between border-b border-base-200 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold">
              <IconScan className="w-5 h-5 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base sm:text-lg text-base-content leading-tight">
                  Escanear Receta Médica con IA
                </h3>
                <span className="badge badge-primary text-primary-content text-[10px] font-bold gap-1 uppercase">
                  <IconSparkles className="w-3 h-3" /> Amazon Textract
                </span>
              </div>
              <p className="text-xs text-base-content/60">
                Digitaliza y asocia automáticamente los estudios solicitados por el médico
              </p>
            </div>
          </div>
          <button onClick={handleClose} className="btn btn-sm btn-circle btn-ghost">
            <IconX className="w-5 h-5" />
          </button>
        </div>

        {/* Mensaje de error si ocurre */}
        {errorMessage && (
          <div className="alert alert-error text-xs rounded-2xl py-2 px-3 flex items-center gap-2">
            <IconAlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* PASO 1: Captura o Selección de Imagen */}
        {!scanResult && (
          <div className="space-y-4">
            {isCameraActive ? (
              <div className="space-y-3">
                <div className="relative rounded-2xl overflow-hidden bg-black aspect-video flex items-center justify-center">
                  <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                  <div className="absolute inset-0 border-2 border-primary/40 border-dashed m-6 rounded-xl pointer-events-none"></div>
                </div>
                <div className="flex justify-center gap-3">
                  <button onClick={capturePhoto} className="btn btn-primary text-white font-bold rounded-xl gap-2">
                    <IconCamera className="w-4 h-4" /> Tomar Foto de la Receta
                  </button>
                  <button onClick={stopCamera} className="btn btn-ghost rounded-xl">
                    Cancelar Cámara
                  </button>
                </div>
              </div>
            ) : imagePreview ? (
              <div className="space-y-3">
                <div className="relative rounded-2xl overflow-hidden border border-base-300 max-h-72 bg-base-200 flex items-center justify-center">
                  <img src={imagePreview} alt="Receta Médica" className="max-h-72 object-contain" />
                  <button
                    onClick={() => setImagePreview(null)}
                    className="btn btn-sm btn-circle btn-error text-white absolute top-2 right-2 shadow-md"
                    title="Eliminar imagen"
                  >
                    <IconTrash className="w-4 h-4" />
                  </button>
                </div>

                <button
                  onClick={handleProcessWithTextract}
                  disabled={isScanning}
                  className="btn btn-primary text-white w-full rounded-2xl font-bold gap-2 shadow-lg hover:scale-[1.01] transition-transform"
                >
                  {isScanning ? (
                    <>
                      <span className="loading loading-spinner loading-sm"></span>
                      Analizando receta con Amazon Textract...
                    </>
                  ) : (
                    <>
                      <IconSparkles className="w-5 h-5" />
                      Procesar y Extraer Estudios Clínicos
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div className="border-2 border-dashed border-base-300 rounded-3xl p-6 text-center space-y-4 hover:border-primary/50 transition-colors">
                <div className="w-14 h-14 mx-auto rounded-3xl bg-base-200 text-base-content/60 flex items-center justify-center">
                  <IconUploadCloud className="w-7 h-7" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-base-content">Sube la foto de la receta médica</h4>
                  <p className="text-xs text-base-content/60 mt-0.5">
                    Puedes tomarle foto con tu celular o arrastrar la imagen JPG o PNG
                  </p>
                </div>

                <div className="flex flex-wrap justify-center gap-3 pt-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*,application/pdf"
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="btn btn-outline btn-primary rounded-xl font-bold text-xs gap-2"
                  >
                    <IconUploadCloud className="w-4 h-4" /> Seleccionar Archivo
                  </button>
                  <button
                    onClick={startCamera}
                    className="btn btn-neutral rounded-xl font-bold text-xs gap-2"
                  >
                    <IconCamera className="w-4 h-4" /> Usar Cámara
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* PASO 2: Resultados Detectados por Textract */}
        {scanResult && (
          <div className="space-y-4 animate-fade-in">
            <div className="bg-success/10 border border-success/30 rounded-2xl p-3.5 flex items-center gap-2.5 text-xs text-success">
              <IconCheckCircle className="w-5 h-5 shrink-0" />
              <span className="font-bold">
                ¡Receta procesada! Textract identificó {scanResult.detectedStudies.length} estudio(s) clínicos coincidentes con tu catálogo.
              </span>
            </div>

            {/* Datos generales extraídos */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="label py-0 text-[11px] font-bold text-base-content/70">
                  Médico Solicitante Detectado:
                </label>
                <input
                  type="text"
                  value={doctorName}
                  onChange={(e) => setDoctorName(e.target.value)}
                  placeholder="Nombre del doctor"
                  className="input input-sm input-bordered w-full rounded-xl mt-1"
                />
              </div>

              <div>
                <label className="label py-0 text-[11px] font-bold text-base-content/70">
                  Paciente Detectado:
                </label>
                <input
                  type="text"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  placeholder="Nombre del paciente (si venía en la receta)"
                  className="input input-sm input-bordered w-full rounded-xl mt-1"
                />
              </div>
            </div>

            {/* Lista de Estudios Coincidentes */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-base-content/70">
                  Estudios del Catálogo Encontrados:
                </span>
                <span className="badge badge-sm badge-neutral font-mono text-[10px]">
                  {selectedStudyIds.length} seleccionados
                </span>
              </div>

              {scanResult.detectedStudies.length > 0 ? (
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {scanResult.detectedStudies.map((s) => {
                    const isChecked = selectedStudyIds.includes(s.id);
                    return (
                      <div
                        key={s.id}
                        onClick={() => toggleStudySelection(s.id)}
                        className={`p-3 rounded-2xl border text-xs flex items-center justify-between cursor-pointer transition-all ${
                          isChecked
                            ? 'bg-primary/10 border-primary text-primary font-bold shadow-xs'
                            : 'bg-base-200/50 border-base-200 text-base-content/70 hover:bg-base-200'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleStudySelection(s.id)}
                            className="checkbox checkbox-primary checkbox-xs rounded-md"
                          />
                          <div>
                            <span className="block text-xs">{s.name}</span>
                            <span className="text-[10px] text-base-content/50 font-normal">
                              Texto en receta: <em>"{s.matchedText}"</em>
                            </span>
                          </div>
                        </div>
                        <span className="badge badge-sm badge-ghost text-[10px]">95% coincidencia</span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="bg-base-200/50 p-4 rounded-2xl text-center text-xs text-base-content/60">
                  No se detectaron estudios coincidentes exactos con tu catálogo actual. Puedes seleccionar los estudios manualmente en la orden.
                </div>
              )}
            </div>

            {/* Acciones Finales */}
            <div className="pt-2 flex items-center justify-between border-t border-base-200">
              <button onClick={handleReset} className="btn btn-sm btn-ghost rounded-xl text-xs">
                Escanear Otra Receta
              </button>

              <button
                onClick={handleApply}
                disabled={selectedStudyIds.length === 0 && !doctorName}
                className="btn btn-sm btn-primary text-white rounded-xl font-bold gap-2 text-xs shadow-md"
              >
                <IconCheckCircle className="w-4 h-4" />
                Aplicar Datos a la Orden
              </button>
            </div>
          </div>
        )}
      </div>
    </dialog>
  );
}
