import { getCloudinaryRawUrl } from "@/lib/cloudinary";
import type { ProfileDTO } from "@/types/admin";

export type ResumeSlot = "primary" | "secondary";

export function parseResumeSlot(value?: string | null): ResumeSlot | "any" {
  if (!value) return "any";
  const normalized = value.toLowerCase();
  if (normalized === "1" || normalized === "primary") return "primary";
  if (normalized === "2" || normalized === "secondary") return "secondary";
  return "any";
}

export function getResumeUrl(
  profile: ProfileDTO,
  slot: ResumeSlot,
): string | null {
  const directUrl =
    slot === "secondary" ? profile.resumeUrlSecondary : profile.resumeUrl;
  const publicId =
    slot === "secondary"
      ? profile.resumePublicIdSecondary
      : profile.resumePublicId;

  if (directUrl) {
    const isCloudinary = directUrl.includes("res.cloudinary.com");
    const isRaw = directUrl.includes("/raw/upload/");
    if (!isCloudinary || isRaw) {
      return directUrl;
    }
  }

  if (publicId) {
    return getCloudinaryRawUrl(publicId);
  }

  return directUrl ?? null;
}

export function resolveResumeUrl(
  profile: ProfileDTO,
  slot: ResumeSlot | "any",
): { url: string | null; slot: ResumeSlot | null } {
  if (slot !== "any") {
    const url = getResumeUrl(profile, slot);
    return { url, slot: url ? slot : null };
  }

  const primary = getResumeUrl(profile, "primary");
  if (primary) return { url: primary, slot: "primary" };

  const secondary = getResumeUrl(profile, "secondary");
  if (secondary) return { url: secondary, slot: "secondary" };

  return { url: null, slot: null };
}
