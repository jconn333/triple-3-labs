import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Terms of Service — Triple 3 Labs",
  description:
    "The terms that govern your use of Triple 3 Labs' website, software, and AI agent services.",
  alternates: { canonical: "/terms" },
};

const EFFECTIVE_DATE = "August 29, 2026";

function Section({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-28">
      <h2 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
        {title}
      </h2>
      <div className="mt-4 space-y-4 text-sm leading-relaxed text-white/60 sm:text-base">
        {children}
      </div>
    </section>
  );
}

export default function TermsPage() {
  return (
    <main className="relative min-h-screen overflow-hidden">
      <Navbar />

      <article className="mx-auto max-w-3xl px-6 pb-24 pt-32 sm:pt-40">
        <header className="border-b border-white/10 pb-10">
          <p className="text-xs font-semibold uppercase tracking-widest text-white/30">
            Legal
          </p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Terms of <span className="gradient-text">Service</span>
          </h1>
          <p className="mt-4 text-sm text-white/40">
            Effective {EFFECTIVE_DATE}
          </p>
          <p className="mt-6 text-sm leading-relaxed text-white/60 sm:text-base">
            These Terms of Service (&ldquo;Terms&rdquo;) govern your access to
            and use of the website at{" "}
            <span className="text-white/80">triple3labs.io</span> and the
            software, AI agents, and services provided by Triple 3 Labs
            (&ldquo;Triple 3 Labs,&rdquo; &ldquo;we,&rdquo; &ldquo;us,&rdquo; or
            &ldquo;our&rdquo;). By using our website or services, you agree to
            these Terms. If you do not agree, do not use them.
          </p>
        </header>

        <div className="mt-12 space-y-12">
          <Section id="services" title="1. Our services">
            <p>
              Triple 3 Labs builds, deploys, and manages AI agents, automations,
              and related digital-presence services for businesses. The specific
              scope, deliverables, and fees for a client engagement are set out
              in a separate order form, proposal, or written agreement (an
              &ldquo;Order&rdquo;). If an Order conflicts with these Terms, the
              Order controls for that engagement.
            </p>
          </Section>

          <Section id="eligibility" title="2. Eligibility and accounts">
            <p>
              You must be at least 18 years old and able to form a binding
              contract to use our services. You are responsible for the accuracy
              of the information you provide and for maintaining the
              confidentiality of any credentials used to access our services or
              deliverables.
            </p>
          </Section>

          <Section id="client-responsibilities" title="3. Client responsibilities and authorizations">
            <p>
              Where we manage third-party platforms on your behalf — for example
              a Google Business Profile, advertising accounts, or listing
              directories — you represent that you own or are authorized to
              manage those accounts and that you grant us permission to act on
              your behalf within the scope of the applicable Order. You are
              responsible for the accuracy of business information you provide
              and for reviewing and approving content where the Order calls for
              your approval.
            </p>
          </Section>

          <Section id="acceptable-use" title="4. Acceptable use">
            <p>You agree not to:</p>
            <ul className="list-disc space-y-2 pl-5 marker:text-white/30">
              <li>Use our services to violate any law or third-party rights;</li>
              <li>
                Submit content that is unlawful, deceptive, infringing, or that
                you lack the rights to use;
              </li>
              <li>
                Attempt to disrupt, reverse-engineer, or gain unauthorized access
                to our systems or those of our providers; or
              </li>
              <li>
                Use our services in a way that violates the terms of any
                integrated third-party platform (including Google&rsquo;s
                policies).
              </li>
            </ul>
          </Section>

          <Section id="third-party" title="5. Third-party platforms">
            <p>
              Our services integrate with third-party platforms (such as Google,
              hosting providers, and listing directories). Your use of those
              platforms is governed by their own terms and policies, and their
              availability and behavior are outside our control. Our handling of
              data obtained through those integrations is described in our{" "}
              <Link
                href="/privacy"
                className="text-white/80 underline decoration-white/30 underline-offset-2 hover:text-white"
              >
                Privacy Policy
              </Link>
              .
            </p>
          </Section>

          <Section id="fees" title="6. Fees and payment">
            <p>
              Fees, billing frequency, and payment terms are specified in your
              Order. Unless otherwise stated, fees are due as invoiced,
              non-refundable except as required by law, and exclusive of
              applicable taxes. We may suspend services for non-payment after
              reasonable notice.
            </p>
          </Section>

          <Section id="ip" title="7. Intellectual property">
            <p>
              We retain all rights to our underlying software, tools, models,
              templates, and know-how, including improvements developed in the
              course of providing services. Subject to full payment and the terms
              of your Order, you own the final deliverables created specifically
              for you, and you grant us a license to use your names, logos, and
              non-confidential materials as needed to provide the services and,
              unless you opt out in writing, to reference you as a client.
            </p>
          </Section>

          <Section id="disclaimers" title="8. Disclaimers">
            <p>
              Our services are provided &ldquo;as is&rdquo; and &ldquo;as
              available.&rdquo; We do not warrant any particular search ranking,
              lead volume, revenue, or other outcome, which depend on factors
              outside our control including third-party platform behavior. To the
              fullest extent permitted by law, we disclaim all implied
              warranties, including merchantability, fitness for a particular
              purpose, and non-infringement.
            </p>
          </Section>

          <Section id="liability" title="9. Limitation of liability">
            <p>
              To the fullest extent permitted by law, Triple 3 Labs will not be
              liable for any indirect, incidental, special, consequential, or
              punitive damages, or for lost profits or revenues. Our total
              liability arising out of or relating to the services will not
              exceed the amounts you paid us for the services giving rise to the
              claim during the three (3) months before the event that gave rise
              to the liability.
            </p>
          </Section>

          <Section id="indemnity" title="10. Indemnification">
            <p>
              You agree to indemnify and hold Triple 3 Labs harmless from claims,
              losses, and expenses arising out of your content, your use of the
              services in violation of these Terms, or your breach of any
              representation regarding your authority over connected accounts.
            </p>
          </Section>

          <Section id="term" title="11. Term and termination">
            <p>
              Either party may terminate an engagement as provided in the
              applicable Order. We may suspend or terminate access to the website
              or services if you materially breach these Terms. Provisions that by
              their nature should survive termination — including intellectual
              property, disclaimers, limitation of liability, and indemnification
              — will survive.
            </p>
          </Section>

          <Section id="governing-law" title="12. Governing law">
            <p>
              These Terms are governed by the laws of the State of Ohio, without
              regard to its conflict-of-laws rules. The state and federal courts
              located in Ohio will have exclusive jurisdiction over any dispute
              arising out of or relating to these Terms or the services.
            </p>
          </Section>

          <Section id="changes" title="13. Changes to these Terms">
            <p>
              We may update these Terms from time to time. When we do, we will
              revise the &ldquo;Effective&rdquo; date above. Continued use of our
              website or services after an update constitutes acceptance of the
              revised Terms.
            </p>
          </Section>

          <Section id="contact" title="14. Contact us">
            <p>
              Questions about these Terms? Email{" "}
              <a
                href="mailto:jeff@triple3labs.io"
                className="text-white/80 underline decoration-white/30 underline-offset-2 hover:text-white"
              >
                jeff@triple3labs.io
              </a>
              .
            </p>
          </Section>
        </div>
      </article>

      <Footer />
    </main>
  );
}
