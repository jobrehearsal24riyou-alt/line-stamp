import lineSubjectsData from "../data/line_subjects.json";
import lineCombinationCategoriesData from "../data/line_combination_categories.json";
import lineCombinationsData from "../data/line_combinations.json";

export const seedLineData = async (db) => {
  for (const subject of lineSubjectsData.line_subjects) {
    await db.execute(
      `INSERT OR IGNORE INTO line_subjects (subject_id, animal_type, name_ja, name_en)
       VALUES (?, ?, ?, ?);`,
      [subject.subject_id, subject.animal_type, subject.name_ja, subject.name_en]
    );
  }

  for (const cat of lineCombinationCategoriesData.categories) {
    await db.execute(
      `INSERT OR IGNORE INTO line_combination_categories (category_id, name_ja)
       VALUES (?, ?);`,
      [cat.category_id, cat.name_ja]
    );
  }

  for (const comb of lineCombinationsData.combinations) {
    await db.execute(
      `INSERT OR IGNORE INTO line_combinations (combination_id, category_id, name_ja, name_en)
       VALUES (?, ?, ?, ?);`,
      [comb.combination_id, comb.category_id, comb.name_ja, comb.name_en]
    );
  }
};
