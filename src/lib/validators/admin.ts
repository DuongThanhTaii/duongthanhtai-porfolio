import { z } from "zod";

const urlSchema = z
  .string()
  .url("Invalid URL format")
  .refine((value) => /^https?:\/\//i.test(value), "URL must start with http:// or https://");

export const adminLoginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

export const socialLinkSchema = z.object({
  platform: z.string().min(1).max(50),
  url: urlSchema,
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().min(0).default(0),
});

export const profileUpdateSchema = z.object({
  author: z.string().min(2).max(150),
  role: z.string().min(2).max(150),
  email: z.string().email(),
  about: z.string().max(5000).default(""),
  resumeUrl: z.string().url().nullable().optional(),
  resumePublicId: z.string().nullable().optional(),
  socialLinks: z.array(socialLinkSchema).default([]),
});

export const projectInputSchema = z.object({
  slug: z
    .string()
    .min(3)
    .max(180)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase and hyphenated."),
  title: z.string().min(2).max(180),
  category: z.string().min(2).max(100),
  shortDescription: z.string().min(10).max(500),
  longDescription: z.string().max(5000).default(""),
  coverImageUrl: z.string().url().nullable().optional(),
  coverImagePublicId: z.string().nullable().optional(),
  liveUrl: urlSchema,
  githubUrl: z.union([urlSchema, z.literal(""), z.null()]).optional(),
  frontendTech: z.array(z.string().min(1).max(60)).default([]),
  backendTech: z.array(z.string().min(1).max(60)).default([]),
  isPublished: z.boolean().default(true),
  sortOrder: z.number().int().min(0).default(0),
  images: z
    .array(
      z.object({
        id: z.number().int().optional(),
        imageUrl: z.string().url(),
        imagePublicId: z.string().nullable().optional(),
        sortOrder: z.number().int().min(0).default(0),
      })
    )
    .default([]),
});

