import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const assetRoot = path.join(root, "dist/assets");
const files = await fs.readdir(assetRoot);
const javascript = (
  await Promise.all(
    files
      .filter((name) => name.endsWith(".js"))
      .map((name) => fs.readFile(path.join(assetRoot, name), "utf8")),
  )
).join("\n");
for (const marker of [
  "Dr. Amina Farooq",
  "Ayesha Mir",
  "dentra.preview",
  "http://localhost:3000/api",
]) {
  if (javascript.includes(marker))
    throw new Error(`Development-only marker found in production: ${marker}`);
}
for (const asset of [
  "dist/index.html",
  "dist/images/clinic-doctor.jpg",
  "dist/fonts/PublicSans.ttf",
  "dist/licenses/PublicSans-OFL.txt",
  "dist/licenses/npm-runtime-notices.txt",
])
  await fs.access(path.join(root, asset));
console.log(
  "Production checks passed: preview fixtures excluded, no localhost API fallback, assets and license notices present.",
);
