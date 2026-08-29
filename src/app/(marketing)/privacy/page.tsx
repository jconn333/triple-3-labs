import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Privacy Policy — Triple 3 Labs",
  description:
    "How Triple 3 Labs collects, uses, stores, and protects data — including data accessed through Google APIs on behalf of clients who authorize it.",
  alternates: { canonical: "/privacy" },
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

export default function PrivacyPage() {
  return (
    <main className="relative min-h-screen overflow-hidden">
      <Navbar />

      <article className="mx-auto max-w-3xl px-6 pb-24 pt-32 sm:pt-40">
        <header className="border-b border-white/10 pb-10">
          <p className="text-xs font-semibold uppercase tracking-widest text-white/30">
            Legal
          </p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Privacy <span className="gradient-text">Policy</span>
          </h1>
          <p className="mt-4 text-sm text-white/40">
            Effective {EFFECTIVE_DATE}
          </p>
          <p className="mt-6 text-sm leading-relaxed text-white/60 sm:text-base">
            Triple 3 Labs (&ldquo;Triple 3 Labs,&rdquo; &ldquo;we,&rdquo;
            &ldquo;us,&rdquo; or &ldquo;our&rdquo;) builds and operates AI agents
            and automation software for small businesses. This policy explains
            what information we collect, how we use it, and the choices you
            have. It covers our website at{" "}
            <span className="text-white/80">triple3labs.io</span> and the
            software and services we provide to clients — including data we
            access through Google APIs on a client&rsquo;s behalf when the
            client authorizes it.
          </p>
        </header>

        <div className="mt-12 space-y-12">
          <Section id="who-we-are" title="Who we are">
            <p>
              Triple 3 Labs is an AI agency operated by Jeff Conn. We can be
              reached at{" "}
              <a
                href="mailto:jeff@triple3labs.io"
                className="text-white/80 underline decoration-white/30 underline-offset-2 transition-colors hover:text-white"
              >
                jeff@triple3labs.io
              </a>
              . References to &ldquo;clients&rdquo; mean the businesses that
              engage us to build or manage AI agents and related digital-presence
              services on their behalf.
            </p>
          </Section>

          <Section id="information-we-collect" title="Information we collect">
            <p>We collect the following categories of information:</p>
            <ul className="list-disc space-y-2 pl-5 marker:text-white/30">
              <li>
                <span className="text-white/80">Information you give us.</span>{" "}
                When you contact us, request a proposal, or become a client, we
                collect details such as your name, business name, email address,
                phone number, and the contents of your messages.
              </li>
              <li>
                <span className="text-white/80">
                  Client business data.
                </span>{" "}
                To deliver our services we process information about a
                client&rsquo;s business — for example location details, hours,
                service offerings, reviews, and performance metrics.
              </li>
              <li>
                <span className="text-white/80">
                  Data from connected accounts.
                </span>{" "}
                With a client&rsquo;s authorization, we access data from
                third-party platforms the client uses — including Google
                Business Profile and related Google services (see{" "}
                <Link
                  href="#google-user-data"
                  className="text-white/80 underline decoration-white/30 underline-offset-2 hover:text-white"
                >
                  Google user data
                </Link>
                ).
              </li>
              <li>
                <span className="text-white/80">Usage information.</span>{" "}
                Standard technical data such as IP address, browser type, and
                pages viewed, collected through cookies and analytics to operate
                and improve our website.
              </li>
            </ul>
          </Section>

          <Section id="how-we-use" title="How we use information">
            <p>We use the information we collect to:</p>
            <ul className="list-disc space-y-2 pl-5 marker:text-white/30">
              <li>Provide, operate, and improve our services and website;</li>
              <li>
                Manage a client&rsquo;s digital presence as authorized — for
                example keeping business listing information accurate, publishing
                approved posts and photos, and monitoring and responding to
                reviews;
              </li>
              <li>Produce reporting and analytics for our clients;</li>
              <li>Respond to inquiries and provide support; and</li>
              <li>
                Comply with legal obligations and enforce our agreements.
              </li>
            </ul>
          </Section>

          <Section id="google-user-data" title="Google user data">
            <p>
              Some of our services help clients manage their presence on Google.
              When a client connects their Google account, they grant us access
              through Google&rsquo;s OAuth consent flow. Depending on the scopes
              the client approves, we may access and manage the client&rsquo;s
              Google Business Profile data on their behalf, including:
            </p>
            <ul className="list-disc space-y-2 pl-5 marker:text-white/30">
              <li>
                Business information such as name, address, phone number, hours,
                categories, and attributes;
              </li>
              <li>Local posts, photos, and other profile content;</li>
              <li>Reviews and review replies;</li>
              <li>Profile performance and insights metrics.</li>
            </ul>
            <p>
              We use this access solely to provide the services the client has
              requested — for example correcting and maintaining accurate
              listing information, publishing approved content, responding to
              reviews, and generating performance reports. A client may revoke
              our access at any time through their Google Account permissions at{" "}
              <a
                href="https://myaccount.google.com/permissions"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/80 underline decoration-white/30 underline-offset-2 hover:text-white"
              >
                myaccount.google.com/permissions
              </a>{" "}
              or by contacting us.
            </p>
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
              <p className="text-white/75">
                Triple 3 Labs&rsquo;s use and transfer of information received
                from Google APIs to any other app will adhere to the{" "}
                <a
                  href="https://developers.google.com/terms/api-services-user-data-policy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white/90 underline decoration-white/40 underline-offset-2 hover:text-white"
                >
                  Google API Services User Data Policy
                </a>
                , including the Limited Use requirements. We do not use Google
                user data for advertising, and we do not sell it. Human access to
                Google user data is limited to what is necessary to provide or
                improve the service, to comply with applicable law, or as part of
                aggregated and anonymized analysis — and only with the
                client&rsquo;s consent where required.
              </p>
            </div>
          </Section>

          <Section id="how-we-share" title="How we share information">
            <p>
              We do not sell personal information. We share information only in
              these limited circumstances:
            </p>
            <ul className="list-disc space-y-2 pl-5 marker:text-white/30">
              <li>
                <span className="text-white/80">Service providers.</span> With
                vendors that host and support our infrastructure (for example
                cloud hosting, database, and email providers) under obligations
                to protect the data and use it only to provide services to us;
              </li>
              <li>
                <span className="text-white/80">On a client&rsquo;s behalf.</span>{" "}
                With the platforms a client has authorized us to manage, such as
                publishing content to their Google Business Profile;
              </li>
              <li>
                <span className="text-white/80">Legal reasons.</span> When
                required by law, regulation, or valid legal process, or to
                protect the rights, safety, and property of Triple 3 Labs, our
                clients, or others.
              </li>
            </ul>
          </Section>

          <Section id="retention-security" title="Data retention and security">
            <p>
              We retain information for as long as needed to provide our
              services and for legitimate business or legal purposes, then delete
              or anonymize it. We apply reasonable administrative and technical
              safeguards — including access controls and encryption in transit —
              to protect information against unauthorized access, loss, or
              misuse. No method of transmission or storage is completely secure,
              and we cannot guarantee absolute security.
            </p>
          </Section>

          <Section id="your-choices" title="Your choices and rights">
            <p>
              You may request access to, correction of, or deletion of the
              personal information we hold about you by emailing{" "}
              <a
                href="mailto:jeff@triple3labs.io"
                className="text-white/80 underline decoration-white/30 underline-offset-2 hover:text-white"
              >
                jeff@triple3labs.io
              </a>
              . Clients may revoke connected-account access at any time as
              described under{" "}
              <Link
                href="#google-user-data"
                className="text-white/80 underline decoration-white/30 underline-offset-2 hover:text-white"
              >
                Google user data
              </Link>
              . Depending on where you live, you may have additional rights under
              applicable privacy laws.
            </p>
          </Section>

          <Section id="children" title="Children's privacy">
            <p>
              Our website and services are intended for businesses and are not
              directed to children under 13. We do not knowingly collect
              personal information from children.
            </p>
          </Section>

          <Section id="changes" title="Changes to this policy">
            <p>
              We may update this policy from time to time. When we do, we will
              revise the &ldquo;Effective&rdquo; date above and, where
              appropriate, provide additional notice. Continued use of our
              website or services after an update constitutes acceptance of the
              revised policy.
            </p>
          </Section>

          <Section id="contact" title="Contact us">
            <p>
              Questions about this policy or our data practices? Email{" "}
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
