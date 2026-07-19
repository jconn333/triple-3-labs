"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Send, Loader2, CheckCircle2 } from "lucide-react";

const formSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  email: z.string().email("Valid email required"),
  company: z.string().max(100).optional(),
  subject: z.string().min(1, "Subject is required").max(200),
  description: z.string().min(10, "Tell us a bit more (10+ chars)"),
  severity: z.enum(["low", "normal", "high", "urgent"]),
  agent_id: z.string().max(100).optional(),
  // Honeypot — left blank by real users, hidden from view.
  website: z.string().max(0).optional().or(z.literal("")),
});

type FormData = z.infer<typeof formSchema>;

export default function SupportTicketForm() {
  const [ticketNumber, setTicketNumber] = useState<number | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { severity: "normal" },
  });

  async function onSubmit(data: FormData) {
    try {
      const res = await fetch("/api/tickets/public", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error || "Something went wrong");
      }

      setTicketNumber(result.ticket_number);
      reset();
      toast.success("Ticket submitted!");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to submit. Try again.");
    }
  }

  if (ticketNumber !== null) {
    return (
      <div className="glass-card rounded-xl p-8 text-center">
        <CheckCircle2 size={36} className="mx-auto mb-4 text-emerald-400" />
        <h3 className="mb-2 text-2xl font-bold text-white" style={{ fontFamily: "var(--font-space-grotesk)" }}>
          Ticket #{ticketNumber} submitted
        </h3>
        <p className="text-white/50">
          Our AI triage system is reviewing it now. We&apos;ll follow up by email if we need anything else —
          keep your ticket number handy for reference.
        </p>
        <button
          onClick={() => setTicketNumber(null)}
          className="mt-4 text-sm text-violet hover:text-violet/80 underline"
        >
          Submit another ticket
        </button>
      </div>
    );
  }

  const inputClasses =
    "w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/30 outline-none transition-colors focus:border-violet/50 focus:ring-1 focus:ring-violet/50";
  const labelClasses = "mb-1.5 block text-sm font-medium text-white/60";
  const errorClasses = "mt-1 text-xs text-red-400";

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="glass-card space-y-4 rounded-xl p-6 text-left sm:p-8">
      {/* Honeypot field — hidden from real users, visible to bots that fill every input */}
      <div className="absolute -left-[9999px] opacity-0" aria-hidden="true">
        <label htmlFor="website">Leave this field blank</label>
        <input id="website" tabIndex={-1} autoComplete="off" {...register("website")} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClasses}>
            Name <span className="text-red-400">*</span>
          </label>
          <input {...register("name")} className={inputClasses} placeholder="Your name" />
          {errors.name && <p className={errorClasses}>{errors.name.message}</p>}
        </div>
        <div>
          <label className={labelClasses}>
            Email <span className="text-red-400">*</span>
          </label>
          <input {...register("email")} type="email" className={inputClasses} placeholder="you@company.com" />
          {errors.email && <p className={errorClasses}>{errors.email.message}</p>}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClasses}>Company</label>
          <input {...register("company")} className={inputClasses} placeholder="Your company" />
        </div>
        <div>
          <label className={labelClasses}>Which agent or product?</label>
          <input {...register("agent_id")} className={inputClasses} placeholder="e.g. SEO Agent, Daily Brief" />
        </div>
      </div>

      <div>
        <label className={labelClasses}>
          Subject <span className="text-red-400">*</span>
        </label>
        <input {...register("subject")} className={inputClasses} placeholder="Short summary of the issue" />
        {errors.subject && <p className={errorClasses}>{errors.subject.message}</p>}
      </div>

      <div>
        <label className={labelClasses}>How urgent is this?</label>
        <select {...register("severity")} className={inputClasses}>
          <option value="low">Low — no rush</option>
          <option value="normal">Normal</option>
          <option value="high">High — blocking my work</option>
          <option value="urgent">Urgent — something is broken now</option>
        </select>
      </div>

      <div>
        <label className={labelClasses}>
          Describe the issue <span className="text-red-400">*</span>
        </label>
        <textarea
          {...register("description")}
          rows={5}
          className={inputClasses + " resize-none"}
          placeholder="What happened, what did you expect, and any steps to reproduce..."
        />
        {errors.description && <p className={errorClasses}>{errors.description.message}</p>}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="group relative inline-flex w-full items-center justify-center gap-2 overflow-hidden rounded-full bg-gradient-to-r from-violet via-purple to-cyan px-10 py-4 text-lg font-semibold text-white transition-all hover:scale-[1.02] hover:shadow-[0_0_40px_rgba(124,58,237,0.5)] disabled:opacity-50 disabled:hover:scale-100"
      >
        <span className="relative z-10">{isSubmitting ? "Submitting..." : "Submit Ticket"}</span>
        {isSubmitting ? (
          <Loader2 size={20} className="relative z-10 animate-spin" />
        ) : (
          <Send size={18} className="relative z-10 transition-transform group-hover:translate-x-1" />
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-cyan via-violet to-pink opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
      </button>
    </form>
  );
}
