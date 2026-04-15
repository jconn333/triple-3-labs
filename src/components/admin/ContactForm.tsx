"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Send, Loader2 } from "lucide-react";

const formSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  email: z.string().email("Valid email required"),
  company: z.string().max(100).optional(),
  phone: z.string().max(20).optional(),
  message: z.string().min(10, "Tell us a bit more (10+ chars)"),
});

type FormData = z.infer<typeof formSchema>;

export default function ContactForm() {
  const [submitted, setSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
  });

  async function onSubmit(data: FormData) {
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Something went wrong");
      }

      setSubmitted(true);
      reset();
      toast.success("Message sent! We'll be in touch soon.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to send. Try again."
      );
    }
  }

  if (submitted) {
    return (
      <div className="text-center py-8">
        <div className="mb-4 text-4xl">✓</div>
        <h3
          className="text-2xl font-bold text-white mb-2"
          style={{ fontFamily: "var(--font-space-grotesk)" }}
        >
          Message Received!
        </h3>
        <p className="text-white/50">
          We&apos;ll review your project and get back to you within 24 hours.
        </p>
        <button
          onClick={() => setSubmitted(false)}
          className="mt-4 text-sm text-violet hover:text-violet/80 underline"
        >
          Send another message
        </button>
      </div>
    );
  }

  const inputClasses =
    "w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/30 outline-none transition-colors focus:border-violet/50 focus:ring-1 focus:ring-violet/50";
  const labelClasses = "mb-1.5 block text-sm font-medium text-white/60";
  const errorClasses = "mt-1 text-xs text-red-400";

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 text-left">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClasses}>
            Name <span className="text-red-400">*</span>
          </label>
          <input
            {...register("name")}
            className={inputClasses}
            placeholder="Your name"
          />
          {errors.name && (
            <p className={errorClasses}>{errors.name.message}</p>
          )}
        </div>
        <div>
          <label className={labelClasses}>
            Email <span className="text-red-400">*</span>
          </label>
          <input
            {...register("email")}
            type="email"
            className={inputClasses}
            placeholder="you@company.com"
          />
          {errors.email && (
            <p className={errorClasses}>{errors.email.message}</p>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClasses}>Company</label>
          <input
            {...register("company")}
            className={inputClasses}
            placeholder="Your company"
          />
        </div>
        <div>
          <label className={labelClasses}>Phone</label>
          <input
            {...register("phone")}
            type="tel"
            className={inputClasses}
            placeholder="(555) 123-4567"
          />
        </div>
      </div>

      <div>
        <label className={labelClasses}>
          Tell us about your project <span className="text-red-400">*</span>
        </label>
        <textarea
          {...register("message")}
          rows={4}
          className={inputClasses + " resize-none"}
          placeholder="Describe your project, goals, and any challenges you're looking to solve..."
        />
        {errors.message && (
          <p className={errorClasses}>{errors.message.message}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="group relative inline-flex w-full items-center justify-center gap-2 overflow-hidden rounded-full bg-gradient-to-r from-violet via-purple to-cyan px-10 py-4 text-lg font-semibold text-white transition-all hover:scale-[1.02] hover:shadow-[0_0_40px_rgba(124,58,237,0.5)] disabled:opacity-50 disabled:hover:scale-100"
      >
        <span className="relative z-10">
          {isSubmitting ? "Sending..." : "Send Message"}
        </span>
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
