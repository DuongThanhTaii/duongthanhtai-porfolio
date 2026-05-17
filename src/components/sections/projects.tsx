"use client";
import Image from "next/image";
import React from "react";
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogTrigger,
  ResponsiveDialogTitle,
} from "../ui/responsive-dialog";
import { FloatingDock } from "../ui/floating-dock";
import { ScrollArea } from "../ui/scroll-area";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { motion } from "motion/react";

import { PROJECT_SKILLS, type Skill } from "@/data/projects";
import { ProjectDTO, ProjectSection } from "@/types/admin";
import SlideShow from "@/components/slide-show";
import { SectionHeader } from "./section-header";

import SectionWrapper from "../ui/section-wrapper";

const ProjectsSection = ({ projects }: { projects: ProjectDTO[] }) => {
  return (
    <SectionWrapper id="projects" className="max-w-7xl mx-auto md:h-[130vh]">
      <SectionHeader id="projects" title="Projects" />
      <div className="grid grid-cols-1 md:grid-cols-3">
        {projects.map((project) => (
          <ProjectCard key={project.id} project={project} />
        ))}
      </div>
    </SectionWrapper>
  );
};

const ProjectCard = ({ project }: { project: ProjectDTO }) => {
  const mapTechToSkill = (techName: string) => {
    // Attempt to find a matching skill icon from PROJECT_SKILLS based on title
    const found = Object.values(PROJECT_SKILLS).find(
      (skill) => skill.title.toLowerCase() === techName.toLowerCase()
    );
    if (found) return found;
    // Fallback if no matching icon
    return {
      title: techName,
      bg: "black",
      fg: "white",
      icon: <span className="text-xs font-bold">{techName.charAt(0).toUpperCase()}</span>,
    };
  };

  const frontendSkills = project.frontendTech?.map(mapTechToSkill) || [];
  const backendSkills = project.backendTech?.map(mapTechToSkill) || [];

  let sections: ProjectSection[] | null = null;
  try {
    const parsed = JSON.parse(project.longDescription);
    if (Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0] === 'object') {
      sections = parsed as ProjectSection[];
    }
  } catch {
    // legacy string
  }

  return (
    <div className="flex items-center justify-center">
      <ResponsiveDialog>
        <ResponsiveDialogTrigger className="bg-transparent flex justify-center">
          <div
            className="relative w-[400px] h-auto rounded-lg overflow-hidden"
            style={{ aspectRatio: "3/2" }}
          >
            <Image
              className="absolute w-full h-full top-0 left-0 hover:scale-[1.05] transition-all"
              src={project.coverImageUrl || "/assets/projects-screenshots/portfolio/landing.png"}
              alt={project.title}
              width={400}
              height={300}
            />
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
          <ResponsiveDialogTitle className="sr-only">{project.title}</ResponsiveDialogTitle>
          {/* Sticky header */}
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
                {project.githubUrl && (
                  <Link
                    href={project.githubUrl}
                    target="_blank"
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2"
                  >
                    Source
                  </Link>
                )}
                <Link href={project.liveUrl || "#"} target="_blank">
                  <button className="group flex items-center gap-2 bg-primary text-primary-foreground text-sm font-medium px-4 py-1.5 rounded-full hover:bg-primary/80 transition-colors">
                    Visit
                    <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </button>
                </Link>
              </div>
            </div>
          </div>

          {/* Scrollable content */}
          <ScrollArea className="flex-1" type="always" data-lenis-prevent>
            <div className="px-8 py-8">
              {/* Tech stack */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 }}
                className="flex flex-col md:flex-row gap-6 md:gap-10 mb-10"
              >
                {frontendSkills.length > 0 && (
                  <div className="flex flex-col items-center md:items-start gap-2">
                    <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-medium">
                      Frontend
                    </span>
                    <FloatingDock items={frontendSkills} />
                  </div>
                )}
                {backendSkills.length > 0 && (
                  <div className="flex flex-col items-center md:items-start gap-2">
                    <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-medium">
                      Backend
                    </span>
                    <FloatingDock items={backendSkills} />
                  </div>
                )}
              </motion.div>

              {/* Divider */}
              <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent mb-10" />

              {/* Project content */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <div className="space-y-12">
                  {sections ? (
                    sections.map((section, sIdx) => (
                      <div key={section.id || sIdx} className="space-y-6">
                        {section.title && (
                          <h3 className="text-xl md:text-2xl font-bold font-display text-foreground">
                            {section.title}
                          </h3>
                        )}
                        <div className="space-y-4">
                          {section.content?.split("\n").map((paragraph, pIdx) => {
                            if (!paragraph.trim()) return null;
                            return (
                              <p key={pIdx} className="font-mono text-sm leading-relaxed text-foreground/80">
                                {paragraph}
                              </p>
                            );
                          })}
                        </div>
                        {section.buttonText && section.buttonUrl && (
                          <div className="pt-2">
                            <Link href={section.buttonUrl} target="_blank">
                              <button className="group flex items-center gap-2 bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 text-sm font-medium px-4 py-2 rounded-lg transition-colors">
                                {section.buttonText}
                                <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                              </button>
                            </Link>
                          </div>
                        )}
                        {section.images && section.images.length > 0 && (
                          <div className="mt-6">
                            <SlideShow images={section.images} />
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="space-y-4">
                      {project.longDescription?.split("\n").map((paragraph, idx) => {
                        if (!paragraph.trim()) return null;
                        return (
                          <p key={idx} className="font-mono text-sm leading-relaxed text-foreground/80">
                            {paragraph}
                          </p>
                        );
                      })}
                      {project.images && project.images.length > 0 && (
                        <div className="mt-8">
                          <SlideShow
                            images={project.images.map((img) => img.imageUrl).filter(Boolean)}
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          </ScrollArea>
        </ResponsiveDialogContent>
      </ResponsiveDialog>
    </div>
  );
};

export default ProjectsSection;
