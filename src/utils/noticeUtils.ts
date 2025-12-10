import type { Tenant } from "../types/tenant";
import type { OwnerSettings } from "../types/ownerSettings";

export type NoticeEditableSections = {
  intro?: string;
  paymentInstructions?: string;
  extraNotes?: string;
};

export type NoticeValidationResult = {
  blocking: string[];
  warn: string[];
};

export const validateNoticeInputs = (
  tenant: Tenant,
  ownerSettings: OwnerSettings
): NoticeValidationResult => {
  const blocking: string[] = [];
  const warn: string[] = [];

  if (!tenant.name) blocking.push("Tenant name is missing.");
  if (!tenant.rent || tenant.rent <= 0)
    blocking.push("Tenant rent amount is missing or invalid.");
  if (!tenant.dueDay) blocking.push("Tenant rent due day is missing.");
  if (!ownerSettings.businessName)
    blocking.push("Your business/management name is missing in Settings.");
  if (!ownerSettings.contactInfo)
    blocking.push("Your contact info is missing in Settings.");

  if (!tenant.email)
    warn.push(
      "Tenant email is missing. You will not be able to send this notice by email until it is added."
    );
  if (!tenant.unit)
    warn.push("Tenant unit is blank. Consider adding it for clarity.");

  return { blocking, warn };
};

export const buildNoticeText = (
  tenant: Tenant,
  ownerSettings: OwnerSettings,
  editable: NoticeEditableSections
): string => {
  const today = new Date();
  const month = today.toLocaleString("default", { month: "long" });
  const day = today.getDate();
  const year = today.getFullYear();

  const base = tenant.rent;
  const lateFee = tenant.lateFeeFlat || 0;
  const total = base + lateFee;

  const businessName =
    ownerSettings.businessName || "[Your Company Name]";
  const contactInfo =
    ownerSettings.contactInfo || "[Your Contact Info]";

  const intro = editable.intro?.trim()
    ? editable.intro.trim() + "\n\n"
    : "";

  const paymentInstructions = editable.paymentInstructions?.trim()
    ? editable.paymentInstructions.trim() + "\n\n"
    : "";

  const extraNotes = editable.extraNotes?.trim()
    ? editable.extraNotes.trim() + "\n\n"
    : "";

  return `
${month} ${day}, ${year}

${tenant.name}
${tenant.unit ? `Unit ${tenant.unit}\n` : ""}

RE: Late Rent Notice

${intro}Dear ${tenant.name},

Our records indicate that your rent for ${
    tenant.unit ? `Unit ${tenant.unit} ` : ""
  }in the amount of $${base.toFixed(
    2
  )} was due on the ${tenant.dueDay} of this month and has not yet been received.

In accordance with the terms of your lease, a late fee of $${lateFee.toFixed(
    2
  )} has been applied, bringing your total amount due to $${total.toFixed(2)}.

${paymentInstructions}Please pay the total amount due immediately to avoid further action.

If you believe you have received this notice in error, please contact management as soon as possible.

${extraNotes}Sincerely,
${businessName}
${contactInfo}
`.trim();
};
