import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { CONSENT_TEXT } from "./types";

export interface CertificateDetails {
  certificateId: string;
  contractTitle: string;
  signerName: string;
  signerEmail: string;
  /** e.g. "Managing Member" — shown on the provider's counter-signature. */
  signerTitle?: string | null;
  /** e.g. "JMC Companies LLC" — shown when signing on behalf of an entity. */
  signerOrg?: string | null;
  signedAtIso: string;
  signerIp: string;
  signerUserAgent: string;
  originalFileHash: string;
  /** PNG data URL of a drawn signature; if absent, the typed name is rendered. */
  signatureDataUrl?: string | null;
}

const INK = rgb(0.1, 0.1, 0.12);
const MUTED = rgb(0.45, 0.45, 0.5);
const ACCENT = rgb(0.42, 0.27, 0.76); // violet, matches brand

/**
 * Appends a tamper-evident Signature Certificate page to the PDF and returns
 * the signed document bytes. The caller hashes the result for the audit record.
 */
export async function stampSignatureCertificate(
  originalPdf: Uint8Array,
  details: CertificateDetails
): Promise<Uint8Array> {
  const doc = await PDFDocument.load(originalPdf);
  const helv = await doc.embedFont(StandardFonts.Helvetica);
  const helvBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const helvOblique = await doc.embedFont(StandardFonts.HelveticaOblique);

  // Letter-size certificate page regardless of source page size
  const page = doc.addPage([612, 792]);
  const left = 64;
  const width = 612 - left * 2;
  let y = 792 - 72;

  const line = (
    text: string,
    opts: { font?: typeof helv; size?: number; color?: typeof INK; gap?: number } = {}
  ) => {
    const { font = helv, size = 10, color = INK, gap = 16 } = opts;
    page.drawText(text, { x: left, y, font, size, color });
    y -= gap;
  };

  const field = (label: string, value: string) => {
    page.drawText(label.toUpperCase(), { x: left, y, font: helvBold, size: 7.5, color: MUTED });
    y -= 13;
    // wrap long values
    const maxChars = 86;
    for (let i = 0; i < value.length; i += maxChars) {
      page.drawText(value.slice(i, i + maxChars), { x: left, y, font: helv, size: 10, color: INK });
      y -= 14;
    }
    y -= 6;
  };

  // Header
  page.drawText("Signature Certificate", { x: left, y, font: helvBold, size: 22, color: INK });
  y -= 20;
  line("Triple 3 Labs — Electronic Signature Record", { color: ACCENT, size: 10, gap: 10 });
  page.drawLine({
    start: { x: left, y },
    end: { x: left + width, y },
    thickness: 1,
    color: ACCENT,
  });
  y -= 28;

  field("Document", details.contractTitle);
  field("Certificate ID", details.certificateId);
  field("Signer", `${details.signerName} <${details.signerEmail}>`);
  if (details.signerTitle || details.signerOrg) {
    field(
      "Signing as",
      [details.signerTitle, details.signerOrg].filter(Boolean).join(", ")
    );
  }
  field("Signed at (UTC)", details.signedAtIso);
  field("IP address", details.signerIp);
  field("Browser", details.signerUserAgent.slice(0, 160));
  field("Original document SHA-256", details.originalFileHash);

  // Signature block
  y -= 8;
  page.drawText("SIGNATURE", { x: left, y, font: helvBold, size: 7.5, color: MUTED });
  y -= 8;

  const sigBoxTop = y;
  const sigBoxHeight = 90;
  page.drawRectangle({
    x: left,
    y: sigBoxTop - sigBoxHeight,
    width,
    height: sigBoxHeight,
    borderColor: MUTED,
    borderWidth: 0.75,
  });

  let drewImage = false;
  if (details.signatureDataUrl?.startsWith("data:image/png;base64,")) {
    try {
      const pngBytes = Buffer.from(
        details.signatureDataUrl.replace("data:image/png;base64,", ""),
        "base64"
      );
      const png = await doc.embedPng(pngBytes);
      const maxW = width - 32;
      const maxH = sigBoxHeight - 20;
      const scale = Math.min(maxW / png.width, maxH / png.height, 1);
      page.drawImage(png, {
        x: left + 16,
        y: sigBoxTop - sigBoxHeight + (sigBoxHeight - png.height * scale) / 2,
        width: png.width * scale,
        height: png.height * scale,
      });
      drewImage = true;
    } catch {
      // fall through to typed signature
    }
  }
  if (!drewImage) {
    page.drawText(details.signerName, {
      x: left + 24,
      y: sigBoxTop - sigBoxHeight / 2 - 10,
      font: helvOblique,
      size: 28,
      color: INK,
    });
  }
  y = sigBoxTop - sigBoxHeight - 24;

  // Consent statement
  page.drawText("ELECTRONIC SIGNATURE CONSENT", { x: left, y, font: helvBold, size: 7.5, color: MUTED });
  y -= 14;
  const words = CONSENT_TEXT.split(" ");
  let current = "";
  for (const w of words) {
    if ((current + " " + w).length > 92) {
      line(current, { size: 9, gap: 12, color: INK });
      current = w;
    } else {
      current = current ? current + " " + w : w;
    }
  }
  if (current) line(current, { size: 9, gap: 12, color: INK });

  y -= 12;
  line(
    "The SHA-256 hash above uniquely identifies the document as presented to the signer. " ,
    { size: 8, color: MUTED, gap: 11 }
  );
  line(
    "Any alteration to the document after signing will produce a different hash.",
    { size: 8, color: MUTED, gap: 11 }
  );

  return doc.save();
}
