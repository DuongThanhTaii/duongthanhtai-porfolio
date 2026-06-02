export type SocialLinkDTO = {
  id?: number;
  platform: string;
  url: string;
  isActive: boolean;
  sortOrder: number;
};

export type ProfileDTO = {
  id?: number;
  author: string;
  role: string;
  email: string;
  about: string;
  resumeUrl: string | null;
  resumePublicId: string | null;
  resumeUrlSecondary: string | null;
  resumePublicIdSecondary: string | null;
  socialLinks: SocialLinkDTO[];
};

export type ProjectImageDTO = {
  id?: number;
  imageUrl: string;
  imagePublicId: string | null;
  sortOrder: number;
};

export type ProjectDTO = {
  id?: number;
  slug: string;
  title: string;
  category: string;
  shortDescription: string;
  longDescription: string;
  coverImageUrl: string | null;
  coverImagePublicId: string | null;
  liveUrl: string;
  githubUrl: string | null;
  frontendTech: string[];
  backendTech: string[];
  isPublished: boolean;
  sortOrder: number;
  images: ProjectImageDTO[];
};

export type ProjectSection = {
  id: string;
  title: string;
  content: string;
  images: string[];
  buttonText?: string;
  buttonUrl?: string;
};

export type ExperienceItemDTO = {
  id?: number;
  sectionId?: number;
  startDate: string;
  endDate: string;
  title: string;
  company: string;
  description: string[];
  skills: string[];
  sortOrder: number;
};

export type ExperienceSectionDTO = {
  id?: number;
  title: string;
  sortOrder: number;
  items: ExperienceItemDTO[];
};
