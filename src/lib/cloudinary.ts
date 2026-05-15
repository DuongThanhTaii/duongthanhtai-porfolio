import { v2 as cloudinary } from "cloudinary";

let isConfigured = false;

function ensureCloudinaryConfigured() {
  if (isConfigured) return;
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error(
      "Missing Cloudinary configuration. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET.",
    );
  }

  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  });

  isConfigured = true;
}

type UploadResourceType = "image" | "raw";

function uploadBuffer(
  buffer: Buffer,
  options: {
    folder: string;
    resourceType: UploadResourceType;
    publicId?: string;
  },
) {
  ensureCloudinaryConfigured();
  return new Promise<{
    secure_url: string;
    public_id: string;
  }>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: options.folder,
        resource_type: options.resourceType,
        public_id: options.publicId,
        overwrite: true,
      },
      (error, result) => {
        if (error || !result) {
          reject(error ?? new Error("Cloudinary upload failed."));
          return;
        }
        resolve({
          secure_url: result.secure_url,
          public_id: result.public_id,
        });
      },
    );

    stream.end(buffer);
  });
}

export async function uploadResumePdf(buffer: Buffer, fileName: string) {
  // Use a sanitized, unique public id to avoid invalid characters and collisions
  const baseName = fileName
    .replace(/\.pdf$/i, "")
    .replace(/[^a-zA-Z0-9-_]/g, "_");
  const publicId = `${baseName}_${Date.now()}`;
  return uploadBuffer(buffer, {
    folder: "portfolio/resumes",
    resourceType: "raw",
    publicId,
  });
}

export async function uploadProjectImage(buffer: Buffer) {
  return uploadBuffer(buffer, {
    folder: "portfolio/projects",
    resourceType: "image",
  });
}

export function getCloudinaryRawUrl(publicId: string) {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  if (!cloudName) {
    throw new Error(
      "Missing Cloudinary configuration. Set CLOUDINARY_CLOUD_NAME.",
    );
  }
  return `https://res.cloudinary.com/${cloudName}/raw/upload/${publicId}`;
}

export async function destroyCloudinaryResource(
  publicId: string,
  resourceType: UploadResourceType,
) {
  ensureCloudinaryConfigured();
  await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
}
