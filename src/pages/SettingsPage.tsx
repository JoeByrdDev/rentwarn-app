// src/pages/SettingsPage.tsx
import type React from "react";
import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import type { OwnerSettings } from "../types/ownerSettings";
import { ownerService } from "../services/ownerService";

const SettingsPage: React.FC = () => {
  const { user, loading: authLoading } = useAuth();

  const [settings, setSettings] = useState<OwnerSettings>({
    businessName: "",
    contactInfo: "",
    defaultDueDay: null,
    defaultLateFeeFlat: null,
  });
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setSettingsLoading(false);
      return;
    }

    const fetchSettings = async () => {
      setSettingsLoading(true);
      try {
        const s = await ownerService.getOwnerSettings(user.uid);
        setSettings(s);
      } catch (err) {
        console.error("Error loading owner settings", err);
      } finally {
        setSettingsLoading(false);
      }
    };

    void fetchSettings();
  }, [authLoading, user]);
  

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

  // While auth is still initializing, don't render anything different
  // (your app-level wrapper can handle a global loader if you want)
  if (authLoading || settingsLoading) {
    return null;
  }

  // If this route isn't supposed to be visible while logged out,
  // you can hard-redirect:
  if (!user) {
    return <Navigate to="/login" replace />;
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
        {settingsLoading ? (
          // 🔹 Inner loading state – layout stays stable
          <p>Loading settings...</p>
        ) : (
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
                onChange={(e) =>
                  handleChange("businessName")(e.target.value)
                }
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
                  onChange={(e) =>
                    handleChange("defaultDueDay")(e.target.value)
                  }
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
        )}

        <button
          type="submit"
          disabled={saving || settingsLoading}
          style={{
            marginTop: "1rem",
            width: "100%",
            padding: "0.7rem 1rem",
            borderRadius: "0.75rem",
            border: "none",
            fontWeight: 600,
            fontSize: "0.95rem",
            cursor: saving || settingsLoading ? "wait" : "pointer",
            background:
              saving || settingsLoading
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
