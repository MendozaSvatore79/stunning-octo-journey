// src/types/ticket.ts

export type TicketCategory = 'EQUIPOS' | 'CALIDAD' | 'SISTEMA' | 'FACTURACION' | string;
export type TicketPriority = 'BAJA' | 'MEDIA' | 'ALTA' | 'CRITICA';
export type TicketStatus = 'ABIERTO' | 'EN_PROCESO' | 'RESUELTO' | 'CERRADO';

export interface SupportTicket {
  id: string;
  ticketNumber: string;
  userId: string;
  userName: string;
  userEmail?: string;
  channelId: string;
  subject: string;
  category: TicketCategory;
  priority: TicketPriority;
  description: string;
  status: TicketStatus;
  likelyCause?: string;
  suggestedAction?: string;
  recommendedPriority?: string;
  summary?: string;
  aiFirstReply?: string;
  aiAnalysis?: {
    likelyCause: string;
    suggestedAction: string;
    recommendedPriority: TicketPriority;
    summary: string;
  };
  createdAt: number | string;
  updatedAt: number | string;
}
