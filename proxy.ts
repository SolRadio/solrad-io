import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

const isProtectedRoute = createRouteMatcher([
  "/score-lab(.*)",
  "/alerts(.*)",
  "/wallets(.*)",
]);

export const proxy = clerkMiddleware(async (auth, req: NextRequest) => {
  // Internal job bypass: skip all middleware checks for service-to-service calls
  const internalToken = req.headers.get("x-internal-job-token");
  const expectedToken = process.env.INTERNAL_JOB_TOKEN;
  if (
    internalToken &&
    expectedToken &&
    internalToken === expectedToken
  ) {
    const res = NextResponse.next();
    res.headers.set("x-internal-auth", "1");
    return res;
  }

  // Block admin and command center routes from indexing
  if (
    req.nextUrl.pathname.startsWith("/admin") ||
    req.nextUrl.pathname.startsWith("/solrad-cc-")
  ) {
    const res = NextResponse.next();
    res.headers.set("X-Robots-Tag", "noindex, nofollow");
    return res;
  }

  // Redirect bare domain to www
  const host = req.headers.get("host") || "";
  if (host === "solrad.io") {
    const url = req.nextUrl.clone();
    url.host = "www.solrad.io";
    return NextResponse.redirect(url, 308);
  }

  // Protect specific routes — redirect unauthenticated users to sign-in
  if (isProtectedRoute(req)) {
    await auth.protect();
  }

  const res = NextResponse.next();

  // Security headers for page responses (API routes are excluded by matcher)
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("X-Frame-Options", "DENY");
  res.headers.set("X-XSS-Protection", "1; mode=block");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  res.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()"
  );

  return res;
});

export const config = {
  matcher: [
    "/((?!_next/|api/|favicon\\.ico|robots\\.txt|sitemap\\.xml|.*\\..*).*)",
    "/api/stripe/:path*",
    "/api/user/:path*",
    "/api/admin/:path*",
  ],
};
