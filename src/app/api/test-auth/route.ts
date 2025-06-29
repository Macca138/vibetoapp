import { NextResponse } from "next/server";

export async function GET() {
  try {
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const response = await fetch(`${baseUrl}/api/auth/providers`);
    const providers = await response.json();
    
    return NextResponse.json({
      status: "success",
      message: "NextAuth is configured correctly",
      providers: providers,
      endpoints: {
        signIn: "/api/auth/signin",
        signOut: "/api/auth/signout",
        session: "/api/auth/session",
        providers: "/api/auth/providers",
      }
    });
  } catch (error) {
    return NextResponse.json({
      status: "error",
      message: "Failed to verify NextAuth configuration",
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}