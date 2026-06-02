import { NextRequest, NextResponse } from "next/server";
import { asc } from "drizzle-orm";
import { getDb } from "@/db";
import { experienceItems, experienceSections } from "@/db/schema";
import { requireAdmin } from "@/lib/admin-route";
import { experiencePayloadSchema } from "@/lib/validators/admin";

const normalizeList = (values: string[]) =>
  values.map((value) => value.trim()).filter(Boolean);

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;

  const db = getDb();
  const sections = await db
    .select()
    .from(experienceSections)
    .orderBy(asc(experienceSections.sortOrder), asc(experienceSections.id));
  const items = await db
    .select()
    .from(experienceItems)
    .orderBy(asc(experienceItems.sortOrder), asc(experienceItems.id));

  const result = sections.map((section) => ({
    id: section.id,
    title: section.title,
    sortOrder: section.sortOrder,
    items: items
      .filter((item) => item.sectionId === section.id)
      .map((item) => ({
        id: item.id,
        sectionId: item.sectionId,
        startDate: item.startDate,
        endDate: item.endDate,
        title: item.title,
        company: item.company,
        description: item.description ?? [],
        skills: item.skills ?? [],
        sortOrder: item.sortOrder,
      })),
  }));

  return NextResponse.json(result);
}

export async function PUT(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;

  try {
    const db = getDb();
    const body = await req.json();
    const parsed = experiencePayloadSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.message }, { status: 400 });
    }

    const { sections } = parsed.data;

    await db.transaction(async (tx) => {
      await tx.delete(experienceItems);
      await tx.delete(experienceSections);

      if (sections.length === 0) return;

      const insertedSections = await tx
        .insert(experienceSections)
        .values(
          sections.map((section) => ({
            title: section.title,
            sortOrder: section.sortOrder,
          })),
        )
        .returning();

      const itemsToInsert = sections.flatMap((section, sectionIndex) => {
        const sectionId = insertedSections[sectionIndex]?.id;
        if (!sectionId) return [];
        return section.items.map((item) => ({
          sectionId,
          startDate: item.startDate,
          endDate: item.endDate,
          title: item.title,
          company: item.company,
          description: normalizeList(item.description),
          skills: normalizeList(item.skills),
          sortOrder: item.sortOrder,
        }));
      });

      if (itemsToInsert.length > 0) {
        await tx.insert(experienceItems).values(itemsToInsert);
      }
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to update experience.",
      },
      { status: 500 },
    );
  }
}
