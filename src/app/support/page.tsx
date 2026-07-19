import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SupportTicketForm from "@/components/SupportTicketForm";

export const metadata: Metadata = {
  title: "Support — Triple 3 Labs",
  description: "Submit a support ticket and our AI triage system will get to work on it right away.",
};

export default function SupportPage() {
  return (
    <div className="grain">
      <main className="relative min-h-screen overflow-hidden">
        <Navbar />
        <div className="mx-auto max-w-2xl px-6 py-24 sm:py-32">
          <div className="mb-10 text-center">
            <h1
              className="text-3xl font-bold text-white sm:text-4xl"
              style={{ fontFamily: "var(--font-space-grotesk)" }}
            >
              How can we <span className="gradient-text">help</span>?
            </h1>
            <p className="mt-3 text-white/50">
              Tell us what&apos;s going on — our AI triage system reviews every ticket right away, and a human
              is always in the loop for anything that needs one.
            </p>
          </div>
          <SupportTicketForm />
        </div>
        <Footer />
      </main>
    </div>
  );
}
