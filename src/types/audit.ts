// src/types/audit.ts
export type AuditCategory = 'ORDERS' | 'REAGENTS' | 'USERS' | 'SECURITY' | 'SYSTEM' | 'CONFIG';

export interface AuditLog {
  id: string;
  action: string;
  category: AuditCategory | string;
  description: string;
  actorId?: string;
  actorName: string;
  actorEmail?: string;
  laboratoryId?: string;
  details?: Record<string, any>;
  ipAddress?: string;
  createdAt: string;
}

export interface AuditStats {
  total: number;
  todayCount: number;
  byCategory: Record<string, number>;
}
