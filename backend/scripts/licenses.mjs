import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const lock = JSON.parse(
  await fs.readFile(path.join(root, "package-lock.json"), "utf8"),
);
const accepted = new Set([
  "MIT",
  "MIT-0",
  "ISC",
  "Apache-2.0",
  "BSD-2-Clause",
  "BSD-3-Clause",
  "0BSD",
  "Python-2.0",
  "CC-BY-4.0",
  "MPL-2.0",
]);
const packages = Object.entries(lock.packages)
  .filter(([location]) => location)
  .map(([location, entry]) => ({
    name: entry.name || location.split("node_modules/").at(-1),
    version: entry.version,
    license: entry.license,
    development: Boolean(entry.dev),
    optional: Boolean(entry.optional),
    location,
  }));
const rejected = packages.filter((entry) => !accepted.has(entry.license));
if (rejected.length)
  throw new Error(`Review dependency licenses: ${JSON.stringify(rejected)}`);
const notices = [
  "Dentra backend third-party licenses",
  "All dependency software costs: $0 / PKR 0.",
];
for (const entry of packages) {
  const directory = path.join(root, entry.location);
  let files;
  try {
    files = await fs.readdir(directory, { withFileTypes: true });
  } catch (error) {
    if (error.code === "ENOENT" && entry.optional) continue;
    throw error;
  }
  notices.push(
    `\n${"=".repeat(72)}\n${entry.name}@${entry.version}\nLicense: ${entry.license}\n`,
  );
  for (const file of files)
    if (file.isFile() && /^(licen[sc]e|notice|copying)(\.|$)/i.test(file.name))
      notices.push(
        `${file.name}\n${await fs.readFile(path.join(directory, file.name), "utf8")}`,
      );
}
await fs.writeFile(
  path.join(root, "THIRD_PARTY_LICENSES.txt"),
  `${notices.join("\n")}\n`,
);
await fs.writeFile(
  path.join(root, "../doc/backend-third-party-packages.json"),
  `${JSON.stringify({ packages, additionalCost: 0, currency: "PKR" }, null, 2)}\n`,
);
console.log(
  `Reviewed ${packages.length} locked packages and generated installed package license notices. Additional cost: PKR 0.`,
);
