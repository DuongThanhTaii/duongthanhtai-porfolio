"use client";

import { useEffect, useState } from "react";

type ResumePdfViewerProps = {
  src: string;
};

export default function ResumePdfViewer({ src }: ResumePdfViewerProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    let currentUrl: string | null = null;

    async function renderPdf() {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(src, { cache: "no-store" });
        if (!response.ok) {
          throw new Error("Failed to load resume.");
        }
        const contentType = response.headers.get("content-type") ?? "";
        let buffer: ArrayBuffer;

        if (contentType.includes("application/json")) {
          const payload = (await response.json()) as { data?: string };
          if (!payload.data) {
            throw new Error("Resume data is missing.");
          }
          const binary = atob(payload.data);
          const bytes = new Uint8Array(binary.length);
          for (let i = 0; i < binary.length; i += 1) {
            bytes[i] = binary.charCodeAt(i);
          }
          buffer = bytes.buffer;
        } else {
          buffer = await response.arrayBuffer();
        }

        if (buffer.byteLength === 0) {
          throw new Error("Resume file is empty.");
        }

        const blob = new Blob([buffer], { type: "application/pdf" });
        const url = URL.createObjectURL(blob);
        currentUrl = url;

        if (!isMounted) {
          URL.revokeObjectURL(url);
          return;
        }

        setBlobUrl(url);
      } catch (err) {
        if (!isMounted) return;
        setError(err instanceof Error ? err.message : "Failed to load resume.");
      } finally {
        if (!isMounted) return;
        setLoading(false);
      }
    }

    renderPdf();

    return () => {
      isMounted = false;
      if (currentUrl) {
        URL.revokeObjectURL(currentUrl);
      }
    };
  }, [src]);

  if (loading) {
    return (
      <div className="flex h-[70vh] items-center justify-center text-sm text-zinc-400">
        Loading resume...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-[70vh] items-center justify-center text-sm text-red-400">
        {error}
      </div>
    );
  }

  if (!blobUrl) {
    return (
      <div className="flex h-[70vh] items-center justify-center text-sm text-zinc-400">
        Resume preview is not available.
      </div>
    );
  }

  return (
    <iframe
      title="Resume preview"
      src={`${blobUrl}#toolbar=0&navpanes=0&scrollbar=0`}
      className="h-[70vh] w-full rounded-md bg-white"
    />
  );
}
