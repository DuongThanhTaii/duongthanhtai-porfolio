import { NextRequest, NextResponse } from "next/server";
import { getAdminFromRequest } from "./admin-auth";

export async function requireAdmin(req: NextRequest) {
  const admin = await getAdminFromRequest(req);
  if (!admin) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  return {
    ok: true as const,
    admin,
  };
}

