// src/components/DigitalSignatureModal.tsx
import { useState, useRef, useEffect } from 'react';
import {
  getSanitarySignatureConfig,
  saveSanitarySignatureConfig,
  type SanitarySignatureConfig,
} from '../utils/cryptoSecurity';
import { IconCheck, IconX, IconTrash, IconAward, IconShieldCheck } from './icons';

interface DigitalSignatureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved?: (config: SanitarySignatureConfig) => void;
}

export default function DigitalSignatureModal({ isOpen, onClose, onSaved }: DigitalSignatureModalProps) {
  const [config, setConfig] = useState<SanitarySignatureConfig>(getSanitarySignatureConfig);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      const current = getSanitarySignatureConfig();
      setConfig(current);
      setHasDrawn(Boolean(current.signatureDataUrl));

      // Si ya hay firma guardada, dibujarla en el canvas
      setTimeout(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (current.signatureDataUrl) {
          const img = new Image();
          img.onload = () => {
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          };
          img.src = current.signatureDataUrl;
        }
      }, 100);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Manejo de trazo en Canvas (Mouse y Touch)
  const getCoordinates = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? (e.touches[0] ? e.touches[0].clientX : 0) : e.clientX;
    const clientY = 'touches' in e ? (e.touches[0] ? e.touches[0].clientY : 0) : e.clientY;
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    setHasDrawn(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoordinates(e, canvas);

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.strokeStyle = '#088395'; // Color Teal Clínico
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoordinates(e, canvas);

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
    setConfig((prev) => ({ ...prev, signatureDataUrl: null }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const img = new Image();
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        setHasDrawn(true);
        setConfig((prev) => ({ ...prev, signatureDataUrl: result }));
      };
      img.src = result;
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    let dataUrl = config.signatureDataUrl;

    if (canvas && hasDrawn) {
      dataUrl = canvas.toDataURL('image/png');
    }

    const updatedConfig: SanitarySignatureConfig = {
      ...config,
      signatureDataUrl: dataUrl,
    };

    saveSanitarySignatureConfig(updatedConfig);
    if (onSaved) onSaved(updatedConfig);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-2.5 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-fade-in overflow-y-auto">
      <div className="bg-base-100 rounded-3xl border border-base-200 shadow-2xl max-w-[95vw] sm:max-w-lg w-full max-h-[90vh] overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-5">
        {/* Encabezado */}
        <div className="flex items-center justify-between border-b border-base-200 pb-3">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20 shrink-0">
              <IconAward className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-base-content leading-tight">
                Firma Digital del Responsable Sanitario
              </h3>
              <p className="text-[11px] sm:text-xs text-base-content/60">
                Aparecerá avalada con Cédula y Sello SHA-256 en cada informe PDF
              </p>
            </div>
          </div>
          <button onClick={onClose} className="btn btn-xs btn-circle btn-ghost">
            <IconX className="w-4 h-4" />
          </button>
        </div>

        {/* Formulario de Datos del Químico */}
        <div className="space-y-3 text-xs">
          <div>
            <label className="font-bold text-base-content/70 block mb-1">Nombre Completo del Q.F.B. / Responsable:</label>
            <input
              type="text"
              value={config.responsibleName}
              onChange={(e) => setConfig({ ...config, responsibleName: e.target.value })}
              className="input input-bordered input-sm w-full rounded-xl font-semibold"
              placeholder="Ej. Q.F.B. Juan Carlos Mendoza Hernández"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label className="font-bold text-base-content/70 block mb-1">Cédula Profesional:</label>
              <input
                type="text"
                value={config.professionalLicense}
                onChange={(e) => setConfig({ ...config, professionalLicense: e.target.value })}
                className="input input-bordered input-sm w-full rounded-xl font-mono"
                placeholder="Ej. 5518954"
              />
            </div>
            <div>
              <label className="font-bold text-base-content/70 block mb-1">Certificado Sanitario / Folio:</label>
              <input
                type="text"
                value={config.digitalCertificateId || ''}
                onChange={(e) => setConfig({ ...config, digitalCertificateId: e.target.value })}
                className="input input-bordered input-sm w-full rounded-xl font-mono text-[11px]"
                placeholder="CERT-ISO-15189"
              />
            </div>
          </div>

          {/* Área de Trazo de Firma */}
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between">
              <label className="font-bold text-base-content/70">Trazo de Firma Manuscrita:</label>
              <div className="flex items-center gap-2">
                <label className="btn btn-xs btn-ghost text-primary font-bold cursor-pointer">
                  Subir Imagen
                  <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                </label>
                <button
                  type="button"
                  onClick={clearCanvas}
                  className="btn btn-xs btn-ghost text-error font-semibold inline-flex items-center gap-1"
                >
                  <IconTrash className="w-3.5 h-3.5" />
                  Limpiar
                </button>
              </div>
            </div>

            <div className="border-2 border-dashed border-base-300 rounded-2xl bg-base-200/40 relative overflow-hidden flex items-center justify-center">
              <canvas
                ref={canvasRef}
                width={440}
                height={150}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
                className="cursor-crosshair w-full h-[150px] touch-none"
              />
              {!hasDrawn && (
                <div className="absolute pointer-events-none text-base-content/40 text-xs font-medium text-center">
                  Dibuja tu firma aquí con mouse o pantalla táctil
                </div>
              )}
            </div>
          </div>

          <div className="p-3 bg-primary/5 border border-primary/20 rounded-xl text-[11px] text-base-content/80 flex items-start gap-2">
            <IconShieldCheck className="w-4 h-4 text-primary shrink-0 mt-0.5" />
            <p className="leading-tight">
              Al guardar, cada PDF incluirá esta rúbrica y se calculará automáticamente el sello criptográfico SHA-256 inalterable conforme a lineamientos sanitarios oficiales.
            </p>
          </div>
        </div>

        {/* Acciones */}
        <div className="flex items-center justify-end gap-2.5 border-t border-base-200 pt-3">
          <button type="button" onClick={onClose} className="btn btn-sm btn-ghost rounded-xl font-bold">
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="btn btn-sm btn-primary text-primary-content rounded-xl font-bold inline-flex items-center gap-1.5 shadow-xs"
          >
            <IconCheck className="w-4 h-4" />
            Guardar Firma Oficial
          </button>
        </div>
      </div>
    </div>
  );
}
