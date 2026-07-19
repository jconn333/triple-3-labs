import { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Pricing from "@/components/Pricing";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "AI Agent Pricing — Triple 3 Labs",
  description:
    "Custom AI agent packages — support, scheduling, back-office, and more, built and managed for you. Chat, email, web, and voice included.",
  // Unlisted page: shared by direct link only, kept out of search engines.
  robots: {
    index: false,
    follow: false,
  },
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
