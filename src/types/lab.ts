// src/types/lab.ts

export interface Laboratory {
  id: string;
  name: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  logo?: string;
  createdById?: string;
  createdBy?: {
    id: string;
    clerkId?: string;
    email?: string;
    firstName?: string;
    lastName?: string;
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateLabDto {
  name: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  logo?: string;
}
