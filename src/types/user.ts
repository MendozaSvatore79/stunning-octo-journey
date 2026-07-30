// src/types/user.ts

export type UserRole = 'ADMIN' | 'LAB_TECHNICIAN' | 'RECEPTIONIST' | 'TECH' | string;

export interface UserProfile {
  id: string;
  email?: string;
  role: UserRole;
  clerkId?: string;
}
