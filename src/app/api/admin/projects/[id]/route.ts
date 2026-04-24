import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { projectImages, projects } from "@/db/schema";
import { requireAdmin } from "@/lib/admin-route";
import { projectInputSchema } from "@/lib/validators/admin";
import { destroyCloudinaryResource } from "@/lib/cloudinary";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(req: NextRequest, context: RouteContext) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;

  const { id } = await context.params;
  const projectId = Number(id);
  if (Number.isNaN(projectId)) {
    return NextResponse.json({ error: "Invalid project id." }, { status: 400 });
  }

  const db = getDb();
  const [project] = await db.select().from(projects).where(eq(projects.id, projectId)).limit(1);
  if (!project) {
    return NextResponse.json({ error: "Project not found." }, { status: 404 });
  }

  const images = await db.select().from(projectImages).where(eq(projectImages.projectId, projectId));

  return NextResponse.json({
    ...project,
    images,
  });
}

export async function PUT(req: NextRequest, context: RouteContext) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;

  const { id } = await context.params;
  const projectId = Number(id);
  if (Number.isNaN(projectId)) {
    return NextResponse.json({ error: "Invalid project id." }, { status: 400 });
  }

  try {
    const db = getDb();
    const body = await req.json();
    const parsed = projectInputSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.message }, { status: 400 });
    }

    const payload = parsed.data;
    const [existingProject] = await db.select().from(projects).where(eq(projects.id, projectId)).limit(1);
    const existingImages = await db.select().from(projectImages).where(eq(projectImages.projectId, projectId));

    await db.transaction(async (tx) => {
      await tx
        .update(projects)
        .set({
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
          updatedAt: new Date(),
        })
        .where(eq(projects.id, projectId));

      await tx.delete(projectImages).where(eq(projectImages.projectId, projectId));

      if (payload.images.length > 0) {
        await tx.insert(projectImages).values(
          payload.images.map((image) => ({
            projectId,
            imageUrl: image.imageUrl,
            imagePublicId: image.imagePublicId ?? null,
            sortOrder: image.sortOrder,
          }))
        );
      }
    });

    const keepImageIds = new Set(payload.images.map((image) => image.imagePublicId).filter(Boolean) as string[]);
    const removedImages = existingImages
      .map((image) => image.imagePublicId)
      .filter((id): id is string => Boolean(id) && !keepImageIds.has(id as string));

    const isCoverRemoved =
      existingProject?.coverImagePublicId &&
      existingProject.coverImagePublicId !== payload.coverImagePublicId;

    await Promise.allSettled([
      ...removedImages.map((id) => destroyCloudinaryResource(id, "image")),
      ...(isCoverRemoved ? [destroyCloudinaryResource(existingProject.coverImagePublicId as string, "image")] : []),
    ]);

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update project." },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest, context: RouteContext) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;

  const { id } = await context.params;
  const projectId = Number(id);
  if (Number.isNaN(projectId)) {
    return NextResponse.json({ error: "Invalid project id." }, { status: 400 });
  }

  const db = getDb();
  const [existingProject] = await db.select().from(projects).where(eq(projects.id, projectId)).limit(1);
  const existingImages = await db.select().from(projectImages).where(eq(projectImages.projectId, projectId));
  await db.delete(projects).where(eq(projects.id, projectId));

  await Promise.allSettled([
    ...(existingProject?.coverImagePublicId
      ? [destroyCloudinaryResource(existingProject.coverImagePublicId, "image")]
      : []),
    ...existingImages
      .map((image) => image.imagePublicId)
      .filter((id): id is string => Boolean(id))
      .map((id) => destroyCloudinaryResource(id, "image")),
  ]);

  return NextResponse.json({ ok: true });
}
