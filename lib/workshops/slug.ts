/**
 * Maakt een URL-veilige slug; leeg resultaat wordt "workshop".
 */
export function slugifyTitle(title: string): string {
  const s = title
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return s || "workshop";
}
