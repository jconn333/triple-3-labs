import { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Pricing from "@/components/Pricing";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "AI Voice Agent Pricing — Triple 3 Labs",
  description:
    "Custom AI voice agent packages starting at $499/mo. 24/7 inbound call handling, appointment booking, live transfers, and more.",
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
