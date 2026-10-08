/**
 * Validates every Git-backed content file (content/projects, content/products, content/redirects.json)
 * with the same schemas the admin and the build use.   npm run content:check
 */
import { promises as fs } from "node:fs";
import path from "node:path";
import { FILE_COLLECTIONS, REDIRECTS_PATH, parseStored, redirectsSchema, type FileCollection } from "../src/lib/content/file-format";

const root = process.cwd();
let errors = 0;
let published = 0;
let total = 0;

for (const collection of Object.keys(FILE_COLLECTIONS) as FileCollection[]) {
  const dir = path.join(root, "content", FILE_COLLECTIONS[collection].dir);
  const names = (await fs.readdir(dir).catch(() => [] as string[])).filter((n) => n.endsWith(".json"));
  const slugs = new Map<string, string>();
  for (const name of names) {
    total++;
    const rel = `content/${FILE_COLLECTIONS[collection].dir}/${name}`;
    let json: unknown;
    try {
      json = JSON.parse(await fs.readFile(path.join(dir, name), "utf8"));
    } catch {
      console.error(`✖ ${rel}: invalid JSON`);
      errors++;
      continue;
    }
    const parsed = parseStored(collection, json);
    if (!parsed.ok) {
      console.error(`✖ ${rel}: ${parsed.error}`);
      errors++;
      continue;
    }
    if (`${parsed.value.id}.json` !== name) {
      console.error(`✖ ${rel}: file name must be ${parsed.value.id}.json`);
      errors++;
    }
    const other = slugs.get(parsed.value.slug);
    if (other) {
      console.error(`✖ ${rel}: slug "${parsed.value.slug}" is also used by ${other}`);
      errors++;
    }
    slugs.set(parsed.value.slug, name);
    if (parsed.value.status === "published") published++;
  }
}

try {
  const parsed = redirectsSchema.safeParse(JSON.parse(await fs.readFile(path.join(root, REDIRECTS_PATH), "utf8")));
  if (!parsed.success) {
    console.error(`✖ ${REDIRECTS_PATH}: ${parsed.error.issues[0]?.message}`);
    errors++;
  }
} catch (e) {
  if ((e as NodeJS.ErrnoException).code !== "ENOENT") {
    console.error(`✖ ${REDIRECTS_PATH}: invalid JSON`);
    errors++;
  }
}

if (errors) {
  console.error(`\n${errors} problem(s) found. Fix them before committing — an invalid file fails the deployment.`);
  process.exit(1);
}
console.log(`✔ ${total} content file(s) valid (${published} published).`);
