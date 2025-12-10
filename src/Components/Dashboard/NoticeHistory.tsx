import type React from "react";
import { useEffect, useState } from "react";
/*
import { db } from "../../firebase";
import {
  collection,
  getDocs,
  query,
  where,
  type QueryDocumentSnapshot,
  type DocumentData,
} from "firebase/firestore";
*/
import { auth } from "../../auth/AuthContext";
import { noticeService } from "../../services/noticeService";


type Notice = {
  id: string;
  tenantName: string;
  unit: string;
  period: string | null;
  totalAmount: number | null;
  createdAt: Date | null;
};

const NoticeHistory: React.FC = () => {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNotices = async () => {
  const user = auth.currentUser;
  if (!user) {
    setLoading(false);
    return;
  }

  try {
    const items = await noticeService.getNoticesForOwner(user.uid);
    setNotices(items);
  } catch (err) {
    console.error("Failed to load notices", err);
    setNotices([]);
  } finally {
    setLoading(false);
  }
};


    void fetchNotices();
  }, []);

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
        Notice history
      </h2>

      {loading ? (
        <p style={{ fontSize: "0.9rem", color: "#9ca3af" }}>
          Loading notices...
        </p>
      ) : notices.length === 0 ? (
        <p style={{ fontSize: "0.9rem", color: "#9ca3af" }}>
          No notices generated yet. Click &quot;Generate notice&quot; for a
          tenant to log it here.
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
                <th style={thStyle}>Date</th>
                <th style={thStyle}>Tenant</th>
                <th style={thStyle}>Unit</th>
                <th style={thStyle}>Period</th>
                <th style={thStyle}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {notices.map((n) => (
                <tr key={n.id}>
                  <td style={tdStyle}>
                    {n.createdAt
                      ? n.createdAt.toLocaleDateString()
                      : "-"}
                  </td>
                  <td style={tdStyle}>{n.tenantName}</td>
                  <td style={tdStyle}>{n.unit || "-"}</td>
                  <td style={tdStyle}>{n.period || "-"}</td>
                  <td style={tdStyle}>
                    {n.totalAmount != null ? `$${n.totalAmount.toFixed(2)}` : "-"}
                  </td>
                </tr>
              ))}
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

export default NoticeHistory;
