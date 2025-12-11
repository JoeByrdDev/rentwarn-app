import type React from "react";
import { useState, useEffect } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { useNavigate, Link } from "react-router-dom";
import { auth, useAuth  } from "../auth/AuthContext";

const SignupPage: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      navigate("/dashboard", { replace: true });
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await createUserWithEmailAndPassword(auth, email, password);
      navigate("/dashboard");
    } catch (err) {
      console.error(err);
      setError("Could not create account. Try a different email.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0f172a",
        color: "#e5e7eb",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1.5rem",
      }}
    >
      <div
        style={{
          maxWidth: "400px",
          width: "100%",
          background: "#020617",
          borderRadius: "0.9rem",
          padding: "1.75rem",
          border: "1px solid #1f2937",
          boxShadow: "0 20px 40px rgba(0,0,0,0.5)",
        }}
      >
        <h1 style={{ fontSize: "1.5rem", marginBottom: "0.75rem" }}>Sign up</h1>
        <p style={{ fontSize: "0.9rem", color: "#9ca3af", marginBottom: "1.25rem" }}>
          Create a RentWarn account to manage your late rent notices.
        </p>

        <form onSubmit={handleSubmit}>
          <div style={{ display: "grid", gap: "0.75rem" }}>
            <input
              type="email"
              required
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={inputStyle}
            />
            <input
              type="password"
              required
              placeholder="Password (min 6 chars)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={inputStyle}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: "1rem",
              width: "100%",
              padding: "0.7rem 1rem",
              borderRadius: "0.75rem",
              border: "none",
              fontWeight: 600,
              fontSize: "0.95rem",
              cursor: loading ? "wait" : "pointer",
              background: loading
                ? "#4b5563"
                : "linear-gradient(135deg, #22c55e, #16a34a)",
              color: "#020617",
            }}
          >
            {loading ? "Creating account..." : "Sign up"}
          </button>
        </form>

        {error && (
          <p
            style={{
              marginTop: "0.75rem",
              fontSize: "0.85rem",
              color: "#f97373",
            }}
          >
            {error}
          </p>
        )}

        <p
          style={{
            marginTop: "1rem",
            fontSize: "0.85rem",
            color: "#9ca3af",
          }}
        >
          Already have an account?{" "}
          <Link to="/login" style={{ color: "#4ade80" }}>
            Log in
          </Link>
        </p>
      </div>
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

export default SignupPage;
