import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  // Admin pages AND the admin-only API routes: the session refresh has to run
  // on the fetches the admin makes too, otherwise a tab left open past the
  // access-token lifetime posts with a stale token and gets 401 Unauthorized
  // (seen on contract upload). Public routes (stripe webhooks, /sign, contact,
  // onboarding forms, blog) are deliberately left out.
  matcher: [
    "/admin/:path*",
    "/api/accounts/:path*",
    "/api/contacts/:path*",
    "/api/deals/:path*",
    "/api/pipeline/:path*",
    "/api/tickets/:path*",
    "/api/ticket-actions/:path*",
    "/api/command/:path*",
    "/api/mission-control/:path*",
    "/api/ai/:path*",
  ],
};
