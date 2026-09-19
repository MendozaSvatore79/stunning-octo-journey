// src/components/QRCodeSVG.tsx
import { useState, useEffect } from 'react';
import QRCode from 'qrcode';

interface QRCodeSVGProps {
  value: string;
  size?: number;
  className?: string;
}

/**
 * Generador de Código QR Estándar ISO/IEC 18004 Certificado.
 * Utiliza la biblioteca industrial 'qrcode' con corrección de errores Nivel M (15%)
 * y quiet-zone obligatoria para detección instantánea por cámaras móviles (iOS, Android y Google Lens).
 */
export default function QRCodeSVG({ value, size = 70, className = '' }: QRCodeSVGProps) {
  const [svgMarkup, setSvgMarkup] = useState<string>('');

  useEffect(() => {
    let isMounted = true;
    if (!value) return;

    QRCode.toString(value, {
      type: 'svg',
      margin: 2,
      errorCorrectionLevel: 'M',
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
    })
      .then((svg) => {
        if (isMounted) {
          const cleanSvg = svg.replace(/<\?xml[^>]*\?>/i, '').trim();
          setSvgMarkup(cleanSvg);
        }
      })
      .catch((err) => {
        console.error('Error generando QR oficial:', err);
      });

    return () => {
      isMounted = false;
    };
  }, [value]);

  return (
    <div
      className={`inline-flex items-center justify-center bg-white p-0.5 rounded-lg border border-slate-300 shadow-2xs overflow-hidden [&_svg]:w-full [&_svg]:h-full [&_svg]:block ${className}`}
      style={{ width: size, height: size }}
      title={`Código QR de autenticidad: ${value}`}
    >
      {svgMarkup ? (
        <div
          className="w-full h-full flex items-center justify-center"
          dangerouslySetInnerHTML={{ __html: svgMarkup }}
        />
      ) : (
        <span className="loading loading-spinner loading-xs text-primary"></span>
      )}
    </div>
  );
}
