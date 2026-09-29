import React, { useState, useRef, useEffect } from "react";

export default function AiChatBox({ currentPrompt, onApplyPrompt, theme }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  async function handleSend() {
    const text = input.trim();
    if (!text || isLoading) return;

    const newMessages = [...messages, { role: "user", content: text }];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);
    setError("");

    try {
      const res = await fetch("http://127.0.0.1:8080/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            {
              role: "system",
              content:
                `あなたはAI画像生成用プロンプトの編集アシスタントです。現在のプロンプトは以下の通りです。\n\n"${currentPrompt}"\n\nユーザーからの要望に応じて、プロンプトの修正案を提案してください。修正後のプロンプト全体を提示する際は、必ず [PROMPT] というマーカーの後に続けて出力してください。`
            },
            ...newMessages
          ],
          temperature: 0.4,
          max_tokens: 400
        })
      });

      if (!res.ok) throw new Error(`サーバーエラー: ${res.status}`);

      const data = await res.json();
      const reply = data.choices?.[0]?.message?.content?.trim() || "（応答がありませんでした）";

      setMessages([...newMessages, { role: "assistant", content: reply }]);
    } catch (e) {
      console.error("AIチャットエラー:", e);
      setError("AIサーバーに接続できませんでした");
    } finally {
      setIsLoading(false);
    }
  }

    function extractPromptFromReply(reply) {
    let text = reply.trim();

    // 表記ゆれに対応: [PROMPT], PROMPT:, PROMPT :, プロンプト: など
    const markerPatterns = [
        /\[PROMPT\]/i,
        /PROMPT\s*[:：]/i,
        /プロンプト\s*[:：]/i,
    ];

    for (const pattern of markerPatterns) {
        const match = text.match(pattern);
        if (match) {
        text = text.slice(match.index + match[0].length).trim();
        break;
        }
    }

    // 前後についた引用符（" や '）を取り除く
    text = text.replace(/^["'](.*)["']$/s, "$1").trim();
    text = text.replace(/^["']+|["']+$/g, "").trim();

    return text;
    }

  function handleApply(reply) {
    const extracted = extractPromptFromReply(reply);
    if (extracted) {
      onApplyPrompt(extracted);
    } else {
      onApplyPrompt(reply);
    }
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div style={{
      marginTop: "16px", padding: "14px",
      background: theme.accordionBg, borderRadius: "8px",
      border: `1px solid ${theme.cardBorder}`
    }}>
      <p style={{ margin: "0 0 10px", fontSize: "0.85rem", color: theme.textMain, fontWeight: "bold" }}>
        🤖 AIに相談する
      </p>

      <div
        ref={scrollRef}
        style={{
          maxHeight: "220px", overflowY: "auto",
          marginBottom: "10px", display: "flex",
          flexDirection: "column", gap: "8px"
        }}
      >
        {messages.length === 0 && (
          <p style={{ fontSize: "0.8rem", color: theme.textMuted, margin: 0 }}>
            例：「もっと元気な雰囲気にして」「色の指定を減らして」など、自由に相談できます。
          </p>
        )}
        {messages.map((msg, i) => (
          <div key={i} style={{
            alignSelf: msg.role === "user" ? "flex-end" : "flex-start",
            maxWidth: "85%",
            background: msg.role === "user" ? theme.activeColor : theme.cardBg,
            color: msg.role === "user" ? "#ffffff" : theme.textMain,
            padding: "8px 12px", borderRadius: "10px",
            fontSize: "0.85rem", lineHeight: "1.4",
            border: msg.role === "user" ? "none" : `1px solid ${theme.cardBorder}`,
            whiteSpace: "pre-wrap"
          }}>
            {msg.content}
            {msg.role === "assistant" && (
              <div style={{ marginTop: "6px" }}>
                <button
                  onClick={() => handleApply(msg.content)}
                  style={{
                    padding: "3px 10px", fontSize: "0.75rem",
                    background: "#7c3aed", color: "#ffffff",
                    border: "none", borderRadius: "4px", cursor: "pointer"
                  }}
                >
                  この内容をプロンプトに反映
                </button>
              </div>
            )}
          </div>
        ))}
        {isLoading && (
          <div style={{ fontSize: "0.8rem", color: theme.textMuted }}>AIが考えています...</div>
        )}
      </div>

      {error && (
        <p style={{ margin: "0 0 8px 0", fontSize: "0.8rem", color: "#dc2626" }}>⚠ {error}</p>
      )}

      <div style={{ display: "flex", gap: "8px" }}>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="例：もう少し明るい雰囲気にして"
          rows={2}
          style={{
            flex: 1, padding: "8px", fontSize: "0.85rem",
            fontFamily: "inherit", resize: "none",
            border: `1px solid ${theme.cardBorder}`, borderRadius: "6px",
            background: theme.inputBg, color: theme.previewText,
            boxSizing: "border-box", outline: "none"
          }}
        />
        <button
          onClick={handleSend}
          disabled={isLoading}
          style={{
            padding: "0 16px",
            background: isLoading ? theme.cardBorder : theme.activeColor,
            color: "#ffffff", border: "none", borderRadius: "6px",
            fontWeight: "bold", cursor: isLoading ? "default" : "pointer"
          }}
        >
          送信
        </button>
      </div>
    </div>
  );
}