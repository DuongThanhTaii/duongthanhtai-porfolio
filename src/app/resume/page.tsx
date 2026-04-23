import Link from "next/link";
import { getPublicProfile } from "@/lib/public-data";

export default async function ResumePage() {
  const profile = await getPublicProfile();

  if (!profile.resumeUrl) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-24 text-zinc-200">
        <h1 className="text-3xl font-bold">Resume</h1>
        <p className="mt-3 text-zinc-400">Resume is not uploaded yet.</p>
        <Link href="/" className="mt-4 inline-block text-cyan-400 hover:underline">
          Back to home
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-16 text-zinc-200">
      <h1 className="mb-4 text-3xl font-bold">Resume</h1>
      <div className="h-[85vh] overflow-hidden rounded-xl border border-zinc-700 bg-zinc-950">
        <iframe
          src={profile.resumeUrl}
          title="Resume PDF"
          className="h-full w-full"
          loading="lazy"
        />
      </div>
    </main>
  );
}

