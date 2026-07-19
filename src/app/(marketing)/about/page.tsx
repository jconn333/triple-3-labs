import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import About from "@/components/About";

export const metadata: Metadata = {
  title: "About — Triple 3 Labs",
  description:
    "Meet Jeff Conn — founder of Triple 3 Labs. Every AI agent we sell is built, run, and battle-tested in his own hospitality businesses first.",
};

export default function AboutPage() {
  return (
    <main className="relative min-h-screen overflow-hidden">
      <Navbar />
      <About />
      <Footer />
    </main>
  );
}
