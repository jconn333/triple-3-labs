import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Marquee from "@/components/Marquee";
import Features from "@/components/Features";
import ProductShowcase from "@/components/ProductShowcase";
import WhyAgents from "@/components/WhyAgents";
import Process from "@/components/Process";
import CTA from "@/components/CTA";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-hidden">
      <Navbar />
      <Hero />
      <Marquee />
      <WhyAgents />
      <Features />
      <ProductShowcase />
      <Process />
      <CTA />
      <Footer />
    </main>
  );
}
