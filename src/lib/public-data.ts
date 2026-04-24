import { asc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { profiles, projectImages, projects, socialLinks } from "@/db/schema";
import { config } from "@/data/config";
import type { ProfileDTO, ProjectDTO } from "@/types/admin";

const defaultSocialLinks = Object.entries(config.social)
  .filter(([, url]) => typeof url === "string" && url.trim() !== "")
  .map(([platform, url], index) => ({
    platform,
    url,
    isActive: true,
    sortOrder: index,
  }));

export async function getPublicProfile(): Promise<ProfileDTO> {
  try {
    const db = getDb();
    const [profile] = await db.select().from(profiles).limit(1);
    const links = await db
      .select()
      .from(socialLinks)
      .where(eq(socialLinks.isActive, true))
      .orderBy(asc(socialLinks.sortOrder), asc(socialLinks.id));

    if (!profile) {
      return {
        author: config.author,
        role: config.role,
        email: config.email,
        about: "",
        resumeUrl: null,
        resumePublicId: null,
        socialLinks: defaultSocialLinks,
      };
    }

    return {
      id: profile.id,
      author: profile.author,
      role: profile.role,
      email: profile.email,
      about: profile.about ?? "",
      resumeUrl: profile.resumeUrl ?? null,
      resumePublicId: profile.resumePublicId ?? null,
      socialLinks: links,
    };
  } catch {
    return {
      author: config.author,
      role: config.role,
      email: config.email,
      about: "",
      resumeUrl: null,
      resumePublicId: null,
      socialLinks: defaultSocialLinks,
    };
  }
}

export async function getPublicProjects(): Promise<ProjectDTO[]> {
  try {
    const db = getDb();
    const dbProjects = await db
      .select()
      .from(projects)
      .where(eq(projects.isPublished, true))
      .orderBy(asc(projects.sortOrder), asc(projects.id));

    if (dbProjects.length === 0) {
      return [];
    }

    const images = await db
      .select()
      .from(projectImages)
      .orderBy(asc(projectImages.sortOrder), asc(projectImages.id));

    return dbProjects.map((project) => ({
      id: project.id,
      slug: project.slug,
      title: project.title,
      category: project.category,
      shortDescription: project.shortDescription,
      longDescription: project.longDescription,
      coverImageUrl: project.coverImageUrl ?? null,
      coverImagePublicId: project.coverImagePublicId ?? null,
      liveUrl: project.liveUrl,
      githubUrl: project.githubUrl ?? null,
      frontendTech: project.frontendTech ?? [],
      backendTech: project.backendTech ?? [],
      isPublished: project.isPublished,
      sortOrder: project.sortOrder,
      images: images
        .filter((image) => image.projectId === project.id)
        .map((image) => ({
          id: image.id,
          imageUrl: image.imageUrl,
          imagePublicId: image.imagePublicId ?? null,
          sortOrder: image.sortOrder,
        })),
    }));
  } catch {
    return [];
  }
}
