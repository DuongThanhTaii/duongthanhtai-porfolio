"use client";

import { useEffect, useMemo, useState } from "react";
import { EXPERIENCE, SkillNames, SKILLS } from "@/data/constants";
import { SectionHeader } from "./section-header";
import { Badge } from "../ui/badge";
import { cn } from "@/lib/utils";
import SectionWrapper from "../ui/section-wrapper";
import { motion } from "motion/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type ExperienceItem = {
  id?: number | string;
  startDate: string;
  endDate: string;
  title: string;
  company: string;
  description: string[];
  skills: string[];
  sortOrder: number;
};

type ExperienceSectionData = {
  id?: number | string;
  title: string;
  sortOrder: number;
  items: ExperienceItem[];
};

const fallbackSections: ExperienceSectionData[] = [
  {
    id: "fallback",
    title: "Experience",
    sortOrder: 0,
    items: EXPERIENCE.map((exp, index) => ({
      id: exp.id,
      startDate: exp.startDate,
      endDate: exp.endDate,
      title: exp.title,
      company: exp.company,
      description: exp.description,
      skills: exp.skills,
      sortOrder: index,
    })),
  },
];

const ExperienceSection = () => {
  const [sections, setSections] = useState<ExperienceSectionData[]>(
    fallbackSections,
  );

  useEffect(() => {
    let active = true;

    async function loadExperience() {
      try {
        const response = await fetch("/api/public/experience", {
          cache: "no-store",
        });
        if (!response.ok) return;
        const data = (await response.json()) as ExperienceSectionData[];
        if (!active || !Array.isArray(data) || data.length === 0) return;
        setSections(data);
      } catch {
        // Keep fallback content if the request fails.
      }
    }

    loadExperience();
    return () => {
      active = false;
    };
  }, []);

  const orderedSections = useMemo(() => {
    return [...sections]
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
      .map((section) => ({
        ...section,
        items: [...section.items].sort(
          (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0),
        ),
      }));
  }, [sections]);

  return (
    <SectionWrapper
      className="flex flex-col items-center justify-center min-h-[120vh] py-20 z-10"
    >
      <div className="w-full max-w-4xl px-4 md:px-8 mx-auto">
        <SectionHeader
          id="experience"
          title="Experience"
          desc="My professional journey."
          className="mb-12 md:mb-20 mt-0"
        />

        <div className="flex flex-col gap-10 md:gap-14">
          {orderedSections.map((section) => (
            <div key={section.id ?? section.title} className="relative">
              <div className="mb-6 flex items-center gap-3">
                <span className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                  {section.title}
                </span>
                <span className="h-px flex-1 bg-border/70" />
              </div>

              <div className="flex flex-col gap-8 md:gap-12 relative">
                <div className="absolute left-8 md:left-1/2 top-4 bottom-4 w-px bg-border hidden md:block -translate-x-1/2" />

                {section.items.map((exp, index) => (
                  <div key={exp.id ?? `${section.title}-${index}`} className="relative">
                    <ExperienceCard experience={exp} index={index} />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </SectionWrapper>
  );
};

const ExperienceCard = ({
  experience,
  index,
}: {
  experience: ExperienceItem;
  index: number;
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.4,
        delay: index * 0.1,
        ease: "easeOut",
      }}
      viewport={{ once: true, margin: "-50px" }}
    >
      <Card
        className={cn(
          "bg-card text-card-foreground border-border",
          "hover:border-primary/20 transition-colors duration-300",
          "shadow-sm hover:shadow-md"
        )}
      >
        <CardHeader className="pb-3">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div className="space-y-1">
              <CardTitle className="text-xl font-bold tracking-tight">
                {experience.title}
              </CardTitle>
              <div className="text-base font-medium text-muted-foreground">
                {experience.company}
              </div>
            </div>
            <Badge variant="secondary" className="w-fit font-mono text-xs font-normal">
              {experience.startDate} - {experience.endDate}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <ul className="list-disc list-outside ml-4 space-y-2 text-base text-muted-foreground leading-relaxed">
            {experience.description.map((point, i) => (
              <li key={i}>{point}</li>
            ))}
          </ul>

          <div className="flex flex-wrap gap-2">
            {experience.skills.map((skillName) => {
              const skill = SKILLS[skillName as SkillNames];
              return (
                <Badge
                  key={skillName}
                  variant="outline"
                  className="gap-2 text-xs font-normal bg-secondary/30 hover:bg-secondary/50 transition-colors border-transparent"
                >
                  {skill ? (
                    <img
                      src={skill.icon}
                      alt={skill.label}
                      className="w-3.5 h-3.5 object-contain opacity-80"
                    />
                  ) : null}
                  {skill?.label ?? skillName}
                </Badge>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default ExperienceSection;
