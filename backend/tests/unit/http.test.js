import { describe, expect, it, vi } from "vitest";
import request from "supertest";
import { createApp } from "../../src/app.js";

const config = { nodeEnv: "test", corsOrigins: ["http://localhost:5173"] };
const logger = { error: vi.fn() };
const appWith = (
  pool = { query: async () => ({ rows: [{ ok: 1 }] }) },
  options = {},
) => createApp({ pool, config, logger, ...options });
describe("HTTP foundation", () => {
  it("checks readiness and sends security headers without Express identification", async () => {
    const response = await request(appWith()).get("/api/health");
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ data: { status: "ok", database: "up" } });
    expect(response.headers["x-content-type-options"]).toBe("nosniff");
    expect(response.headers["x-powered-by"]).toBeUndefined();
    expect(response.headers["x-request-id"]).toBeTruthy();
  });
  it("sanitizes database readiness failures", async () => {
    const response = await request(
      appWith({
        query: async () => {
          throw new Error("postgres://secret-password@private-host SQL stack");
        },
      }),
    ).get("/api/health");
    expect(response.status).toBe(503);
    expect(JSON.stringify(response.body)).not.toMatch(
      /secret|stack|private-host/,
    );
  });
  it("allows configured frontend origins and rejects unrelated origins", async () => {
    const app = appWith();
    expect(
      (
        await request(app)
          .get("/api/health")
          .set("Origin", "http://localhost:5173")
      ).headers["access-control-allow-origin"],
    ).toBe("http://localhost:5173");
    expect(
      (
        await request(app)
          .get("/api/health")
          .set("Origin", "https://unrelated.example")
      ).status,
    ).toBe(403);
  });
  it("supports CORS preflight for the frontend mutation methods", async () => {
    const result = await request(appWith())
      .options("/api/doctors/1")
      .set("Origin", "http://localhost:5173")
      .set("Access-Control-Request-Method", "PUT");
    expect(result.status).toBe(204);
    expect(result.headers["access-control-allow-methods"]).toContain("PUT");
    expect(result.headers["access-control-allow-credentials"]).toBeUndefined();
  });
  it("rejects malformed, unsupported, and oversized bodies before SQL", async () => {
    const pool = { query: vi.fn() };
    const app = appWith(pool);
    expect(
      (
        await request(app)
          .post("/api/doctors")
          .set("Content-Type", "application/json")
          .send("{bad json")
      ).status,
    ).toBe(400);
    expect(
      (
        await request(app)
          .post("/api/doctors")
          .set("Content-Type", "text/plain")
          .send("bad")
      ).status,
    ).toBe(415);
    expect(
      (
        await request(app)
          .post("/api/doctors")
          .send({ value: "x".repeat(40000) })
      ).status,
    ).toBe(413);
    expect(pool.query).not.toHaveBeenCalled();
  });
  it("returns field errors and rejects invalid parameters before SQL", async () => {
    const pool = { query: vi.fn() };
    const app = appWith(pool);
    const invalid = await request(app).post("/api/doctors").send({});
    expect(invalid.status).toBe(400);
    expect(invalid.body.error.fieldErrors.fullName).toBeTruthy();
    expect((await request(app).get("/api/doctors/1abc")).status).toBe(400);
    expect(
      (await request(app).get("/api/appointments?date=2026-02-30")).status,
    ).toBe(400);
    expect(pool.query).not.toHaveBeenCalled();
  });
  it("returns a consistent unknown-route response", async () => {
    expect(
      (await request(appWith()).get("/api/not-found")).body.error.code,
    ).toBe("NOT_FOUND");
  });
  it("applies rate limits without rate-limiting readiness", async () => {
    const app = appWith(undefined, { rateLimits: true, apiLimit: 1 });
    expect((await request(app).get("/api/not-found")).status).toBe(404);
    const limited = await request(app).get("/api/not-found");
    expect(limited.status).toBe(429);
    expect(limited.body.error.code).toBe("RATE_LIMITED");
    expect((await request(app).get("/api/health")).status).toBe(200);
  });
  it("sanitizes unexpected errors consistently", async () => {
    const pool = {
      query: async () => {
        throw new Error("raw SQL and private-password");
      },
    };
    const result = await request(appWith(pool)).get("/api/doctors/1");
    expect(result.status).toBe(500);
    expect(result.body.error.code).toBe("INTERNAL_ERROR");
    expect(JSON.stringify(result.body)).not.toContain("private-password");
  });
  it("returns service-unavailable for PostgreSQL driver timeouts without codes", async () => {
    const pool = {
      query: async () => {
        throw new Error("timeout exceeded when trying to connect");
      },
    };
    const result = await request(appWith(pool)).get("/api/doctors/1");
    expect(result.status).toBe(503);
    expect(result.body.error.code).toBe("DATABASE_UNAVAILABLE");
  });
});
