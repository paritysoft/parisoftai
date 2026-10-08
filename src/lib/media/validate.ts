export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
export const ALLOWED_MIME = ["image/png", "image/jpeg", "image/webp", "image/avif", "image/svg+xml"] as const;
export type AllowedMime = (typeof ALLOWED_MIME)[number];

export const EXTENSIONS: Record<AllowedMime, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/avif": "avif",
  "image/svg+xml": "svg",
};

/** Detect the real file type from its first bytes — never trust the extension or browser MIME. */
export function sniffImageType(bytes: Uint8Array): AllowedMime | null {
  const b = bytes;
  if (b.length >= 8 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return "image/png";
  if (b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "image/jpeg";
  if (b.length >= 12 && ascii(b, 0, 4) === "RIFF" && ascii(b, 8, 12) === "WEBP") return "image/webp";
  if (b.length >= 12 && ascii(b, 4, 8) === "ftyp" && /^avi[fs]$/.test(ascii(b, 8, 12))) return "image/avif";
  const head = new TextDecoder().decode(b.slice(0, 1024)).trimStart().toLowerCase();
  if (head.startsWith("<svg") || (head.startsWith("<?xml") && head.includes("<svg"))) return "image/svg+xml";
  return null;
}

function ascii(b: Uint8Array, start: number, end: number) {
  return String.fromCharCode(...b.slice(start, end));
}

/**
 * SVG can carry scripts. We don't try to "clean" it — any risky construct rejects the file.
 * Uploading SVG is additionally limited to admins.
 */
export function svgIsSafe(svgText: string): boolean {
  const s = svgText.toLowerCase();
  const forbidden = [/<script/, /\son[a-z]+\s*=/, /javascript:/, /<foreignobject/, /<iframe/, /<embed/, /<object/, /<!entity/, /xlink:href\s*=\s*["']?(?!#)/, /href\s*=\s*["']?(?!#)[a-z]+:/, /<use[^>]+href\s*=\s*["']?https?:/, /data:text\/html/];
  return !forbidden.some((re) => re.test(s));
}

export function safeFileName(name: string): string {
  const base = name.replace(/\.[^.]+$/, "").toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60);
  return base || "image";
}

export function storagePathFor(fileName: string, mime: AllowedMime, id: string, now = new Date()): string {
  const y = now.getUTCFullYear();
  const m = String(now.getUTCMonth() + 1).padStart(2, "0");
  return `uploads/${y}/${m}/${id}-${safeFileName(fileName)}.${EXTENSIONS[mime]}`;
}
