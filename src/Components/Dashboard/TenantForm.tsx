import type React from "react";

type TenantFormProps = {
  name: string;
  unit: string;
  email: string;
  rent: string;
  dueDay: string;
  lateFeeFlat: string;
  loading: boolean;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  onNameChange: (value: string) => void;
  onUnitChange: (value: string) => void;
  onEmailChange: (value: string) => void;
  onRentChange: (value: string) => void;
  onDueDayChange: (value: string) => void;
  onLateFeeChange: (value: string) => void;
  onCSVUpload: (file: File | undefined) => void;
};

const TenantForm: React.FC<TenantFormProps> = ({
  name,
  unit,
  email,
  rent,
  dueDay,
  lateFeeFlat,
  loading,
  onSubmit,
  onNameChange,
  onUnitChange,
  onEmailChange,
  onRentChange,
  onDueDayChange,
  onLateFeeChange,
  onCSVUpload,
}) => {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    onCSVUpload(file);
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
      <h2 style={{ fontSize: "1.2rem", marginBottom: "0.75rem" }}>
        Add tenant
      </h2>

      <div style={{ marginBottom: "1rem" }}>
        <p
          style={{
            color: "#9ca3af",
            marginBottom: "0.5rem",
            fontSize: "0.9rem",
          }}
        >
          CSV import (optional)
        </p>
        <input type="file" accept=".csv" onChange={handleFileChange} />
        <p style={{ color: "#6b7280", fontSize: "0.8rem", marginTop: "0.4rem" }}>
          Columns: name, unit, email, rent, dueDay, lateFeeFlat
        </p>
      </div>

      <form onSubmit={onSubmit}>
        <div style={{ display: "grid", gap: "0.6rem" }}>
          <input
            type="text"
            required
            placeholder="Tenant name *"
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            style={inputStyle}
          />
          <input
            type="text"
            placeholder="Unit (e.g. 3B)"
            value={unit}
            onChange={(e) => onUnitChange(e.target.value)}
            style={inputStyle}
          />
          <input
            type="email"
            required
            placeholder="Tenant email *"
            value={email}
            onChange={(e) => onEmailChange(e.target.value)}
            style={inputStyle}
          />
          <input
            type="number"
            required
            min={0}
            placeholder="Monthly rent amount *"
            value={rent}
            onChange={(e) => onRentChange(e.target.value)}
            style={inputStyle}
          />
          <input
            type="number"
            required
            min={1}
            max={31}
            placeholder="Rent due day of month (1–31) *"
            value={dueDay}
            onChange={(e) => onDueDayChange(e.target.value)}
            style={inputStyle}
          />
          <input
            type="number"
            min={0}
            placeholder="Flat late fee (optional)"
            value={lateFeeFlat}
            onChange={(e) => onLateFeeChange(e.target.value)}
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
        This is a simple, manual tenant list for now. CSV import and automation
        come next.
      </p>
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

export default TenantForm;
