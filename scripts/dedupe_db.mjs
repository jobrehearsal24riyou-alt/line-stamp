import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';

// Allow passing DB path as first arg: `node scripts/dedupe_db.mjs /path/to/app.db`
const argPath = process.argv[2];
const DB_PATH = argPath ? path.resolve(argPath) : path.resolve(process.cwd(), 'app.db');

async function main() {
  try {
    console.log('Using DB:', DB_PATH);
    const db = await open({ filename: DB_PATH, driver: sqlite3.Database });

    const [{ count: beforeCount }] = await db.all("SELECT COUNT(*) as count FROM subcategories;");
    const [{ distinctCount }] = await db.all("SELECT COUNT(DISTINCT category_id || '||' || item_name_en) as distinctCount FROM subcategories;");
    console.log(`subcategories: total=${beforeCount}, distinctPairs=${distinctCount}`);

    const deleteSql = `
      DELETE FROM subcategories
      WHERE id NOT IN (
        SELECT MIN(id) FROM subcategories GROUP BY category_id, item_name_en
      );
    `;

    const res = await db.run(deleteSql);
    console.log('Deleted duplicate rows (if any).');

    await db.run('VACUUM;');

    const [{ count: afterCount }] = await db.all("SELECT COUNT(*) as count FROM subcategories;");
    console.log(`subcategories after dedupe: total=${afterCount}`);

    await db.close();
    console.log('Dedupe complete.');
  } catch (err) {
    console.error('Failed to dedupe DB:', err.message || err);
    process.exit(1);
  }
}

main();
