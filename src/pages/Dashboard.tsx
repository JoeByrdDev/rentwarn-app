import type React from "react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { db } from "../firebase";
import {
  collection,
  addDoc,
  getDocs,
  serverTimestamp,
  query,
  where,
  doc,
  getDoc,
  type QueryDocumentSnapshot,
  type DocumentData,
} from "firebase/firestore";
import Papa from "papaparse";
import type { ParseResult } from "papaparse";
import { auth } from "../auth/AuthContext";
import type { Tenant } from "../types/tenant";
import type { OwnerSettings } from "../types/ownerSettings";
import TenantTable from "../components/dashboard/TenantTable";
import TenantForm from "../components/dashboard/TenantForm";
import NoticePreview from "../components/dashboard/NoticePreview";

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

const Dashboard: React.FC = () => {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [name, setName] = useState("");
  const [unit, setUnit] = useState("");
  const [email, setEmail] = useState("");
  const [rent, setRent] = useState("");
  const [dueDay, setDueDay] = useState("");
  const [lateFeeFlat, setLateFeeFlat] = useState("");
  const [loading, setLoading] = useState(false);
  const [noticePreview, setNoticePreview] = useState<string | null>(null);
  const [ownerSettings, setOwnerSettings] = useState<OwnerSettings | null>(
    null
  );

  useEffect(() => {
    const fetchData = async () => {
      const user = auth.currentUser;
      if (!user) return;

      // Fetch tenants for this owner
      const tenantsSnap = await getDocs(
        query(collection(db, "tenants"), where("ownerId", "==", user.uid))
      );
      const items = tenantsSnap.docs.map((d) =>
        mapDocToTenant(d as QueryDocumentSnapshot<DocumentData>)
      );
      setTenants(items);

      // Fetch owner settings
      const settingsRef = doc(db, "owners", user.uid);
      const settingsSnap = await getDoc(settingsRef);
      if (settingsSnap.exists()) {
        const data = settingsSnap.data() as any;
        setOwnerSettings({
          businessName: data.businessName ?? "",
          contactInfo: data.contactInfo ?? "",
          defaultDueDay:
            typeof data.defaultDueDay === "number" ? data.defaultDueDay : null,
          defaultLateFeeFlat:
            typeof data.defaultLateFeeFlat === "number"
              ? data.defaultLateFeeFlat
              : null,
        });
      }
    };

    void fetchData();
  }, []);

  const handleAddTenant = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!name || !email || !rent || !dueDay) return;

    const user = auth.currentUser;
    if (!user) return;

    setLoading(true);
    try {
      const payload = {
        name,
        unit,
        email,
        rent: Number(rent),
        dueDay: Number(dueDay),
        lateFeeFlat: lateFeeFlat ? Number(lateFeeFlat) : 0,
        createdAt: serverTimestamp(),
        ownerId: user.uid,
      };

      const docRef = await addDoc(collection(db, "tenants"), payload);

      setTenants((prev) => [
        ...prev,
        {
          id: docRef.id,
          name,
          unit,
          email,
          rent: Number(rent),
          dueDay: Number(dueDay),
          lateFeeFlat: lateFeeFlat ? Number(lateFeeFlat) : 0,
        },
      ]);

      setName("");
      setUnit("");
      setEmail("");
      setRent("");
      setDueDay("");
      setLateFeeFlat("");
    } finally {
      setLoading(false);
    }
  };

  const handleCSVUpload = (file: File | undefined) => {
    if (!file) return;

    const user = auth.currentUser;
    if (!user) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results: ParseResult<any>) => {
        const rows = results.data as any[];

        for (const row of rows) {
          if (!row.name || !row.email || !row.rent || !row.dueDay) continue;

          await addDoc(collection(db, "tenants"), {
            name: row.name,
            unit: row.unit || "",
            email: row.email,
            rent: Number(row.rent),
            dueDay: Number(row.dueDay),
            lateFeeFlat: Number(row.lateFeeFlat || 0),
            createdAt: serverTimestamp(),
            ownerId: user.uid,
          });
        }

        const tenantsSnap = await getDocs(
          query(collection(db, "tenants"), where("ownerId", "==", user.uid))
        );
        const items = tenantsSnap.docs.map((d) =>
          mapDocToTenant(d as QueryDocumentSnapshot<DocumentData>)
        );
        setTenants(items);
      },
    });
  };

  const isLate = (tenant: Tenant): boolean => {
    const today = new Date();
    const todayDay = today.getDate();
    return todayDay > tenant.dueDay;
  };

  const generateNoticeText = (tenant: Tenant): string => {
    const today = new Date();
    const month = today.toLocaleString("default", { month: "long" });
    const day = today.getDate();
    const year = today.getFullYear();

    const base = tenant.rent;
    const lateFee = tenant.lateFeeFlat || 0;
    const total = base + lateFee;

    const businessName =
      ownerSettings?.businessName || "[Your Company Name]";
    const contactInfo =
      ownerSettings?.contactInfo || "[Your Contact Info]";

    return `
${month} ${day}, ${year}

${tenant.name}
Unit ${tenant.unit}

RE: Late Rent Notice

Dear ${tenant.name},

Our records indicate that your rent for Unit ${tenant.unit} in the amount of $${base.toFixed(
      2
    )} was due on the ${tenant.dueDay} of this month and has not yet been received.

In accordance with the terms of your lease, a late fee of $${lateFee.toFixed(
      2
    )} has been applied, bringing your total amount due to $${total.toFixed(2)}.

Please pay the total amount due immediately to avoid further action.

If you believe you have received this notice in error, please contact management as soon as possible.

Sincerely,
${businessName}
${contactInfo}
`.trim();
  };

  const handleGenerateNotice = (tenant: Tenant) => {
    const text = generateNoticeText(tenant);
    setNoticePreview(text);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0f172a",
        color: "#e5e7eb",
        padding: "2rem",
      }}
    >
      <div
  style={{
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "1rem",
  }}
>
  <h1 style={{ fontSize: "2rem", marginBottom: 0 }}>RentWarn Dashboard</h1>
  <div style={{ display: "flex", gap: "1rem", fontSize: "0.9rem" }}>
    <Link to="/settings" style={{ color: "#9ca3af" }}>
      Settings
    </Link>
    <Link to="/billing" style={{ color: "#4ade80" }}>
      Billing
    </Link>
  </div>
</div>


      <p style={{ marginBottom: "1.5rem", color: "#9ca3af" }}>
        Manage tenants, see who is likely late, and generate late rent notices.
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.2fr 1fr",
          gap: "1.5rem",
          alignItems: "flex-start",
        }}
      >
        <TenantTable
          tenants={tenants}
          isLate={isLate}
          onGenerateNotice={handleGenerateNotice}
        />

        <TenantForm
          name={name}
          unit={unit}
          email={email}
          rent={rent}
          dueDay={dueDay}
          lateFeeFlat={lateFeeFlat}
          loading={loading}
          onSubmit={handleAddTenant}
          onNameChange={setName}
          onUnitChange={setUnit}
          onEmailChange={setEmail}
          onRentChange={setRent}
          onDueDayChange={setDueDay}
          onLateFeeChange={setLateFeeFlat}
          onCSVUpload={handleCSVUpload}
        />
      </div>

      <NoticePreview text={noticePreview} />
    </div>
  );
};

export default Dashboard;
