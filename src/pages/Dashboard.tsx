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

type Tenant = {
  id: string;
  name: string;
  unit: string;
  email: string;
  rent: number;
  dueDay: number;
  lateFeeFlat: number;
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

  useEffect(() => {
    const fetchTenants = async () => {
      const snap = await getDocs(collection(db, "tenants"));
      const items = snap.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => {
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
      });
      setTenants(items);
    };

    void fetchTenants();
  }, []);
  
  

const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
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

      // Refresh tenant list
      const snap = await getDocs(collection(db, "tenants"));
      const items = snap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as any;

      setTenants(items);
    },
  });
};


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
      <h1 style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>RentWarn Dashboard</h1>
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
        {/* Tenants list */}
        <div
          style={{
            background: "#020617",
            borderRadius: "0.75rem",
            padding: "1.25rem",
            border: "1px solid #1f2937",
          }}
        >
          <h2 style={{ fontSize: "1.2rem", marginBottom: "0.75rem" }}>Tenants</h2>
          {tenants.length === 0 ? (
            <p style={{ color: "#9ca3af", fontSize: "0.9rem" }}>
              No tenants yet. Add your first tenant using the form on the right.
            </p>
          ) : (
            <div
              style={{
                maxHeight: "380px",
                overflow: "auto",
                borderRadius: "0.5rem",
                border: "1px solid #1f2937",
              }}
            >
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontSize: "0.9rem",
                }}
              >
                <thead
                  style={{
                    background: "#020617",
                    position: "sticky",
                    top: 0,
                    zIndex: 1,
                  }}
                >
                  <tr>
                    <th style={thStyle}>Name</th>
                    <th style={thStyle}>Unit</th>
                    <th style={thStyle}>Rent</th>
                    <th style={thStyle}>Due day</th>
                    <th style={thStyle}>Late fee</th>
                    <th style={thStyle}>Status</th>
                    <th style={thStyle}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {tenants.map((t) => {
                    const late = isLate(t);
                    return (
                      <tr key={t.id}>
                        <td style={tdStyle}>{t.name}</td>
                        <td style={tdStyle}>{t.unit || "-"}</td>
                        <td style={tdStyle}>${t.rent.toFixed(2)}</td>
                        <td style={tdStyle}>{t.dueDay}</td>
                        <td style={tdStyle}>
                          {t.lateFeeFlat ? `$${t.lateFeeFlat.toFixed(2)}` : "$0.00"}
                        </td>
                        <td style={tdStyle}>
                          <span
                            style={{
                              padding: "0.15rem 0.5rem",
                              borderRadius: "999px",
                              fontSize: "0.75rem",
                              border: "1px solid",
                              borderColor: late ? "#f97316" : "#22c55e",
                              color: late ? "#fdba74" : "#bbf7d0",
                              background: late ? "#451a03" : "#022c22",
                            }}
                          >
                            {late ? "Likely late" : "On-time (so far)"}
                          </span>
                        </td>
                        <td style={tdStyle}>
                          <button
                            type="button"
                            onClick={() => handleGenerateNotice(t)}
                            style={{
                              padding: "0.25rem 0.6rem",
                              borderRadius: "0.5rem",
                              border: "none",
                              fontSize: "0.8rem",
                              cursor: "pointer",
                              background:
                                "linear-gradient(135deg, #22c55e, #16a34a)",
                              color: "#020617",
                              fontWeight: 600,
                            }}
                          >
                            Generate notice
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

		<div style={{ marginBottom: "1rem" }}>
  <p style={{ color: "#9ca3af", marginBottom: "0.5rem", fontSize: "0.9rem" }}>
    CSV import (optional)
  </p>
  <input
    type="file"
    accept=".csv"
    onChange={handleCSVUpload}
    style={{ marginBottom: "0.5rem" }}
  />
  <p style={{ color: "#6b7280", fontSize: "0.8rem" }}>
    Columns: name, unit, email, rent, dueDay, lateFeeFlat
  </p>
</div>

        {/* Add tenant form */}
        <div
          style={{
            background: "#020617",
            borderRadius: "0.75rem",
            padding: "1.25rem",
            border: "1px solid #1f2937",
          }}
        >
          <h2 style={{ fontSize: "1.2rem", marginBottom: "0.75rem" }}>
            Add tenant
          </h2>
          <form onSubmit={handleAddTenant}>
            <div style={{ display: "grid", gap: "0.6rem" }}>
              <input
                type="text"
                required
                placeholder="Tenant name *"
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={inputStyle}
              />
              <input
                type="text"
                placeholder="Unit (e.g. 3B)"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                style={inputStyle}
              />
              <input
                type="email"
                required
                placeholder="Tenant email *"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={inputStyle}
              />
              <input
                type="number"
                required
                min={0}
                placeholder="Monthly rent amount *"
                value={rent}
                onChange={(e) => setRent(e.target.value)}
                style={inputStyle}
              />
              <input
                type="number"
                required
                min={1}
                max={31}
                placeholder="Rent due day of month (1–31) *"
                value={dueDay}
                onChange={(e) => setDueDay(e.target.value)}
                style={inputStyle}
              />
              <input
                type="number"
                min={0}
                placeholder="Flat late fee (optional)"
                value={lateFeeFlat}
                onChange={(e) => setLateFeeFlat(e.target.value)}
                style={inputStyle}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                marginTop: "0.75rem",
                width: "100%",
                padding: "0.65rem 1rem",
                borderRadius: "0.75rem",
                border: "none",
                fontWeight: 600,
                fontSize: "0.9rem",
                cursor: loading ? "wait" : "pointer",
                background: loading
                  ? "#4b5563"
                  : "linear-gradient(135deg, #22c55e, #16a34a)",
                color: "#020617",
              }}
            >
              {loading ? "Saving..." : "Add tenant"}
            </button>
          </form>

          <p
            style={{
              marginTop: "0.75rem",
              fontSize: "0.8rem",
              color: "#9ca3af",
            }}
          >
            This is a simple, manual tenant list for now. CSV import and
            automation come next.
          </p>
        </div>
      </div>

      {/* Notice preview panel */}
      <div
        style={{
          marginTop: "1.5rem",
          background: "#020617",
          borderRadius: "0.75rem",
          padding: "1.25rem",
          border: "1px solid #1f2937",
        }}
      >
        <h2 style={{ fontSize: "1.1rem", marginBottom: "0.75rem" }}>
          Latest generated notice
        </h2>
        {noticePreview ? (
          <>
            <p
              style={{
                fontSize: "0.85rem",
                color: "#9ca3af",
                marginBottom: "0.75rem",
              }}
            >
              Copy and paste this into your email client or document system.
            </p>
            <pre
              style={{
                whiteSpace: "pre-wrap",
                background: "#020617",
                borderRadius: "0.5rem",
                border: "1px solid #1f2937",
                padding: "0.75rem",
                fontSize: "0.85rem",
                fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
              }}
            >
              {noticePreview}
            </pre>
          </>
        ) : (
          <p style={{ fontSize: "0.9rem", color: "#9ca3af" }}>
            Click &quot;Generate notice&quot; next to a tenant to see a draft
            late rent letter here.
          </p>
        )}
      </div>
    </div>
  );
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "0.55rem 0.75rem",
  borderRadius: "0.55rem",
  border: "1px solid #374151",
  background: "#020617",
  color: "#e5e7eb",
  fontSize: "0.9rem",
};

const thStyle: React.CSSProperties = {
  textAlign: "left",
  padding: "0.5rem",
  borderBottom: "1px solid #1f2937",
  fontSize: "0.8rem",
  color: "#9ca3af",
};

const tdStyle: React.CSSProperties = {
  padding: "0.5rem",
  borderBottom: "1px solid #111827",
  fontSize: "0.85rem",
};

export default Dashboard;
