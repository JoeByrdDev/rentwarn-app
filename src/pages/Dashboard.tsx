import type React from "react";
import { useEffect, useState } from "react";
import { db } from "../firebase";
import {
  collection,
  addDoc,
  getDocs,
  serverTimestamp,
} from "firebase/firestore";
import type {
  QueryDocumentSnapshot,
  DocumentData,
} from "firebase/firestore";

import Papa from "papaparse";
import type { ParseResult } from "papaparse";

import type { Tenant } from "../types/tenant";
import TenantTable from "../components/dashboard/TenantTable";
import TenantForm from "../components/dashboard/TenantForm";
import NoticePreview from "../components/dashboard/NoticePreview";

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

  useEffect(() => {
    const fetchTenants = async () => {
      const snap = await getDocs(collection(db, "tenants"));
      const items = snap.docs.map(
        (doc: QueryDocumentSnapshot<DocumentData>) => {
          const data = doc.data();
          return {
            id: doc.id,
            name: data.name ?? "",
            unit: data.unit ?? "",
            email: data.email ?? "",
            rent: Number(data.rent ?? 0),
            dueDay: Number(data.dueDay ?? 1),
            lateFeeFlat: Number(data.lateFeeFlat ?? 0),
          } as Tenant;
        }
      );
      setTenants(items);
    };

    void fetchTenants();
  }, []);

  const handleAddTenant = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!name || !email || !rent || !dueDay) return;

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
          });
        }

        const snap = await getDocs(collection(db, "tenants"));
        const items = snap.docs.map(
          (doc: QueryDocumentSnapshot<DocumentData>) => {
            const data = doc.data();
            return {
              id: doc.id,
              name: data.name ?? "",
              unit: data.unit ?? "",
              email: data.email ?? "",
              rent: Number(data.rent ?? 0),
              dueDay: Number(data.dueDay ?? 1),
              lateFeeFlat: Number(data.lateFeeFlat ?? 0),
            } as Tenant;
          }
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
[Your Company Name]
[Your Contact Info]
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
      <h1 style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>
        RentWarn Dashboard
      </h1>
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
