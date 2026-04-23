import { NextRequest, NextResponse } from "next/server";
import { adminLoginSchema } from "@/lib/validators/admin";
import { adminSessionCookie, createAdminToken, getAdminCredentials } from "@/lib/admin-auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = adminLoginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.message }, { status: 400 });
    }

    const { username, password } = parsed.data;
    const adminCreds = getAdminCredentials();
    const isValid = username === adminCreds.username && password === adminCreds.password;

    if (!isValid) {
      return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
    }

    const token = await createAdminToken({ username });
    const response = NextResponse.json({ ok: true });
    response.cookies.set(adminSessionCookie(token));
    return response;
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Login failed." },
      { status: 500 }
    );
  }
}

