// src/types/system-health.ts
export interface SystemHealthData {
  status: 'HEALTHY' | 'WARNING' | 'DEGRADED';
  timestamp: string;
  database: {
    provider: string;
    status: string;
    latencyMs: number;
    tables: {
      users: number;
      laboratories: number;
      patients: number;
      workOrders: number;
      pendingOrders: number;
      reagents: number;
      supportTickets: number;
      auditLogs: number;
    };
  };
  server: {
    nodeVersion: string;
    uptimeSeconds: number;
    memoryMb: {
      heapUsed: number;
      heapTotal: number;
      rss: number;
    };
  };
}

export interface SystemErrorItem {
  id: string;
  statusCode: number;
  path: string;
  method: string;
  message: string;
  stackTrace?: string;
  userId?: string;
  userEmail?: string;
  laboratoryId?: string;
  metadata?: any;
  createdAt: string;
}
