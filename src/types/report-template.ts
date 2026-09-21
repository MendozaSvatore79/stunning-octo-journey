// src/types/report-template.ts
export interface ReportTemplateConfig {
  id: string;
  headerText: string;
  footerText: string;
  showQrCode: boolean;
  showDigitalSeal: boolean;
  sanitaryLegalText: string;
  signatureTitle: string;
  signatureName: string;
  licenseNumber: string;
  updatedAt?: string;
}

export interface OrderVerificationResult {
  valid: boolean;
  folio: number;
  orderId: string;
  patientInitials: string;
  gender: string;
  laboratoryName: string;
  laboratoryCity?: string;
  status: string;
  issuedAt: string;
  updatedAt: string;
  studyCount: number;
  studies: string[];
  verificationUrl: string;
  sealTimestamp: string;
}
