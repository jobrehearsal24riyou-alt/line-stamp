import { useState, useEffect } from "react";
import Database from "@tauri-apps/plugin-sql";
import { initDatabase } from "../lib/initDatabase";
import { iconSeedData } from "../data/iconSeedData";

export const usePromptData = () => {
  // ==========================================
  // アイコン用 state
  // ==========================================
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [styles, setStyles] = useState([]);
  const [substyles, setSubstyles] = useState([]);

  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedSubCategoryName, setSelectedSubCategoryName] = useState("");
  const [selectedItemId, setSelectedItemId] = useState(null);
  const [selectedStyle, setSelectedStyle] = useState("");
  const [selectedPromptParts, setSelectedPromptParts] = useState([]);

  const [editablePrompt, setEditablePrompt] = useState("");
  const [isCopied, setIsCopied] = useState(false);

  // ==========================================
  // LINEスタンプ用 state
  // ==========================================
  const [lineSubjects, setLineSubjects] = useState([]);
  const [lineCombinationCategories, setLineCombinationCategories] = useState([]);
  const [lineCombinations, setLineCombinations] = useState([]);

  const [selectedAnimalType, setSelectedAnimalType] = useState("");
  const [selectedSubjectId, setSelectedSubjectId] = useState("");
  const [selectedCombinationCategoryId, setSelectedCombinationCategoryId] = useState("");
  const [selectedCombinationId, setSelectedCombinationId] = useState("");

  // LINE用サブスタイル
  const [lineSelectedStyle, setLineSelectedStyle] = useState("");
  const [lineSubstyles, setLineSubstyles] = useState([]);
  const [lineSelectedPromptParts, setLineSelectedPromptParts] = useState([]);

  const [lineEditablePrompt, setLineEditablePrompt] = useState("");
  const [lineIsCopied, setLineIsCopied] = useState(false);

  // ==========================================
  // テーマ
  // ==========================================
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const currentHour = new Date().getHours();
    return currentHour >= 21 || currentHour < 5;
  });

  // ==========================================
  // 1. 画面起動時：DB初期化 → マスターデータをロード
  // ==========================================
  useEffect(() => {
    const loadInitialMaster = async () => {
      try {
        await initDatabase();
        const db = await Database.load("sqlite:app.db");

        // アイコン用
        const catResult = await db.select("SELECT category_id, category_name_ja FROM categories ORDER BY id ASC;");
        setCategories(catResult);

        const styleResult = await db.select("SELECT style_id, style_name_ja FROM styles ORDER BY id ASC;");
        setStyles(styleResult);

        // LINE用：主役
        const subjectResult = await db.select("SELECT subject_id, animal_type, name_ja, name_en FROM line_subjects ORDER BY id ASC;");
        setLineSubjects(subjectResult);

        // LINE用：掛け合わせカテゴリ
        const combCatResult = await db.select("SELECT category_id, name_ja FROM line_combination_categories ORDER BY id ASC;");
        setLineCombinationCategories(combCatResult);

      } catch (error) {
        console.warn("DB unavailable, falling back to built-in seed data:", error);
        setCategories(iconSeedData.categories);
        setStyles(iconSeedData.styles);
        setLineSubjects([]);
        setLineCombinationCategories([]);
      }
    };
    loadInitialMaster();
  }, []);

  // ==========================================
  // 2. 大カテゴリ選択時：連動データ取得（アイコン用）
  // ==========================================
  useEffect(() => {
    if (!selectedCategory) {
      setSubcategories([]);
      setSelectedSubCategoryName("");
      setSelectedItemId(null);
      return;
    }

    const fetchLinkedSubcategories = async () => {
      try {
        const db = await Database.load("sqlite:app.db");
        const result = await db.select(
          `SELECT id, subcategory_id, subcategory_name_ja, item_name_ja, item_name_en
           FROM subcategories
           WHERE category_id = $1
           ORDER BY id ASC;`,
          [selectedCategory]
        );
        setSubcategories(result);

        if (result.length > 0) {
          const firstMiddleName = result[0].subcategory_name_ja;
          setSelectedSubCategoryName(firstMiddleName);
          const firstItem = result.find(sub => sub.subcategory_name_ja === firstMiddleName);
          setSelectedItemId(firstItem ? firstItem.id : result[0].id);
        } else {
          setSelectedSubCategoryName("");
          setSelectedItemId(null);
        }
      } catch (error) {
        console.warn("Using fallback subcategory data:", error);
        const fallback = iconSeedData.subcategories.filter((sub) => sub.category_id === selectedCategory);
        setSubcategories(fallback);

        if (fallback.length > 0) {
          const firstMiddleName = fallback[0].subcategory_name_ja;
          setSelectedSubCategoryName(firstMiddleName);
          setSelectedItemId(fallback[0].id);
        } else {
          setSelectedSubCategoryName("");
          setSelectedItemId(null);
        }
      }
    };
    fetchLinkedSubcategories();
  }, [selectedCategory]);

  // ==========================================
  // 3. 画風スタイル連動（アイコン用）
  // ==========================================
  useEffect(() => {
    if (!selectedStyle) {
      setSubstyles([]);
      return;
    }

    const fetchLinkedSubstyles = async () => {
      try {
        const db = await Database.load("sqlite:app.db");
        const result = await db.select(
          `SELECT substyles.substyle_id, substyles.substyle_name_ja, substyles.prompt_text
           FROM substyles
           INNER JOIN styles ON substyles.style_id = styles.style_id
           WHERE styles.style_id = $1
           ORDER BY substyles.id ASC;`,
          [selectedStyle]
        );
        setSubstyles(result);
        setSelectedPromptParts([]);
      } catch (error) {
        console.warn("Using fallback substyle data:", error);
        const fallback = iconSeedData.substyles.filter((sub) => sub.style_id === selectedStyle);
        setSubstyles(fallback);
        setSelectedPromptParts([]);
      }
    };
    fetchLinkedSubstyles();
  }, [selectedStyle]);

  // ==========================================
  // 4. 掛け合わせカテゴリ選択時：掛け合わせ一覧取得（LINE用）
  // ==========================================
  useEffect(() => {
    if (!selectedCombinationCategoryId) {
      setLineCombinations([]);
      setSelectedCombinationId("");
      return;
    }

    const fetchLinkedCombinations = async () => {
      try {
        const db = await Database.load("sqlite:app.db");
        const result = await db.select(
          `SELECT lc.combination_id, lc.name_ja, lc.name_en, c.name_ja as category_name_ja
           FROM line_combinations lc
           INNER JOIN line_combination_categories c ON lc.category_id = c.category_id
           WHERE lc.category_id = $1
           ORDER BY lc.id ASC;`,
          [selectedCombinationCategoryId]
        );
        setLineCombinations(result);
        setSelectedCombinationId("");
      } catch (error) {
        console.warn("LINE combinations fallback is not available in the browser build.", error);
        setLineCombinations([]);
        setSelectedCombinationId("");
      }
    };
    fetchLinkedCombinations();
  }, [selectedCombinationCategoryId]);

  // ==========================================
  // 5. LINE用スタイル連動
  // ==========================================
  useEffect(() => {
    if (!lineSelectedStyle) {
      setLineSubstyles([]);
      setLineSelectedPromptParts([]);
      return;
    }

    const fetchLineSubstyles = async () => {
      try {
        const db = await Database.load("sqlite:app.db");
        const result = await db.select(
          `SELECT substyles.substyle_id, substyles.substyle_name_ja, substyles.prompt_text
           FROM substyles
           INNER JOIN styles ON substyles.style_id = styles.style_id
           WHERE styles.style_id = $1
           ORDER BY substyles.id ASC;`,
          [lineSelectedStyle]
        );
        setLineSubstyles(result);
        setLineSelectedPromptParts([]);
      } catch (error) {
        console.warn("LINE substyle fallback is not available in the browser build.", error);
        setLineSubstyles([]);
        setLineSelectedPromptParts([]);
      }
    };
    fetchLineSubstyles();
  }, [lineSelectedStyle]);

  // ==========================================
  // アイコン用：派生データ
  // ==========================================
  const middleCategoryList = Array.from(
    new Set(subcategories.map((sub) => sub.subcategory_name_ja).filter(Boolean))
  );

  const filteredItems = subcategories.filter(
    (sub) => sub.subcategory_name_ja === selectedSubCategoryName
  );

  const handleMiddleCategoryChange = (middleName) => {
    setSelectedSubCategoryName(middleName);
    const targetGroupItems = subcategories.filter(sub => sub.subcategory_name_ja === middleName);
    if (targetGroupItems.length > 0) {
      setSelectedItemId(targetGroupItems[0].id);
    }
  };

  const handleCheckboxChange = (promptText) => {
    if (selectedPromptParts.includes(promptText)) {
      setSelectedPromptParts(selectedPromptParts.filter(p => p !== promptText));
    } else {
      setSelectedPromptParts([...selectedPromptParts, promptText]);
    }
  };

  // ==========================================
  // LINE用：animal_typeで絞り込んだ主役一覧
  // ==========================================
  const filteredSubjects = selectedAnimalType
    ? lineSubjects.filter(s => s.animal_type === selectedAnimalType)
    : lineSubjects;

  // ==========================================
  // LINE用：サブスタイルチェックボックス
  // ==========================================
  const handleLineCheckboxChange = (promptText) => {
    if (lineSelectedPromptParts.includes(promptText)) {
      setLineSelectedPromptParts(lineSelectedPromptParts.filter(p => p !== promptText));
    } else {
      setLineSelectedPromptParts([...lineSelectedPromptParts, promptText]);
    }
  };

  // ==========================================
  // アイコン用：プロンプト自動生成
  // ==========================================
  useEffect(() => {
    const activeSubData = subcategories.find(sub => sub.id === selectedItemId);
    const objectPrompt = activeSubData ? activeSubData.item_name_en : "";
    const generated = [objectPrompt, ...selectedPromptParts].filter(Boolean).join(", ");
    setEditablePrompt(generated);
  }, [selectedItemId, selectedPromptParts, subcategories]);

  // ==========================================
  // アイコン用：コピー
  // ==========================================
  const handleCopy = async () => {
    if (!editablePrompt) return;
    try {
      await navigator.clipboard.writeText(editablePrompt);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (error) {
      console.error("プロンプトのコピーに失敗しました:", error);
    }
  };

  // ==========================================
  // LINE用：コピー
  // ==========================================
  const handleLineCopy = async () => {
    if (!lineEditablePrompt) return;
    try {
      await navigator.clipboard.writeText(lineEditablePrompt);
      setLineIsCopied(true);
      setTimeout(() => setLineIsCopied(false), 2000);
    } catch (error) {
      console.error("LINEプロンプトのコピーに失敗しました:", error);
    }
  };

  return {
    // アイコン用
    categories, styles, substyles,
    middleCategoryList, filteredItems,
    selectedCategory, setSelectedCategory,
    selectedSubCategoryName,
    selectedItemId, setSelectedItemId,
    selectedStyle, setSelectedStyle,
    selectedPromptParts,
    editablePrompt, setEditablePrompt,
    isCopied,
    handleMiddleCategoryChange,
    handleCheckboxChange,
    handleCopy,

    // LINE用
    lineSubjects, lineCombinationCategories, lineCombinations,
    filteredSubjects,
    selectedAnimalType, setSelectedAnimalType,
    selectedSubjectId, setSelectedSubjectId,
    selectedCombinationCategoryId, setSelectedCombinationCategoryId,
    selectedCombinationId, setSelectedCombinationId,
    lineSelectedStyle, setLineSelectedStyle,
    lineSubstyles,
    lineSelectedPromptParts,
    lineEditablePrompt, setLineEditablePrompt,
    lineIsCopied,
    handleLineCheckboxChange,
    handleLineCopy,

    // テーマ
    isDarkMode, setIsDarkMode,
  };
};
