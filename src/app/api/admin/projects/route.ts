import { NextRequest, NextResponse } from "next/server";
import { asc } from "drizzle-orm";
import { getDb } from "@/db";
import { projectImages, projects } from "@/db/schema";
import { requireAdmin } from "@/lib/admin-route";
import { projectInputSchema } from "@/lib/validators/admin";

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;

  const db = getDb();
  const dbProjects = await db.select().from(projects).orderBy(asc(projects.sortOrder), asc(projects.id));
  const images = await db.select().from(projectImages).orderBy(asc(projectImages.sortOrder), asc(projectImages.id));

  const result = dbProjects.map((project) => ({
    ...project,
    images: images.filter((image) => image.projectId === project.id),
  }));

  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;

  try {
    const db = getDb();
    const body = await req.json();
    const parsed = projectInputSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.message }, { status: 400 });
    }

    const payload = parsed.data;

    const [created] = await db
      .insert(projects)
      .values({
        slug: payload.slug,
        title: payload.title,
        category: payload.category,
        shortDescription: payload.shortDescription,
        longDescription: payload.longDescription,
        coverImageUrl: payload.coverImageUrl ?? null,
        coverImagePublicId: payload.coverImagePublicId ?? null,
        liveUrl: payload.liveUrl,
        githubUrl: payload.githubUrl || null,
        frontendTech: payload.frontendTech,
        backendTech: payload.backendTech,
        isPublished: payload.isPublished,
        sortOrder: payload.sortOrder,
      })
      .returning();

    if (payload.images.length > 0) {
      await db.insert(projectImages).values(
        payload.images.map((image) => ({
          projectId: created.id,
          imageUrl: image.imageUrl,
          imagePublicId: image.imagePublicId ?? null,
          sortOrder: image.sortOrder,
        }))
      );
    }

    return NextResponse.json({ ok: true, id: created.id });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create project." },
      { status: 500 }
    );
  }
}
