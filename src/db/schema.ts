import {
  boolean,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const profiles = pgTable("profiles", {
  id: serial("id").primaryKey(),
  author: varchar("author", { length: 150 }).notNull(),
  role: varchar("role", { length: 150 }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  about: text("about").default(""),
  resumeUrl: text("resume_url"),
  resumePublicId: varchar("resume_public_id", { length: 255 }),
  resumeUrlSecondary: text("resume_url_secondary"),
  resumePublicIdSecondary: varchar("resume_public_id_secondary", {
    length: 255,
  }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const socialLinks = pgTable(
  "social_links",
  {
    id: serial("id").primaryKey(),
    platform: varchar("platform", { length: 50 }).notNull(),
    url: text("url").notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    sortOrder: integer("sort_order").default(0).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    platformIdx: uniqueIndex("social_links_platform_idx").on(table.platform),
  }),
);

export const projects = pgTable(
  "projects",
  {
    id: serial("id").primaryKey(),
    slug: varchar("slug", { length: 180 }).notNull(),
    title: varchar("title", { length: 180 }).notNull(),
    category: varchar("category", { length: 100 }).notNull(),
    shortDescription: text("short_description").notNull(),
    longDescription: text("long_description").default("").notNull(),
    coverImageUrl: text("cover_image_url"),
    coverImagePublicId: varchar("cover_image_public_id", { length: 255 }),
    liveUrl: text("live_url").notNull(),
    githubUrl: text("github_url"),
    frontendTech: text("frontend_tech").array().default([]).notNull(),
    backendTech: text("backend_tech").array().default([]).notNull(),
    isPublished: boolean("is_published").default(true).notNull(),
    sortOrder: integer("sort_order").default(0).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    slugIdx: uniqueIndex("projects_slug_idx").on(table.slug),
  }),
);

export const projectImages = pgTable("project_images", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  imageUrl: text("image_url").notNull(),
  imagePublicId: varchar("image_public_id", { length: 255 }),
  sortOrder: integer("sort_order").default(0).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const experienceSections = pgTable("experience_sections", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 120 }).notNull(),
  sortOrder: integer("sort_order").default(0).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const experienceItems = pgTable("experience_items", {
  id: serial("id").primaryKey(),
  sectionId: integer("section_id")
    .notNull()
    .references(() => experienceSections.id, { onDelete: "cascade" }),
  startDate: varchar("start_date", { length: 40 }).notNull(),
  endDate: varchar("end_date", { length: 40 }).notNull(),
  title: varchar("title", { length: 180 }).notNull(),
  company: varchar("company", { length: 180 }).notNull(),
  description: text("description").array().default([]).notNull(),
  skills: text("skills").array().default([]).notNull(),
  sortOrder: integer("sort_order").default(0).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const projectsRelations = relations(projects, ({ many }) => ({
  images: many(projectImages),
}));

export const projectImagesRelations = relations(projectImages, ({ one }) => ({
  project: one(projects, {
    fields: [projectImages.projectId],
    references: [projects.id],
  }),
}));

export const experienceSectionsRelations = relations(
  experienceSections,
  ({ many }) => ({
    items: many(experienceItems),
  }),
);

export const experienceItemsRelations = relations(
  experienceItems,
  ({ one }) => ({
    section: one(experienceSections, {
      fields: [experienceItems.sectionId],
      references: [experienceSections.id],
    }),
  }),
);
