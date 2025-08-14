import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

export default async function middleware(request: NextRequest) {
  const sessionCookie = getSessionCookie(request);

  const isProtectedRoute = request.nextUrl.pathname.startsWith("/chat");

  if (isProtectedRoute && !sessionCookie) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!.*\\..*|_next|api/auth).*)", "/", "/trpc(.*)"],
};
