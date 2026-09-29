import React, { useState } from "react";
import AiChatBox from "./AiChatBox";
import PromptAnalyzer from "./PromptAnalyzer";

export default function PromptPreview({ editablePrompt, setEditablePrompt, handleCopy, isCopied, theme }) {
  // onFocus/onBlur による直接操作ではない state で管理
  const [isFocused, setIsFocused] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");

  async function handleAiRefine() {
    if (!editablePrompt || editablePrompt.trim() === "") {
      setAiError("プロンプトが空です");
      return;
    }
    setIsAiLoading(true);
    setAiError("");
    try {
      const res = await fetch("http://127.0.0.1:8080/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            {
              role: "system",
              content:
                "あなたはAI画像生成用プロンプトの編集アシスタントです。与えられたプロンプトの重複タグや矛盾を整理し、自然な英語のプロンプトに修正してください。説明や前置きは不要で、修正後のプロンプト文字列のみを出力してください。"
            },
            {
              role: "user",
              content: editablePrompt
            }
          ],
          temperature: 0.3,
          max_tokens: 300
        })
      });

      if (!res.ok) {
        throw new Error(`サーバーエラー: ${res.status}`);
      }

      const data = await res.json();
      const refined = data.choices?.[0]?.message?.content?.trim();

      if (refined) {
        setEditablePrompt(refined);
      } else {
        setAiError("AIから有効な応答が得られませんでした");
      }
    } catch (e) {
      console.error("AI整形エラー:", e);
      setAiError("AIサーバーに接続できませんでした");
    } finally {
      setIsAiLoading(false);
    }
  }

  return (
    <div style={{
      marginTop: "24px", padding: "16px",
      background: theme.previewBg, borderRadius: "8px",
      border: `1px solid ${theme.activeColor}`
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
        <p style={{ margin: 0, fontSize: "0.85rem", color: theme.activeColor, fontWeight: "bold" }}>
          出力される完成プロンプト（直接編集できます）
        </p>
        <div style={{ display: "flex", gap: "8px" }}>
          <button
            onClick={handleAiRefine}
            disabled={isAiLoading}
            style={{
              padding: "6px 14px",
              background: isAiLoading ? theme.cardBorder : "#7c3aed",
              color: "#ffffff",
              border: "none", borderRadius: "4px",
              fontWeight: "bold",
              cursor: isAiLoading ? "default" : "pointer",
              transition: "all 0.2s ease",
              boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
            }}
          >
            {isAiLoading ? "整形中..." : "🤖 AIで整形"}
          </button>
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
            {isCopied ? "✓ コピーしました" : "📋 プロンプトをコピー"}
          </button>
        </div>
      </div>

      {aiError && (
        <p style={{ margin: "0 0 8px 0", fontSize: "0.8rem", color: "#dc2626" }}>
          ⚠ {aiError}
        </p>
      )}

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
      <AiChatBox
        currentPrompt={editablePrompt}
        onApplyPrompt={setEditablePrompt}
        theme={theme}
      />
      <PromptAnalyzer currentPrompt={editablePrompt} theme={theme} />
    </div>
  );
}