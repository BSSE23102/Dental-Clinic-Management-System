import fs from "node:fs/promises";
import path from "node:path";
import { randomBytes } from "node:crypto";
import { fileURLToPath } from "node:url";
import { execFile, spawn } from "node:child_process";
import { promisify } from "node:util";
import net from "node:net";
import pg from "pg";

const execute = promisify(execFile);
const root = fileURLToPath(new URL("../../", import.meta.url));
const local = path.join(root, ".local");
const data = path.join(local, "postgres");
const envPath = path.join(root, ".env");
const exists = async (file) =>
  fs.access(file).then(
    () => true,
    () => false,
  );
const suffix = process.platform === "win32" ? ".exe" : "";
let bin = process.env.PG_BIN;
if (!bin) {
  try {
    bin = (
      await execute(`pg_config${suffix}`, ["--bindir"], { windowsHide: true })
    ).stdout.trim();
  } catch {
    if (process.platform === "win32")
      bin = "C:/Program Files/PostgreSQL/17/bin";
    else
      throw new Error(
        "Set PG_BIN to the directory containing initdb and pg_ctl.",
      );
  }
}
// PostgreSQL is a long-lived child; do not inherit captured pipes that keep pg_ctl open.
const run = (name, args) =>
  new Promise((resolve, reject) => {
    const child = spawn(path.join(bin, `${name}${suffix}`), args, {
      windowsHide: true,
      timeout: 60000,
      stdio: "ignore",
    });
    child.once("error", reject);
    child.once("exit", (code, signal) => {
      if (code === 0) resolve();
      else
        reject(
          new Error(
            `${name} failed (${signal || code}). Check PG_BIN and backend/.local/postgres.log.`,
          ),
        );
    });
  });

try {
  await fs.mkdir(local, { recursive: true });
  if (process.argv[2] === "stop") {
    if (await exists(path.join(data, "PG_VERSION"))) {
      await run("pg_ctl", ["-D", data, "-m", "fast", "-w", "stop"]);
      console.log(
        "Project PostgreSQL stopped. Existing system PostgreSQL was not changed.",
      );
    }
  } else {
    if (!(await exists(envPath))) {
      if (await exists(path.join(data, "PG_VERSION")))
        throw new Error(
          "Project database exists but .env is missing. Restore its connection settings; credentials will not be overwritten.",
        );
      const password = randomBytes(30).toString("base64url");
      await fs.writeFile(path.join(local, "init-password"), password, {
        mode: 0o600,
      });
      const base = `postgresql://clinic_owner:${encodeURIComponent(password)}@127.0.0.1:55432/`;
      await fs.writeFile(
        envPath,
        `DATABASE_URL=${base}dental_clinic\nTEST_DATABASE_URL=${base}dental_clinic_test\nPORT=3000\nHOST=127.0.0.1\nNODE_ENV=development\nCORS_ORIGIN=http://localhost:5173,http://127.0.0.1:5173\nDEMO_MODE=true\n`,
        { mode: 0o600, flag: "wx" },
      );
    }
    const env = Object.fromEntries(
      (await fs.readFile(envPath, "utf8"))
        .split(/\r?\n/)
        .filter((line) => line && !line.startsWith("#"))
        .map((line) => {
          const split = line.indexOf("=");
          return [line.slice(0, split), line.slice(split + 1)];
        }),
    );
    const target = new URL(env.DATABASE_URL);
    if (
      target.hostname !== "127.0.0.1" ||
      target.port !== "55432" ||
      target.pathname !== "/dental_clinic"
    )
      throw new Error(
        "Existing .env points to a custom database. Configure it yourself; db:local will not replace it.",
      );
    let running = false;
    try {
      await run("pg_ctl", ["-D", data, "status"]);
      running = true;
    } catch {
      /* No project server is running. */
    }
    if (!running) {
      await new Promise((resolve, reject) => {
        const server = net.createServer();
        server.once("error", () =>
          reject(
            new Error(
              "Port 55432 is already occupied. No existing process will be stopped.",
            ),
          ),
        );
        server.listen(55432, "127.0.0.1", () => server.close(resolve));
      });
      if (!(await exists(path.join(data, "PG_VERSION"))))
        await run("initdb", [
          "-D",
          data,
          "-U",
          "clinic_owner",
          "--encoding=UTF8",
          "--locale=C",
          "--auth=scram-sha-256",
          "--pwfile",
          path.join(local, "init-password"),
          "--no-instructions",
        ]);
      await run("pg_ctl", [
        "-D",
        data,
        "-l",
        path.join(local, "postgres.log"),
        "-o",
        "-h 127.0.0.1 -p 55432",
        "-w",
        "start",
      ]);
    }
    const admin = new pg.Pool({
      connectionString: new URL("postgres", env.DATABASE_URL).href,
      max: 1,
    });
    try {
      for (const name of ["dental_clinic", "dental_clinic_test"]) {
        const found = await admin.query(
          "SELECT 1 FROM pg_database WHERE datname = $1",
          [name],
        );
        if (!found.rowCount) await admin.query(`CREATE DATABASE "${name}"`);
      }
    } finally {
      await admin.end();
    }
    console.log(
      "Project PostgreSQL is ready on 127.0.0.1:55432. Credentials are in ignored backend/.env. System PostgreSQL is unchanged.",
    );
  }
} catch (error) {
  console.error(
    error.code
      ? `Local PostgreSQL setup failed (${error.code}). Check PG_BIN and backend/.local/postgres.log.`
      : error.message,
  );
  process.exitCode = 1;
}
