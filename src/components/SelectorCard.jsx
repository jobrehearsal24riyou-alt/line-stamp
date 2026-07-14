import React from "react";

// CategorySelector と同じ構造のため、SelectorCard として共通化
// 呼び出し元で以下のように使う：
//
// <SelectorCard
//   label="■ 1. 大カテゴリを選択してください"
//   items={categories}
//   idKey="category_id"
//   nameKey="category_name_ja"
//   icon="📁"
//   selectedId={selectedCategory}
//   setSelectedId={setSelectedCategory}
//   theme={theme}
// />
//
// <SelectorCard
//   label="■ 2. 画風スタイルを選択してください"
//   items={styles}
//   idKey="style_id"
//   nameKey="style_name_ja"
//   icon="✨"
//   selectedId={selectedStyle}
//   setSelectedId={setSelectedStyle}
//   theme={theme}
// />

export default function SelectorCard({ label, items, idKey, nameKey, icon, selectedId, setSelectedId, theme }) {
  return (
    <div style={{ marginTop: "24px" }}>
      <p className="label" style={{ color: theme.textMain }}>{label}</p>
      <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
        {items.map((item) => {
          const isChecked = selectedId === item[idKey];
          return (
            <button
              key={item[idKey]}
              onClick={() => setSelectedId(item[idKey])}
              aria-pressed={isChecked}
              style={{
                padding: "14px 20px", borderRadius: "8px",
                border: isChecked ? `2px solid ${theme.activeColor}` : `1px solid ${theme.cardBorder}`,
                background: isChecked ? theme.activeBg : theme.cardBg,
                cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "8px",
                transition: "all 0.15s ease"
              }}
            >
              <span style={{ fontSize: "1.2rem" }}>{icon}</span>
              <span style={{ fontWeight: "600", color: isChecked ? theme.activeText : theme.textMain }}>
                {item[nameKey]}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
