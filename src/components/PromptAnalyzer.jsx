import React, { useState } from "react";

export default function PromptAnalyzer({ currentPrompt, theme }) {
  const [analysis, setAnalysis] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleAnalyze() {
    if (!currentPrompt || currentPrompt.trim() === "") {
      setError("プロンプトが空です");
      return;
    }
    setIsLoading(true);
    setError("");
    setAnalysis("");

    try {
      const res = await fetch("http://127.0.0.1:8080/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            {
              role: "system",
              content:
                "あなたはAI画像生成プロンプトの解説者です。与えられた英語のプロンプトを読んで、どのような絵になるかを日本語で分かりやすく説明してください。箇条書きではなく、2〜4文程度の自然な文章で説明してください。前置きや余計な言葉は不要で、説明本文のみを出力してください。"
            },
            {
              role: "user",
              content: currentPrompt
            }
          ],
          temperature: 0.3,
          max_tokens: 300
        })
      });

      if (!res.ok) throw new Error(`サーバーエラー: ${res.status}`);

      const data = await res.json();
      const result = data.choices?.[0]?.message?.content?.trim();

      if (result) {
        setAnalysis(result);
      } else {
        setError("AIから有効な応答が得られませんでした");
      }
    } catch (e) {
      console.error("プロンプト解析エラー:", e);
      setError("AIサーバーに接続できませんでした");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div style={{
      marginTop: "16px", padding: "14px",
      background: theme.accordionBg, borderRadius: "8px",
      border: `1px solid ${theme.cardBorder}`
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
        <p style={{ margin: 0, fontSize: "0.85rem", color: theme.textMain, fontWeight: "bold" }}>
          🔍 このプロンプトの解説
        </p>
        <button
          onClick={handleAnalyze}
          disabled={isLoading}
          style={{
            padding: "6px 14px",
            background: isLoading ? theme.cardBorder : "#0891b2",
            color: "#ffffff", border: "none", borderRadius: "4px",
            fontWeight: "bold", cursor: isLoading ? "default" : "pointer",
            transition: "all 0.2s ease"
          }}
        >
          {isLoading ? "解析中..." : "AIに解説してもらう"}
        </button>
      </div>

      {error && (
        <p style={{ margin: "0 0 8px 0", fontSize: "0.8rem", color: "#dc2626" }}>⚠ {error}</p>
      )}

      {analysis && (
        <p style={{
          margin: 0, fontSize: "0.85rem", color: theme.textMain,
          lineHeight: "1.6", whiteSpace: "pre-wrap"
        }}>
          {analysis}
        </p>
      )}

      {!analysis && !isLoading && !error && (
        <p style={{ margin: 0, fontSize: "0.8rem", color: theme.textMuted }}>
          ボタンを押すと、現在のプロンプトがどんな絵になるかAIが解説します。
        </p>
      )}
    </div>
  );
}