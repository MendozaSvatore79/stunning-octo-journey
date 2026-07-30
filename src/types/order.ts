// src/types/order.ts
import type { Patient } from './patient';
import type { Laboratory } from './lab';

export interface ClinicalAnalysis {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  referenceValues?: string | null;
}

export interface WorkOrderAnalysis {
  id: string;
  resultValue?: string | null;
  status: string;
  analysisId: string;
  analysis: ClinicalAnalysis;
}

export interface WorkOrder {
  id: string;
  folio: number;
  status: string;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  patientId: string;
  patient: Patient;
  laboratoryId: string;
  laboratory: Laboratory;
  analyses: WorkOrderAnalysis[];
}

export interface CreateOrderDto {
  patientId: string;
  laboratoryId: string;
  doctorName?: string;
  discountPercent?: number;
  notes?: string;
  analysisIds: string[];
}
