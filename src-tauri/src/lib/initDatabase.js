import Database from "@tauri-apps/plugin-sql";
import lineSubjectsData from "../data/line_subjects.json";
import lineCombinationsData from "../data/line_combinations.json";

export const initDatabase = async () => {
  try {
    const db = await Database.load("sqlite:app.db");

    const pathResult = await db.select("PRAGMA database_list;");
    console.log("====================================");
    console.log("DBの実際の場所はココです！👇");
    console.log(pathResult[0].file);
    console.log("====================================");

    // =========================
    // テーブル作成（省略なし）
    // =========================

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

    await db.execute(`
      CREATE TABLE IF NOT EXISTS line_combination_categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        category_id TEXT NOT NULL UNIQUE,
        name_ja TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS line_combinations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        combination_id TEXT NOT NULL UNIQUE,
        category_id TEXT NOT NULL,
        name_ja TEXT NOT NULL,
        name_en TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // =========================
    // JSON安全取得（ここが重要）
    // =========================

    const subjects =
      lineSubjectsData?.line_subjects ??
      lineSubjectsData?.default?.line_subjects ??
      lineSubjectsData;

    const categories =
      lineCombinationsData?.line_combination_categories ??
      lineCombinationsData?.default?.line_combination_categories ??
      [];

    const combinations =
      lineCombinationsData?.line_combinations ??
      lineCombinationsData?.default?.line_combinations ??
      [];

    // =========================
    // デバッグログ
    // =========================

    console.log("subjects type:", typeof subjects);
    console.log("isArray:", Array.isArray(subjects));

    // =========================
    // line_subjects
    // =========================

    if (Array.isArray(subjects)) {
      for (const subject of subjects) {
        await db.execute(
          `INSERT OR IGNORE INTO line_subjects
           (subject_id, animal_type, name_ja, name_en)
           VALUES (?, ?, ?, ?)`,
          [
            subject.subject_id,
            subject.animal_type,
            subject.name_ja,
            subject.name_en,
          ]
        );
      }
    } else {
      console.error("line_subjects の形式が不正:", subjects);
    }

    // =========================
    // categories
    // =========================

    if (Array.isArray(categories)) {
      for (const cat of categories) {
        await db.execute(
          `INSERT OR IGNORE INTO line_combination_categories
           (category_id, name_ja)
           VALUES (?, ?)`,
          [cat.category_id, cat.name_ja]
        );
      }
    }

    // =========================
    // combinations
    // =========================

    if (Array.isArray(combinations)) {
      for (const comb of combinations) {
        await db.execute(
          `INSERT OR IGNORE INTO line_combinations
           (combination_id, category_id, name_ja, name_en)
           VALUES (?, ?, ?, ?)`,
          [
            comb.combination_id,
            comb.category_id,
            comb.name_ja,
            comb.name_en,
          ]
        );
      }
    }

    console.log("データベースの初期化が正常に完了しました。");
  } catch (error) {
    console.error("データベースの初期化に失敗しました:", error);
  }
};