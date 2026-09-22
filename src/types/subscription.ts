// src/types/subscription.ts

export type PlanType = 'BASIC' | 'GROWTH' | 'PRO';
export type SubscriptionStatus = 'TRIAL' | 'ACTIVE' | 'PAST_DUE' | 'CANCELED';

export interface PlanConfig {
  name: string;
  priceMxn: number;
  maxOrders: number;
  maxLabs: number;
  hasQualityControl?: boolean;
  hasAnalyzerLis?: boolean;
  hasCustomReportTemplates?: boolean;
  hasAdvancedAgreements?: boolean;
  hasPrioritySupport?: boolean;
  features: string[];
}

export interface UserSubscription {
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
  plan: {
    type: PlanType;
    name: string;
    priceMxn: number;
    currency: string;
    maxOrders: number;
    maxLabs: number;
    hasQualityControl?: boolean;
    hasAnalyzerLis?: boolean;
    hasCustomReportTemplates?: boolean;
    hasAdvancedAgreements?: boolean;
    hasPrioritySupport?: boolean;
    features: string[];
  };
  status: SubscriptionStatus;
  currentPeriodEnd?: string;
  usage: {
    ordersCountThisMonth: number;
    maxOrders: number;
    ordersPercent: number;
    labsCount: number;
    maxLabs: number;
    isExceededOrders: boolean;
    isExceededLabs: boolean;
  };
  allPlans: Record<PlanType, PlanConfig>;
}

export interface AdminSubscriptionItem {
  id: string;
  email: string;
  name: string;
  role: string;
  planType: PlanType;
  planName: string;
  priceMxn: number;
  status: SubscriptionStatus;
  currentPeriodEnd?: string;
  labsCount: number;
  maxLabs: number;
  ordersThisMonth: number;
  maxOrders: number;
  laboratories: Array<{
    id: string;
    name: string;
    verificationStatus: string;
    isSuspended: boolean;
  }>;
}
