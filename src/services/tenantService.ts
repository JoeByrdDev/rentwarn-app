// src/services/tenantService.ts
import {
  collection,
  addDoc,
  getDocs,
  doc,
  getDoc,
  query,
  where,
  serverTimestamp,
  type DocumentData,
  type QueryDocumentSnapshot,
} from "firebase/firestore";
import { db } from "../firebase";
import type { Tenant } from "../types/tenant";

const tenantsCollection = collection(db, "tenants");

const mapDocToTenant = (
  docSnap: QueryDocumentSnapshot<DocumentData>
): Tenant => {
  const data = docSnap.data() as any;
  return {
    id: docSnap.id,
    name: data.name ?? "",
    unit: data.unit ?? "",
    email: data.email ?? "",
    rent: Number(data.rent ?? 0),
    dueDay: Number(data.dueDay ?? 1),
    lateFeeFlat: Number(data.lateFeeFlat ?? 0),
  };
};

export const tenantService = {
  async getTenantsForOwner(ownerId: string): Promise<Tenant[]> {
    const q = query(tenantsCollection, where("ownerId", "==", ownerId));
    const snap = await getDocs(q);
    return snap.docs.map((d) => mapDocToTenant(d));
  },

  async getTenantById(
    ownerId: string,
    tenantId: string
  ): Promise<Tenant | null> {
    const ref = doc(db, "tenants", tenantId);
    const snap = await getDoc(ref);

    if (!snap.exists()) return null;

    const data = snap.data() as any;
    if (data.ownerId !== ownerId) return null;

    return {
      id: snap.id,
      name: data.name ?? "",
      unit: data.unit ?? "",
      email: data.email ?? "",
      rent: Number(data.rent ?? 0),
      dueDay: Number(data.dueDay ?? 1),
      lateFeeFlat: Number(data.lateFeeFlat ?? 0),
    };
  },

  async createTenant(
    ownerId: string,
    data: Omit<Tenant, "id">
  ): Promise<Tenant> {
    const payload = {
      ...data,
      rent: Number(data.rent),
      dueDay: Number(data.dueDay),
      lateFeeFlat: Number(data.lateFeeFlat ?? 0),
      ownerId,
      createdAt: serverTimestamp(),
    };

    const docRef = await addDoc(tenantsCollection, payload);

    return {
      id: docRef.id,
      ...data,
      rent: Number(data.rent),
      dueDay: Number(data.dueDay),
      lateFeeFlat: Number(data.lateFeeFlat ?? 0),
    };
  },
};
