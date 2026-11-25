import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const manifest = JSON.parse(
  await fs.readFile(path.join(root, "package.json"), "utf8"),
);
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
  .filter(([key]) => key)
  .map(([key, value]) => ({
    path: key,
    name: value.name || key.split("node_modules/").at(-1),
    version: value.version,
    license: value.license,
    dev: !!value.dev,
    optional: !!value.optional,
  }));
const rejected = packages.filter((item) => !accepted.has(item.license));
if (rejected.length)
  throw new Error(
    `Review new licenses before continuing: ${JSON.stringify(rejected)}`,
  );

const visited = new Set();
const notices = [
  "Dentra frontend — runtime third-party notices",
  "Public Sans has its separate OFL file in this directory.",
  "Free stock image attribution is in THIRD_PARTY_NOTICES.md.",
  "",
];
async function collect(name, parent = root) {
  let current = parent;
  let packageRoot;
  while (current.startsWith(root)) {
    const candidate = path.join(current, "node_modules", name);
    try {
      await fs.access(path.join(candidate, "package.json"));
      packageRoot = candidate;
      break;
    } catch {
      current = path.dirname(current);
    }
  }
  if (!packageRoot || visited.has(packageRoot)) return;
  visited.add(packageRoot);
  const pkg = JSON.parse(
    await fs.readFile(path.join(packageRoot, "package.json"), "utf8"),
  );
  notices.push(
    `\n${"=".repeat(72)}\n${pkg.name}@${pkg.version}\nLicense: ${typeof pkg.license === "string" ? pkg.license : JSON.stringify(pkg.license)}\n`,
  );
  for (const entry of await fs.readdir(packageRoot, { withFileTypes: true })) {
    if (
      entry.isFile() &&
      /^(licen[sc]e|notice|copying)(\.|$)/i.test(entry.name)
    )
      notices.push(
        `${entry.name}\n${await fs.readFile(path.join(packageRoot, entry.name), "utf8")}`,
      );
  }
  for (const dependency of Object.keys(pkg.dependencies || {}))
    await collect(dependency, packageRoot);
}
for (const name of Object.keys(manifest.dependencies)) await collect(name);
await fs.mkdir(path.join(root, "public/licenses"), { recursive: true });
await fs.writeFile(
  path.join(root, "public/licenses/npm-runtime-notices.txt"),
  notices.join("\n"),
  "utf8",
);
await fs.writeFile(
  path.join(root, "../doc/third-party-packages.json"),
  `${JSON.stringify({ generatedAt: new Date().toISOString(), direct: { ...manifest.dependencies, ...manifest.devDependencies }, licenseCounts: packages.reduce((counts, pkg) => ({ ...counts, [pkg.license]: (counts[pkg.license] || 0) + 1 }), {}), packages }, null, 2)}\n`,
  "utf8",
);
console.log(
  `Reviewed ${packages.length} resolved packages; wrote ${visited.size} runtime package notices. All required package costs: $0.`,
);
