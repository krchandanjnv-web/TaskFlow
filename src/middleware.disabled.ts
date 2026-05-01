import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth(req => {
  const { nextUrl } = req;
  const isLoggedIn  = !!req.auth;

  const publicPaths = ["/", "/login", "/register"];
  const isPublic    = publicPaths.some(p => nextUrl.pathname === p || nextUrl.pathname.startsWith("/api/auth"));

  if (!isLoggedIn && !isPublic) {
    return NextResponse.redirect(new URL("/login", nextUrl));
  }
  if (isLoggedIn && (nextUrl.pathname === "/login" || nextUrl.pathname === "/register")) {
    return NextResponse.redirect(new URL("/dashboard", nextUrl));
  }
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/auth).*)"],
};
