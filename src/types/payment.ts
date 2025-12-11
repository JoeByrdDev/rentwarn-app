// src/types/payment.ts
export type Payment = {
  id: string;
  tenantId: string;
  ownerId: string;
  period: string; // e.g. "2025-12"
  amount: number;
  createdAt: Date | null;
};
