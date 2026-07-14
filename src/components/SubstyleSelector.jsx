import React from "react";

export default function SubstyleSelector({ selectedStyle, substyles, selectedPromptParts, handleCheckboxChange, theme }) {
  return (
    <div className="substyle-selector" style={{ marginTop: "24px" }}>
      // ラベルを1箇所に統合
      <p className="label" style={{ color: theme.textMain }}>■ 3. 画風調整パーツを選択してください（複数選択可）</p>

      {!selectedStyle ? (
        // 未選択時のプレースホルダー
        <div style={{ padding: "16px", background: theme.cardBg, borderRadius: "8px", border: `1px dashed ${theme.cardBorder}` }}>
          <p style={{ color: theme.textMuted, fontSize: "0.9rem", margin: 0 }}>
            画風スタイルを選択すると、調整パーツが表示されます。
          </p>
        </div>
      ) : (
        <div style={{
          background: theme.panelBg, padding: "16px", borderRadius: "8px",
          border: `1px solid ${theme.cardBorder}`, display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "12px"
        }}>
          {substyles.map((sub) => {
            const isChecked = selectedPromptParts.includes(sub.prompt_text);
            return (
              // div → button に変更（アクセシビリティ対応）
              <button
                key={sub.substyle_id}
                onClick={() => handleCheckboxChange(sub.prompt_text)}
                aria-pressed={isChecked}
                style={{
                  display: "flex", alignItems: "center", gap: "10px", cursor: "pointer",
                  padding: "10px", borderRadius: "6px",
                  border: isChecked ? `1px solid ${theme.activeColor}` : `1px solid ${theme.cardBorder}`,
                  background: isChecked ? theme.activeBg : theme.cardBg,
                  transition: "all 0.2s ease",
                  textAlign: "left"
                }}
              >
                {/* カスタムcheckboxをネイティブに置換（accentColorで色変更） */}
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => handleCheckboxChange(sub.prompt_text)}
                  style={{ accentColor: theme.activeColor, width: "16px", height: "16px", cursor: "pointer", flexShrink: 0 }}
                />
                <div>
                  <div style={{ fontSize: "0.9rem", fontWeight: "600", color: theme.textMain }}>
                    {sub.substyle_name_ja}
                  </div>
                  <div style={{ fontSize: "0.75rem", color: theme.textMuted, marginTop: "2px" }}>
                    {sub.prompt_text}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
