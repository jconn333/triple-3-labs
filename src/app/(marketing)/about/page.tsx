import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import About from "@/components/About";

export const metadata: Metadata = {
  title: "About — Triple 3 Labs",
  description:
    "Meet Jeff Conn — CEO of Five Star Group and founder of Triple 3 Labs. Building AI agents for Holmes County businesses.",
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
