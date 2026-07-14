import React, { useState } from "react";

export default function PromptPreview({ editablePrompt, setEditablePrompt, handleCopy, isCopied, theme }) {
  // onFocus/onBlur をDOMの直接操作ではなく state で管理
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div style={{
      marginTop: "24px", padding: "16px",
      background: theme.previewBg, borderRadius: "8px",
      border: `1px solid ${theme.activeColor}`
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
        <p style={{ margin: 0, fontSize: "0.85rem", color: theme.activeColor, fontWeight: "bold" }}>
          📋 出力される完成プロンプト（直接編集できます）
        </p>
        <button
          onClick={handleCopy}
          style={{
            padding: "6px 14px",
            background: isCopied ? theme.successColor : theme.activeColor,
            color: "#ffffff",
            border: "none", borderRadius: "4px",
            fontWeight: "bold", cursor: "pointer",
            transition: "all 0.2s ease",
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
          }}
        >
          {isCopied ? "✓ コピーしました！" : "📄 プロンプトをコピー"}
        </button>
      </div>

      <textarea
        value={editablePrompt}
        onChange={(e) => setEditablePrompt(e.target.value)}
        placeholder="アイテムとパーツを選択すると自動で組み立てられます"
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        style={{
          width: "100%", minHeight: "70px", padding: "10px",
          fontFamily: "monospace", fontSize: "0.95rem",
          color: theme.previewText, backgroundColor: theme.inputBg,
          border: `1px solid ${isFocused ? theme.activeColor : theme.cardBorder}`,
          borderRadius: "6px", resize: "vertical",
          boxSizing: "border-box", outline: "none",
          lineHeight: "1.4", transition: "border-color 0.15s ease"
        }}
      />
    </div>
  );
}
