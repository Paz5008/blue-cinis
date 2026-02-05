const FALLBACK_SLUG = "oeuvre";

function slugify(input: string | null | undefined) {
  return (input || "")
    .toString()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

export type ArtworkSlugInput = {
  id: string;
  title?: string | null;
  slug?: string | null;
};

export function buildArtworkSlug({ id, title, slug }: ArtworkSlugInput) {
  const existing = typeof slug === "string" ? slug.trim() : "";
  if (existing.endsWith(`--${id}`)) {
    return existing;
  }
  const base = slugify(existing) || slugify(title) || FALLBACK_SLUG;
  return `${base}--${id}`;
}

export function buildArtworkPath(input: ArtworkSlugInput) {
  return `/galerie/${buildArtworkSlug(input)}`;
}

export function extractArtworkIdFromParam(param: string) {
  if (!param) return param;
  const separator = param.lastIndexOf("--");
  if (separator === -1) {
    return param;
  }
  const candidate = param.slice(separator + 2);
  if (/^[a-z0-9-]+$/i.test(candidate) && candidate.length >= 10) {
    return candidate;
  }
  return param;
}
