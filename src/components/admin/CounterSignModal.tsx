"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { PenLine } from "lucide-react";
import type { Contract } from "@/lib/crm/types";
import { Button, Field, Input, Modal } from "@/components/ui";

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
    <Modal
      title="Counter-sign as JMC"
      description={
        <>
          {contract.title} <span className="text-ink-3">· {contract.file_name}</span>
        </>
      }
      onClose={onClose}
      footer={
        isPdf ? (
          <>
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleSign}
              disabled={!consent || typedName.trim().length < 2}
              loading={signing}
            >
              {!signing && <PenLine size={14} />}
              Sign as JMC
            </Button>
          </>
        ) : (
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        )
      }
    >
      {!isPdf ? (
        <p className="rounded-lg border border-warn/40 bg-warn-soft p-3 text-sm text-warn">
          Only PDF contracts can be signed. Export to PDF and re-upload first.
        </p>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Your name">
              <Input value={typedName} onChange={(e) => setTypedName(e.target.value)} />
            </Field>
            <Field label="Title">
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Managing Member" />
            </Field>
          </div>

          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label className="block text-xs font-medium text-ink-2">Draw your signature (optional)</label>
              <button type="button" onClick={clearCanvas} className="text-xs text-ink-3 hover:text-ink">
                Clear
              </button>
            </div>
            <canvas
              ref={canvasRef}
              onPointerDown={startDraw}
              onPointerMove={moveDraw}
              onPointerUp={endDraw}
              onPointerLeave={endDraw}
              className="h-32 w-full touch-none rounded-lg border border-dashed border-line-strong bg-ground"
            />
            <p className="mt-1 text-xs text-ink-3">
              If you skip drawing, your typed name is used as the signature.
            </p>
          </div>

          <label className="flex cursor-pointer items-start gap-3 rounded-lg bg-surface-2 p-4">
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--color-accent)]"
            />
            <span className="text-xs leading-relaxed text-ink-2">{CONSENT_TEXT}</span>
          </label>

          <p className="text-center text-xs text-ink-3">
            Your IP, timestamp, and a hash of the document are recorded on a signature certificate.
          </p>
        </div>
      )}
    </Modal>
  );
}
