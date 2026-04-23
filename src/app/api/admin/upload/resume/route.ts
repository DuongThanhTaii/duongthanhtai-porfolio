import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-route";
import { uploadResumePdf } from "@/lib/cloudinary";

const MAX_RESUME_SIZE_BYTES = 6 * 1024 * 1024;

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;

  try {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Missing file" }, { status: 400 });
    }

    if (file.type !== "application/pdf") {
      return NextResponse.json({ error: "Only PDF is supported." }, { status: 400 });
    }

    if (file.size > MAX_RESUME_SIZE_BYTES) {
      return NextResponse.json({ error: "PDF must be <= 6MB." }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const uploadResult = await uploadResumePdf(buffer, file.name);

    return NextResponse.json(uploadResult);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Resume upload failed." },
      { status: 500 }
    );
  }
}

