import { iconSeedData } from "../data/iconSeedData.js";

export const seedIconData = async (db) => {
  for (const cat of iconSeedData.categories) {
    await db.execute(
      `INSERT OR IGNORE INTO categories (category_id, category_name_en, category_code_en, category_name_ja)
       VALUES (?, ?, ?, ?);`,
      [cat.category_id, cat.category_name_en, cat.category_code_en, cat.category_name_ja]
    );
  }

  for (const sub of iconSeedData.subcategories) {
    await db.execute(
      `INSERT OR IGNORE INTO subcategories (category_id, subcategory_id, subcategory_name_ja, item_name_en, item_name_ja)
       VALUES (?, ?, ?, ?, ?);`,
      [sub.category_id, sub.subcategory_id, sub.subcategory_name_ja, sub.item_name_en, sub.item_name_ja]
    );
  }
};
