import { NextResponse, type NextRequest } from "next/server";
import { getAdminCookieName, verifyAdminToken } from "@/lib/admin-auth";

const PUBLIC_ADMIN_PATHS = ["/admin/login", "/api/admin/auth/login"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const needsAdmin = pathname.startsWith("/admin") || pathname.startsWith("/api/admin");

  if (!needsAdmin) {
    return NextResponse.next();
  }

  if (PUBLIC_ADMIN_PATHS.includes(pathname)) {
    return NextResponse.next();
  }

  const token = req.cookies.get(getAdminCookieName())?.value;
  if (!token) {
    if (pathname.startsWith("/api/admin")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const loginUrl = new URL("/admin/login", req.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  try {
    await verifyAdminToken(token);
    return NextResponse.next();
  } catch {
    if (pathname.startsWith("/api/admin")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/admin/login", req.url));
  }
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};

