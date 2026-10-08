import { homeSeed } from "@/content/pages";
import { HOME_SECTION_KEYS, type GenericPageContent, type HomeContent, type HomeSection } from "@/types/content";

/**
 * Content in the database is JSON edited through the admin. These helpers make sure the
 * renderer always receives a complete, well-typed object even if a field is missing.
 */
export function normalizeHome(raw: unknown): HomeContent {
  const input = (raw && typeof raw === "object" ? raw : {}) as Partial<HomeContent>;
  const hero = { ...homeSeed.hero, ...(input.hero ?? {}) };
  const incoming = Array.isArray(input.sections) ? input.sections : [];
  const sections: HomeSection[] = [];
  const seen = new Set<string>();
  for (const section of incoming) {
    if (!section || typeof section !== "object" || !HOME_SECTION_KEYS.includes(section.key) || seen.has(section.key)) continue;
    const fallback = homeSeed.sections.find((s) => s.key === section.key)!;
    sections.push({ ...fallback, ...section } as HomeSection);
    seen.add(section.key);
  }
  // Sections missing from stored content are appended (hidden) so the editor can enable them.
  for (const fallback of homeSeed.sections) {
    if (!seen.has(fallback.key)) sections.push({ ...fallback, visible: incoming.length === 0 ? fallback.visible : false });
  }
  return { hero, sections };
}

export function normalizeGenericPage(raw: unknown, fallback: GenericPageContent): GenericPageContent {
  const input = (raw && typeof raw === "object" ? raw : {}) as Partial<GenericPageContent>;
  return {
    heading: typeof input.heading === "string" ? input.heading : fallback.heading,
    intro: typeof input.intro === "string" ? input.intro : fallback.intro,
    mission: typeof input.mission === "string" ? input.mission : fallback.mission,
    vision: typeof input.vision === "string" ? input.vision : fallback.vision,
    notice: typeof input.notice === "string" ? input.notice : undefined,
    blocks: Array.isArray(input.blocks) ? input.blocks : fallback.blocks,
  };
}
