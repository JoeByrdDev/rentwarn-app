import type React from "react";
import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { db } from "../firebase";
import { doc, getDoc, type DocumentData } from "firebase/firestore";
import { auth } from "../auth/AuthContext";
import type { Tenant } from "../types/tenant";
import type { OwnerSettings } from "../types/ownerSettings";
import { ownerService } from "../services/ownerService";
import { noticeService } from "../services/noticeService";
import { emailQueueService } from "../services/emailQueueService";
import {
  validateNoticeInputs,
  buildNoticeText,
  type NoticeEditableSections,
} from "../utils/noticeUtils";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";


type EditableParts = NoticeEditableSections;

const NoticeEditorPage: React.FC = () => {
  const { tenantId } = useParams();
  const navigate = useNavigate();

  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [ownerSettings, setOwnerSettings] = useState<OwnerSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [editable, setEditable] = useState<EditableParts>({
    intro: "",
    paymentInstructions:
      "Please remit payment in full to the address or payment method on file immediately.",
    extraNotes: "",
  });

  const [blockingIssues, setBlockingIssues] = useState<string[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [noticeEmail, setNoticeEmail] = useState("");

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      setStatus(null);
      setBlockingIssues([]);
      setWarnings([]);

      const user = auth.currentUser;
      if (!user) {
        setError("You must be logged in to edit notices.");
        setLoading(false);
        return;
      }

      if (!tenantId) {
        setError("No tenant selected.");
        setLoading(false);
        return;
      }

      try {
        // Load tenant directly (we could later move this into tenantService)
        const tenantRef = doc(db, "tenants", tenantId);
        const tenantSnap = await getDoc(tenantRef);

        if (!tenantSnap.exists()) {
          setError("Tenant not found.");
          setLoading(false);
          return;
        }

        const tenantData = tenantSnap.data() as DocumentData;
        if (tenantData.ownerId !== user.uid) {
          setError("You do not have access to this tenant.");
          setLoading(false);
          return;
        }

        const tenantObj: Tenant = {
          id: tenantSnap.id,
          name: tenantData.name ?? "",
          unit: tenantData.unit ?? "",
          email: tenantData.email ?? "",
          rent: Number(tenantData.rent ?? 0),
          dueDay: Number(tenantData.dueDay ?? 1),
          lateFeeFlat: Number(tenantData.lateFeeFlat ?? 0),
        };
        setTenant(tenantObj);
        setNoticeEmail(tenantObj.email || "");

        // Load owner settings via service
        const ownerObj = await ownerService.getOwnerSettings(user.uid);
        setOwnerSettings(ownerObj);

        const { blocking, warn } = validateNoticeInputs(tenantObj, ownerObj);
        setBlockingIssues(blocking);
        setWarnings(warn);
      } catch (err) {
        console.error(err);
        setError("Failed to load notice data.");
      } finally {
        setLoading(false);
      }
    };

    void loadData();
  }, [tenantId]);

  const handleEditableChange =
    (field: keyof EditableParts) =>
    (value: string): void => {
      setEditable((prev) => ({ ...prev, [field]: value }));
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
        <p>Loading notice editor...</p>
      </div>
    );
  }

  if (error || !tenant || !ownerSettings) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#0f172a",
          color: "#e5e7eb",
          padding: "2rem",
        }}
      >
        <p style={{ marginBottom: "1rem", color: "#f97373" }}>
          {error ?? "Unable to load notice editor."}
        </p>
        <button
          type="button"
          onClick={() => navigate("/dashboard")}
          style={backButtonStyle}
        >
          Back to dashboard
        </button>
      </div>
    );
  }

  const noticeText = buildNoticeText(tenant, ownerSettings, editable);

  const handleSaveNotice = async () => {
    setSaving(true);
    setStatus(null);

    const user = auth.currentUser;
    if (!user) {
      setStatus("You must be logged in to save notices.");
      setSaving(false);
      return;
    }

    const { blocking } = validateNoticeInputs(tenant, ownerSettings);
    if (blocking.length > 0) {
      setBlockingIssues(blocking);
      setStatus(
        "Please resolve the required fields before confirming this notice."
      );
      setSaving(false);
      return;
    }

    try {
      const today = new Date();
      const period = `${today.getFullYear()}-${String(
        today.getMonth() + 1
      ).padStart(2, "0")}`;

      const baseAmount = tenant.rent;
      const lateFee = tenant.lateFeeFlat || 0;
      const totalAmount = baseAmount + lateFee;

      await noticeService.logNotice({
        ownerId: user.uid,
        tenantId: tenant.id,
        tenantName: tenant.name,
        unit: tenant.unit,
        baseAmount,
        lateFee,
        totalAmount,
        period,
        text: noticeText,
      });

      setStatus("Notice saved and logged (no email sent).");
    } catch (err) {
      console.error("Failed to save notice", err);
      setStatus("Failed to save notice. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleSendEmail = async () => {
    setSaving(true);
    setStatus(null);

    const user = auth.currentUser;
    if (!user) {
      setStatus("You must be logged in to send notices.");
      setSaving(false);
      return;
    }

    const { blocking } = validateNoticeInputs(tenant, ownerSettings);
    if (blocking.length > 0) {
      setBlockingIssues(blocking);
      setStatus(
        "Please resolve the required fields before sending this notice."
      );
      setSaving(false);
      return;
    }

    if (!noticeEmail) {
      setStatus(
        "Tenant email is missing. Please enter an email address for this notice."
      );
      setSaving(false);
      return;
    }

    try {
      const today = new Date();
      const period = `${today.getFullYear()}-${String(
        today.getMonth() + 1
      ).padStart(2, "0")}`;

      const baseAmount = tenant.rent;
      const lateFee = tenant.lateFeeFlat || 0;
      const totalAmount = baseAmount + lateFee;

      const noticeRef = await noticeService.logNotice({
        ownerId: user.uid,
        tenantId: tenant.id,
        tenantName: tenant.name,
        unit: tenant.unit,
        baseAmount,
        lateFee,
        totalAmount,
        period,
        text: noticeText,
      });

      await emailQueueService.queueNoticeEmail({
        ownerId: user.uid,
        tenantId: tenant.id,
        noticeId: noticeRef.id,
        to: noticeEmail,
        subject: `Late Rent Notice - ${tenant.name}`,
        bodyText: noticeText,
      });

      setStatus(
        "Notice saved, and email queued for sending (backend email sending to be wired)."
      );
    } catch (err) {
      console.error("Failed to queue email", err);
      setStatus("Failed to queue email. Please try again.");
    } finally {
      setSaving(false);
    }
  };
  
    const handleDownloadPdf = async () => {
    try {
      await downloadNoticePdf(noticeText, tenant, ownerSettings);
    } catch (err) {
      console.error("Failed to generate PDF", err);
      setStatus("Failed to generate PDF. Please try again.");
    }
  };


  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0f172a",
        color: "#e5e7eb",
        padding: "2rem",
      }}
    >
      <div
        style={{
          marginBottom: "1rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <h1 style={{ fontSize: "1.8rem", marginBottom: "0.25rem" }}>
            Edit notice
          </h1>
          <p style={{ fontSize: "0.9rem", color: "#9ca3af" }}>
            Review and adjust the editable sections before sending. The legal
            core of the notice is locked.
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate("/dashboard")}
          style={backButtonStyle}
        >
          Back to dashboard
        </button>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.1fr 1.2fr",
          gap: "1.5rem",
          alignItems: "flex-start",
        }}
      >
        {/* Left column: meta + editable fields */}
        <div
          style={{
            background: "#020617",
            borderRadius: "0.75rem",
            padding: "1.25rem",
            border: "1px solid #1f2937",
          }}
        >
          <h2 style={{ fontSize: "1.1rem", marginBottom: "0.75rem" }}>
            Notice details
          </h2>

          <div
            style={{
              fontSize: "0.85rem",
              color: "#9ca3af",
              marginBottom: "0.75rem",
            }}
          >
            <p>
              <strong>Tenant:</strong> {tenant.name}{" "}
              {tenant.unit && `• Unit ${tenant.unit}`}
            </p>
            <p>
              <strong>Rent:</strong> ${tenant.rent.toFixed(2)} due on the{" "}
              {tenant.dueDay} of each month
            </p>
            <p>
              <strong>Late fee:</strong>{" "}
              {tenant.lateFeeFlat
                ? `$${tenant.lateFeeFlat.toFixed(2)}`
                : "No late fee configured"}
            </p>
            <p style={{ marginTop: "0.5rem" }}>
              <strong>From:</strong>{" "}
              {ownerSettings.businessName || "[Your business name]"}
            </p>
          </div>

          <div
            style={{
              marginBottom: "0.75rem",
              fontSize: "0.85rem",
              color: "#e5e7eb",
            }}
          >
            <label
              style={{
                display: "block",
                fontSize: "0.85rem",
                marginBottom: "0.25rem",
              }}
            >
              Tenant email for this notice
            </label>
            <input
              type="email"
              value={noticeEmail}
              onChange={(e) => setNoticeEmail(e.target.value)}
              placeholder="tenant@example.com"
              style={{
                width: "100%",
                padding: "0.6rem 0.75rem",
                borderRadius: "0.6rem",
                border: "1px solid #374151",
                background: "#020617",
                color: "#e5e7eb",
                fontSize: "0.85rem",
              }}
            />
            <p
              style={{
                marginTop: "0.25rem",
                fontSize: "0.75rem",
                color: "#9ca3af",
              }}
            >
              This address will be used when emailing the notice. It does not
              yet update the tenant record.
            </p>
          </div>

          {(blockingIssues.length > 0 || warnings.length > 0) && (
            <div
              style={{
                marginBottom: "0.75rem",
                padding: "0.75rem",
                borderRadius: "0.55rem",
                background: "#111827",
                border: "1px solid #4b5563",
                fontSize: "0.85rem",
              }}
            >
              {blockingIssues.length > 0 && (
                <div style={{ marginBottom: "0.5rem" }}>
                  <strong style={{ color: "#f97373" }}>
                    Required before sending:
                  </strong>
                  <ul style={{ margin: "0.25rem 0 0 1rem", padding: 0 }}>
                    {blockingIssues.map((b) => (
                      <li key={b}>{b}</li>
                    ))}
                  </ul>
                  <p style={{ marginTop: "0.25rem", color: "#9ca3af" }}>
                    Update these in{" "}
                    <Link to="/settings" style={{ color: "#4ade80" }}>
                      Settings
                    </Link>{" "}
                    or on the tenant record in the dashboard.
                  </p>
                </div>
              )}
              {warnings.length > 0 && (
                <div>
                  <strong style={{ color: "#facc15" }}>
                    Recommended to check:
                  </strong>
                  <ul style={{ margin: "0.25rem 0 0 1rem", padding: 0 }}>
                    {warnings.map((w) => (
                      <li key={w}>{w}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          <div style={{ marginTop: "0.75rem" }}>
            <h3
              style={{
                fontSize: "0.95rem",
                marginBottom: "0.5rem",
              }}
            >
              Editable sections
            </h3>
            <p
              style={{
                fontSize: "0.8rem",
                color: "#9ca3af",
                marginBottom: "0.75rem",
              }}
            >
              These parts will be inserted into the notice. Core legal
              paragraphs stay locked so you don&apos;t accidentally change
              required language.
            </p>

            <div style={{ marginBottom: "0.75rem" }}>
              <label
                style={{
                  display: "block",
                  fontSize: "0.85rem",
                  marginBottom: "0.25rem",
                }}
              >
                Optional intro paragraph
              </label>
              <textarea
                value={editable.intro ?? ""}
                onChange={(e) =>
                  handleEditableChange("intro")(e.target.value)
                }
                style={textareaStyle}
                placeholder="E.g. 'This letter is to formally notify you that your rent payment is past due.'"
              />
            </div>

            <div style={{ marginBottom: "0.75rem" }}>
              <label
                style={{
                  display: "block",
                  fontSize: "0.85rem",
                  marginBottom: "0.25rem",
                }}
              >
                Payment instructions
              </label>
              <textarea
                value={editable.paymentInstructions ?? ""}
                onChange={(e) =>
                  handleEditableChange("paymentInstructions")(e.target.value)
                }
                style={textareaStyle}
              />
            </div>

            <div style={{ marginBottom: "0.75rem" }}>
              <label
                style={{
                  display: "block",
                  fontSize: "0.85rem",
                  marginBottom: "0.25rem",
                }}
              >
                Extra notes (optional)
              </label>
              <textarea
                value={editable.extraNotes ?? ""}
                onChange={(e) =>
                  handleEditableChange("extraNotes")(e.target.value)
                }
                style={textareaStyle}
                placeholder="E.g. 'If you have already made this payment, please disregard this notice and contact us to confirm.'"
              />
            </div>

            <button
              type="button"
              disabled={saving}
              onClick={handleSaveNotice}
              style={{
                marginTop: "0.5rem",
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
              {saving ? "Saving..." : "Confirm notice (log only)"}
            </button>

            <button
              type="button"
              disabled={saving}
              onClick={handleSendEmail}
              style={{
                marginTop: "0.5rem",
                width: "100%",
                padding: "0.7rem 1rem",
                borderRadius: "0.75rem",
                border: "1px solid #4ade80",
                fontWeight: 600,
                fontSize: "0.95rem",
                cursor: saving ? "wait" : "pointer",
                background: "#020617",
                color: "#4ade80",
              }}
            >

              {saving ? "Saving..." : "Save & queue email"}
            </button>
			
			<button
              type="button"
              onClick={handleDownloadPdf}
              style={{
                marginTop: "0.5rem",
                width: "100%",
                padding: "0.7rem 1rem",
                borderRadius: "0.75rem",
                border: "1px solid #374151",
                fontWeight: 500,
                fontSize: "0.9rem",
                cursor: "pointer",
                background: "#020617",
                color: "#e5e7eb",
              }}
            >
              Download PDF
            </button>

            {status && (
              <p
                style={{
                  marginTop: "0.5rem",
                  fontSize: "0.85rem",
                  color: status.startsWith("Failed") ? "#f97373" : "#4ade80",
                }}
              >
                {status}
              </p>
            )}
          </div>
        </div>

        {/* Right column: final preview */}
        <div
          style={{
            background: "#020617",
            borderRadius: "0.75rem",
            padding: "1.25rem",
            border: "1px solid #1f2937",
          }}
        >
          <h2 style={{ fontSize: "1.1rem", marginBottom: "0.75rem" }}>
            Final preview
          </h2>
          <p
            style={{
              fontSize: "0.85rem",
              color: "#9ca3af",
              marginBottom: "0.75rem",
            }}
          >
            This is what will be saved and, later, emailed or printed. Locked
            sections cannot be edited here.
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
                "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', monospace",
            }}
          >
            {noticeText}
          </pre>

          <p
            style={{
              marginTop: "0.75rem",
              fontSize: "0.8rem",
              color: "#6b7280",
            }}
          >
            Email sending will be handled by a backend connected to this
            account&apos;s email queue.
          </p>
        </div>
      </div>
    </div>
  );
};

const downloadNoticePdf = async (
  noticeText: string,
  tenant: Tenant,
  ownerSettings: OwnerSettings
): Promise<void> => {
  const pdfDoc = await PDFDocument.create();
  let page = pdfDoc.addPage();

  const { width, height } = page.getSize();
  const margin = 50;
  const contentWidth = width - margin * 2;

  const fontSize = 12;
  const lineHeight = fontSize * 1.4;

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const titleFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const textColor = rgb(0.1, 0.1, 0.1); // dark grey, close to black

  let y = height - margin;

  // Helper to add a new page when we run out of space
  const ensureSpace = (linesNeeded = 1) => {
    if (y - lineHeight * linesNeeded < margin) {
      page = pdfDoc.addPage();
      y = height - margin;
    }
  };

  // Draw title
  const title = "Late Rent Notice";
  const titleWidth = titleFont.widthOfTextAtSize(title, 18);
  page.drawText(title, {
    x: margin + (contentWidth - titleWidth) / 2,
    y,
    size: 18,
    font: titleFont,
    color: textColor,
  });

  y -= lineHeight * 2;

  // Header lines (landlord + tenant info)
  const headerLines = [
    ownerSettings.businessName || "[Your Company Name]",
    ownerSettings.contactInfo || "[Your Contact Info]",
    "",
    `Tenant: ${tenant.name}`,
    tenant.unit ? `Unit: ${tenant.unit}` : "",
  ].filter(Boolean);

  headerLines.forEach((line) => {
    ensureSpace();
    page.drawText(line, {
      x: margin,
      y,
      size: fontSize,
      font,
      color: textColor,
    });
    y -= lineHeight;
  });

  y -= lineHeight; // extra space before body

  // Word-wrap a single line of text to fit contentWidth
  const drawWrappedLine = (line: string) => {
    let remaining = line.trim();

    while (remaining.length > 0) {
      ensureSpace();

      // If line fits as-is, draw and break
      let idx = remaining.length;
      let slice = remaining;

      while (
        font.widthOfTextAtSize(slice, fontSize) > contentWidth &&
        idx > 0
      ) {
        const lastSpace = remaining.lastIndexOf(" ", idx - 1);
        if (lastSpace === -1) {
          // No spaces, hard-break
          idx = Math.max(1, idx - 1);
        } else {
          idx = lastSpace;
        }
        slice = remaining.slice(0, idx);
      }

      const toDraw = slice.trim();
      if (toDraw.length === 0) {
        // Avoid infinite loops on weird whitespace
        break;
      }

      page.drawText(toDraw, {
        x: margin,
        y,
        size: fontSize,
        font,
        color: textColor,
      });

      y -= lineHeight;
      remaining = remaining.slice(slice.length).trimStart();
    }
  };

  // Respect existing newlines from noticeText
  // Blank lines become vertical space, non-blank lines are wrapped
  const lines = noticeText.split("\n");
  lines.forEach((line) => {
    if (line.trim() === "") {
      // Blank line -> extra vertical space
      ensureSpace();
      y -= lineHeight;
    } else {
      drawWrappedLine(line);
    }
  });

  const pdfBytes = await pdfDoc.save();

  const blob = new Blob([pdfBytes as any], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  const safeTenantName = tenant.name.replace(/[^a-z0-9]+/gi, "_");
  link.href = url;
  link.download = `rent_notice_${safeTenantName}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};



const backButtonStyle: React.CSSProperties = {
  padding: "0.5rem 0.9rem",
  borderRadius: "0.6rem",
  border: "1px solid #374151",
  background: "#020617",
  color: "#e5e7eb",
  fontSize: "0.85rem",
  cursor: "pointer",
};

const textareaStyle: React.CSSProperties = {
  width: "100%",
  minHeight: "70px",
  padding: "0.6rem 0.75rem",
  borderRadius: "0.6rem",
  border: "1px solid #374151",
  background: "#020617",
  color: "#e5e7eb",
  fontSize: "0.85rem",
  resize: "vertical",
};

export default NoticeEditorPage;
