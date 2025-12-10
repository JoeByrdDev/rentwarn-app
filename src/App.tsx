import type React from "react";
import type { CSSProperties, FormEvent } from "react";
import { useState } from "react";
import { Routes, Route, Link } from "react-router-dom";
import { db } from "./firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import Dashboard from "./pages/Dashboard";

const App: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/dashboard" element={<Dashboard />} />
    </Routes>
  );
};

const LandingPage: React.FC = () => {
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [units, setUnits] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">(
    "idle"
  );
  const [error, setError] = useState("");

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!email) return;

    setStatus("loading");
    setError("");

    try {
      await addDoc(collection(db, "waitlist"), {
        email,
        company,
        units,
        createdAt: serverTimestamp(),
      });
      setStatus("success");
      setEmail("");
      setCompany("");
      setUnits("");
    } catch (err) {
      console.error(err);
      setStatus("error");
      setError("Something went wrong. Please try again.");
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "#0f172a",
        color: "#e5e7eb",
        padding: "1.5rem",
      }}
    >
      <div
        style={{
          maxWidth: "720px",
          width: "100%",
          background: "#020617",
          borderRadius: "1rem",
          padding: "2rem",
          boxShadow: "0 20px 40px rgba(0,0,0,0.6)",
          border: "1px solid #1f2937",
        }}
      >
        <div style={{ marginBottom: "1.5rem" }}>
          <span
            style={{
              fontSize: "0.85rem",
              padding: "0.2rem 0.6rem",
              borderRadius: "999px",
              border: "1px solid #374151",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: "#9ca3af",
            }}
          >
            For small landlords & property managers
          </span>
        </div>

        <h1
          style={{
            fontSize: "2rem",
            lineHeight: 1.2,
            marginBottom: "0.75rem",
          }}
        >
          Stop chasing late rent manually.
        </h1>
        <h2
          style={{
            fontSize: "1.1rem",
            color: "#9ca3af",
            marginBottom: "1.5rem",
          }}
        >
          RentWarn automatically tracks due dates, flags who&apos;s late, and
          generates ready-to-send late rent notices with fees calculated for
          you.
        </h2>

        <ul
          style={{
            listStyle: "none",
            padding: 0,
            marginBottom: "1.5rem",
            color: "#9ca3af",
            fontSize: "0.95rem",
          }}
        >
          <li>• Upload a simple tenant list (CSV or manual)</li>
          <li>• See who&apos;s late at a glance</li>
          <li>• One click to generate and send notices</li>
          <li>• Keep a clear log for disputes and court</li>
        </ul>

        <div
          style={{
            padding: "1rem",
            borderRadius: "0.75rem",
            background: "#111827",
            border: "1px solid #1f2937",
            marginBottom: "1.5rem",
            fontSize: "0.9rem",
          }}
        >
          <strong>Early access list:</strong> We&apos;re opening spots for a
          small group of early users. You get{" "}
          <strong>50% off for the first 6 months</strong> and direct input into
          the product.
        </div>

        <form onSubmit={handleSubmit}>
          <div
            style={{
              display: "grid",
              gap: "0.75rem",
              marginBottom: "1rem",
            }}
          >
            <input
              type="email"
              required
              placeholder="Work email (required)"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={inputStyle}
            />
            <input
              type="text"
              placeholder="Company / portfolio name (optional)"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              style={inputStyle}
            />
            <input
              type="number"
              min={1}
              placeholder="# of units you manage (optional)"
              value={units}
              onChange={(e) => setUnits(e.target.value)}
              style={inputStyle}
            />
          </div>

          <button
            type="submit"
            disabled={status === "loading"}
            style={{
              width: "100%",
              padding: "0.75rem 1rem",
              borderRadius: "0.75rem",
              border: "none",
              fontWeight: 600,
              fontSize: "0.95rem",
              cursor: status === "loading" ? "wait" : "pointer",
              background:
                status === "loading"
                  ? "#4b5563"
                  : "linear-gradient(135deg, #22c55e, #16a34a)",
              color: "#020617",
            }}
          >
            {status === "loading"
              ? "Adding you to the list..."
              : "Join the early access list"}
          </button>
        </form>

        {status === "success" && (
          <p
            style={{
              marginTop: "0.75rem",
              fontSize: "0.9rem",
              color: "#4ade80",
            }}
          >
            You&apos;re in. We&apos;ll email you when we&apos;re ready for early
            access.
          </p>
        )}

        {status === "error" && (
          <p
            style={{
              marginTop: "0.75rem",
              fontSize: "0.9rem",
              color: "#f97373",
            }}
          >
            {error}
          </p>
        )}

        <p
          style={{
            marginTop: "1.5rem",
            fontSize: "0.8rem",
            color: "#6b7280",
          }}
        >
          Built for small landlords and property managers who are tired of
          spreadsheets and chasing checks. No spam. No sharing your email.
        </p>

        <p style={{ marginTop: "2rem", fontSize: "0.85rem" }}>
          <Link to="/dashboard" style={{ color: "#4ade80" }}>
            Go to dashboard (dev only)
          </Link>
        </p>
      </div>
    </div>
  );
};

const inputStyle: CSSProperties = {
  width: "100%",
  padding: "0.6rem 0.75rem",
  borderRadius: "0.6rem",
  border: "1px solid #374151",
  background: "#020617",
  color: "#e5e7eb",
  fontSize: "0.9rem",
};

export default App;
