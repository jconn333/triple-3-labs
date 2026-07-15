import type { Metadata } from "next";
import SigningClient from "./signing-client";

export const metadata: Metadata = {
  title: "Sign Document | Triple 3 Labs",
  robots: { index: false, follow: false },
};

export default async function SignPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  return <SigningClient token={token} />;
}
