import { getSupabaseUrl } from "@/lib/supabase/env";

export const DEFAULT_WORKSHOP_IMAGE_SRC = "/workshops/default-512.svg";

export function workshopImageSrc(imagePath: string | null): string {
  if (!imagePath) return DEFAULT_WORKSHOP_IMAGE_SRC;
  const base = getSupabaseUrl();
  return `${base}/storage/v1/object/public/workshop-images/${imagePath}`;
}
