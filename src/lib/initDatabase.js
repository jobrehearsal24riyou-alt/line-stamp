import Database from "@tauri-apps/plugin-sql";
import { createTables } from "./createTables.js";
import { seedIconData } from "./seedIconData.js";
import { seedLineData } from "./seedLineData.js";
import { seedStyleData } from "./seedStyleData.js";

export const initDatabase = async () => {
  try {
    const db = await Database.load("sqlite:app.db");

    const pathResult = await db.select("PRAGMA database_list;");
    console.log("====================================");
    console.log("DBの実際の場所はココです！👇");
    console.log(pathResult[0].file);
    console.log("====================================");

    await createTables(db);

    // ==========================================
    // アイコン用初期データ挿入（INSERT OR IGNORE）
    // DELETEは削除：ユーザーが追加したデータを消さないため
    // ==========================================
    await seedIconData(db);
    await seedStyleData(db);

    // ==========================================
    // LINE用初期データ挿入
    // ==========================================
    await seedLineData(db);

    console.log("データベースの初期化が正常に完了しました。");
  } catch (error) {
    console.error("データベースの初期化に失敗しました:", error);
    throw error;
  }
};
