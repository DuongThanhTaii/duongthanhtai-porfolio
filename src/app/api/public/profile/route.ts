import { NextResponse } from "next/server";
import { getPublicProfile } from "@/lib/public-data";

export async function GET() {
  const profile = await getPublicProfile();
  return NextResponse.json(profile);
}

