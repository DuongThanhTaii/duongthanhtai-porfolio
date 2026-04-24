import { cn } from "@/lib/utils";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import { Button } from "../ui/button";
import { Download, File } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { usePreloader } from "../preloader";
import { BlurIn, BoxReveal } from "../reveal-animations";
import ScrollDownIcon from "../scroll-down-icon";
import { SiGithub, SiLinkedin, SiX } from "react-icons/si";
import { config } from "@/data/config";
import type { ProfileDTO } from "@/types/admin";
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogTrigger,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "../ui/responsive-dialog";

import SectionWrapper from "../ui/section-wrapper";

const HeroSection = () => {
  const { isLoading } = usePreloader();
  const [profile, setProfile] = useState<ProfileDTO | null>(null);
  const [firstName, ...restNameParts] = config.author.split(" ");
  const lastName = restNameParts.join(" ");

  useEffect(() => {
    fetch("/api/public/profile")
      .then((res) => res.json())
      .then((data: ProfileDTO) => setProfile(data))
      .catch(() => setProfile(null));
  }, []);

  const resumeUrl = profile?.resumeUrl ?? null;
  const resumeViewerUrl = resumeUrl
    ? `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(resumeUrl)}`
    : null;

  return (
    <SectionWrapper id="hero" className={cn("relative w-full h-screen")}>
      <div className="grid md:grid-cols-2">
        <div
          className={cn(
            "h-[calc(100dvh-3rem)] md:h-[calc(100dvh-4rem)] z-[2]",
            "col-span-1",
            "flex flex-col justify-start md:justify-center items-center md:items-start",
            "pt-24 sm:pb-10 md:p-16 lg:p-20 xl:p-24",
          )}
        >
          {!isLoading && (
            <div className="flex flex-col">
              <div>
                <BlurIn delay={0.7}>
                  <p
                    className={cn(
                      "md:self-start mt-4 font-thin text-md text-slate-500 dark:text-zinc-400",
                      "cursor-default font-display sm:text-xl md:text-xl whitespace-nowrap bg-clip-text ",
                    )}
                  >
                    Hi, I am
                    <br className="md:hidden" />
                  </p>
                </BlurIn>

                <BlurIn delay={1}>
                  <Tooltip delayDuration={300}>
                    <TooltipTrigger asChild>
                      <h1
                        className={cn(
                          "-ml-[4px] leading-[0.92] font-thin text-transparent text-slate-800 text-left",
                          "font-thin text-5xl md:text-5xl lg:text-7xl xl:text-8xl",
                          "cursor-default text-edge-outline font-display ",
                        )}
                      >
                        {firstName}
                        <br className="md:block hiidden" />
                        <span className="whitespace-nowrap">{lastName}</span>
                      </h1>
                    </TooltipTrigger>
                    <TooltipContent
                      side="top"
                      className="dark:bg-white dark:text-black"
                    >
                      theres something waiting for you in devtools
                    </TooltipContent>
                  </Tooltip>
                </BlurIn>
                {/* <div className="md:block hidden bg-gradient-to-r from-zinc-300/0 via-zinc-300/50 to-zinc-300/0 w-screen h-px animate-fade-right animate-glow" /> */}
                <BlurIn delay={1.2}>
                  <p
                    className={cn(
                      "md:self-start md:mt-4 font-thin text-md text-slate-500 dark:text-zinc-400",
                      "cursor-default font-display sm:text-xl md:text-xl whitespace-nowrap bg-clip-text ",
                    )}
                  >
                    A Full Stack Web Developer
                  </p>
                </BlurIn>
              </div>
              <div className="mt-6 flex flex-col gap-2 w-fit">
                <ResponsiveDialog>
                  <ResponsiveDialogTrigger asChild>
                    <div className="flex-1">
                      <BoxReveal delay={2} width="100%">
                        <Button className="flex items-center gap-2 w-full">
                          <File size={24} />
                          <p>Resume</p>
                        </Button>
                      </BoxReveal>
                    </div>
                  </ResponsiveDialogTrigger>
                  <ResponsiveDialogContent className="md:max-w-5xl md:h-[85vh] md:p-0 md:gap-0">
                    <div className="flex h-full flex-col">
                      <ResponsiveDialogHeader className="flex items-center justify-center border-b border-border bg-background/80 px-6 py-4">
                        {/* visually-hidden title for accessibility */}
                        <ResponsiveDialogTitle className="sr-only">
                          Resume
                        </ResponsiveDialogTitle>
                        {resumeUrl ? (
                          <a
                            href={resumeUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label="Download resume"
                            title="Download resume"
                            className="inline-flex items-center justify-center rounded-md border border-zinc-600 p-2 hover:bg-zinc-800"
                          >
                            <Download className="h-5 w-5" />
                          </a>
                        ) : null}
                      </ResponsiveDialogHeader>
                      <div className="h-[72vh] md:h-full bg-zinc-950">
                        {resumeUrl ? (
                          <iframe
                            src={resumeViewerUrl ?? resumeUrl}
                            title="Resume PDF"
                            className="h-full w-full"
                            loading="lazy"
                          />
                        ) : (
                          <div className="grid h-full place-items-center text-zinc-400">
                            Resume chưa được upload.
                          </div>
                        )}
                      </div>
                    </div>
                  </ResponsiveDialogContent>
                </ResponsiveDialog>
                <div className="md:self-start flex gap-3">
                  <Tooltip delayDuration={300}>
                    <TooltipTrigger asChild>
                      <Link href={"#contact"}>
                        <Button
                          variant={"outline"}
                          className="block w-full overflow-hidden"
                        >
                          Hire Me
                        </Button>
                      </Link>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                      <p>please 🙏</p>
                    </TooltipContent>
                  </Tooltip>
                  <div className="flex items-center h-full gap-2">
                    <Link href={config.social.twitter} target="_blank">
                      <Button variant={"outline"}>
                        <SiX size={24} />
                      </Button>
                    </Link>
                    <Link
                      href={config.social.github}
                      target="_blank"
                      className="cursor-can-hover"
                    >
                      <Button variant={"outline"}>
                        <SiGithub size={24} />
                      </Button>
                    </Link>
                    <Link
                      href={config.social.linkedin}
                      target="_blank"
                      className="cursor-can-hover"
                    >
                      <Button variant={"outline"}>
                        <SiLinkedin size={24} />
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="grid col-span-1"></div>
      </div>
      <div className="absolute bottom-10 left-[50%] translate-x-[-50%]">
        <ScrollDownIcon />
      </div>
    </SectionWrapper>
  );
};

export default HeroSection;
