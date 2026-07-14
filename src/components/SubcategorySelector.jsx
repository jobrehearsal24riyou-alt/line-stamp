import React from "react";

export default function SubcategorySelector({
  selectedCategory,
  middleCategoryList,
  filteredItems,
  selectedSubCategoryName,
  selectedItemId,
  handleMiddleCategoryChange,
  setSelectedItemId,
  theme
}) {
  return (
    <div className="subcategory-selector" style={{ marginTop: "24px" }}>
      // ラベルを1箇所に統合
      <p className="label" style={{ color: theme.textMain }}>■ 1-2. 具体的なアイテム（サブカテゴリ）を選択してください</p>

      {!selectedCategory ? (
        // 未選択時のプレースホルダー
        <div style={{ padding: "16px", background: theme.cardBg, borderRadius: "8px", border: `1px dashed ${theme.cardBorder}` }}>
          <p style={{ color: theme.textMuted, fontSize: "0.9rem", margin: 0 }}>
            上方の大カテゴリを選択すると、サブカテゴリの選択肢が表示されます。
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

          {/* 中カテゴリの選択ボタン */}
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", padding: "10px 0" }}>
            {middleCategoryList.map((middleName) => {
              const isMiddleChecked = selectedSubCategoryName === middleName;
              return (
                <button
                  key={middleName}
                  onClick={() => handleMiddleCategoryChange(middleName)}
                  aria-pressed={isMiddleChecked}
                  style={{
                    padding: "10px 18px", borderRadius: "20px",
                    border: isMiddleChecked ? `1px solid ${theme.activeColor}` : `1px solid ${theme.cardBorder}`,
                    background: isMiddleChecked ? theme.activeBg : "transparent",
                    color: isMiddleChecked ? theme.activeText : theme.textMain,
                    fontWeight: "600", cursor: "pointer", transition: "all 0.15s ease"
                  }}
                >
                  📁 {middleName}
                </button>
              );
            })}
          </div>

          {/* アイテム一覧グリッド */}
          <div style={{
            background: theme.panelBg, padding: "16px", borderRadius: "8px",
            border: `1px solid ${theme.cardBorder}`, display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "10px"
          }}>
            {filteredItems.map((sub) => {
              const isSubChecked = selectedItemId === sub.id;

              // 英語名をファイル名用に成形（小文字化・前後の空白削除・スペースをアンダースコアに）
              const imgFileName = sub.item_name_en
                ? sub.item_name_en.toLowerCase().trim().replace(/[\s-]+/g, "_")
                : "";

              // ファイル名をそのまま画像パスに使う（ファイルがなければ onError で非表示になる）
              const imgSrc = imgFileName ? `/items/${imgFileName}.png` : "";

              return (
                // div → button に変更（アクセシビリティ対応）
                <button
                  key={sub.id}
                  onClick={() => setSelectedItemId(sub.id)}
                  aria-pressed={isSubChecked}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "flex-start",
                    gap: "12px",
                    cursor: "pointer",
                    padding: "14px 16px",
                    borderRadius: "8px",
                    border: isSubChecked ? `2px solid ${theme.activeColor}` : `1px solid ${theme.cardBorder}`,
                    background: isSubChecked ? theme.activeBg : theme.cardBg,
                    transition: "all 0.15s ease",
                    boxSizing: "border-box",
                    width: "100%",
                    minHeight: "68px",
                    textAlign: "left"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", width: "100%", gap: "12px" }}>

                    {/* 画像パスが存在するときだけ表示 */}
                    {imgSrc && (
                      <img
                        src={imgSrc}
                        alt={sub.item_name_ja}
                        style={{
                          width: "32px", height: "32px",
                          objectFit: "contain", flexShrink: 0, borderRadius: "4px"
                        }}
                        onError={(e) => { e.target.style.display = "none"; }}
                      />
                    )}

                    <div style={{ flexGrow: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: "0.95rem", fontWeight: "600",
                        color: isSubChecked ? theme.activeText : theme.textMain,
                        lineHeight: "1.2", whiteSpace: "nowrap",
                        overflow: "hidden", textOverflow: "ellipsis"
                      }}>
                        {sub.item_name_ja}
                      </div>
                      <div style={{
                        fontSize: "0.75rem",
                        color: isSubChecked ? "rgba(255,255,255,0.8)" : theme.textMuted,
                        marginTop: "4px", whiteSpace: "nowrap",
                        overflow: "hidden", textOverflow: "ellipsis"
                      }}>
                        {sub.item_name_en}
                      </div>
                    </div>

                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
