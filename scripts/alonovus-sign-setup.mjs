// AloNovus Corp. — Website-Recreation Skill license e-sign setup, headless (LIVE CRM/Supabase).
//
// Adapted verbatim from scripts/radiantshine-sign-setup.mjs. Produces a client
// signing link WITHOUT the CRM emailing Michael, so we send it with our own context
// alongside the ACH payment link. Steps:
//   1. Upload the final PDF to the `contracts` storage bucket.
//   2. Create the contract row (mime application/pdf — required by the e-sign flow).
//   3. Counter-sign as JMC (provider) — appends the provider certificate page,
//      using a verbatim port of src/lib/esign/pdf.ts stampSignatureCertificate
//      (that file only depends on pdf-lib, so it ports cleanly to plain JS).
//   4. Mint the client signing token and print the /sign/<token> URL. No email.
//
// NO AUTO PAYMENT LINK: account.setup_fee_cents is 0 for this account, so the /sign
// completion path won't mint a setup-fee link. This is a one-time $10,000 license;
// collection is the manual ACH link (buy.stripe.com/...). On completion Michael
// still gets his executed copy by email.
//
// Idempotent: reuses an existing contract row / provider signature; each run mints
// a fresh client link and cancels prior pending client links.
//
// Usage:  node scripts/alonovus-sign-setup.mjs /abs/path/to/agreement.pdf

import { readFileSync } from "node:fs";
import { basename, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash, randomBytes } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
for (const line of readFileSync(join(repoRoot, ".env.local"), "utf8").split("\n")) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
}
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const SITE = (process.env.NEXT_PUBLIC_SITE_URL || "https://triple3labs.io").replace(/\/$/, "");

// ── Deal constants ──────────────────────────────────────────────────────────
const ACCOUNT_ID = "22182458-07b7-41b4-8416-663ea6cc9329";
const CONTRACT_TITLE = "Website-Recreation Skill License Agreement";
const PROVIDER_ORG = "JMC Companies LLC";
const PROVIDER_SIGNER = { name: "Jeff Conn", title: "Managing Member", email: "jconn333@gmail.com" };
const CLIENT_SIGNER = { name: "Michael Mast", email: "mlmast@alonovus.com" };
const EXPIRES_DAYS = 30;
const CONSENT_TEXT =
  "I agree to conduct this transaction electronically and to be legally bound by my " +
  "electronic signature, which I intend to serve as my signature on this document, " +
  "pursuant to the U.S. ESIGN Act and applicable state law (UETA).";

const sha256Hex = (data) => createHash("sha256").update(data).digest("hex");

// ── Verbatim port of src/lib/esign/pdf.ts stampSignatureCertificate ──────────
const INK = rgb(0.1, 0.1, 0.12);
const MUTED = rgb(0.45, 0.45, 0.5);
const ACCENT = rgb(0.42, 0.27, 0.76);

async function stampSignatureCertificate(originalPdf, details) {
  const doc = await PDFDocument.load(originalPdf);
  const helv = await doc.embedFont(StandardFonts.Helvetica);
  const helvBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const helvOblique = await doc.embedFont(StandardFonts.HelveticaOblique);

  const page = doc.addPage([612, 792]);
  const left = 64;
  const width = 612 - left * 2;
  let y = 792 - 72;

  const line = (text, opts = {}) => {
    const { font = helv, size = 10, color = INK, gap = 16 } = opts;
    page.drawText(text, { x: left, y, font, size, color });
    y -= gap;
  };
  const field = (label, value) => {
    page.drawText(label.toUpperCase(), { x: left, y, font: helvBold, size: 7.5, color: MUTED });
    y -= 13;
    const maxChars = 86;
    for (let i = 0; i < value.length; i += maxChars) {
      page.drawText(value.slice(i, i + maxChars), { x: left, y, font: helv, size: 10, color: INK });
      y -= 14;
    }
    y -= 6;
  };

  page.drawText("Signature Certificate", { x: left, y, font: helvBold, size: 22, color: INK });
  y -= 20;
  line("Triple 3 Labs — Electronic Signature Record", { color: ACCENT, size: 10, gap: 10 });
  page.drawLine({ start: { x: left, y }, end: { x: left + width, y }, thickness: 1, color: ACCENT });
  y -= 28;

  field("Document", details.contractTitle);
  field("Certificate ID", details.certificateId);
  field("Signer", `${details.signerName} <${details.signerEmail}>`);
  if (details.signerTitle || details.signerOrg) {
    field("Signing as", [details.signerTitle, details.signerOrg].filter(Boolean).join(", "));
  }
  field("Signed at (UTC)", details.signedAtIso);
  field("IP address", details.signerIp);
  field("Browser", details.signerUserAgent.slice(0, 160));
  field("Original document SHA-256", details.originalFileHash);

  y -= 8;
  page.drawText("SIGNATURE", { x: left, y, font: helvBold, size: 7.5, color: MUTED });
  y -= 8;
  const sigBoxTop = y;
  const sigBoxHeight = 90;
  page.drawRectangle({ x: left, y: sigBoxTop - sigBoxHeight, width, height: sigBoxHeight, borderColor: MUTED, borderWidth: 0.75 });
  page.drawText(details.signerName, { x: left + 24, y: sigBoxTop - sigBoxHeight / 2 - 10, font: helvOblique, size: 28, color: INK });
  y = sigBoxTop - sigBoxHeight - 24;

  page.drawText("ELECTRONIC SIGNATURE CONSENT", { x: left, y, font: helvBold, size: 7.5, color: MUTED });
  y -= 14;
  const words = CONSENT_TEXT.split(" ");
  let current = "";
  for (const w of words) {
    if ((current + " " + w).length > 92) { line(current, { size: 9, gap: 12, color: INK }); current = w; }
    else { current = current ? current + " " + w : w; }
  }
  if (current) line(current, { size: 9, gap: 12, color: INK });
  y -= 12;
  line("The SHA-256 hash above uniquely identifies the document as presented to the signer. ", { size: 8, color: MUTED, gap: 11 });
  line("Any alteration to the document after signing will produce a different hash.", { size: 8, color: MUTED, gap: 11 });

  return doc.save();
}

async function computeSignedRoles(contractId) {
  const { data } = await db.from("signature_requests").select("signer_role").eq("contract_id", contractId).eq("status", "signed");
  return [...new Set((data ?? []).map((r) => r.signer_role))];
}

async function main() {
  const pdfPath = process.argv[2];
  if (!pdfPath) throw new Error("Pass the absolute path to the agreement PDF");

  const { data: account } = await db.from("accounts").select("id, contact_id, name, setup_fee_cents").eq("id", ACCOUNT_ID).single();
  if (!account) throw new Error("Radiant account not found");

  // 1-2. Contract row + PDF upload (skip if already present)
  let { data: contract } = await db.from("contracts").select("*").eq("account_id", ACCOUNT_ID).eq("title", CONTRACT_TITLE).maybeSingle();
  if (!contract) {
    const bytes = readFileSync(pdfPath);
    const storagePath = `${ACCOUNT_ID}/${crypto.randomUUID()}.pdf`;
    const { error: upErr } = await db.storage.from("contracts").upload(storagePath, bytes, { contentType: "application/pdf", upsert: false });
    if (upErr) throw upErr;
    const ins = await db.from("contracts").insert({
      account_id: ACCOUNT_ID, title: CONTRACT_TITLE,
      description: "Effective Sep 9, 2026. AloNovus Corp. One-time $10,000 exclusive license to the website-recreation skill. Counter-signed by JMC; client link delivered by us (not the CRM).",
      file_path: storagePath, file_name: basename(pdfPath), file_size: bytes.length, mime_type: "application/pdf",
    }).select().single();
    if (ins.error) throw ins.error;
    contract = ins.data;
    await db.from("activities").insert({ account_id: ACCOUNT_ID, contact_id: account.contact_id, type: "contract_uploaded", title: `Contract uploaded: ${CONTRACT_TITLE}`, description: basename(pdfPath) });
    console.log("✓ contract created", contract.id);
  } else {
    console.log("• contract already exists", contract.id, "— reusing");
  }

  // 3. Counter-sign as JMC (provider) if not already
  if (!(await computeSignedRoles(contract.id)).includes("provider")) {
    const { data: provReq, error: prErr } = await db.from("signature_requests").insert({
      contract_id: contract.id, account_id: ACCOUNT_ID, token_hash: null, signer_role: "provider",
      signer_name: PROVIDER_SIGNER.name, signer_email: PROVIDER_SIGNER.email, signer_title: PROVIDER_SIGNER.title,
      status: "pending", expires_at: new Date(Date.now() + 60_000).toISOString(),
    }).select().single();
    if (prErr) throw prErr;

    const { data: blob, error: dlErr } = await db.storage.from("contracts").download(contract.file_path);
    if (dlErr || !blob) throw new Error("Could not download contract PDF: " + (dlErr?.message ?? "no blob"));
    const originalBytes = new Uint8Array(await blob.arrayBuffer());
    const originalHash = sha256Hex(originalBytes);
    const signedAtIso = new Date().toISOString();
    const ip = "script/counter-sign", userAgent = "radiantshine-sign-setup.mjs";
    const signedBytes = await stampSignatureCertificate(originalBytes, {
      certificateId: provReq.id, contractTitle: contract.title, signerName: PROVIDER_SIGNER.name,
      signerEmail: PROVIDER_SIGNER.email, signerTitle: PROVIDER_SIGNER.title, signerOrg: PROVIDER_ORG,
      signedAtIso, signerIp: ip, signerUserAgent: userAgent, originalFileHash: originalHash,
    });
    const signedHash = sha256Hex(signedBytes);
    const signedPath = `${ACCOUNT_ID}/${contract.id}-signed-${provReq.id.slice(0, 8)}.pdf`;
    const { error: sUpErr } = await db.storage.from("contracts").upload(signedPath, signedBytes, { contentType: "application/pdf", upsert: true });
    if (sUpErr) throw sUpErr;
    const signedFileName = `${contract.file_name.replace(/\s*\((signed|partially signed)\)/i, "").replace(/\.pdf$/i, "")} (signed).pdf`;

    await db.from("signature_requests").update({
      status: "signed", signed_at: signedAtIso, consent_given: true, signer_ip: ip, signer_user_agent: userAgent,
      original_file_hash: originalHash, signed_file_hash: signedHash, signed_file_path: signedPath, updated_at: signedAtIso,
    }).eq("id", provReq.id);
    await db.from("contracts").update({
      status: "partially_signed", esign_provider: "triple3", esign_status: "partially_signed",
      file_path: signedPath, file_name: signedFileName, updated_at: signedAtIso,
    }).eq("id", contract.id);
    contract.file_path = signedPath; contract.file_name = signedFileName;
    await db.from("contract_audit_events").insert({
      signature_request_id: provReq.id, contract_id: contract.id, event_type: "signed",
      ip, user_agent: userAgent,
      metadata: { signer_role: "provider", typed_name: PROVIDER_SIGNER.name, signer_title: PROVIDER_SIGNER.title, original_file_hash: originalHash, signed_file_hash: signedHash, signed_file_path: signedPath, fully_executed: false },
    });
    await db.from("activities").insert({
      account_id: ACCOUNT_ID, contact_id: account.contact_id, type: "contract_counter_signed",
      title: `Counter-signed by JMC: ${contract.title}`,
      description: `${PROVIDER_SIGNER.name}, ${PROVIDER_SIGNER.title} signed on behalf of ${PROVIDER_ORG}.`,
    });
    console.log("✓ counter-signed by JMC");
  } else {
    console.log("• already counter-signed — skipping");
  }

  // 3b. Neutralize the auto setup-fee link on completion
  if (account.setup_fee_cents && account.setup_fee_cents > 0) {
    await db.from("accounts").update({ setup_fee_cents: 0 }).eq("id", ACCOUNT_ID);
    console.log("✓ account.setup_fee_cents → 0 (billing is on the manual combined link; $2,000 stays on the deal + notes)");
  }

  // 4. Mint client signing link (NO email)
  await db.from("signature_requests").update({ status: "cancelled", updated_at: new Date().toISOString() })
    .eq("contract_id", contract.id).eq("signer_role", "client").in("status", ["pending", "viewed"]);
  const token = randomBytes(32).toString("base64url");
  const tokenHash = sha256Hex(token);
  const expiresAt = new Date(Date.now() + EXPIRES_DAYS * 864e5).toISOString();
  const { data: clientReq, error: cErr } = await db.from("signature_requests").insert({
    contract_id: contract.id, account_id: ACCOUNT_ID, token_hash: tokenHash, signer_role: "client",
    signer_name: CLIENT_SIGNER.name, signer_email: CLIENT_SIGNER.email, expires_at: expiresAt,
  }).select().single();
  if (cErr) throw cErr;

  await db.from("contracts").update({
    status: "sent", esign_provider: "triple3", esign_document_id: clientReq.id,
    esign_status: "pending", esign_sent_at: new Date().toISOString(), updated_at: new Date().toISOString(),
  }).eq("id", contract.id);
  await db.from("contract_audit_events").insert({
    signature_request_id: clientReq.id, contract_id: contract.id, event_type: "request_created",
    metadata: { signer_name: CLIENT_SIGNER.name, signer_email: CLIENT_SIGNER.email, expires_at: expiresAt, sent_by: "jeff (manual delivery)" },
  });
  await db.from("activities").insert({
    account_id: ACCOUNT_ID, contact_id: account.contact_id, type: "contract_sent",
    title: `Signing link created for ${contract.title}`,
    description: `Link created for ${CLIENT_SIGNER.name} <${CLIENT_SIGNER.email}> — NOT emailed by the CRM; Jeff delivers it. Expires ${expiresAt.slice(0, 10)}.`,
    metadata: { signature_request_id: clientReq.id, email_sent: false },
  });

  console.log("\n── SIGNING LINK (send from your own email) ──");
  console.log(`${SITE}/sign/${token}`);
  console.log(`\nExpires: ${expiresAt.slice(0, 10)} · Signer: ${CLIENT_SIGNER.name} <${CLIENT_SIGNER.email}>`);
}

main().catch((e) => { console.error("FAILED:", e.message || e); process.exit(1); });
