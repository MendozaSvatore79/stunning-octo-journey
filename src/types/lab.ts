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
  permitExpiresAt?: string;
  rpbiExpiresAt?: string;
  phone?: string;
  email?: string;

  // 🛡️ Auditoría y Validación Central
  verificationStatus?: VerificationStatus;
  verificationNotes?: string;
  verifiedAt?: string;
  verifiedBy?: string;
  isSuspended?: boolean;
  suspensionReason?: string;

  createdById?: string;
  createdBy?: {
    id: string;
    clerkId?: string;
    email?: string;
    firstName?: string;
    lastName?: string;
  };
  staff?: Array<{
    id: string;
    clerkId?: string;
    email?: string;
    firstName?: string;
    lastName?: string;
    role?: string;
  }>;
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
  permitExpiresAt?: string;
  rpbiExpiresAt?: string;
  isSuspended?: boolean;
  suspensionReason?: string;
  phone?: string;
  email?: string;
}
