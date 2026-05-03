/** Workshop hero images: public bucket + UI/server validation stay in sync. */

export const WORKSHOP_IMAGE_BUCKET = "workshop-images";

/** Exact pixel size required for uploads (cards expect square assets). */
export const WORKSHOP_IMAGE_PIXEL_SIZE = 512;

export const WORKSHOP_IMAGE_MAX_BYTES = 5 * 1024 * 1024;

export const WORKSHOP_IMAGE_ACCEPT_ATTR = "image/png,image/jpeg,image/webp";

const ALLOWED_EXT = [".png", ".jpg", ".jpeg", ".webp"] as const;

export function workshopImageFilenameAllowed(filename: string): boolean {
  const lower = filename.toLowerCase();
  return ALLOWED_EXT.some((ext) => lower.endsWith(ext));
}

export function workshopImageMimeAllowed(mime: string): boolean {
  return mime === "image/png" || mime === "image/jpeg" || mime === "image/webp";
}

export function workshopImageExtensionFromMime(mime: string): string | null {
  if (mime === "image/png") return "png";
  if (mime === "image/jpeg") return "jpg";
  if (mime === "image/webp") return "webp";
  return null;
}
