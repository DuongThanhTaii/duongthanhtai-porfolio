import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-route";

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;
  return NextResponse.json({ authenticated: true, username: auth.admin.username });
}

