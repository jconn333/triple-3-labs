"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CheckCircle2, FileText, Loader2, PenLine, XCircle } from "lucide-react";

const CONSENT_TEXT =
  "I agree to conduct this transaction electronically and to be legally bound by my " +
  "electronic signature, which I intend to serve as my signature on this document, " +
  "pursuant to the U.S. ESIGN Act and applicable state law (UETA).";

interface SigningView {
  status: string;
  contract_title?: string;
  signer_name?: string;
  signer_email?: string;
  expires_at?: string;
  signed_at?: string | null;
  document_url?: string;
}

export default function SigningClient({ token }: { token: string }) {
  const [view, setView] = useState<SigningView | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [justSigned, setJustSigned] = useState(false);

  const [consent, setConsent] = useState(false);
  const [typedName, setTypedName] = useState("");
  const [hasDrawn, setHasDrawn] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);

  useEffect(() => {
    fetch(`/api/sign/${token}`)
      .then(async (res) => {
        const data = await res.json();
        setView(data);
        if (data.signer_name) setTypedName(data.signer_name);
      })
      .catch(() => setView({ status: "not_found" }))
      .finally(() => setLoading(false));
  }, [token]);

  // Signature canvas — pointer events, HiDPI-aware
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(dpr, dpr);
    ctx.strokeStyle = "#1a1a2e";
    ctx.lineWidth = 2.25;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  }, [view?.status]);

  const pos = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const startDraw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    drawing.current = true;
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const { x, y } = pos(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const moveDraw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return;
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const { x, y } = pos(e);
    ctx.lineTo(x, y);
    ctx.stroke();
    setHasDrawn(true);
  };

  const endDraw = () => {
    drawing.current = false;
  };

  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  }, []);

  async function handleSign() {
    if (!consent || typedName.trim().length < 2) return;
    setSubmitting(true);
    setError(null);
    try {
      const signatureDataUrl = hasDrawn ? canvasRef.current?.toDataURL("image/png") : null;
      const res = await fetch(`/api/sign/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          consent: true,
          typed_name: typedName.trim(),
          signature_data_url: signatureDataUrl,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Signing failed");
      setJustSigned(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Signing failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const shell = (content: React.ReactNode) => (
    <div className="min-h-screen bg-[#030014] text-white">
      <div className="mx-auto max-w-3xl px-4 py-10 sm:py-16">
        <div className="mb-8 flex items-center gap-2">
          <span className="text-lg font-bold tracking-tight">
            Triple <span className="text-violet-400">3</span> Labs
          </span>
          <span className="text-xs uppercase tracking-widest text-white/30">· e-sign</span>
        </div>
        {content}
      </div>
    </div>
  );

  if (loading) {
    return shell(
      <div className="flex items-center justify-center py-24 text-white/50">
        <Loader2 className="mr-2 animate-spin" size={18} /> Loading document…
      </div>
    );
  }

  if (justSigned) {
    return shell(
      <div className="glass-card rounded-2xl p-10 text-center">
        <CheckCircle2 className="mx-auto mb-4 text-emerald-400" size={48} />
        <h1 className="mb-2 text-2xl font-semibold">Document signed</h1>
        <p className="text-white/60">
          Thank you, {typedName.trim()}. A copy of the fully signed document is being emailed to{" "}
          <span className="text-white/90">{view?.signer_email}</span> for your records.
        </p>
      </div>
    );
  }

  if (!view || view.status === "not_found") {
    return shell(
      <div className="glass-card rounded-2xl p-10 text-center">
        <XCircle className="mx-auto mb-4 text-rose-400" size={48} />
        <h1 className="mb-2 text-2xl font-semibold">Link not found</h1>
        <p className="text-white/60">
          This signing link is invalid. Please contact the sender for a new link.
        </p>
      </div>
    );
  }

  if (view.status === "signed") {
    return shell(
      <div className="glass-card rounded-2xl p-10 text-center">
        <CheckCircle2 className="mx-auto mb-4 text-emerald-400" size={48} />
        <h1 className="mb-2 text-2xl font-semibold">Already signed</h1>
        <p className="text-white/60">
          {view.contract_title} was signed
          {view.signed_at ? ` on ${new Date(view.signed_at).toLocaleDateString()}` : ""}. A copy was
          emailed to {view.signer_email}.
        </p>
      </div>
    );
  }

  if (view.status === "expired" || view.status === "cancelled") {
    return shell(
      <div className="glass-card rounded-2xl p-10 text-center">
        <XCircle className="mx-auto mb-4 text-amber-400" size={48} />
        <h1 className="mb-2 text-2xl font-semibold">
          {view.status === "expired" ? "Link expired" : "Request cancelled"}
        </h1>
        <p className="text-white/60">
          This signing link is no longer active. Please contact the sender to request a new one.
        </p>
      </div>
    );
  }

  // Active signing view (pending / viewed)
  return shell(
    <div className="space-y-6">
      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-start gap-3">
          <FileText className="mt-1 shrink-0 text-violet-400" size={20} />
          <div>
            <h1 className="text-xl font-semibold">{view.contract_title}</h1>
            <p className="mt-1 text-sm text-white/50">
              Prepared for {view.signer_name} ({view.signer_email})
              {view.expires_at &&
                ` · link expires ${new Date(view.expires_at).toLocaleDateString()}`}
            </p>
          </div>
        </div>
      </div>

      {view.document_url ? (
        <div className="glass-card overflow-hidden rounded-2xl">
          <iframe
            src={view.document_url}
            title="Document to sign"
            className="h-[70vh] w-full bg-white"
          />
        </div>
      ) : (
        <div className="glass-card rounded-2xl p-6 text-sm text-white/50">
          The document preview could not be loaded. You can still review the document from the
          email attachment before signing, or refresh this page.
        </div>
      )}

      <div className="glass-card space-y-5 rounded-2xl p-6">
        <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-white/40">
          <PenLine size={14} /> Sign this document
        </h2>

        <div>
          <label className="mb-1 block text-xs text-white/50">
            Type your full legal name <span className="text-rose-400">*</span>
          </label>
          <input
            type="text"
            value={typedName}
            onChange={(e) => setTypedName(e.target.value)}
            placeholder="Full legal name"
            className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/30 outline-none focus:border-violet-400/50"
          />
        </div>

        <div>
          <div className="mb-1 flex items-center justify-between">
            <label className="block text-xs text-white/50">Draw your signature (optional)</label>
            <button
              type="button"
              onClick={clearCanvas}
              className="text-xs text-white/40 hover:text-white/70"
            >
              Clear
            </button>
          </div>
          <canvas
            ref={canvasRef}
            onPointerDown={startDraw}
            onPointerMove={moveDraw}
            onPointerUp={endDraw}
            onPointerLeave={endDraw}
            className="h-36 w-full touch-none rounded-lg border border-dashed border-white/20 bg-white"
          />
          <p className="mt-1 text-[11px] text-white/30">
            If you skip drawing, your typed name will be used as your signature.
          </p>
        </div>

        <label className="flex cursor-pointer items-start gap-3 rounded-lg bg-white/[0.03] p-4">
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            className="mt-0.5 h-4 w-4 shrink-0 accent-violet-500"
          />
          <span className="text-xs leading-relaxed text-white/60">{CONSENT_TEXT}</span>
        </label>

        {error && (
          <p className="rounded-lg border border-rose-400/30 bg-rose-400/10 p-3 text-sm text-rose-300">
            {error}
          </p>
        )}

        <button
          onClick={handleSign}
          disabled={!consent || typedName.trim().length < 2 || submitting}
          className="w-full rounded-lg bg-violet-600 py-3.5 text-sm font-semibold text-white transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {submitting ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="animate-spin" size={16} /> Signing…
            </span>
          ) : (
            "Agree & Sign"
          )}
        </button>

        <p className="text-center text-[11px] text-white/25">
          Your IP address, timestamp, and a cryptographic fingerprint of this document will be
          recorded to create a verifiable signature certificate.
        </p>
      </div>
    </div>
  );
}
