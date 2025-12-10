import type React from "react";

type NoticePreviewProps = {
  text: string | null;
};

const NoticePreview: React.FC<NoticePreviewProps> = ({ text }) => {
  return (
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
      {text ? (
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
              fontFamily:
                "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
            }}
          >
            {text}
          </pre>
        </>
      ) : (
        <p style={{ fontSize: "0.9rem", color: "#9ca3af" }}>
          Click &quot;Generate notice&quot; next to a tenant to see a draft late
          rent letter here.
        </p>
      )}
    </div>
  );
};

export default NoticePreview;
