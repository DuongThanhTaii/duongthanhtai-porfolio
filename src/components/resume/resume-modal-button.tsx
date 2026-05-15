"use client";

import { useEffect, useState } from "react";
import { File } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  ResponsiveDialog,
  ResponsiveDialogClose,
  ResponsiveDialogContent,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogTrigger,
} from "@/components/ui/responsive-dialog";
import ResumePdfViewer from "@/components/resume/resume-pdf-viewer";

type ResumeModalButtonProps = {
  primaryAvailable: boolean;
  secondaryAvailable: boolean;
};

const RESUME_PDF_SRC = "/api/public/resume";
const RESUME_DATA_SRC = "/api/public/resume-data";

type ResumeSlot = "primary" | "secondary";

export default function ResumeModalButton({
  primaryAvailable,
  secondaryAvailable,
}: ResumeModalButtonProps) {
  const [open, setOpen] = useState(false);
  const [activeSlot, setActiveSlot] = useState<ResumeSlot>(
    primaryAvailable ? "primary" : "secondary",
  );

  const resumeAvailable = primaryAvailable || secondaryAvailable;
  const fallbackSlot: ResumeSlot = primaryAvailable ? "primary" : "secondary";
  const activeSlotAvailable =
    activeSlot === "primary" ? primaryAvailable : secondaryAvailable;
  const resolvedSlot = resumeAvailable
    ? activeSlotAvailable
      ? activeSlot
      : fallbackSlot
    : "primary";
  const pdfSrc = `${RESUME_PDF_SRC}?slot=${resolvedSlot}`;
  const dataSrc = `${RESUME_DATA_SRC}?slot=${resolvedSlot}`;

  useEffect(() => {
    if (activeSlot === "primary" && !primaryAvailable && secondaryAvailable) {
      setActiveSlot("secondary");
      return;
    }
    if (activeSlot === "secondary" && !secondaryAvailable && primaryAvailable) {
      setActiveSlot("primary");
    }
  }, [activeSlot, primaryAvailable, secondaryAvailable]);

  return (
    <ResponsiveDialog open={open} onOpenChange={setOpen}>
      <ResponsiveDialogTrigger asChild>
        <Button className="flex items-center gap-2 w-full">
          <File size={24} />
          <span>Resume</span>
        </Button>
      </ResponsiveDialogTrigger>
      <ResponsiveDialogContent className="w-[min(96vw,72rem)] max-w-none border-zinc-700 bg-zinc-950 text-zinc-100">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>Resume</ResponsiveDialogTitle>
        </ResponsiveDialogHeader>
        {primaryAvailable && secondaryAvailable ? (
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant={resolvedSlot === "primary" ? "default" : "outline"}
              onClick={() => setActiveSlot("primary")}
            >
              Resume 1
            </Button>
            <Button
              type="button"
              variant={resolvedSlot === "secondary" ? "default" : "outline"}
              onClick={() => setActiveSlot("secondary")}
            >
              Resume 2
            </Button>
          </div>
        ) : null}
        <div className="rounded-lg border border-zinc-800 bg-zinc-950/60">
          {resumeAvailable ? (
            <ResumePdfViewer src={dataSrc} />
          ) : (
            <div className="flex h-[70vh] items-center justify-center text-sm text-zinc-400">
              Resume is not uploaded yet.
            </div>
          )}
        </div>
        <div className="flex flex-wrap justify-end gap-2">
          {resumeAvailable ? (
            <Button asChild variant="outline">
              <a href={pdfSrc} download>
                Download PDF
              </a>
            </Button>
          ) : null}
          <ResponsiveDialogClose asChild>
            <Button variant="outline">Close</Button>
          </ResponsiveDialogClose>
        </div>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
