import "server-only";
import { revalidatePath } from "next/cache";

/**
 * Public pages are statically rendered (ISR). Navigation, footer, sitemap and listing pages all
 * share the same content, so any published change re-renders the whole public site on next
 * request. The site is small enough that this is cheaper than tracking dependencies.
 */
export function revalidatePublicSite(...paths: string[]) {
  for (const p of paths) revalidatePath(p);
  revalidatePath("/", "layout");
}
