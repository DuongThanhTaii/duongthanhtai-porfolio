import { NextResponse } from "next/server";
import { getPublicProjects } from "@/lib/public-data";

export async function GET() {
  const projects = await getPublicProjects();
  return NextResponse.json(projects);
}

