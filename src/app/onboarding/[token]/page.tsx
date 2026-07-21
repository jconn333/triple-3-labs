import type { Metadata } from "next";
import OnboardingClient from "./onboarding-client";

export const metadata: Metadata = {
  title: "Client Onboarding | Triple 3 Labs",
  robots: { index: false, follow: false },
};

export default async function OnboardingPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  return <OnboardingClient token={token} />;
}
