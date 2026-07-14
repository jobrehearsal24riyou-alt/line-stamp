import Database from "@tauri-apps/plugin-sql";
import { iconSeedData } from "../data/iconSeedData.js";
import lineSubjectsData from "../data/line_subjects.json";
import lineCombinationCategoriesData from "../data/line_combination_categories.json";
import lineCombinationsData from "../data/line_combinations.json";

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

    // 4. サブスタイル TBL
    await db.execute(`
      CREATE TABLE IF NOT EXISTS substyles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        style_id TEXT NOT NULL,
        substyle_id TEXT NOT NULL,
        substyle_name_ja TEXT NOT NULL,
        prompt_text TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (style_id, substyle_id),
        FOREIGN KEY (style_id) REFERENCES styles(style_id) ON UPDATE CASCADE ON DELETE CASCADE
      );
    `);

    // 既存DBに重複行が入っている場合は、1組ごとに1行だけ残すように整理する
    const existingSubstyles = await db.select("SELECT COUNT(*) AS cnt FROM substyles;");
    if (existingSubstyles[0]?.cnt > 0) {
      await db.execute(`DROP TABLE IF EXISTS substyles_migration;`);
      await db.execute(`
        CREATE TABLE substyles_migration (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          style_id TEXT NOT NULL,
          substyle_id TEXT NOT NULL,
          substyle_name_ja TEXT NOT NULL,
          prompt_text TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE (style_id, substyle_id),
          FOREIGN KEY (style_id) REFERENCES styles(style_id) ON UPDATE CASCADE ON DELETE CASCADE
        );
      `);

      await db.execute(`
        INSERT OR IGNORE INTO substyles_migration (
          id, style_id, substyle_id, substyle_name_ja, prompt_text, created_at, updated_at
        )
        SELECT id, style_id, substyle_id, substyle_name_ja, prompt_text, created_at, updated_at
        FROM substyles
        ORDER BY id ASC;
      `);

      await db.execute(`DROP TABLE substyles;`);
      await db.execute(`ALTER TABLE substyles_migration RENAME TO substyles;`);

      await db.execute(`
        CREATE TRIGGER IF NOT EXISTS trg_substyles_updated_at
        AFTER UPDATE ON substyles
        BEGIN
          UPDATE substyles SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
        END;
      `);
    }

    // 5. LINE専用マスター：主役 TBL
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

    // 6. LINE専用マスター：掛け合わせカテゴリ TBL
    await db.execute(`
      CREATE TABLE IF NOT EXISTS line_combination_categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        category_id TEXT NOT NULL UNIQUE,
        name_ja TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 7. LINE専用マスター：掛け合わせ TBL
    await db.execute(`
      CREATE TABLE IF NOT EXISTS line_combinations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        combination_id TEXT NOT NULL UNIQUE,
        category_id TEXT NOT NULL,
        name_ja TEXT NOT NULL,
        name_en TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (category_id) REFERENCES line_combination_categories(category_id) ON UPDATE CASCADE ON DELETE CASCADE
      );
    `);

    // 8. LINE専用マスター：セリフ・挨拶文 TBL
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

    // 9. LINEスタンプ パッケージ TBL
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

    // 10. カード管理 TBL（アイコン・LINEスタンプ共用）
    await db.execute(`
      CREATE TABLE IF NOT EXISTS cards (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        card_id TEXT NOT NULL UNIQUE,
        card_type TEXT NOT NULL CHECK (card_type IN ('icon', 'stamp')),
        title TEXT NOT NULL,
        sort_order INTEGER DEFAULT 0,
        is_favorite INTEGER DEFAULT 0 CHECK (is_favorite IN (0, 1)),
        is_hidden INTEGER DEFAULT 0 CHECK (is_hidden IN (0, 1)),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 11. LINEスタンプ 個別 TBL
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

    // updated_at 自動更新トリガー
    const tablesWithUpdatedAt = [
      "categories",
      "subcategories",
      "styles",
      "substyles",
      "cards",
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

    // ==========================================
    // アイコン用初期データ挿入（INSERT OR IGNORE）
    // DELETEは削除：ユーザーが追加したデータを消さないため
    // ==========================================

    // カテゴリ
    for (const cat of iconSeedData.categories) {
      await db.execute(
        `INSERT OR IGNORE INTO categories (category_id, category_name_en, category_code_en, category_name_ja)
         VALUES (?, ?, ?, ?);`,
        [cat.category_id, cat.category_name_en, cat.category_code_en, cat.category_name_ja]
      );
    }

    // サブカテゴリ
    for (const sub of iconSeedData.subcategories) {
      await db.execute(
        `INSERT OR IGNORE INTO subcategories (category_id, subcategory_id, subcategory_name_ja, item_name_en, item_name_ja)
         VALUES (?, ?, ?, ?, ?);`,
        [sub.category_id, sub.subcategory_id, sub.subcategory_name_ja, sub.item_name_en, sub.item_name_ja]
      );
    }

    // スタイル
    const stylesData = [
      { style_id: "c001", style_name_en: "Irasutoya style (Heartwarming)", style_name_ja: "いらすとや風 (ほのぼの)" },
      { style_id: "c002", style_name_en: "3D Isometric (Solid)",           style_name_ja: "3Dアイソメトリック (立体)" },
      { style_id: "c003", style_name_en: "Flat Design (Modern)",           style_name_ja: "フラットデザイン (モダン)" },
      { style_id: "c004", style_name_en: "Glossy 3D Icon (Shiny)",         style_name_ja: "光沢3Dアイコン (ツヤ感)" },
      { style_id: "c005", style_name_en: "Watercolor style (Analog)",      style_name_ja: "水彩画風 (アナログ)" },
      { style_id: "c006", style_name_en: "Pixel Art (Dot Art)",            style_name_ja: "ピクセルアート (ドット絵)" },
    ];

    for (const style of stylesData) {
      await db.execute(
        `INSERT OR IGNORE INTO styles (style_id, style_name_en, style_name_ja)
         VALUES (?, ?, ?);`,
        [style.style_id, style.style_name_en, style.style_name_ja]
      );
    }

    // サブスタイル
    const substylesData = [
      { style_id: "c001", substyle_id: "ss001", substyle_name_ja: "いらすとや風",          prompt_text: "Irasutoya style" },
      { style_id: "c001", substyle_id: "ss002", substyle_name_ja: "かわいい手描きイラスト", prompt_text: "cute hand-drawn illustration" },
      { style_id: "c001", substyle_id: "ss003", substyle_name_ja: "フラットカラー（べた塗り）", prompt_text: "flat color" },
      { style_id: "c001", substyle_id: "ss004", substyle_name_ja: "太い輪郭線",            prompt_text: "thick outlines" },
      { style_id: "c002", substyle_id: "ss005", substyle_name_ja: "3Dアイソメトリック",    prompt_text: "3D isometric" },
      { style_id: "c002", substyle_id: "ss006", substyle_name_ja: "クレイレンダリング",     prompt_text: "clay render" },
      { style_id: "c002", substyle_id: "ss007", substyle_name_ja: "高品質",                prompt_text: "high quality" },
      { style_id: "c002", substyle_id: "ss008", substyle_name_ja: "C4D（3Dソフト風の質感）", prompt_text: "C4D" },
      { style_id: "c002", substyle_id: "ss009", substyle_name_ja: "柔らかな照明",          prompt_text: "soft lighting" },
      { style_id: "c003", substyle_id: "ss010", substyle_name_ja: "フラットデザイン",       prompt_text: "Flat design" },
      { style_id: "c003", substyle_id: "ss011", substyle_name_ja: "ミニマリスト",           prompt_text: "minimalist" },
      { style_id: "c003", substyle_id: "ss012", substyle_name_ja: "ベクターアート",         prompt_text: "vector art" },
      { style_id: "c003", substyle_id: "ss013", substyle_name_ja: "鮮やかな色彩",          prompt_text: "vibrant colors" },
      { style_id: "c004", substyle_id: "ss014", substyle_name_ja: "光沢のある3Dアイコン",   prompt_text: "Glossy 3D icon" },
      { style_id: "c004", substyle_id: "ss015", substyle_name_ja: "プラスチックの質感",     prompt_text: "plastic texture" },
      { style_id: "c004", substyle_id: "ss016", substyle_name_ja: "スタジオライティング",   prompt_text: "studio lighting" },
      { style_id: "c004", substyle_id: "ss017", substyle_name_ja: "反射・光沢あり",        prompt_text: "reflective" },
      { style_id: "c005", substyle_id: "ss018", substyle_name_ja: "水彩画風",              prompt_text: "Watercolor style" },
      { style_id: "c005", substyle_id: "ss019", substyle_name_ja: "柔らかなエッジ",        prompt_text: "soft edges" },
      { style_id: "c005", substyle_id: "ss020", substyle_name_ja: "パステルカラー",        prompt_text: "pastel colors" },
      { style_id: "c005", substyle_id: "ss021", substyle_name_ja: "アーティスティック",     prompt_text: "artistic" },
      { style_id: "c006", substyle_id: "ss022", substyle_name_ja: "ピクセルアート",        prompt_text: "Pixel art" },
      { style_id: "c006", substyle_id: "ss023", substyle_name_ja: "8ビット",               prompt_text: "8-bit" },
      { style_id: "c006", substyle_id: "ss024", substyle_name_ja: "レトロゲーム風",        prompt_text: "retro game style" },
    ];

    for (const sub of substylesData) {
      await db.execute(
        `INSERT OR IGNORE INTO substyles (style_id, substyle_id, substyle_name_ja, prompt_text)
         VALUES (?, ?, ?, ?);`,
        [sub.style_id, sub.substyle_id, sub.substyle_name_ja, sub.prompt_text]
      );
    }

    // ==========================================
    // LINE用初期データ挿入
    // ==========================================

    // line_subjects
    for (const subject of lineSubjectsData.line_subjects) {
      await db.execute(
        `INSERT OR IGNORE INTO line_subjects (subject_id, animal_type, name_ja, name_en)
         VALUES (?, ?, ?, ?);`,
        [subject.subject_id, subject.animal_type, subject.name_ja, subject.name_en]
      );
    }

    // line_combination_categories
    for (const cat of lineCombinationCategoriesData.categories) {
      await db.execute(
        `INSERT OR IGNORE INTO line_combination_categories (category_id, name_ja)
         VALUES (?, ?);`,
        [cat.category_id, cat.name_ja]
      );
    }

    // line_combinations
    for (const comb of lineCombinationsData.combinations) {
      await db.execute(
        `INSERT OR IGNORE INTO line_combinations (combination_id, category_id, name_ja, name_en)
         VALUES (?, ?, ?, ?);`,
        [comb.combination_id, comb.category_id, comb.name_ja, comb.name_en]
      );
    }

    console.log("データベースの初期化が正常に完了しました。");
  } catch (error) {
    console.error("データベースの初期化に失敗しました:", error);
  }
};
// ※このコードは initDatabase.js の既存コードの末尾、console.log の前に追加してください
