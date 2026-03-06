import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
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
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${inter.variable} ${spaceGrotesk.variable} antialiased grain`}
      >
        {children}
      </body>
    </html>
  );
}
