import { NextRequest, NextResponse } from "next/server";
import { getPublicProfile } from "@/lib/public-data";
import { getCloudinaryRawUrl } from "@/lib/cloudinary";
import { parseResumeSlot, resolveResumeUrl } from "@/lib/resume";

export async function GET(req: NextRequest) {
  const profile = await getPublicProfile();
  const slot = parseResumeSlot(new URL(req.url).searchParams.get("slot"));
  const { url: resumeUrl, slot: resolvedSlot } = resolveResumeUrl(
    profile,
    slot,
  );

  if (!resumeUrl) {
    return NextResponse.json(
      { error: "Resume not available." },
      { status: 404 },
    );
  }

  const publicId =
    resolvedSlot === "secondary"
      ? profile.resumePublicIdSecondary
      : profile.resumePublicId;
  const fallbackUrl = publicId ? getCloudinaryRawUrl(publicId) : null;
  async function fetchUpstream(url: string) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);
    const headers: Record<string, string> = {
      Accept: "application/pdf",
      "User-Agent": "Mozilla/5.0",
    };
    const response = await fetch(url, {
      cache: "no-store",
      signal: controller.signal,
      headers,
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
      { error: "Failed to load resume." },
      { status: 502 },
    );
  }

  const contentType = "application/pdf";
  let buffer = await upstream.arrayBuffer();
  if (buffer.byteLength === 0 && fallbackUrl && fallbackUrl !== resumeUrl) {
    try {
      const retry = await fetchUpstream(fallbackUrl);
      if (retry.ok) {
        buffer = await retry.arrayBuffer();
      }
    } catch {
      // ignore retry errors
    }
  }

  if (buffer.byteLength === 0) {
    return NextResponse.json(
      { error: "Resume file is empty." },
      { status: 502 },
    );
  }
  const fileName = resolvedSlot === "secondary" ? "resume-2.pdf" : "resume.pdf";
  const responseHeaders = new Headers({
    "Content-Type": contentType,
    "Content-Disposition": `inline; filename=${fileName}`,
    "Cache-Control": "no-store",
  });
  responseHeaders.set("Content-Length", buffer.byteLength.toString());

  return new NextResponse(buffer, {
    status: 200,
    headers: responseHeaders,
  });
}

export async function HEAD(req: NextRequest) {
  const profile = await getPublicProfile();
  const slot = parseResumeSlot(new URL(req.url).searchParams.get("slot"));
  const { url: resumeUrl, slot: resolvedSlot } = resolveResumeUrl(
    profile,
    slot,
  );

  if (!resumeUrl) {
    return new NextResponse(null, { status: 404 });
  }

  let upstream: Response;
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);
    upstream = await fetch(resumeUrl, {
      cache: "no-store",
      signal: controller.signal,
      method: "HEAD",
    });
    clearTimeout(timeoutId);
  } catch {
    return new NextResponse(null, { status: 504 });
  }

  if (!upstream.ok) {
    return new NextResponse(null, { status: 502 });
  }

  const fileName = resolvedSlot === "secondary" ? "resume-2.pdf" : "resume.pdf";
  const headers = new Headers({
    "Content-Type": "application/pdf",
    "Content-Disposition": `inline; filename=${fileName}`,
    "Cache-Control": "no-store",
  });

  const contentLength = upstream.headers.get("content-length");
  if (contentLength) headers.set("Content-Length", contentLength);
  const acceptRanges = upstream.headers.get("accept-ranges");
  headers.set("Accept-Ranges", acceptRanges ?? "bytes");

  return new NextResponse(null, { status: 200, headers });
}
