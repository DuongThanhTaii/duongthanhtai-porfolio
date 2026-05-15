import { NextRequest, NextResponse } from "next/server";
import { asc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { profiles, socialLinks } from "@/db/schema";
import { requireAdmin } from "@/lib/admin-route";
import { profileUpdateSchema } from "@/lib/validators/admin";
import { getPublicProfile } from "@/lib/public-data";
import { destroyCloudinaryResource } from "@/lib/cloudinary";

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;

  const profile = await getPublicProfile();
  return NextResponse.json(profile);
}

export async function PUT(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;

  try {
    const db = getDb();
    const body = await req.json();
    const parsed = profileUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.message },
        { status: 400 },
      );
    }

    const payload = parsed.data;

    // read existing profile before update so we can clean up old resume
    const [existingProfile] = await db.select().from(profiles).limit(1);

    await db.transaction(async (tx) => {
      const [existing] = await tx.select().from(profiles).limit(1);

      if (!existing) {
        await tx.insert(profiles).values({
          author: payload.author,
          role: payload.role,
          email: payload.email,
          about: payload.about,
          resumeUrl: payload.resumeUrl ?? null,
          resumePublicId: payload.resumePublicId ?? null,
          resumeUrlSecondary: payload.resumeUrlSecondary ?? null,
          resumePublicIdSecondary: payload.resumePublicIdSecondary ?? null,
        });
      } else {
        await tx
          .update(profiles)
          .set({
            author: payload.author,
            role: payload.role,
            email: payload.email,
            about: payload.about,
            resumeUrl: payload.resumeUrl ?? null,
            resumePublicId: payload.resumePublicId ?? null,
            resumeUrlSecondary: payload.resumeUrlSecondary ?? null,
            resumePublicIdSecondary: payload.resumePublicIdSecondary ?? null,
            updatedAt: new Date(),
          })
          .where(eq(profiles.id, existing.id));
      }

      await tx.delete(socialLinks);

      if (payload.socialLinks.length > 0) {
        await tx.insert(socialLinks).values(
          payload.socialLinks.map((link) => ({
            platform: link.platform,
            url: link.url,
            isActive: link.isActive,
            sortOrder: link.sortOrder,
          })),
        );
      }
    });

    const [profile] = await db.select().from(profiles).limit(1);

    // If resume was replaced, attempt to delete the old resource from Cloudinary
    try {
      if (
        existingProfile &&
        existingProfile.resumePublicId &&
        existingProfile.resumePublicId !== payload.resumePublicId
      ) {
        await destroyCloudinaryResource(existingProfile.resumePublicId, "raw");
      }
      if (
        existingProfile &&
        existingProfile.resumePublicIdSecondary &&
        existingProfile.resumePublicIdSecondary !==
          payload.resumePublicIdSecondary
      ) {
        await destroyCloudinaryResource(
          existingProfile.resumePublicIdSecondary,
          "raw",
        );
      }
    } catch (e) {
      // log and continue; don't block the response on cleanup failures
      console.warn("Failed to destroy old resume resource", e);
    }
    const links = await db
      .select()
      .from(socialLinks)
      .orderBy(asc(socialLinks.sortOrder), asc(socialLinks.id));

    return NextResponse.json({
      id: profile?.id,
      author: profile?.author ?? "",
      role: profile?.role ?? "",
      email: profile?.email ?? "",
      about: profile?.about ?? "",
      resumeUrl: profile?.resumeUrl ?? null,
      resumePublicId: profile?.resumePublicId ?? null,
      resumeUrlSecondary: profile?.resumeUrlSecondary ?? null,
      resumePublicIdSecondary: profile?.resumePublicIdSecondary ?? null,
      socialLinks: links,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to update profile.",
      },
      { status: 500 },
    );
  }
}
