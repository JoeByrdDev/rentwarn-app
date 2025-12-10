import type React from "react";
import { useEffect, useState } from "react";
//import { doc, getDoc, setDoc } from "firebase/firestore";
//import { db } from "../firebase";
import { auth } from "../auth/AuthContext";
import type { OwnerSettings } from "../types/ownerSettings";
import { ownerService } from "../services/ownerService";

const SettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<OwnerSettings>({
    businessName: "",
    contactInfo: "",
    defaultDueDay: null,
    defaultLateFeeFlat: null,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
  const fetchSettings = async () => {
    const user = auth.currentUser;
    if (!user) {
      setLoading(false);
      return;
    }

    const s = await ownerService.getOwnerSettings(user.uid);
    setSettings(s);
    setLoading(false);
  };

    void fetchSettings();
  }, []);

  const handleChange =
    (field: keyof OwnerSettings) =>
    (value: string): void => {
      setSettings((prev) => ({
        ...prev,
        [field]:
          field === "defaultDueDay" || field === "defaultLateFeeFlat"
            ? value === ""
              ? null
              : Number(value)
            : value,
      }));
    };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const user = auth.currentUser;
if (!user) return;

setSaving(true);
setStatus(null);

try {
  await ownerService.saveOwnerSettings(user.uid, settings);
  setStatus("Saved");
} catch (err) {
  console.error(err);
  setStatus("Error saving settings");
} finally {
  setSaving(false);
}
  };

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
        <p>Loading settings...</p>
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
      <h1 style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>Settings</h1>
      <p style={{ marginBottom: "1.5rem", color: "#9ca3af" }}>
        Configure how your notices look and your default late rent rules.
      </p>

      <form
        onSubmit={handleSubmit}
        style={{
          maxWidth: "500px",
          background: "#020617",
          borderRadius: "0.75rem",
          padding: "1.5rem",
          border: "1px solid #1f2937",
        }}
      >
        <div style={{ display: "grid", gap: "0.75rem" }}>
          <div>
            <label
              style={{
                display: "block",
                fontSize: "0.9rem",
                marginBottom: "0.25rem",
              }}
            >
              Business / management name
            </label>
            <input
              type="text"
              value={settings.businessName}
              onChange={(e) => handleChange("businessName")(e.target.value)}
              style={inputStyle}
              placeholder="e.g. Sunrise Property Management LLC"
            />
          </div>

          <div>
            <label
              style={{
                display: "block",
                fontSize: "0.9rem",
                marginBottom: "0.25rem",
              }}
            >
              Contact info for notices
            </label>
            <textarea
              value={settings.contactInfo}
              onChange={(e) => handleChange("contactInfo")(e.target.value)}
              style={{
                ...inputStyle,
                minHeight: "80px",
                resize: "vertical",
              }}
              placeholder={"e.g.\n(555) 123-4567\nrent@sunrisepm.com"}
            />
          </div>

          <div style={{ display: "flex", gap: "0.75rem" }}>
            <div style={{ flex: 1 }}>
              <label
                style={{
                  display: "block",
                  fontSize: "0.9rem",
                  marginBottom: "0.25rem",
                }}
              >
                Default due day (1–31)
              </label>
              <input
                type="number"
                min={1}
                max={31}
                value={settings.defaultDueDay ?? ""}
                onChange={(e) => handleChange("defaultDueDay")(e.target.value)}
                style={inputStyle}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label
                style={{
                  display: "block",
                  fontSize: "0.9rem",
                  marginBottom: "0.25rem",
                }}
              >
                Default flat late fee
              </label>
              <input
                type="number"
                min={0}
                value={settings.defaultLateFeeFlat ?? ""}
                onChange={(e) =>
                  handleChange("defaultLateFeeFlat")(e.target.value)
                }
                style={inputStyle}
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          style={{
            marginTop: "1rem",
            width: "100%",
            padding: "0.7rem 1rem",
            borderRadius: "0.75rem",
            border: "none",
            fontWeight: 600,
            fontSize: "0.95rem",
            cursor: saving ? "wait" : "pointer",
            background: saving
              ? "#4b5563"
              : "linear-gradient(135deg, #22c55e, #16a34a)",
            color: "#020617",
          }}
        >
          {saving ? "Saving..." : "Save settings"}
        </button>

        {status && (
          <p
            style={{
              marginTop: "0.75rem",
              fontSize: "0.85rem",
              color: status === "Saved" ? "#4ade80" : "#f97373",
            }}
          >
            {status}
          </p>
        )}
      </form>
    </div>
  );
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "0.6rem 0.75rem",
  borderRadius: "0.6rem",
  border: "1px solid #374151",
  background: "#020617",
  color: "#e5e7eb",
  fontSize: "0.9rem",
};

export default SettingsPage;
