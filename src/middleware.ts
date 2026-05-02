import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;

  // Always public — never block these
  if (
    path.startsWith("/api/auth") ||
    path.startsWith("/_next") ||
    path === "/" ||
    path === "/login" ||
    path === "/register" ||
    path === "/favicon.ico" ||
    path.includes(".")
  ) {
    return NextResponse.next();
  }

  // Check JWT token directly — zero DB calls, works on edge
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (!token) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", path);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
