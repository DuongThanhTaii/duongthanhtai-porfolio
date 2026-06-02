import { NextResponse } from "next/server";
import { getPublicExperience } from "@/lib/public-data";

export async function GET() {
  const experience = await getPublicExperience();
  return NextResponse.json(experience);
}
