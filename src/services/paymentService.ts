// src/services/paymentService.ts
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  serverTimestamp,
  type QueryDocumentSnapshot,
  type DocumentData,
} from "firebase/firestore";
import { db } from "../firebase";
import type { Payment } from "../types/payment";

const paymentsCollection = collection(db, "payments");

const mapDocToPayment = (
  docSnap: QueryDocumentSnapshot<DocumentData>
): Payment => {
  const data = docSnap.data() as any;
  return {
    id: docSnap.id,
    tenantId: data.tenantId ?? "",
    ownerId: data.ownerId ?? "",
    period: data.period ?? "",
    amount: Number(data.amount ?? 0),
    createdAt: data.createdAt?.toDate
      ? (data.createdAt.toDate() as Date)
      : null,
  };
};

export const paymentService = {
  async getPaymentsForOwnerForPeriod(
    ownerId: string,
    period: string
  ): Promise<Payment[]> {
    const q = query(
      paymentsCollection,
      where("ownerId", "==", ownerId),
      where("period", "==", period)
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => mapDocToPayment(d));
  },

  async getPaymentsForTenant(
    ownerId: string,
    tenantId: string
  ): Promise<Payment[]> {
    const q = query(
      paymentsCollection,
      where("ownerId", "==", ownerId),
      where("tenantId", "==", tenantId)
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => mapDocToPayment(d));
  },

  async logPayment(params: {
    ownerId: string;
    tenantId: string;
    amount: number;
    period: string;
  }): Promise<Payment> {
    const { ownerId, tenantId, amount, period } = params;

    const docRef = await addDoc(paymentsCollection, {
      ownerId,
      tenantId,
      amount,
      period,
      createdAt: serverTimestamp(),
    });

    return {
      id: docRef.id,
      ownerId,
      tenantId,
      amount,
      period,
      createdAt: null,
    };
  },
};
