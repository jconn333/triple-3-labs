"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Loader2, PenLine, X } from "lucide-react";
import type { Contract } from "@/lib/crm/types";

const CONSENT_TEXT =
  "I agree to conduct this transaction electronically and to be legally bound by my " +
  "electronic signature, which I intend to serve as my signature on this document, " +
  "pursuant to the U.S. ESIGN Act and applicable state law (UETA).";

interface CounterSignModalProps {
  accountId: string;
  contract: Contract;
  onClose: () => void;
  onSigned: () => void;
}

export default function CounterSignModal({
  accountId,
  contract,
  onClose,
  onSigned,
}: CounterSignModalProps) {
  const [typedName, setTypedName] = useState("Jeff Conn");
  const [title, setTitle] = useState("Managing Member");
  const [consent, setConsent] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [signing, setSigning] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);

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
  }, []);

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
    setSigning(true);
    try {
      const signatureDataUrl = hasDrawn ? canvasRef.current?.toDataURL("image/png") : null;
      const res = await fetch(
        `/api/accounts/${accountId}/contracts/${contract.id}/counter-sign`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            consent: true,
            typed_name: typedName.trim(),
            signer_title: title.trim() || null,
            signature_data_url: signatureDataUrl,
          }),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Counter-signing failed");
      toast.success(
        data.fully_executed
          ? "Contract fully executed 🎉"
          : "Counter-signed — ready to send to the client"
      );
      onSigned();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Counter-signing failed");
    } finally {
      setSigning(false);
    }
  }

  const isPdf = contract.mime_type === "application/pdf";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="glass-card w-full max-w-lg rounded-2xl p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h3
            className="text-lg font-bold text-white"
            style={{ fontFamily: "var(--font-space-grotesk)" }}
          >
            Counter-sign as JMC
          </h3>
          <button onClick={onClose} className="text-white/40 hover:text-white/60">
            <X size={20} />
          </button>
        </div>

        <p className="text-sm text-white/50">
          {contract.title} <span className="text-white/30">· {contract.file_name}</span>
        </p>

        {!isPdf ? (
          <p className="rounded-lg border border-amber-400/30 bg-amber-400/10 p-3 text-sm text-amber-300">
            Only PDF contracts can be signed. Export to PDF and re-upload first.
          </p>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-white/60">
                  Your name
                </label>
                <input
                  value={typedName}
                  onChange={(e) => setTypedName(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-white/30 outline-none focus:border-violet/50"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-white/60">Title</label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Managing Member"
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-white/30 outline-none focus:border-violet/50"
                />
              </div>
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label className="block text-sm font-medium text-white/60">
                  Draw your signature (optional)
                </label>
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
                className="h-32 w-full touch-none rounded-lg border border-dashed border-white/20 bg-white"
              />
              <p className="mt-1 text-[11px] text-white/30">
                If you skip drawing, your typed name is used as the signature.
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

            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 rounded-lg border border-white/10 px-4 py-2.5 text-sm font-medium text-white/60 hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSign}
                disabled={!consent || typedName.trim().length < 2 || signing}
                className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-violet to-purple px-4 py-2.5 text-sm font-semibold text-white transition-all hover:shadow-[0_0_20px_rgba(124,58,237,0.4)] disabled:opacity-50"
              >
                {signing ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> Signing...
                  </>
                ) : (
                  <>
                    <PenLine size={16} /> Sign as JMC
                  </>
                )}
              </button>
            </div>

            <p className="text-center text-[11px] text-white/25">
              Your IP, timestamp, and a hash of the document are recorded on a signature certificate.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
