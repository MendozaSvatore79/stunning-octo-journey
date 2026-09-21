// src/types/agreement.ts
export interface PriceAgreement {
  id: string;
  name: string;
  code: string;
  discountPct: number;
  contactName?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  isActive: boolean;
  notes?: string | null;
  createdById?: string | null;
  laboratories?: {
    id: string;
    name: string;
    city?: string | null;
    state?: string | null;
  }[];
  createdAt: string;
  updatedAt: string;
}
