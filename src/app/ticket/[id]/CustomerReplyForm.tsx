"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Send, Loader2 } from "lucide-react";

export default function CustomerReplyForm({ ticketId, token }: { ticketId: string; token: string }) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    setSending(true);
    try {
      const res = await fetch(`/api/tickets/${ticketId}/customer-reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, body }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong");
      setBody("");
      toast.success("Reply sent");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to send reply");
    } finally {
      setSending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-5 border-t border-white/5 pt-5">
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Add a reply..."
        rows={3}
        maxLength={5000}
        className="w-full resize-none rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/30 outline-none transition-colors focus:border-violet/50 focus:ring-1 focus:ring-violet/50"
      />
      <div className="mt-2 flex items-center justify-between">
        <span className="text-[11px] text-white/25">{body.length}/5000</span>
        <button
          type="submit"
          disabled={sending || !body.trim()}
          className="flex items-center gap-2 rounded-lg bg-violet/20 px-4 py-2 text-sm font-medium text-violet transition-colors hover:bg-violet/30 disabled:opacity-40"
        >
          {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
          Send Reply
        </button>
      </div>
    </form>
  );
}
