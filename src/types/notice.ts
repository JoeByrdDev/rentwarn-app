export type Notice = {
  id: string;
  tenantId: string;
  tenantName: string;
  unit: string;
  period: string | null;
  baseAmount: number;
  lateFee: number;
  totalAmount: number;
  createdAt: Date | null;
  text: string;
};
