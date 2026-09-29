import Database from "@tauri-apps/plugin-sql";

export const initDatabase = async () => {
  try {
    const db = await Database.load("sqlite:app.db");

    const pathResult = await db.select("PRAGMA database_list;");
    console.log("====================================");
    console.log("DBの実際の場所はココです！👇");
    console.log(pathResult[0].file);
    console.log("====================================");

    // 1. カテゴリ TBL
    await db.execute(`
      CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        category_id TEXT NOT NULL UNIQUE,
        category_name_en TEXT NOT NULL,
        category_code_en TEXT NOT NULL,
        category_name_ja TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 2. サブカテゴリ TBL
    await db.execute(`
      CREATE TABLE IF NOT EXISTS subcategories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        category_id TEXT NOT NULL,
        subcategory_id TEXT NOT NULL,
        subcategory_name_ja TEXT NOT NULL,
        item_name_en TEXT NOT NULL,
        item_name_ja TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (category_id) REFERENCES categories(category_id) ON UPDATE CASCADE ON DELETE CASCADE
      );
    `);

    // 3. スタイル TBL
    await db.execute(`
      CREATE TABLE IF NOT EXISTS styles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        style_id TEXT NOT NULL UNIQUE,
        style_name_en TEXT NOT NULL,
        style_name_ja TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 4. LINE専用マスター：主役 TBL
    await db.execute(`
      CREATE TABLE IF NOT EXISTS line_subjects (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        subject_id TEXT NOT NULL UNIQUE,
        animal_type TEXT NOT NULL,
        name_ja TEXT NOT NULL,
        name_en TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 6. LINE専用マスター：掛け合わせ TBL
    await db.execute(`
      CREATE TABLE IF NOT EXISTS line_combinations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        combination_id TEXT NOT NULL UNIQUE,
        name_ja TEXT NOT NULL,
        name_en TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 7. LINE専用マスター：セリフ・挨拶文 TBL
    await db.execute(`
      CREATE TABLE IF NOT EXISTS line_phrases (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        phrase_id TEXT NOT NULL UNIQUE,
        phrase_category TEXT NOT NULL,
        text_ja TEXT NOT NULL,
        prompt_hint_en TEXT NOT NULL DEFAULT '',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 8. LINEスタンプ パッケージ TBL
    await db.execute(`
      CREATE TABLE IF NOT EXISTS line_packages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        package_id TEXT NOT NULL UNIQUE,
        title TEXT NOT NULL,
        description TEXT,
        style_id TEXT,
        max_stamps INTEGER NOT NULL DEFAULT 40,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (style_id) REFERENCES styles(style_id) ON UPDATE CASCADE ON DELETE SET NULL
      );
    `);

    // 9. LINEスタンプ 個別 TBL
    await db.execute(`
      CREATE TABLE IF NOT EXISTS line_stamps (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        package_id TEXT NOT NULL,
        stamp_index INTEGER NOT NULL,
        stamp_type TEXT NOT NULL DEFAULT 'normal'
          CHECK (stamp_type IN ('normal', 'main', 'tab')),
        subject_id TEXT,
        combination_id TEXT,
        phrase_id TEXT,
        image_path TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (package_id, stamp_index),
        FOREIGN KEY (package_id) REFERENCES line_packages(package_id) ON UPDATE CASCADE ON DELETE CASCADE,
        FOREIGN KEY (subject_id) REFERENCES line_subjects(subject_id) ON UPDATE CASCADE ON DELETE SET NULL,
        FOREIGN KEY (combination_id) REFERENCES line_combinations(combination_id) ON UPDATE CASCADE ON DELETE SET NULL,
        FOREIGN KEY (phrase_id) REFERENCES line_phrases(phrase_id) ON UPDATE CASCADE ON DELETE SET NULL
      );
    `);

    // ==========================================
    // 【修正3】updated_at 自動更新トリガー
    // UPDATE時にも updated_at が現在時刻に書き換わるようにする
    // ==========================================

    const tablesWithUpdatedAt = [
      "categories",
      "subcategories",
      "styles",
      "line_packages",
      "line_stamps",
    ];

    for (const table of tablesWithUpdatedAt) {
      await db.execute(`
        CREATE TRIGGER IF NOT EXISTS trg_${table}_updated_at
        AFTER UPDATE ON ${table}
        BEGIN
          UPDATE ${table} SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
        END;
      `);
    }

    console.log("データベースの初期化が正常に完了しました。");
  } catch (error) {
    console.error("データベースの初期化に失敗しました:", error);
  }
};