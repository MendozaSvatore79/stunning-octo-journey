// src/utils/labOwnership.ts
import type { Laboratory } from '../types/lab';
import type { UserProfile } from '../types/user';

export function isUserLaboratory(
  lab: Laboratory,
  userProfile?: UserProfile | null,
  clerkUserId?: string,
  userEmail?: string
): boolean {
  if (!userProfile && !clerkUserId && !userEmail) return false;

  const myDbId = userProfile?.id;
  const myClerkId = clerkUserId || userProfile?.clerkId;
  const myEmail = (userEmail || userProfile?.email || '').toLowerCase().trim();

  // 1. Creador directo por ID de base de datos
  if (myDbId && (lab.createdById === myDbId || lab.createdBy?.id === myDbId)) {
    return true;
  }

  // 2. Creador directo por ID de Clerk
  if (myClerkId && (lab.createdById === myClerkId || lab.createdBy?.clerkId === myClerkId)) {
    return true;
  }

  // 3. Creador por coincidencia de correo electrónico
  if (myEmail && lab.createdBy?.email && lab.createdBy.email.toLowerCase().trim() === myEmail) {
    return true;
  }

  // 4. Personal asignado formalmente a esta sede (staff)
  if (lab.staff && Array.isArray(lab.staff)) {
    const isStaff = lab.staff.some((s: any) => {
      if (myDbId && s.id === myDbId) return true;
      if (myClerkId && s.clerkId === myClerkId) return true;
      if (myEmail && s.email && s.email.toLowerCase().trim() === myEmail) return true;
      return false;
    });
    if (isStaff) return true;
  }

  return false;
}
