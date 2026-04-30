import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Marquee from "@/components/Marquee";
import Features from "@/components/Features";
import WhyAgents from "@/components/WhyAgents";
import MeetTheOffice from "@/components/MeetTheOffice";
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
      <MeetTheOffice />
      <Features />
      <Process />
      <CTA />
      <Footer />
    </main>
  );
}
