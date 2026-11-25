import fs from "node:fs/promises";
import { createHash } from "node:crypto";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";
import { createPool } from "../../src/config/database.js";

export const migrationsDirectory = fileURLToPath(
  new URL("../migrations/", import.meta.url),
);
async function migrationFiles(directory) {
  const files = (await fs.readdir(directory))
    .filter((name) => /^\d{3}_[a-z0-9_]+\.sql$/.test(name))
    .sort();
  if (!files.length) throw new Error("No database migrations found.");
  return Promise.all(
    files.map(async (version) => {
      const sql = await fs.readFile(path.join(directory, version), "utf8");
      return {
        version,
        sql,
        checksum: createHash("sha256").update(sql).digest("hex"),
      };
    }),
  );
}
export async function migrate(pool, directory = migrationsDirectory) {
  const files = await migrationFiles(directory);
  const client = await pool.connect();
  const applied = [];
  try {
    await client.query("SELECT pg_advisory_lock(19851524)");
    await client.query(
      "CREATE TABLE IF NOT EXISTS schema_migrations (version text PRIMARY KEY, checksum text NOT NULL, applied_at timestamptz NOT NULL DEFAULT now())",
    );
    for (const file of files) {
      const previous = await client.query(
        "SELECT checksum FROM schema_migrations WHERE version = $1",
        [file.version],
      );
      if (previous.rows.length) {
        if (previous.rows[0].checksum !== file.checksum)
          throw new Error(
            `Applied migration changed: ${file.version}. Add a new migration instead.`,
          );
        continue;
      }
      await client.query("BEGIN");
      try {
        await client.query(file.sql);
        await client.query(
          "INSERT INTO schema_migrations (version, checksum) VALUES ($1, $2)",
          [file.version, file.checksum],
        );
        await client.query("COMMIT");
        applied.push(file.version);
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      }
    }
    return applied;
  } finally {
    await client.query("SELECT pg_advisory_unlock(19851524)").catch(() => {});
    client.release();
  }
}
export async function assertCurrentSchema(pool) {
  const files = await migrationFiles(migrationsDirectory);
  const { rows } = await pool.query(
    "SELECT version, checksum FROM schema_migrations ORDER BY version",
  );
  if (
    rows.length !== files.length ||
    files.some(
      (file) =>
        !rows.some(
          (row) =>
            row.version === file.version && row.checksum === file.checksum,
        ),
    )
  )
    throw new Error("Database schema is not current. Run npm run db:migrate.");
}
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href
) {
  const pool = createPool();
  try {
    const applied = await migrate(pool);
    console.log(
      applied.length
        ? `Applied migrations: ${applied.join(", ")}`
        : "Database migrations are already current.",
    );
  } catch (error) {
    console.error(
      `Migration failed (${error.code || "migration validation"}). Check connectivity and migration files.`,
    );
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}
