#!/usr/bin/env node
/**
 * Applies SQL migrations from supabase/migrations/ using SUPABASE_DB_URL.
 * Usage: npm run db:migrate
 */
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

async function main() {
  const databaseUrl = process.env.SUPABASE_DB_URL;
  if (!databaseUrl) {
    console.error('SUPABASE_DB_URL is required');
    process.exit(1);
  }

  const migrationsDir = path.join(__dirname, '..', 'supabase', 'migrations');
  const files = fs
    .readdirSync(migrationsDir)
    .filter((file) => file.endsWith('.sql'))
    .sort();

  const client = new Client({
    connectionString: databaseUrl,
    ssl:
      process.env.SUPABASE_DB_SSL === 'false'
        ? false
        : { rejectUnauthorized: false },
  });

  await client.connect();

  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      filename TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  for (const file of files) {
    const applied = await client.query(
      'SELECT 1 FROM schema_migrations WHERE filename = $1',
      [file],
    );
    if (applied.rowCount > 0) {
      console.log(`Skipping ${file} (already applied)`);
      continue;
    }

    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
    console.log(`Applying ${file}...`);
    await client.query('BEGIN');
    try {
      await client.query(sql);
      await client.query(
        'INSERT INTO schema_migrations (filename) VALUES ($1)',
        [file],
      );
      await client.query('COMMIT');
      console.log(`Applied ${file}`);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    }
  }

  await client.end();
  console.log('Migrations complete.');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
