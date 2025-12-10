import type React from "react";
import type { Tenant } from "../../types/tenant";

type TenantTableProps = {
  tenants: Tenant[];
  isLate: (tenant: Tenant) => boolean;
  onGenerateNotice: (tenant: Tenant) => void;
};

const TenantTable: React.FC<TenantTableProps> = ({
  tenants,
  isLate,
  onGenerateNotice,
}) => {
  if (tenants.length === 0) {
    return (
      <div
        style={{
          background: "#020617",
          borderRadius: "0.75rem",
          padding: "1.25rem",
          border: "1px solid #1f2937",
        }}
      >
        <h2 style={{ fontSize: "1.2rem", marginBottom: "0.75rem" }}>Tenants</h2>
        <p style={{ color: "#9ca3af", fontSize: "0.9rem" }}>
          No tenants yet. Add your first tenant using the form on the right.
        </p>
      </div>
    );
  }

  return (
    <div
      style={{
        background: "#020617",
        borderRadius: "0.75rem",
        padding: "1.25rem",
        border: "1px solid #1f2937",
      }}
    >
      <h2 style={{ fontSize: "1.2rem", marginBottom: "0.75rem" }}>Tenants</h2>
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
                      onClick={() => onGenerateNotice(t)}
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
    </div>
  );
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

export default TenantTable;
