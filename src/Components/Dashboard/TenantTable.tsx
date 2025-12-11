import type React from "react";
import type { Tenant } from "../../types/tenant";

type TenantTableProps = {
  tenants: Tenant[];
  isLate: (tenant: Tenant) => boolean;
  isPaid: (tenant: Tenant) => boolean;
  onGenerateNotice: (tenant: Tenant) => void;
  onMarkPaid: (tenant: Tenant) => void;
  onViewLedger: (tenant: Tenant) => void;
};

const TenantTable: React.FC<TenantTableProps> = ({
  tenants,
  isLate,
  isPaid,
  onGenerateNotice,
  onMarkPaid,
  onViewLedger,
}) => {
  const getStatusLabel = (tenant: Tenant): { label: string; color: string } => {
    if (isPaid(tenant)) {
      return { label: "Current", color: "#4ade80" };
    }
    if (isLate(tenant)) {
      return { label: "Late", color: "#f97373" };
    }
    return { label: "Due", color: "#facc15" };
  };

  return (
    <div
      style={{
        background: "#020617",
        borderRadius: "0.75rem",
        padding: "1.25rem",
        border: "1px solid #1f2937",
      }}
    >
      <h2 style={{ fontSize: "1.1rem", marginBottom: "0.75rem" }}>Tenants</h2>

      {tenants.length === 0 ? (
        <p style={{ fontSize: "0.9rem", color: "#9ca3af" }}>
          No tenants yet. Add one using the form on the right or import from
          CSV.
        </p>
      ) : (
        <div
          style={{
            maxHeight: "260px",
            overflow: "auto",
            borderRadius: "0.5rem",
            border: "1px solid #1f2937",
          }}
        >
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: "0.85rem",
            }}
          >
            <thead>
              <tr>
                <th style={thStyle}>Name</th>
                <th style={thStyle}>Unit</th>
                <th style={thStyle}>Rent</th>
                <th style={thStyle}>Due day</th>
                <th style={thStyle}>Status</th>
                <th style={thStyle}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {tenants.map((tenant) => {
                const status = getStatusLabel(tenant);
                const paid = isPaid(tenant);

                return (
                  <tr key={tenant.id}>
                    <td style={tdStyle}>{tenant.name}</td>
                    <td style={tdStyle}>{tenant.unit || "-"}</td>
                    <td style={tdStyle}>${tenant.rent.toFixed(2)}</td>
                    <td style={tdStyle}>{tenant.dueDay}</td>
                    <td style={tdStyle}>
                      <span
                        style={{
                          display: "inline-block",
                          padding: "0.1rem 0.45rem",
                          borderRadius: "999px",
                          fontSize: "0.75rem",
                          background: "#020617",
                          border: `1px solid ${status.color}`,
                          color: status.color,
                        }}
                      >
                        {status.label}
                      </span>
                    </td>
                    <td style={{ ...tdStyle, whiteSpace: "nowrap" }}>
                      <button
                        type="button"
                        onClick={() => onGenerateNotice(tenant)}
                        style={primaryButtonStyle}
                      >
                        Generate notice
                      </button>
                      {!paid && (
                        <button
                          type="button"
                          onClick={() => onMarkPaid(tenant)}
                          style={secondaryButtonStyle}
                        >
                          Mark as paid
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => onViewLedger(tenant)}
                        style={tertiaryButtonStyle}
                      >
                        Ledger
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
  );
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

const primaryButtonStyle: React.CSSProperties = {
  padding: "0.35rem 0.6rem",
  borderRadius: "0.5rem",
  border: "none",
  fontSize: "0.75rem",
  fontWeight: 600,
  cursor: "pointer",
  background: "linear-gradient(135deg, #22c55e, #16a34a)",
  color: "#020617",
  marginRight: "0.35rem",
};

const secondaryButtonStyle: React.CSSProperties = {
  padding: "0.35rem 0.6rem",
  borderRadius: "0.5rem",
  border: "1px solid #4b5563",
  fontSize: "0.75rem",
  fontWeight: 500,
  cursor: "pointer",
  background: "#020617",
  color: "#e5e7eb",
  marginRight: "0.35rem",
};

const tertiaryButtonStyle: React.CSSProperties = {
  padding: "0.35rem 0.6rem",
  borderRadius: "0.5rem",
  border: "1px solid #1f2937",
  fontSize: "0.75rem",
  fontWeight: 500,
  cursor: "pointer",
  background: "#020617",
  color: "#9ca3af",
};

export default TenantTable;
