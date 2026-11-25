import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';

export const backendRoot = fileURLToPath(new URL('../../', import.meta.url));
dotenv.config({ path: fileURLToPath(new URL('../../.env', import.meta.url)), quiet: true });
const databaseUrl = z.string().url().refine((value) => ['postgres:', 'postgresql:'].includes(new URL(value).protocol), 'Use a PostgreSQL connection URL.');
const schema = z.object({
  DATABASE_URL: databaseUrl,
  TEST_DATABASE_URL: databaseUrl.optional(),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  HOST: z.string().default('127.0.0.1'),
  CORS_ORIGIN: z.string().default('http://localhost:5173,http://127.0.0.1:5173').transform((value) => value.split(',').map((origin) => origin.trim())).pipe(z.array(z.string().url().refine((value) => new URL(value).origin === value, 'Use an exact origin without a trailing slash.')).min(1)),
  DEMO_MODE: z.enum(['true', 'false']).default('false').transform((value) => value === 'true'),
});
export function readConfig(source = process.env) {
  const result = schema.safeParse(source);
  if (!result.success) throw new Error(`Invalid environment configuration: ${[...new Set(result.error.issues.map((issue) => issue.path[0]))].join(', ')}. Check backend/.env against .env.example.`);
  return { databaseUrl: result.data.DATABASE_URL, testDatabaseUrl: result.data.TEST_DATABASE_URL, nodeEnv: result.data.NODE_ENV, port: result.data.PORT, host: source.HOST || (result.data.NODE_ENV === 'production' ? '0.0.0.0' : '127.0.0.1'), corsOrigins: result.data.CORS_ORIGIN, demoMode: result.data.DEMO_MODE };
}
