import type { ProfileRole } from "@/lib/auth/profile-role";

export function canManageWorkshopCatalog(role: ProfileRole): boolean {
  return role === "owner";
}
