import { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Pricing from "@/components/Pricing";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "AI Agent Pricing — Triple 3 Labs",
  description:
    "Custom AI agent packages starting at $499/mo — support, scheduling, back-office, and more, built and managed for you. Chat, email, web, and voice included.",
};

export default function PricingPage() {
  return (
    <main className="relative min-h-screen overflow-hidden">
      <Navbar />
      <div className="pt-28" />
      <Pricing />
      <Footer />
    </main>
  );
}
