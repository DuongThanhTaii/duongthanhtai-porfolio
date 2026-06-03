import { NextRequest, NextResponse } from "next/server";
import { getPublicProfile } from "@/lib/public-data";
import { getCloudinaryRawUrl } from "@/lib/cloudinary";
import { parseResumeSlot, resolveResumeUrl } from "@/lib/resume";

export async function GET(req: NextRequest) {
  const profile = await getPublicProfile();
  const slot = parseResumeSlot(new URL(req.url).searchParams.get("slot"));
  const { url: resumeUrl } = resolveResumeUrl(profile, slot);

  if (!resumeUrl) {
    return NextResponse.json(
      { error: "Resume not available." },
      { status: 404 },
    );
  }

  const publicId =
    slot === "secondary"
      ? profile.resumePublicIdSecondary
      : profile.resumePublicId;
  const fallbackUrl = publicId ? getCloudinaryRawUrl(publicId) : null;

  async function fetchUpstream(url: string) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);
    const response = await fetch(url, {
      cache: "no-store",
      signal: controller.signal,
      headers: {
        Accept: "application/pdf",
        "User-Agent": "Mozilla/5.0",
      },
    });
    clearTimeout(timeoutId);
    return response;
  }

  let upstream: Response;
  try {
    upstream = await fetchUpstream(resumeUrl);
  } catch {
    return NextResponse.json(
      { error: "Resume upstream timeout." },
      { status: 504 },
    );
  }

  if (!upstream.ok && fallbackUrl && fallbackUrl !== resumeUrl) {
    try {
      upstream = await fetchUpstream(fallbackUrl);
    } catch {
      return NextResponse.json(
        { error: "Resume upstream timeout." },
        { status: 504 },
      );
    }
  }

  if (!upstream.ok) {
    return NextResponse.json(
      { error: "Failed to load resume.", status: upstream.status, statusText: upstream.statusText, url: resumeUrl, fallbackUrl },
      { status: 502 },
    );
  }

  let buffer = Buffer.from(await upstream.arrayBuffer());
  if (buffer.length === 0 && fallbackUrl && fallbackUrl !== resumeUrl) {
    try {
      const retry = await fetchUpstream(fallbackUrl);
      if (retry.ok) {
        buffer = Buffer.from(await retry.arrayBuffer());
      }
    } catch {
      // ignore retry errors
    }
  }

  if (buffer.length === 0) {
    return NextResponse.json(
      { error: "Resume file is empty." },
      { status: 502 },
    );
  }
  return NextResponse.json({ data: buffer.toString("base64") });
}
