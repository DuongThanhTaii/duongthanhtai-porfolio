"use client";

import Image from "next/image";
import React, { useEffect, useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";
import { ScrollArea } from "../ui/scroll-area";
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogTrigger,
} from "../ui/responsive-dialog";
import type { ProjectDTO } from "@/types/admin";
import { SectionHeader } from "./section-header";
import SectionWrapper from "../ui/section-wrapper";
import { findTechOption, formatTechLabel } from "@/lib/tech-options";

const ProjectsSection = () => {
  const [projects, setProjects] = useState<ProjectDTO[]>([]);

  useEffect(() => {
    fetch("/api/public/projects")
      .then((res) => res.json())
      .then((data: ProjectDTO[]) => setProjects(data))
      .catch(() => setProjects([]));
  }, []);

  // notify global state when projects are loaded so other UI (like Spline)
  // can coordinate SSR/initial display to avoid flashes
  useEffect(() => {
    if (projects.length === 0) return;
    try {
      // set a global flag and dispatch an event
      (window as any).__projectsLoaded = true;
      window.dispatchEvent(new Event("projects:ready"));
    } catch (e) {}
  }, [projects]);

  if (projects.length === 0) {
    return null;
  }

  return (
    <SectionWrapper id="projects" className="max-w-7xl mx-auto md:h-[130vh]">
      <SectionHeader id="projects" title="Projects" />
      <div className="grid grid-cols-1 md:grid-cols-3">
        {projects.map((project) => (
          <ProjectCard key={project.id ?? project.slug} project={project} />
        ))}
      </div>
    </SectionWrapper>
  );
};

const ProjectCard = ({ project }: { project: ProjectDTO }) => {
  const images = [project.coverImageUrl, ...project.images.map((item) => item.imageUrl)].filter(Boolean) as string[];

  return (
    <div className="flex items-center justify-center">
      <ResponsiveDialog>
        <ResponsiveDialogTrigger className="bg-transparent flex justify-center">
          <div
            className="relative w-[400px] h-auto rounded-lg overflow-hidden"
            style={{ aspectRatio: "3/2" }}
          >
            {project.coverImageUrl ? (
              <Image
                className="absolute w-full h-full top-0 left-0 object-cover hover:scale-[1.05] transition-all"
                src={project.coverImageUrl}
                alt={project.title}
                width={800}
                height={460}
              />
            ) : (
              <div className="absolute inset-0 grid place-items-center bg-zinc-900 text-zinc-400">
                No cover image
              </div>
            )}
            <div className="absolute w-full h-1/2 bottom-0 left-0 bg-gradient-to-t from-background via-background/85 to-transparent pointer-events-none">
              <div className="flex flex-col h-full items-start justify-end p-6">
                <div className="text-lg text-left">{project.title}</div>
                <div className="text-xs bg-primary text-primary-foreground rounded-lg w-fit px-2">
                  {project.category}
                </div>
              </div>
            </div>
          </div>
        </ResponsiveDialogTrigger>

        <ResponsiveDialogContent className="md:max-w-4xl md:h-[85vh] md:!flex md:flex-col md:overflow-hidden md:p-0 md:gap-0">
          <div className="shrink-0 border-b border-border bg-background/80 backdrop-blur-sm px-8 py-5">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4 min-w-0">
                <h4 className="font-display text-xl md:text-2xl font-bold text-foreground tracking-tight truncate">
                  {project.title}
                </h4>
                <span className="shrink-0 text-[11px] uppercase tracking-widest text-muted-foreground border border-border rounded-full px-3 py-0.5">
                  {project.category}
                </span>
              </div>
              <div className="shrink-0 flex items-center gap-4">
                {project.githubUrl ? (
                  <Link
                    href={project.githubUrl}
                    target="_blank"
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2"
                  >
                    Source
                  </Link>
                ) : null}
                <Link href={project.liveUrl} target="_blank">
                  <button className="group flex items-center gap-2 bg-primary text-primary-foreground text-sm font-medium px-4 py-1.5 rounded-full hover:bg-primary/80 transition-colors">
                    Visit
                    <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </button>
                </Link>
              </div>
            </div>
          </div>

          <ScrollArea className="flex-1" type="always" data-lenis-prevent>
            <div className="px-8 py-8">
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 }}
                className="grid gap-6 md:grid-cols-2 mb-10"
              >
                <TechGroup label="Frontend" values={project.frontendTech} />
                <TechGroup label="Backend" values={project.backendTech} />
              </motion.div>

              <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent mb-8" />

              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <p className="mb-4 font-mono text-sm">{project.shortDescription}</p>
                {project.longDescription ? (
                  <p className="mb-6 whitespace-pre-line font-mono text-sm text-zinc-300">
                    {project.longDescription}
                  </p>
                ) : null}

                {images.length > 0 ? (
                  <div className="grid gap-4 md:grid-cols-2">
                    {images.map((image, index) => (
                      <div key={`${project.slug}-${index}`} className="overflow-hidden rounded-lg border border-zinc-800">
                        <Image
                          src={image}
                          alt={`${project.title} screenshot ${index + 1}`}
                          width={900}
                          height={540}
                          className="h-full w-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                ) : null}
              </motion.div>
            </div>
          </ScrollArea>
        </ResponsiveDialogContent>
      </ResponsiveDialog>
    </div>
  );
};

function TechGroup({ label, values }: { label: string; values: string[] }) {
  if (values.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-medium">
        {label}
      </span>
      <div className="flex flex-wrap gap-2">
        {values.map((value) => {
          const item = findTechOption(value);
          return (
            <span
              key={`${label}-${value}`}
              className="inline-flex items-center gap-1 rounded-full border border-zinc-700 bg-zinc-900/70 px-2 py-1 text-xs"
            >
              <span className="text-sm">{item?.icon ?? null}</span>
              {formatTechLabel(value)}
            </span>
          );
        })}
      </div>
    </div>
  );
}

export default ProjectsSection;

