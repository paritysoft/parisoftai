import { SmartImage } from "@/components/ui/smart-image";
import type { GalleryImage } from "@/types/content";

/** Responsive screenshot gallery — horizontal scroll-snap on small screens, grid on larger ones. */
export function Gallery({ images, title }: { images: GalleryImage[]; title: string }) {
  if (images.length === 0) return null;
  return (
    <ul
      className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-4 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 lg:grid-cols-3"
      aria-label={`${title} screenshots`}
    >
      {images.map((img, i) => (
        <li key={img.id ?? `${img.url}-${i}`} className="w-[75%] shrink-0 snap-center sm:w-auto">
          <figure className="surface relative aspect-[9/16] overflow-hidden sm:aspect-[4/5]">
            <SmartImage src={img.url} alt={img.alt || `${title} screenshot ${i + 1}`} sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 75vw" />
          </figure>
        </li>
      ))}
    </ul>
  );
}
