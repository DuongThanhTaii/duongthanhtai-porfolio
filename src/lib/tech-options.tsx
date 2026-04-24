import type { ReactNode } from "react";
import {
  SiChakraui,
  SiDocker,
  SiExpress,
  SiFirebase,
  SiJavascript,
  SiMongodb,
  SiPostgresql,
  SiPrisma,
  SiPython,
  SiReactquery,
  SiSanity,
  SiShadcnui,
  SiSocketdotio,
  SiSupabase,
  SiTailwindcss,
  SiThreedotjs,
  SiTypescript,
  SiVuedotjs,
} from "react-icons/si";
import { TbBrandFramerMotion } from "react-icons/tb";
import { RiNextjsFill, RiNodejsFill, RiReactjsFill } from "react-icons/ri";

export type TechOption = {
  key: string;
  label: string;
  icon: ReactNode;
  group: "frontend" | "backend";
};

export const TECH_OPTIONS: TechOption[] = [
  { key: "nextjs", label: "Next.js", icon: <RiNextjsFill />, group: "frontend" },
  { key: "react", label: "React", icon: <RiReactjsFill />, group: "frontend" },
  { key: "typescript", label: "TypeScript", icon: <SiTypescript />, group: "frontend" },
  { key: "javascript", label: "JavaScript", icon: <SiJavascript />, group: "frontend" },
  { key: "tailwind", label: "Tailwind", icon: <SiTailwindcss />, group: "frontend" },
  { key: "chakra", label: "Chakra UI", icon: <SiChakraui />, group: "frontend" },
  { key: "vue", label: "Vue", icon: <SiVuedotjs />, group: "frontend" },
  { key: "react-query", label: "React Query", icon: <SiReactquery />, group: "frontend" },
  { key: "shadcn", label: "Shadcn", icon: <SiShadcnui />, group: "frontend" },
  { key: "spline", label: "Spline/3D", icon: <SiThreedotjs />, group: "frontend" },
  { key: "framer-motion", label: "Framer Motion", icon: <TbBrandFramerMotion />, group: "frontend" },
  { key: "nodejs", label: "Node.js", icon: <RiNodejsFill />, group: "backend" },
  { key: "express", label: "Express", icon: <SiExpress />, group: "backend" },
  { key: "postgresql", label: "PostgreSQL", icon: <SiPostgresql />, group: "backend" },
  { key: "mongodb", label: "MongoDB", icon: <SiMongodb />, group: "backend" },
  { key: "prisma", label: "Prisma", icon: <SiPrisma />, group: "backend" },
  { key: "python", label: "Python", icon: <SiPython />, group: "backend" },
  { key: "docker", label: "Docker", icon: <SiDocker />, group: "backend" },
  { key: "socketio", label: "Socket.IO", icon: <SiSocketdotio />, group: "backend" },
  { key: "firebase", label: "Firebase", icon: <SiFirebase />, group: "backend" },
  { key: "supabase", label: "Supabase", icon: <SiSupabase />, group: "backend" },
  { key: "sanity", label: "Sanity", icon: <SiSanity />, group: "backend" },
];

export function normalizeTechKey(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, "-");
}

const TECH_ALIASES: Record<string, string> = {
  next: "nextjs",
  ts: "typescript",
  js: "javascript",
  node: "nodejs",
  postgres: "postgresql",
  mongo: "mongodb",
  sockerio: "socketio",
  "framermotion": "framer-motion",
};

export function findTechOption(key: string) {
  const normalized = normalizeTechKey(key);
  const resolvedKey = TECH_ALIASES[normalized] ?? normalized;
  return TECH_OPTIONS.find((item) => item.key === resolvedKey);
}

export function formatTechLabel(value: string) {
  const match = findTechOption(value);
  if (match) return match.label;
  return value;
}
