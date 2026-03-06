import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const inter = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Triple 3 Labs | AI Agents + Automations",
  description:
    "Triple 3 Labs builds intelligent AI agents and automation systems that transform your business operations. Custom AI solutions, workflow automation, and intelligent agents.",
  keywords: [
    "AI agency",
    "AI agents",
    "automation",
    "artificial intelligence",
    "Triple 3 Labs",
  ],
  metadataBase: new URL("https://triple3labs.io"),
  openGraph: {
    title: "Triple 3 Labs | AI Agents + Automations",
    description:
      "We build intelligent AI agents and automation systems that transform your business operations.",
    url: "https://triple3labs.io",
    siteName: "Triple 3 Labs",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Triple 3 Labs | AI Agents + Automations",
    description:
      "We build intelligent AI agents and automation systems that transform your business operations.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${inter.variable} ${spaceGrotesk.variable} antialiased`}
      >
        {children}
        <Toaster theme="dark" position="bottom-right" richColors />
      </body>
    </html>
  );
}
