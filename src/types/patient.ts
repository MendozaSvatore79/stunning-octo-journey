// src/types/patient.ts

export interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  phone?: string | null;
  email?: string | null;
  createdAt?: string;
  updatedAt?: string;
  workOrders?: any[];
}

export interface CreatePatientDto {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  phone?: string;
  email?: string;
}

export interface UpdatePatientDto {
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  gender?: string;
  phone?: string;
  email?: string;
}
