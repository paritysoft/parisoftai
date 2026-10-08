import Image from "next/image";
import { cn } from "@/lib/utils";

const optimizableHosts = (() => {
  const hosts: string[] = [];
  try {
    if (process.env.NEXT_PUBLIC_SUPABASE_URL) hosts.push(new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname);
  } catch {}
  return hosts;
})();

function canOptimize(src: string) {
  if (src.startsWith("/")) return true;
  try {
    return optimizableHosts.includes(new URL(src).hostname);
  } catch {
    return false;
  }
}

/** next/image for local and Supabase Storage images; a plain lazy <img> for anything else. */
export function SmartImage({
  src,
  alt,
  className,
  sizes = "(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw",
  priority,
}: {
  src: string;
  alt: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
}) {
  if (canOptimize(src) && !src.endsWith(".svg")) {
    return <Image src={src} alt={alt} fill sizes={sizes} priority={priority} className={cn("object-cover", className)} />;
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element -- external or SVG source
    <img src={src} alt={alt} loading={priority ? "eager" : "lazy"} decoding="async" className={cn("absolute inset-0 size-full object-cover", className)} />
  );
}
