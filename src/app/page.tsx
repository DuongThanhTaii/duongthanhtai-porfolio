import React from "react";
import SmoothScroll from "@/components/smooth-scroll";
import { cn } from "@/lib/utils";
import AnimatedBackground from "@/components/animated-background";
import SkillsSection from "@/components/sections/skills";
import ExperienceSection from "@/components/sections/experience";
import ProjectsSection from "@/components/sections/projects";
import ContactSection from "@/components/sections/contact";
import HeroSection from "@/components/sections/hero";
import { getCloudinaryRawUrl } from "@/lib/cloudinary";
import { getPublicProfile } from "@/lib/public-data";

export default async function MainPage() {
  const profile = await getPublicProfile();
  const resumeUrl =
    profile.resumeUrl ??
    (profile.resumePublicId
      ? getCloudinaryRawUrl(profile.resumePublicId)
      : null);
  const resumeSecondaryUrl =
    profile.resumeUrlSecondary ??
    (profile.resumePublicIdSecondary
      ? getCloudinaryRawUrl(profile.resumePublicIdSecondary)
      : null);

  return (
    <SmoothScroll>
      <AnimatedBackground />
      <main
        className={cn("bg-slate-100 dark:bg-transparent canvas-overlay-mode")}
      >
        <HeroSection
          primaryResumeAvailable={Boolean(resumeUrl)}
          secondaryResumeAvailable={Boolean(resumeSecondaryUrl)}
        />
        <SkillsSection />
        <ExperienceSection />
        <ProjectsSection />
        <ContactSection />
      </main>
    </SmoothScroll>
  );
}
