import { readConfig } from './config/env.js';
import { createPool } from './config/database.js';
import { createApp } from './app.js';
import { assertCurrentSchema } from '../db/scripts/migrate.js';

async function main() {
  const config = readConfig(); const pool = createPool(config.databaseUrl);
  try { await pool.query('SELECT 1'); await assertCurrentSchema(pool); }
  catch { await pool.end(); throw new Error('Database is unavailable or schema is not current. Check backend/.env and run npm run db:migrate.'); }
  const server = createApp({ pool, config }).listen(config.port, config.host);
  server.on('listening', () => console.log(`Dentra API ready at http://${config.host}:${config.port}/api`));
  server.on('error', async (error) => { console.error(`API startup failed (${error.code || 'server error'}).`); await pool.end(); process.exitCode = 1; });
  let stopping = false;
  const shutdown = () => { if (stopping) return; stopping = true; const timeout = setTimeout(() => process.exit(1), 10000); timeout.unref(); server.close(async () => { await pool.end(); clearTimeout(timeout); }); };
  process.once('SIGINT', shutdown); process.once('SIGTERM', shutdown);
}
main().catch((error) => { console.error(error.message); process.exitCode = 1; });
