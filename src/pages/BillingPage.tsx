import type React from "react";

const CHECKOUT_URL = ""; // TODO: paste your Stripe Checkout URL here when ready

const BillingPage: React.FC = () => {
  const handleSubscribeClick = () => {
    if (!CHECKOUT_URL) {
      alert(
        "Checkout is not configured yet. Ask your AI boss where to paste the Stripe Checkout URL."
      );
      return;
    }
    window.location.href = CHECKOUT_URL;
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0f172a",
        color: "#e5e7eb",
        padding: "2rem",
        display: "flex",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          maxWidth: "640px",
          width: "100%",
          background: "#020617",
          borderRadius: "1rem",
          padding: "2rem",
          border: "1px solid #1f2937",
          boxShadow: "0 20px 40px rgba(0,0,0,0.6)",
        }}
      >
        <h1 style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>
          Billing & Plans
        </h1>
        <p style={{ color: "#9ca3af", marginBottom: "1.5rem" }}>
          RentWarn is currently in early access. Early users get a discounted
          rate and direct influence on what we build next.
        </p>

        <div
          style={{
            borderRadius: "0.9rem",
            padding: "1.5rem",
            border: "1px solid #1f2937",
            background:
              "radial-gradient(circle at top left, #22c55e22, #020617)",
          }}
        >
          <h2 style={{ fontSize: "1.3rem", marginBottom: "0.5rem" }}>
            Early Access
          </h2>
          <p style={{ fontSize: "0.95rem", color: "#9ca3af", marginBottom: "1rem" }}>
            For small landlords and property managers handling up to ~150 units.
          </p>

          <p style={{ fontSize: "2rem", fontWeight: 600, marginBottom: "0.25rem" }}>
            $19<span style={{ fontSize: "1rem", color: "#9ca3af" }}>/month</span>
          </p>
          <p style={{ fontSize: "0.85rem", color: "#9ca3af", marginBottom: "1rem" }}>
            Early access price. Planned full price: <s>$39/mo</s>.
          </p>

          <ul
            style={{
              listStyle: "none",
              padding: 0,
              marginBottom: "1.25rem",
              fontSize: "0.9rem",
              color: "#d1d5db",
            }}
          >
            <li>• Unlimited tenants</li>
            <li>• CSV import</li>
            <li>• Late rent detection</li>
            <li>• Notice generator with your branding</li>
            <li>• Priority support during early access</li>
          </ul>

          <button
            type="button"
            onClick={handleSubscribeClick}
            style={{
              width: "100%",
              padding: "0.8rem 1rem",
              borderRadius: "0.8rem",
              border: "none",
              fontWeight: 600,
              fontSize: "0.95rem",
              cursor: "pointer",
              background: "linear-gradient(135deg, #22c55e, #16a34a)",
              color: "#020617",
              marginBottom: "0.75rem",
            }}
          >
            Start subscription
          </button>

          {!CHECKOUT_URL && (
            <p
              style={{
                fontSize: "0.8rem",
                color: "#f97373",
                marginTop: "0.25rem",
              }}
            >
              Checkout URL not configured yet. This is just a placeholder until
              Stripe is wired in.
            </p>
          )}
        </div>

        <p
          style={{
            marginTop: "1rem",
            fontSize: "0.8rem",
            color: "#6b7280",
          }}
        >
          You can cancel anytime via Stripe customer portal (we&apos;ll link it
          here once configured).
        </p>
      </div>
    </div>
  );
};

export default BillingPage;
