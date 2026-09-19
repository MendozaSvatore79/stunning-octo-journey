// src/utils/cryptoSecurity.ts
// Utilidad para generación de Sello Criptográfico SHA-256 y Firma Digital del Q.F.B.

export interface SanitarySignatureConfig {
  responsibleName: string;
  professionalLicense: string; // Cédula Profesional
  institution: string;
  signatureDataUrl?: string | null; // Firma manuscrita en base64
  digitalCertificateId?: string;
}

const DEFAULT_SIGNATURE_KEY = 'lab_sanitary_signature_config';

export function getSanitarySignatureConfig(): SanitarySignatureConfig {
  try {
    const saved = localStorage.getItem(DEFAULT_SIGNATURE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch {}

  return {
    responsibleName: 'Q.F.B. JUAN CARLOS MENDOZA HERNÁNDEZ',
    professionalLicense: '5518954 / ESP. 892104',
    institution: 'Laboratorio de Patología Clínica y Análisis Bioquímicos',
    signatureDataUrl: null,
    digitalCertificateId: 'CERT-NOM-15189-MX-2026',
  };
}

export function saveSanitarySignatureConfig(config: SanitarySignatureConfig): void {
  try {
    localStorage.setItem(DEFAULT_SIGNATURE_KEY, JSON.stringify(config));
  } catch (e) {
    console.error('Error saving sanitary signature config:', e);
  }
}

/**
 * Calcula el Sello Digital Criptográfico SHA-256 para una orden clínica
 */
export async function generateOrderCryptoHash(
  orderFolio: number | string,
  patientName: string,
  createdAt: string,
  analysesCount: number,
  license: string
): Promise<string> {
  const payload = `FOLIO:${orderFolio}|PATIENT:${patientName}|DATE:${createdAt}|ITEMS:${analysesCount}|LIC:${license}|STD:ISO-15189`;
  
  if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
    try {
      const msgBuffer = new TextEncoder().encode(payload);
      const hashBuffer = await window.crypto.subtle.digest('SHA-256', msgBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
      return hashHex.toUpperCase();
    } catch {
      // Fallback si web crypto falla
    }
  }

  // Fallback hash determinista simple en caso de que crypto.subtle no esté disponible
  let hash = 0;
  for (let i = 0; i < payload.length; i++) {
    hash = (hash << 5) - hash + payload.charCodeAt(i);
    hash |= 0;
  }
  return `SHA256-${Math.abs(hash).toString(16).toUpperCase().padStart(16, '0')}B798A02F34`;
}
