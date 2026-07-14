import { iconSeedData } from '../src/data/iconSeedData.js';

function analyzeSeedData(data) {
  const categories = data.categories;
  const subcats = data.subcategories;

  console.log('Categories:');
  for (const c of categories) {
    console.log(`- ${c.category_id}: ${c.category_name_ja} / ${c.category_name_en} (${c.category_code_en})`);
  }

  // Detect duplicates of item_name_en within same category
  const dupMap = new Map();
  const byCategory = new Map();

  for (const s of subcats) {
    const key = `${s.category_id}||${s.item_name_en}`.toLowerCase();
    if (!byCategory.has(s.category_id)) byCategory.set(s.category_id, []);
    byCategory.get(s.category_id).push(s);

    if (!dupMap.has(key)) dupMap.set(key, []);
    dupMap.get(key).push(s);
  }

  console.log('\nSubcategories summary:');
  for (const [cat, items] of byCategory.entries()) {
    console.log(`- ${cat}: ${items.length} entries`);
  }

  console.log('\nDuplicates (same category + same item_name_en):');
  let found = false;
  for (const [k, arr] of dupMap.entries()) {
    if (arr.length > 1) {
      found = true;
      const [catId, itemName] = k.split('||');
      console.log(`\nCategory ${catId} — item "${itemName}" appears ${arr.length} times:`);
      for (const r of arr) {
        console.log(`  id=${r.id} subcategory_id=${r.subcategory_id} subcategory_name_ja=${r.subcategory_name_ja} item_name_ja=${r.item_name_ja}`);
      }
    }
  }
  if (!found) console.log('  (no duplicates found)');

  console.log('\n総件数:', subcats.length, 'サブカテゴリレコード');
}

analyzeSeedData(iconSeedData);

console.log('\nScript: node scripts/dump_seed_duplicates.mjs');
