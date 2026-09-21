// src/types/lab.ts

export type VerificationStatus = 'PENDING_REVIEW' | 'VERIFIED' | 'REJECTED' | 'IN_REVIEW';

export interface Laboratory {
  id: string;
  name: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  logo?: string;

  // 📜 Datos Sanitarios y Regulatorios (México / COFEPRIS)
  rfc?: string;
  cofeprisNotice?: string;
  sanitaryResponsible?: string;
  professionalLicense?: string;
  sanitaryPermitUrl?: string;
  phone?: string;
  email?: string;

  // 🛡️ Auditoría y Validación Central
  verificationStatus?: VerificationStatus;
  verificationNotes?: string;
  verifiedAt?: string;
  verifiedBy?: string;

  createdById?: string;
  createdBy?: {
    id: string;
    clerkId?: string;
    email?: string;
    firstName?: string;
    lastName?: string;
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateLabDto {
  name: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  logo?: string;

  // 📜 Datos Sanitarios y Regulatorios (México / COFEPRIS)
  rfc?: string;
  cofeprisNotice?: string;
  sanitaryResponsible?: string;
  professionalLicense?: string;
  sanitaryPermitUrl?: string;
  phone?: string;
  email?: string;
}
