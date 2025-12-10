import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  type DocumentData,
  type QueryDocumentSnapshot,
} from "firebase/firestore";
import { db } from "../firebase";
import type { Notice } from "../types/notice";


const noticesCollection = collection(db, "notices");

const mapDocToNotice = (
  docSnap: QueryDocumentSnapshot<DocumentData>
): Notice => {
  const data = docSnap.data() as any;
  return {
    id: docSnap.id,
    tenantId: data.tenantId ?? "",
    tenantName: data.tenantName ?? "",
    unit: data.unit ?? "",
    period: data.period ?? null,
    baseAmount: Number(data.baseAmount ?? 0),
    lateFee: Number(data.lateFee ?? 0),
    totalAmount: Number(data.totalAmount ?? 0),
    createdAt: data.createdAt?.toDate
      ? (data.createdAt.toDate() as Date)
      : null,
    text: data.text ?? "",
  };
};

export const noticeService = {
  async logNotice(params: {
    ownerId: string;
    tenantId: string;
    tenantName: string;
    unit: string;
    baseAmount: number;
    lateFee: number;
    totalAmount: number;
    period: string;
    text: string;
  }) {
    const { ownerId, ...rest } = params;
    return await addDoc(noticesCollection, {
      ownerId,
      ...rest,
      createdAt: new Date(),
    });
  },

  async getNoticesForOwner(ownerId: string): Promise<Notice[]> {
    const q = query(noticesCollection, where("ownerId", "==", ownerId));
    const snap = await getDocs(q);
    const items = snap.docs.map((d) => mapDocToNotice(d));
    // Newest first
    return items.sort(
      (a, b) => (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0)
    );
  },
};
