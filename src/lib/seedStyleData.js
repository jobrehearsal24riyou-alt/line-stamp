export const seedStyleData = async (db) => {
  const stylesData = [
    {
      style_id: "c001",
      style_name_en: "Irasutoya style (Heartwarming)",
      style_name_ja: "いらすとや風 (ほのぼの)",
      display_name_ja: "いらすとや風",
      display_name_en: "Irasutoya Style",
      sort_order: 1,
      is_enabled: 1,
    },
    {
      style_id: "c002",
      style_name_en: "3D Isometric (Solid)",
      style_name_ja: "3Dアイソメトリック (立体)",
      display_name_ja: "3Dアイソメトリック",
      display_name_en: "3D Isometric",
      sort_order: 2,
      is_enabled: 1,
    },
    {
      style_id: "c003",
      style_name_en: "Flat Design (Modern)",
      style_name_ja: "フラットデザイン (モダン)",
      display_name_ja: "フラットデザイン",
      display_name_en: "Flat Design",
      sort_order: 3,
      is_enabled: 1,
    },
    {
      style_id: "c004",
      style_name_en: "Glossy 3D Icon (Shiny)",
      style_name_ja: "光沢3Dアイコン (ツヤ感)",
      display_name_ja: "光沢3Dアイコン",
      display_name_en: "Glossy 3D Icon",
      sort_order: 4,
      is_enabled: 1,
    },
    {
      style_id: "c005",
      style_name_en: "Watercolor style (Analog)",
      style_name_ja: "水彩画風 (アナログ)",
      display_name_ja: "水彩画風",
      display_name_en: "Watercolor",
      sort_order: 5,
      is_enabled: 1,
    },
    {
      style_id: "c006",
      style_name_en: "Pixel Art (Dot Art)",
      style_name_ja: "ピクセルアート (ドット絵)",
      display_name_ja: "ピクセルアート",
      display_name_en: "Pixel Art",
      sort_order: 6,
      is_enabled: 1,
    },
  ];

  for (const style of stylesData) {
    await db.execute(
      `INSERT OR IGNORE INTO styles (style_id, style_name_en, style_name_ja, display_name_ja, display_name_en, sort_order, is_enabled)
       VALUES (?, ?, ?, ?, ?, ?, ?);`,
      [style.style_id, style.style_name_en, style.style_name_ja, style.display_name_ja, style.display_name_en, style.sort_order, style.is_enabled]
    );
  }

  const stylePromptsData = [
    { style_id: "c001", prompt_id: "c001-p001", display_name_ja: "いらすとや風", display_name_en: "Irasutoya Style", prompt_text: "Irasutoya style", sort_order: 1, is_enabled: 1 },
    { style_id: "c001", prompt_id: "c001-p002", display_name_ja: "かわいい手描きイラスト", display_name_en: "Cute Hand-Drawn Illustration", prompt_text: "cute hand-drawn illustration", sort_order: 2, is_enabled: 1 },
    { style_id: "c001", prompt_id: "c001-p003", display_name_ja: "フラットカラー", display_name_en: "Flat Color", prompt_text: "flat color", sort_order: 3, is_enabled: 1 },
    { style_id: "c001", prompt_id: "c001-p004", display_name_ja: "太い輪郭線", display_name_en: "Thick Outline", prompt_text: "thick outlines", sort_order: 4, is_enabled: 1 },
    { style_id: "c002", prompt_id: "c002-p001", display_name_ja: "3Dアイソメトリック", display_name_en: "3D Isometric", prompt_text: "3D isometric", sort_order: 1, is_enabled: 1 },
    { style_id: "c002", prompt_id: "c002-p002", display_name_ja: "クレイレンダリング", display_name_en: "Clay Render", prompt_text: "clay render", sort_order: 2, is_enabled: 1 },
    { style_id: "c002", prompt_id: "c002-p003", display_name_ja: "高品質", display_name_en: "High Quality", prompt_text: "high quality", sort_order: 3, is_enabled: 1 },
    { style_id: "c002", prompt_id: "c002-p004", display_name_ja: "C4D", display_name_en: "C4D", prompt_text: "C4D", sort_order: 4, is_enabled: 1 },
    { style_id: "c002", prompt_id: "c002-p005", display_name_ja: "柔らかな照明", display_name_en: "Soft Lighting", prompt_text: "soft lighting", sort_order: 5, is_enabled: 1 },
    { style_id: "c003", prompt_id: "c003-p001", display_name_ja: "フラットデザイン", display_name_en: "Flat Design", prompt_text: "Flat design", sort_order: 1, is_enabled: 1 },
    { style_id: "c003", prompt_id: "c003-p002", display_name_ja: "ミニマリスト", display_name_en: "Minimalist", prompt_text: "minimalist", sort_order: 2, is_enabled: 1 },
    { style_id: "c003", prompt_id: "c003-p003", display_name_ja: "ベクターアート", display_name_en: "Vector Art", prompt_text: "vector art", sort_order: 3, is_enabled: 1 },
    { style_id: "c003", prompt_id: "c003-p004", display_name_ja: "鮮やかな色彩", display_name_en: "Vibrant Colors", prompt_text: "vibrant colors", sort_order: 4, is_enabled: 1 },
    { style_id: "c004", prompt_id: "c004-p001", display_name_ja: "光沢のある3Dアイコン", display_name_en: "Glossy 3D Icon", prompt_text: "Glossy 3D icon", sort_order: 1, is_enabled: 1 },
    { style_id: "c004", prompt_id: "c004-p002", display_name_ja: "プラスチックの質感", display_name_en: "Plastic Texture", prompt_text: "plastic texture", sort_order: 2, is_enabled: 1 },
    { style_id: "c004", prompt_id: "c004-p003", display_name_ja: "スタジオライティング", display_name_en: "Studio Lighting", prompt_text: "studio lighting", sort_order: 3, is_enabled: 1 },
    { style_id: "c004", prompt_id: "c004-p004", display_name_ja: "反射・光沢あり", display_name_en: "Reflective", prompt_text: "reflective", sort_order: 4, is_enabled: 1 },
    { style_id: "c005", prompt_id: "c005-p001", display_name_ja: "水彩画風", display_name_en: "Watercolor", prompt_text: "Watercolor style", sort_order: 1, is_enabled: 1 },
    { style_id: "c005", prompt_id: "c005-p002", display_name_ja: "柔らかなエッジ", display_name_en: "Soft Edges", prompt_text: "soft edges", sort_order: 2, is_enabled: 1 },
    { style_id: "c005", prompt_id: "c005-p003", display_name_ja: "パステルカラー", display_name_en: "Pastel Colors", prompt_text: "pastel colors", sort_order: 3, is_enabled: 1 },
    { style_id: "c005", prompt_id: "c005-p004", display_name_ja: "アーティスティック", display_name_en: "Artistic", prompt_text: "artistic", sort_order: 4, is_enabled: 1 },
    { style_id: "c006", prompt_id: "c006-p001", display_name_ja: "ピクセルアート", display_name_en: "Pixel Art", prompt_text: "Pixel art", sort_order: 1, is_enabled: 1 },
    { style_id: "c006", prompt_id: "c006-p002", display_name_ja: "8ビット", display_name_en: "8-bit", prompt_text: "8-bit", sort_order: 2, is_enabled: 1 },
    { style_id: "c006", prompt_id: "c006-p003", display_name_ja: "レトロゲーム風", display_name_en: "Retro Game Style", prompt_text: "retro game style", sort_order: 3, is_enabled: 1 },
  ];

  for (const prompt of stylePromptsData) {
    await db.execute(
      `INSERT OR IGNORE INTO style_prompts (style_id, prompt_id, display_name_ja, display_name_en, prompt_text, sort_order, is_enabled)
       VALUES (?, ?, ?, ?, ?, ?, ?);`,
      [prompt.style_id, prompt.prompt_id, prompt.display_name_ja, prompt.display_name_en, prompt.prompt_text, prompt.sort_order, prompt.is_enabled]
    );
  }
};
