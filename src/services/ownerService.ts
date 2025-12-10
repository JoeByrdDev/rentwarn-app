import { db } from "../firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import type { OwnerSettings } from "../types/ownerSettings";

export const ownerService = {
  async getOwnerSettings(ownerId: string): Promise<OwnerSettings> {
    const ref = doc(db, "owners", ownerId);
    const snap = await getDoc(ref);

    if (!snap.exists()) {
      return {
        businessName: "",
        contactInfo: "",
        defaultDueDay: null,
        defaultLateFeeFlat: null,
      };
    }

    const data = snap.data() as any;
    return {
      businessName: data.businessName ?? "",
      contactInfo: data.contactInfo ?? "",
      defaultDueDay:
        typeof data.defaultDueDay === "number" ? data.defaultDueDay : null,
      defaultLateFeeFlat:
        typeof data.defaultLateFeeFlat === "number"
          ? data.defaultLateFeeFlat
          : null,
    };
  },

  async saveOwnerSettings(ownerId: string, settings: OwnerSettings) {
    const ref = doc(db, "owners", ownerId);
    await setDoc(
      ref,
      {
        businessName: settings.businessName,
        contactInfo: settings.contactInfo,
        defaultDueDay: settings.defaultDueDay,
        defaultLateFeeFlat: settings.defaultLateFeeFlat,
      },
      { merge: true }
    );
  },
};
