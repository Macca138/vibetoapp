import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware() {
    // Middleware logic if needed
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // For database sessions, check if the session cookie exists
        return !!req.cookies.get("next-auth.session-token") || !!token;
      },
    },
  }
);

// Protect these routes
export const config = {
  matcher: [
    "/dashboard/:path*",
    "/projects/:path*",
    "/workflow/:path*",
  ],
};