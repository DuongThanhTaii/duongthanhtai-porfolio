import Link from "next/link";
import { getPublicProfile } from "@/lib/public-data";
import ResumePdfViewer from "@/components/resume/resume-pdf-viewer";
import { parseResumeSlot, resolveResumeUrl } from "@/lib/resume";

type ResumePageProps = {
  searchParams?: { slot?: string };
};

export default async function ResumePage({ searchParams }: ResumePageProps) {
  const profile = await getPublicProfile();
  const slot = parseResumeSlot(searchParams?.slot);
  const { url: resumeUrl, slot: resolvedSlot } = resolveResumeUrl(
    profile,
    slot,
  );

  if (!resumeUrl) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-24 text-zinc-200">
        <h1 className="text-3xl font-bold">Resume</h1>
        <p className="mt-3 text-zinc-400">Resume is not uploaded yet.</p>
        <Link
          href="/"
          className="mt-4 inline-block text-cyan-400 hover:underline"
        >
          Back to home
        </Link>
      </main>
    );
  }

  const viewerSrc = resolvedSlot
    ? `/api/public/resume-data?slot=${resolvedSlot}`
    : "/api/public/resume-data";
  const downloadHref = resolvedSlot
    ? `/api/public/resume?slot=${resolvedSlot}`
    : "/api/public/resume";

  return (
    <main className="mx-auto max-w-6xl px-4 py-16 text-zinc-200">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-bold">Resume</h1>
        <a
          href={downloadHref}
          className="inline-flex items-center justify-center rounded-full border border-cyan-300/40 bg-cyan-500/10 px-4 py-2 text-sm font-semibold text-cyan-200 transition hover:border-cyan-300/70 hover:bg-cyan-500/20"
        >
          Download PDF
        </a>
      </div>
      <div className="max-h-[85vh] overflow-auto rounded-xl border border-zinc-700 bg-zinc-950 p-4">
        <ResumePdfViewer src={viewerSrc} />
      </div>
    </main>
  );
}
