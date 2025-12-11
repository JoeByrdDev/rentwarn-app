// src/pages/TenantLedgerPage.tsx
import type React from "react";
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { auth } from "../auth/AuthContext";
import type { Tenant } from "../types/tenant";
import type { Payment } from "../types/payment";
import { tenantService } from "../services/tenantService";
import { paymentService } from "../services/paymentService";

type LedgerRow = {
  period: string; // "YYYY-MM"
  expected: number;
  paid: number;
  status: string;
};

const TenantLedgerPage: React.FC = () => {
  const { tenantId } = useParams();
  const navigate = useNavigate();

  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [rows, setRows] = useState<LedgerRow[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);

      const user = auth.currentUser;
      if (!user) {
        setError("You must be logged in to view this ledger.");
        setLoading(false);
        return;
      }

      if (!tenantId) {
        setError("No tenant selected.");
        setLoading(false);
        return;
      }

      try {
        const [tenantObj, tenantPayments] = await Promise.all([
          tenantService.getTenantById(user.uid, tenantId),
          paymentService.getPaymentsForTenant(user.uid, tenantId),
        ]);

        if (!tenantObj) {
          setError("Tenant not found or you do not have access.");
          setLoading(false);
          return;
        }

        setTenant(tenantObj);
        setPayments(tenantPayments);
        setRows(buildLedgerRows(tenantObj, tenantPayments));
      } catch (err) {
        console.error(err);
        setError("Failed to load ledger.");
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [tenantId]);

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#0f172a",
          color: "#e5e7eb",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <p>Loading tenant ledger...</p>
      </div>
    );
  }

  if (error || !tenant) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#0f172a",
          color: "#e5e7eb",
          padding: "2rem",
        }}
      >
        <p style={{ marginBottom: "1rem", color: "#f97373" }}>
          {error ?? "Unable to load tenant ledger."}
        </p>
        <button
          type="button"
          onClick={() => navigate("/dashboard")}
          style={backButtonStyle}
        >
          Back to dashboard
        </button>
      </div>
    );
  }

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
          marginBottom: "1rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <h1 style={{ fontSize: "1.8rem", marginBottom: "0.25rem" }}>
            Ledger – {tenant.name}
          </h1>
          <p style={{ fontSize: "0.9rem", color: "#9ca3af" }}>
            Monthly overview of rent and payments for the last 12 months.
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate("/dashboard")}
          style={backButtonStyle}
        >
          Back to dashboard
        </button>
      </div>

      <div
        style={{
          background: "#020617",
          borderRadius: "0.75rem",
          padding: "1.25rem",
          border: "1px solid #1f2937",
          marginBottom: "1rem",
        }}
      >
        <p style={{ fontSize: "0.9rem", color: "#9ca3af" }}>
          Unit: {tenant.unit || "-"} • Rent: $
          {tenant.rent.toFixed(2)} • Due day: {tenant.dueDay}
        </p>
      </div>

      <div
        style={{
          background: "#020617",
          borderRadius: "0.75rem",
          padding: "1.25rem",
          border: "1px solid #1f2937",
        }}
      >
        <h2 style={{ fontSize: "1.1rem", marginBottom: "0.75rem" }}>
          Monthly ledger (last 12 months)
        </h2>

        {rows.length === 0 ? (
          <p style={{ fontSize: "0.9rem", color: "#9ca3af" }}>
            No ledger data yet. Mark payments from the dashboard to see
            history here.
          </p>
        ) : (
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: "0.85rem",
            }}
          >
            <thead>
              <tr>
                <th style={thStyle}>Period</th>
                <th style={thStyle}>Expected</th>
                <th style={thStyle}>Paid</th>
                <th style={thStyle}>Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.period}>
                  <td style={tdStyle}>{formatPeriod(row.period)}</td>
                  <td style={tdStyle}>
                    {row.expected > 0
                      ? `$${row.expected.toFixed(2)}`
                      : "-"}
                  </td>
                  <td style={tdStyle}>
                    {row.paid > 0 ? `$${row.paid.toFixed(2)}` : "-"}
                  </td>
                  <td style={tdStyle}>
                    <span
                      style={{
                        display: "inline-block",
                        padding: "0.1rem 0.45rem",
                        borderRadius: "999px",
                        fontSize: "0.75rem",
                        background: "#020617",
                        border: `1px solid ${statusColor(row.status)}`,
                        color: statusColor(row.status),
                      }}
                    >
                      {row.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {payments.length > 0 && (
        <div
          style={{
            marginTop: "1.5rem",
            background: "#020617",
            borderRadius: "0.75rem",
            padding: "1.25rem",
            border: "1px solid #1f2937",
          }}
        >
          <h3 style={{ fontSize: "1rem", marginBottom: "0.75rem" }}>
            Raw payments
          </h3>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: "0.85rem",
            }}
          >
            <thead>
              <tr>
                <th style={thStyle}>Date</th>
                <th style={thStyle}>Period</th>
                <th style={thStyle}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p.id}>
                  <td style={tdStyle}>
                    {p.createdAt
                      ? p.createdAt.toLocaleDateString()
                      : "-"}
                  </td>
                  <td style={tdStyle}>{p.period}</td>
                  <td style={tdStyle}>${p.amount.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

const buildLedgerRows = (
  tenant: Tenant,
  payments: Payment[]
): LedgerRow[] => {
  const now = new Date();
  const rows: LedgerRow[] = [];

  // Sum payments by period
  const paidByPeriod: Record<string, number> = {};
  for (const p of payments) {
    if (!p.period) continue;
    paidByPeriod[p.period] = (paidByPeriod[p.period] || 0) + p.amount;
  }

  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const period = `${year}-${month}`;

    const expected = tenant.rent;
    const paid = paidByPeriod[period] ?? 0;

    let status = "Unpaid";
    if (expected <= 0) {
      status = "N/A";
    } else if (paid >= expected) {
      status = "Paid";
    } else if (paid > 0 && paid < expected) {
      status = "Partial";
    }

    rows.push({ period, expected, paid, status });
  }

  // Show newest first
  return rows.sort((a, b) => (a.period < b.period ? 1 : -1));
};

const formatPeriod = (period: string): string => {
  const [year, month] = period.split("-");
  const m = Number(month);
  const date = new Date(Number(year), m - 1, 1);
  const monthName = date.toLocaleString("default", { month: "short" });
  return `${monthName} ${year}`;
};

const statusColor = (status: string): string => {
  if (status === "Paid") return "#4ade80";
  if (status === "Partial") return "#facc15";
  if (status === "Unpaid") return "#f97373";
  return "#9ca3af";
};

const thStyle: React.CSSProperties = {
  textAlign: "left",
  padding: "0.45rem",
  borderBottom: "1px solid #1f2937",
  fontSize: "0.8rem",
  color: "#9ca3af",
};

const tdStyle: React.CSSProperties = {
  padding: "0.45rem",
  borderBottom: "1px solid #111827",
  fontSize: "0.8rem",
};

const backButtonStyle: React.CSSProperties = {
  padding: "0.5rem 0.9rem",
  borderRadius: "0.6rem",
  border: "1px solid #374151",
  background: "#020617",
  color: "#e5e7eb",
  fontSize: "0.85rem",
  cursor: "pointer",
};

export default TenantLedgerPage;
