// src/types/announcement.ts
export type AnnouncementType = 'INFO' | 'WARNING' | 'URGENT' | 'MAINTENANCE';
export type AnnouncementScope = 'GLOBAL' | 'SPECIFIC_LAB';

export interface BroadcastAnnouncement {
  id: string;
  title: string;
  message: string;
  type: AnnouncementType;
  targetScope: AnnouncementScope;
  laboratoryId?: string | null;
  isActive: boolean;
  createdById?: string | null;
  createdByName: string;
  expiresAt?: string | null;
  createdAt: string;
  updatedAt: string;
}
