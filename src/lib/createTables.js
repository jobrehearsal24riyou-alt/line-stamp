const ensureColumn = async (db, tableName, columnDefinition) => {
  const columnName = columnDefinition.trim().split(/\s+/)[0];
  const columns = await db.select(`PRAGMA table_info(${tableName});`);
  const exists = columns.some((column) => column.name === columnName);

  if (!exists) {
    await db.execute(`ALTER TABLE ${tableName} ADD COLUMN ${columnDefinition};`);
  }
};

const ensureColumns = async (db, tableName, columnDefinitions) => {
  for (const columnDefinition of columnDefinitions) {
    await ensureColumn(db, tableName, columnDefinition);
  }
};

export const createTables = async (db) => {
  // 1. カテゴリ TBL
  await db.execute(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category_id TEXT NOT NULL UNIQUE,
      category_name_en TEXT NOT NULL,
      category_code_en TEXT NOT NULL,
      category_name_ja TEXT NOT NULL,
      display_name_ja TEXT NOT NULL DEFAULT '',
      display_name_en TEXT NOT NULL DEFAULT '',
      sort_order INTEGER NOT NULL DEFAULT 0,
      is_enabled INTEGER NOT NULL DEFAULT 1 CHECK (is_enabled IN (0, 1)),
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);
  await ensureColumns(db, "categories", [
    "display_name_ja TEXT NOT NULL DEFAULT ''",
    "display_name_en TEXT NOT NULL DEFAULT ''",
    "sort_order INTEGER NOT NULL DEFAULT 0",
    "is_enabled INTEGER NOT NULL DEFAULT 1 CHECK (is_enabled IN (0, 1))",
    "created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP",
    "updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP",
  ]);

  // 2. サブカテゴリ TBL
  await db.execute(`
    CREATE TABLE IF NOT EXISTS subcategories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category_id TEXT NOT NULL,
      subcategory_id TEXT NOT NULL,
      subcategory_name_ja TEXT NOT NULL,
      item_name_en TEXT NOT NULL,
      item_name_ja TEXT NOT NULL,
      display_name_ja TEXT NOT NULL DEFAULT '',
      display_name_en TEXT NOT NULL DEFAULT '',
      sort_order INTEGER NOT NULL DEFAULT 0,
      is_enabled INTEGER NOT NULL DEFAULT 1 CHECK (is_enabled IN (0, 1)),
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (category_id) REFERENCES categories(category_id) ON UPDATE CASCADE ON DELETE CASCADE
    );
  `);
  await ensureColumns(db, "subcategories", [
    "display_name_ja TEXT NOT NULL DEFAULT ''",
    "display_name_en TEXT NOT NULL DEFAULT ''",
    "sort_order INTEGER NOT NULL DEFAULT 0",
    "is_enabled INTEGER NOT NULL DEFAULT 1 CHECK (is_enabled IN (0, 1))",
    "created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP",
    "updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP",
  ]);

  // 3. スタイル TBL
  await db.execute(`
    CREATE TABLE IF NOT EXISTS styles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      style_id TEXT NOT NULL UNIQUE,
      style_name_en TEXT NOT NULL,
      style_name_ja TEXT NOT NULL,
      display_name_ja TEXT NOT NULL DEFAULT '',
      display_name_en TEXT NOT NULL DEFAULT '',
      sort_order INTEGER NOT NULL DEFAULT 0,
      is_enabled INTEGER NOT NULL DEFAULT 1 CHECK (is_enabled IN (0, 1)),
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);
  await ensureColumns(db, "styles", [
    "display_name_ja TEXT NOT NULL DEFAULT ''",
    "display_name_en TEXT NOT NULL DEFAULT ''",
    "sort_order INTEGER NOT NULL DEFAULT 0",
    "is_enabled INTEGER NOT NULL DEFAULT 1 CHECK (is_enabled IN (0, 1))",
    "created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP",
    "updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP",
  ]);

  // 4. スタイル別プロンプト TBL
  await db.execute(`
    CREATE TABLE IF NOT EXISTS style_prompts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      style_id TEXT NOT NULL,
      prompt_id TEXT NOT NULL UNIQUE,
      display_name_ja TEXT NOT NULL DEFAULT '',
      display_name_en TEXT NOT NULL DEFAULT '',
      prompt_text TEXT NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0,
      is_enabled INTEGER NOT NULL DEFAULT 1 CHECK (is_enabled IN (0, 1)),
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (style_id) REFERENCES styles(style_id) ON UPDATE CASCADE ON DELETE CASCADE
    );
  `);
  await ensureColumns(db, "style_prompts", [
    "display_name_ja TEXT NOT NULL DEFAULT ''",
    "display_name_en TEXT NOT NULL DEFAULT ''",
    "prompt_text TEXT NOT NULL DEFAULT ''",
    "sort_order INTEGER NOT NULL DEFAULT 0",
    "is_enabled INTEGER NOT NULL DEFAULT 1 CHECK (is_enabled IN (0, 1))",
    "created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP",
    "updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP",
  ]);

  // 5. LINE専用マスター：主役 TBL
  await db.execute(`
    CREATE TABLE IF NOT EXISTS line_subjects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      subject_id TEXT NOT NULL UNIQUE,
      animal_type TEXT NOT NULL,
      name_ja TEXT NOT NULL,
      name_en TEXT NOT NULL,
      display_name_ja TEXT NOT NULL DEFAULT '',
      display_name_en TEXT NOT NULL DEFAULT '',
      sort_order INTEGER NOT NULL DEFAULT 0,
      is_enabled INTEGER NOT NULL DEFAULT 1 CHECK (is_enabled IN (0, 1)),
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);
  await ensureColumns(db, "line_subjects", [
    "display_name_ja TEXT NOT NULL DEFAULT ''",
    "display_name_en TEXT NOT NULL DEFAULT ''",
    "sort_order INTEGER NOT NULL DEFAULT 0",
    "is_enabled INTEGER NOT NULL DEFAULT 1 CHECK (is_enabled IN (0, 1))",
    "created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP",
    "updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP",
  ]);

  // 6. LINE専用マスター：掛け合わせカテゴリ TBL
  await db.execute(`
    CREATE TABLE IF NOT EXISTS line_combination_categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category_id TEXT NOT NULL UNIQUE,
      name_ja TEXT NOT NULL,
      display_name_ja TEXT NOT NULL DEFAULT '',
      display_name_en TEXT NOT NULL DEFAULT '',
      sort_order INTEGER NOT NULL DEFAULT 0,
      is_enabled INTEGER NOT NULL DEFAULT 1 CHECK (is_enabled IN (0, 1)),
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);
  await ensureColumns(db, "line_combination_categories", [
    "display_name_ja TEXT NOT NULL DEFAULT ''",
    "display_name_en TEXT NOT NULL DEFAULT ''",
    "sort_order INTEGER NOT NULL DEFAULT 0",
    "is_enabled INTEGER NOT NULL DEFAULT 1 CHECK (is_enabled IN (0, 1))",
    "created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP",
    "updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP",
  ]);

  // 7. LINE専用マスター：掛け合わせ TBL
  await db.execute(`
    CREATE TABLE IF NOT EXISTS line_combinations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      combination_id TEXT NOT NULL UNIQUE,
      category_id TEXT NOT NULL,
      name_ja TEXT NOT NULL,
      name_en TEXT NOT NULL,
      display_name_ja TEXT NOT NULL DEFAULT '',
      display_name_en TEXT NOT NULL DEFAULT '',
      sort_order INTEGER NOT NULL DEFAULT 0,
      is_enabled INTEGER NOT NULL DEFAULT 1 CHECK (is_enabled IN (0, 1)),
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (category_id) REFERENCES line_combination_categories(category_id) ON UPDATE CASCADE ON DELETE CASCADE
    );
  `);
  await ensureColumns(db, "line_combinations", [
    "display_name_ja TEXT NOT NULL DEFAULT ''",
    "display_name_en TEXT NOT NULL DEFAULT ''",
    "sort_order INTEGER NOT NULL DEFAULT 0",
    "is_enabled INTEGER NOT NULL DEFAULT 1 CHECK (is_enabled IN (0, 1))",
    "created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP",
    "updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP",
  ]);

  // 8. LINE専用マスター：セリフ・挨拶文 TBL
  await db.execute(`
    CREATE TABLE IF NOT EXISTS line_phrases (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      phrase_id TEXT NOT NULL UNIQUE,
      phrase_category TEXT NOT NULL,
      text_ja TEXT NOT NULL,
      prompt_hint_en TEXT NOT NULL DEFAULT '',
      display_name_ja TEXT NOT NULL DEFAULT '',
      display_name_en TEXT NOT NULL DEFAULT '',
      sort_order INTEGER NOT NULL DEFAULT 0,
      is_enabled INTEGER NOT NULL DEFAULT 1 CHECK (is_enabled IN (0, 1)),
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);
  await ensureColumns(db, "line_phrases", [
    "display_name_ja TEXT NOT NULL DEFAULT ''",
    "display_name_en TEXT NOT NULL DEFAULT ''",
    "sort_order INTEGER NOT NULL DEFAULT 0",
    "is_enabled INTEGER NOT NULL DEFAULT 1 CHECK (is_enabled IN (0, 1))",
    "created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP",
    "updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP",
  ]);

  // 9. LINEスタンプ パッケージ TBL
  await db.execute(`
    CREATE TABLE IF NOT EXISTS line_packages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      package_id TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL,
      description TEXT,
      style_id TEXT,
      max_stamps INTEGER NOT NULL DEFAULT 40,
      display_name_ja TEXT NOT NULL DEFAULT '',
      display_name_en TEXT NOT NULL DEFAULT '',
      sort_order INTEGER NOT NULL DEFAULT 0,
      is_enabled INTEGER NOT NULL DEFAULT 1 CHECK (is_enabled IN (0, 1)),
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (style_id) REFERENCES styles(style_id) ON UPDATE CASCADE ON DELETE SET NULL
    );
  `);
  await ensureColumns(db, "line_packages", [
    "display_name_ja TEXT NOT NULL DEFAULT ''",
    "display_name_en TEXT NOT NULL DEFAULT ''",
    "sort_order INTEGER NOT NULL DEFAULT 0",
    "is_enabled INTEGER NOT NULL DEFAULT 1 CHECK (is_enabled IN (0, 1))",
    "created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP",
    "updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP",
  ]);

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
      display_name_ja TEXT NOT NULL DEFAULT '',
      display_name_en TEXT NOT NULL DEFAULT '',
      is_enabled INTEGER NOT NULL DEFAULT 1 CHECK (is_enabled IN (0, 1)),
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);
  await ensureColumns(db, "cards", [
    "display_name_ja TEXT NOT NULL DEFAULT ''",
    "display_name_en TEXT NOT NULL DEFAULT ''",
    "is_enabled INTEGER NOT NULL DEFAULT 1 CHECK (is_enabled IN (0, 1))",
    "created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP",
    "updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP",
  ]);

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
      display_name_ja TEXT NOT NULL DEFAULT '',
      display_name_en TEXT NOT NULL DEFAULT '',
      sort_order INTEGER NOT NULL DEFAULT 0,
      is_enabled INTEGER NOT NULL DEFAULT 1 CHECK (is_enabled IN (0, 1)),
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE (package_id, stamp_index),
      FOREIGN KEY (package_id) REFERENCES line_packages(package_id) ON UPDATE CASCADE ON DELETE CASCADE,
      FOREIGN KEY (subject_id) REFERENCES line_subjects(subject_id) ON UPDATE CASCADE ON DELETE SET NULL,
      FOREIGN KEY (combination_id) REFERENCES line_combinations(combination_id) ON UPDATE CASCADE ON DELETE SET NULL,
      FOREIGN KEY (phrase_id) REFERENCES line_phrases(phrase_id) ON UPDATE CASCADE ON DELETE SET NULL
    );
  `);
  await ensureColumns(db, "line_stamps", [
    "display_name_ja TEXT NOT NULL DEFAULT ''",
    "display_name_en TEXT NOT NULL DEFAULT ''",
    "sort_order INTEGER NOT NULL DEFAULT 0",
    "is_enabled INTEGER NOT NULL DEFAULT 1 CHECK (is_enabled IN (0, 1))",
    "created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP",
    "updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP",
  ]);

  // updated_at 自動更新トリガー
  const tablesWithUpdatedAt = [
    "categories",
    "subcategories",
    "styles",
    "style_prompts",
    "line_subjects",
    "line_combination_categories",
    "line_combinations",
    "line_phrases",
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
};
