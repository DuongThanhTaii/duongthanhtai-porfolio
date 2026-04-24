import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/admin-route";
import { getDb } from "@/db";
import { profiles } from "@/db/schema";
import { destroyCloudinaryResource } from "@/lib/cloudinary";

export async function DELETE(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;

  try {
    const db = getDb();
    const [profile] = await db.select().from(profiles).limit(1);
    if (!profile) {
      return NextResponse.json({ error: "Profile not found." }, { status: 404 });
    }

    if (profile.resumePublicId) {
      await destroyCloudinaryResource(profile.resumePublicId, "raw");
    }

    await db
      .update(profiles)
      .set({
        resumeUrl: null,
        resumePublicId: null,
        updatedAt: new Date(),
      })
      .where(eq(profiles.id, profile.id));

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete resume." },
      { status: 500 }
    );
  }
}

