import React, { useRef, useEffect } from "react";
import AiChatBox from "./AiChatBox";
import PromptAnalyzer from "./PromptAnalyzer";
import { ALL_LINE_POSES, LINE_POSE_CATEGORIES } from "../data/linePoseCategories";
import {
  BUBBLE_COLORS,
  BUBBLE_DECORATIONS,
  BUBBLE_SHAPES,
  BUBBLE_SIZES,
  buildBubblePrompt,
  SPEECH_BUBBLE_GRID,
} from "../data/lineBubbleOptions";

// 組み合わせスタイル（キャラと道具の関係）
const COMBINATION_STYLES = [
  { id: "holding",    label: "持っている",    prompt: "holding" },
  { id: "merged",     label: "一体化している", prompt: "merged with" },
  { id: "disguised",  label: "擬態している",   prompt: "disguised as" },
];


// animal_type の日本語表示名
const ANIMAL_TYPE_LABELS = {
  cat: "猫",
  dog: "犬",
  zoo: "動物園",
  aquarium: "水族館",
  bird: "鳥類",
  small: "小動物",
};

// 固定プロンプト（自動で追加される部分）
const FIXED_PREFIX = "high quality, cute kawaii character";
const FIXED_STYLE = "LINE sticker style, white outline, transparent background, simple illustration";

// アコーディオンセクションのコンポーネント
function AccordionSection({ stepNumber, title, isOpen, onToggle, selectedLabel, children, theme, isFirst = false }) {
  return (
    <div style={{
      marginTop: isFirst ? "0px" : "12px",
      borderRadius: "8px",
      border: `2px solid ${theme.cardBorder}`,
      overflow: "hidden"
    }}>
      <div
        onClick={onToggle}
        style={{
          padding: "12px 16px",
          background: theme.accordionBg,
          display: "flex", justifyContent: "space-between", alignItems: "center",
          cursor: onToggle ? "pointer" : "default"
        }}
      >
        <span style={{ fontWeight: "600", color: theme.textMain }}>
          ■ {stepNumber}. {title}
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {!isOpen && selectedLabel && (
            <span style={{
              fontSize: "0.85rem", color: "#ffffff",
              fontWeight: "600", background: theme.lineColor,
              padding: "2px 10px", borderRadius: "20px"
            }}>
              ✓ {selectedLabel}
            </span>
          )}
          {onToggle && (
            <span style={{ color: theme.textMuted, fontSize: "0.8rem" }}>
              {isOpen ? "▲" : "▼"}
            </span>
          )}
        </div>
      </div>
      {isOpen && (
        <div style={{ padding: "16px", background: theme.accordionBg }}>
          {children}
        </div>
      )}
    </div>
  );
}

export default function LineStampMaker({
  lineSubjects,
  lineCombinationCategories,
  lineCombinations,
  filteredSubjects,
  selectedAnimalType, setSelectedAnimalType,
  selectedSubjectId, setSelectedSubjectId,
  selectedCombinationCategoryId, setSelectedCombinationCategoryId,
  selectedCombinationId, setSelectedCombinationId,
  styles,
  lineSelectedStyle, setLineSelectedStyle,
  lineSubstyles,
  lineSelectedPromptParts,
  handleLineCheckboxChange,
  lineEditablePrompt, setLineEditablePrompt,
  lineIsCopied,
  handleLineCopy,
  onBubbleSettingsChange,
  theme,
}) {
  const [selectedBubble, setSelectedBubble] = React.useState("none");
  const [selectedDecoration, setSelectedDecoration] = React.useState("none");
  const [selectedColor, setSelectedColor] = React.useState("none");
  const [selectedCombinationStyle, setSelectedCombinationStyle] = React.useState("holding");
  const [selectedPoseCategoryId, setSelectedPoseCategoryId] = React.useState("greeting");
  const [selectedPose, setSelectedPose] = React.useState("wave");
  const [selectedBubbleSize, setSelectedBubbleSize] = React.useState("medium");
  const [selectedBubbleShape, setSelectedBubbleShape] = React.useState("none");

  const [openStep2, setOpenStep2] = React.useState(false);
  const [openStep3, setOpenStep3] = React.useState(false);
  const [openStep4, setOpenStep4] = React.useState(false);

  const [isAiLoading, setIsAiLoading] = React.useState(false);
  const [aiError, setAiError] = React.useState("");

  React.useEffect(() => {
    onBubbleSettingsChange?.({
      enabled: selectedBubble !== "none",
      bubbleId: selectedBubble,
      sizeId: selectedBubbleSize,
      colorId: selectedColor,
    });
  }, [onBubbleSettingsChange, selectedBubble, selectedBubbleSize, selectedColor]);

  async function handleAiRefine() {
    if (!lineEditablePrompt || lineEditablePrompt.trim() === "") {
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
              content: "あなたはAI画像生成用プロンプトの編集アシスタントです。与えられたプロンプトの重複タグや矛盾を整理し、自然な英語のプロンプトに修正してください。説明や前置きは不要で、修正後のプロンプト文字列のみを出力してください。"
            },
            {
              role: "user",
              content: lineEditablePrompt
            }
          ],
          temperature: 0.3,
          max_tokens: 300
        })
      });

      if (!res.ok) throw new Error(`サーバーエラー: ${res.status}`);

      const data = await res.json();
      const refined = data.choices?.[0]?.message?.content?.trim();

      if (refined) {
        setLineEditablePrompt(refined);
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

  const textareaRef = useRef(null);
  const animalTypes = Object.keys(ANIMAL_TYPE_LABELS);

  useEffect(() => { if (selectedAnimalType) setOpenStep2(true); }, [selectedAnimalType]);
  useEffect(() => { if (selectedSubjectId) setOpenStep3(true); }, [selectedSubjectId]);
  useEffect(() => { if (selectedCombinationCategoryId) setOpenStep4(true); }, [selectedCombinationCategoryId]);

  // テキストエリア自動リサイズ
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = textareaRef.current.scrollHeight + "px";
    }
  }, [lineEditablePrompt]);

  // プロンプト自動生成
  useEffect(() => {
    const subject = lineSubjects.find(s => s.subject_id === selectedSubjectId);
    const combination = lineCombinations.find(c => c.combination_id === selectedCombinationId);
    const bubble = SPEECH_BUBBLE_GRID.find(b => b.id === selectedBubble);
    const decoration = BUBBLE_DECORATIONS.find(d => d.id === selectedDecoration);
    const color = BUBBLE_COLORS.find(c => c.id === selectedColor);
    const combinationStyle = COMBINATION_STYLES.find(s => s.id === selectedCombinationStyle);
    const bubbleSize = BUBBLE_SIZES.find(s => s.id === selectedBubbleSize);
    const bubbleShape = BUBBLE_SHAPES.find(s => s.id === selectedBubbleShape);

    const parts = [];

    // 1. 固定プレフィックス
    parts.push(FIXED_PREFIX);

    // 2. キャラクター + 組み合わせ
    if (subject) {
      if (combination && combinationStyle) {
        parts.push(`${subject.name_en} ${combinationStyle.prompt} ${combination.name_en}`);
      } else {
        parts.push(subject.name_en);
      }
    }

    // 3. ポーズと固定スタイル
    const pose = ALL_LINE_POSES.find((item) => item.id === selectedPose);
    if (pose) parts.push(`Pose: ${pose.prompt}`);
    parts.push(FIXED_STYLE);

    // 4. サブスタイルパーツ（任意選択）
    if (lineSelectedPromptParts && lineSelectedPromptParts.length > 0) {
      parts.push(lineSelectedPromptParts.join(", "));
    }

    // 5. 吹き出し（位置が選択されているときだけ追加）
    // 位置が "none" 以外のときだけ吹き出し関連プロンプトを追加する
    const isBubbleEnabled = selectedBubble !== "none";

    if (isBubbleEnabled) {
      const bubblePrompt = buildBubblePrompt({ bubbleSize, bubbleShape, decoration, color, bubble });
      if (bubblePrompt) parts.push(bubblePrompt);

      // 吹き出しがある場合は固定で追加（文字が入らないようにする）
      parts.push("speech bubble tail pointing to character's mouth");
      parts.push("empty speech bubble, no text inside, blank interior, white background inside bubble");
    }

    const generated = parts.filter(Boolean).join(", ");
    setLineEditablePrompt(generated);
  }, [
    selectedSubjectId, selectedCombinationId, selectedCombinationStyle, selectedPose,
    selectedBubble, selectedDecoration, selectedColor,
    selectedBubbleSize, selectedBubbleShape,
    lineSelectedPromptParts,
    lineSubjects, lineCombinations
  ]);

  const selectedSubject = lineSubjects.find(s => s.subject_id === selectedSubjectId);
  const selectedCombination = lineCombinations.find(c => c.combination_id === selectedCombinationId);
  const selectedCombinationCategory = lineCombinationCategories.find(c => c.category_id === selectedCombinationCategoryId);
  const selectedPoseCategory = LINE_POSE_CATEGORIES.find((category) => category.id === selectedPoseCategoryId) || LINE_POSE_CATEGORIES[0];

  return (
    <div style={{ marginTop: "16px" }}>

      {/* 2カラムレイアウト */}
      <div style={{ display: "flex", gap: "24px", alignItems: "flex-start" }}>

        {/* 左カラム：ステップ1〜5 */}
        <div style={{ flex: 1, minWidth: 0 }}>

          {/* 1. キャラクターの種類 */}
          <AccordionSection
            stepNumber={1} title="キャラクターの種類を選んでください"
            isOpen={true} isFirst={true} theme={theme}
          >
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              {animalTypes.map((type) => {
                const isChecked = selectedAnimalType === type;
                return (
                  <button key={type}
                    onClick={() => { setSelectedAnimalType(type); setSelectedSubjectId(""); setOpenStep2(true); }}
                    aria-pressed={isChecked}
                    style={{
                      padding: "10px 18px", borderRadius: "20px",
                      border: isChecked ? `2px solid ${theme.lineColor}` : `1px solid ${theme.cardBorder}`,
                      background: isChecked ? theme.lineColor : "transparent",
                      color: isChecked ? "#ffffff" : theme.textMain,
                      fontWeight: "600", cursor: "pointer", transition: "all 0.15s ease"
                    }}
                  >{ANIMAL_TYPE_LABELS[type]}</button>
                );
              })}
            </div>
          </AccordionSection>

          {/* 2. キャラクターの種別 */}
          {selectedAnimalType && (
            <AccordionSection
              stepNumber={2} title="キャラクターの種別を選んでください"
              isOpen={openStep2} onToggle={() => setOpenStep2(!openStep2)}
              selectedLabel={selectedSubject ? selectedSubject.name_ja : null} theme={theme}
            >
              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                {filteredSubjects.map((subject) => {
                  const isChecked = selectedSubjectId === subject.subject_id;
                  return (
                    <button key={subject.subject_id}
                      onClick={() => { setSelectedSubjectId(subject.subject_id); setOpenStep2(false); }}
                      aria-pressed={isChecked}
                      style={{
                        padding: "10px 18px", borderRadius: "8px",
                        border: isChecked ? `2px solid ${theme.lineColor}` : `1px solid ${theme.cardBorder}`,
                        background: isChecked ? theme.lineColor : theme.cardBg,
                        color: isChecked ? "#ffffff" : theme.textMain,
                        fontWeight: "600", cursor: "pointer", transition: "all 0.15s ease"
                      }}
                    >{subject.name_ja}</button>
                  );
                })}
              </div>
            </AccordionSection>
          )}

          {/* 3. 掛け合わせカテゴリ */}
          {selectedSubjectId && (
            <AccordionSection
              stepNumber={3} title="掛け合わせのカテゴリを選んでください"
              isOpen={openStep3} onToggle={() => setOpenStep3(!openStep3)}
              selectedLabel={selectedCombinationCategory ? selectedCombinationCategory.name_ja : null} theme={theme}
            >
              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                {lineCombinationCategories.map((cat) => {
                  const isChecked = selectedCombinationCategoryId === cat.category_id;
                  return (
                    <button key={cat.category_id}
                      onClick={() => { setSelectedCombinationCategoryId(cat.category_id); setSelectedCombinationId(""); setOpenStep3(false); }}
                      aria-pressed={isChecked}
                      style={{
                        padding: "10px 18px", borderRadius: "20px",
                        border: isChecked ? `2px solid ${theme.lineColor}` : `1px solid ${theme.cardBorder}`,
                        background: isChecked ? theme.lineColor : "transparent",
                        color: isChecked ? "#ffffff" : theme.textMain,
                        fontWeight: "600", cursor: "pointer", transition: "all 0.15s ease"
                      }}
                    >{cat.name_ja}</button>
                  );
                })}
              </div>
            </AccordionSection>
          )}

          {/* 4. 掛け合わせ */}
          {selectedCombinationCategoryId && lineCombinations.length > 0 && (
            <AccordionSection
              stepNumber={4} title="掛け合わせを選んでください"
              isOpen={openStep4} onToggle={() => setOpenStep4(!openStep4)}
              selectedLabel={selectedCombination ? selectedCombination.name_ja : null} theme={theme}
            >
              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                {lineCombinations.map((comb) => {
                  const isChecked = selectedCombinationId === comb.combination_id;
                  return (
                    <button key={comb.combination_id}
                      onClick={() => { setSelectedCombinationId(comb.combination_id); setOpenStep4(false); }}
                      aria-pressed={isChecked}
                      style={{
                        padding: "10px 18px", borderRadius: "8px",
                        border: isChecked ? `2px solid ${theme.lineColor}` : `1px solid ${theme.cardBorder}`,
                        background: isChecked ? theme.lineColor : theme.cardBg,
                        color: isChecked ? "#ffffff" : theme.textMain,
                        fontWeight: "600", cursor: "pointer", transition: "all 0.15s ease"
                      }}
                    >{comb.name_ja}</button>
                  );
                })}
              </div>
            </AccordionSection>
          )}

          {/* 4-2. キャラと道具の関係 */}
          {selectedCombinationId && (
            <AccordionSection
              stepNumber="4-2" title="キャラと道具の関係を選んでください"
              isOpen={true} onToggle={null} theme={theme}
            >
              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                {COMBINATION_STYLES.map((style) => {
                  const isChecked = selectedCombinationStyle === style.id;
                  return (
                    <button key={style.id}
                      onClick={() => setSelectedCombinationStyle(style.id)}
                      aria-pressed={isChecked}
                      style={{
                        padding: "10px 18px", borderRadius: "20px",
                        border: isChecked ? `2px solid ${theme.lineColor}` : `1px solid ${theme.cardBorder}`,
                        background: isChecked ? theme.lineColor : "transparent",
                        color: isChecked ? "#ffffff" : theme.textMain,
                        fontWeight: "600", cursor: "pointer", transition: "all 0.15s ease"
                      }}
                    >{style.label}</button>
                  );
                })}
              </div>
            </AccordionSection>
          )}

          {/* 4-3. ポーズ */}
          {selectedCombinationId && (
            <AccordionSection stepNumber="4-3" title="ポーズを選んでください" isOpen={true} onToggle={null} theme={theme}>
              <div style={{ marginBottom: "14px" }}>
                <div style={{ marginBottom: "8px", color: theme.textMuted, fontSize: "0.85rem", fontWeight: "600" }}>ポーズカテゴリ</div>
                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                  {LINE_POSE_CATEGORIES.map((category) => {
                    const isChecked = selectedPoseCategoryId === category.id;
                    return (
                      <button key={category.id}
                        onClick={() => { setSelectedPoseCategoryId(category.id); setSelectedPose(category.poses[0].id); }}
                        aria-pressed={isChecked}
                        style={{ padding: "9px 15px", borderRadius: "8px", border: isChecked ? `2px solid ${theme.lineColor}` : `1px solid ${theme.cardBorder}`, background: isChecked ? theme.lineColor : theme.cardBg, color: isChecked ? "#ffffff" : theme.textMain, fontWeight: "600", cursor: "pointer" }}
                      >{category.label}</button>
                    );
                  })}
                </div>
              </div>
              <div>
                <div style={{ marginBottom: "8px", color: theme.textMuted, fontSize: "0.85rem", fontWeight: "600" }}>{selectedPoseCategory.label}のポーズ（10種類）</div>
                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                  {selectedPoseCategory.poses.map((pose) => {
                    const isChecked = selectedPose === pose.id;
                    return (
                      <button key={pose.id} onClick={() => setSelectedPose(pose.id)} aria-pressed={isChecked}
                        style={{ padding: "10px 18px", borderRadius: "20px", border: isChecked ? `2px solid ${theme.lineColor}` : `1px solid ${theme.cardBorder}`, background: isChecked ? theme.lineColor : "transparent", color: isChecked ? "#ffffff" : theme.textMain, fontWeight: "600", cursor: "pointer" }}>
                        {pose.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </AccordionSection>
          )}
          {/* 5. 画風スタイル＋サブスタイルパーツ（任意） */}
          {selectedCombinationId && styles && styles.length > 0 && (
            <AccordionSection
              stepNumber={5} title="画風スタイルを選んでください（任意）"
              isOpen={true} onToggle={null} theme={theme}
            >
              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "12px" }}>
                {styles.map((st) => {
                  const isChecked = lineSelectedStyle === st.style_id;
                  return (
                    <button key={st.style_id}
                      onClick={() => setLineSelectedStyle(isChecked ? "" : st.style_id)}
                      aria-pressed={isChecked}
                      style={{
                        padding: "10px 18px", borderRadius: "8px",
                        border: isChecked ? `2px solid ${theme.lineColor}` : `1px solid ${theme.cardBorder}`,
                        background: isChecked ? theme.lineColor : theme.cardBg,
                        color: isChecked ? "#ffffff" : theme.textMain,
                        fontWeight: "600", cursor: "pointer", transition: "all 0.15s ease"
                      }}
                    >{st.style_name_ja}</button>
                  );
                })}
              </div>

              {lineSubstyles && lineSubstyles.length > 0 && (
                <div>
                  <div style={{ marginBottom: "8px", color: theme.textMuted, fontSize: "0.8rem", fontWeight: "600" }}>複数選択可</div>
                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                    {lineSubstyles.map((sub) => {
                      const isChecked = lineSelectedPromptParts && lineSelectedPromptParts.includes(sub.prompt_text);
                      return (
                        <button key={sub.substyle_id}
                          onClick={() => handleLineCheckboxChange(sub.prompt_text)}
                          aria-pressed={isChecked}
                          style={{
                            padding: "6px 14px", borderRadius: "6px",
                            border: isChecked ? `2px solid ${theme.lineColor}` : `1px solid ${theme.cardBorder}`,
                            background: isChecked ? theme.lineColor : theme.cardBg,
                            color: isChecked ? "#ffffff" : theme.textMain,
                            fontWeight: "600", cursor: "pointer", transition: "all 0.15s ease",
                            fontSize: "0.85rem"
                          }}
                        >{sub.substyle_name_ja}</button>
                      );
                    })}
                  </div>
                </div>
              )}
            </AccordionSection>
          )}
        </div>

        {/* 右カラム：吹き出し設定 */}
        <div style={{
          width: "320px", flexShrink: 0,
          borderRadius: "8px", border: `2px solid ${theme.cardBorder}`,
          overflow: "hidden"
        }}>
          <div style={{ padding: "12px 16px", background: theme.accordionBg, borderBottom: `2px solid ${theme.cardBorder}` }}>
            <span style={{ fontWeight: "600", color: theme.textMain }}>■ 吹き出しの設定</span>
          </div>
          <div style={{ padding: "16px", background: theme.accordionBg }}>

            {/* 位置グリッド（3x3） */}
            <p style={{ margin: "0 0 8px", fontSize: "0.8rem", color: theme.textMuted, fontWeight: "600" }}>位置</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "5px", marginBottom: "16px" }}>
              {SPEECH_BUBBLE_GRID.map((bubble) => {
                const isChecked = selectedBubble === bubble.id;
                return (
                  <button key={bubble.id} onClick={() => setSelectedBubble(bubble.id)}
                    aria-pressed={isChecked} title={bubble.label}
                    style={{
                      height: "52px", borderRadius: "8px",
                      border: isChecked ? `2px solid ${theme.lineColor}` : `1px solid ${theme.cardBorder}`,
                      background: isChecked ? theme.lineColor : theme.cardBg,
                      color: isChecked ? "#ffffff" : theme.textMain,
                      cursor: "pointer", transition: "all 0.15s ease",
                      display: "flex", flexDirection: "column",
                      alignItems: "center", justifyContent: "center", gap: "2px"
                    }}
                  >
                    <span style={{ fontSize: "1.1rem" }}>{bubble.icon}</span>
                    <span style={{ fontSize: "0.6rem", fontWeight: "600" }}>{bubble.label}</span>
                  </button>
                );
              })}
            </div>

            {/* サイズ（3列） */}
            <p style={{ margin: "0 0 8px", fontSize: "0.8rem", color: theme.textMuted, fontWeight: "600" }}>サイズ</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "5px", marginBottom: "16px" }}>
              {BUBBLE_SIZES.map((size) => {
                const isChecked = selectedBubbleSize === size.id;
                return (
                  <button key={size.id} onClick={() => setSelectedBubbleSize(size.id)}
                    aria-pressed={isChecked} title={size.label}
                    style={{
                      height: "36px", borderRadius: "6px",
                      border: isChecked ? `2px solid ${theme.lineColor}` : `1px solid ${theme.cardBorder}`,
                      background: isChecked ? theme.lineColor : theme.cardBg,
                      color: isChecked ? "#ffffff" : theme.textMain,
                      fontWeight: "600", cursor: "pointer", transition: "all 0.15s ease",
                      fontSize: "0.75rem"
                    }}
                  >{size.label}</button>
                );
              })}
            </div>

            {/* 形状 */}
            <p style={{ margin: "0 0 8px", fontSize: "0.8rem", color: theme.textMuted, fontWeight: "600" }}>形状</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "5px", marginBottom: "16px" }}>
              {BUBBLE_SHAPES.map((shape) => {
                const isChecked = selectedBubbleShape === shape.id;
                return (
                  <button key={shape.id} onClick={() => setSelectedBubbleShape(shape.id)}
                    aria-pressed={isChecked} title={shape.label}
                    style={{
                      height: "36px", borderRadius: "6px",
                      border: isChecked ? `2px solid ${theme.lineColor}` : `1px solid ${theme.cardBorder}`,
                      background: isChecked ? theme.lineColor : theme.cardBg,
                      color: isChecked ? "#ffffff" : theme.textMain,
                      fontWeight: "600", cursor: "pointer", transition: "all 0.15s ease",
                      fontSize: "0.7rem", padding: "2px"
                    }}
                  >{shape.label}</button>
                );
              })}
            </div>

            {/* デコレーション（5列×2行） */}
            <p style={{ margin: "0 0 8px", fontSize: "0.8rem", color: theme.textMuted, fontWeight: "600" }}>デコレーション</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "5px", marginBottom: "16px" }}>
              {BUBBLE_DECORATIONS.map((deco) => {
                const isChecked = selectedDecoration === deco.id;
                return (
                  <button key={deco.id} onClick={() => setSelectedDecoration(deco.id)}
                    aria-pressed={isChecked} title={deco.label}
                    style={{
                      height: "44px", borderRadius: "6px",
                      border: isChecked ? `2px solid ${theme.lineColor}` : `1px solid ${theme.cardBorder}`,
                      background: isChecked ? theme.lineColor : theme.cardBg,
                      color: isChecked ? "#ffffff" : theme.textMain,
                      fontWeight: "600", cursor: "pointer", transition: "all 0.15s ease",
                      fontSize: "0.7rem", padding: "2px",
                      display: "flex", alignItems: "center", justifyContent: "center"
                    }}
                  >{deco.label}</button>
                );
              })}
            </div>

            {/* カラーパレット（5列×2行） */}
            <p style={{ margin: "0 0 8px", fontSize: "0.8rem", color: theme.textMuted, fontWeight: "600" }}>カラー</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "5px" }}>
              {BUBBLE_COLORS.map((col) => {
                const isChecked = selectedColor === col.id;
                return (
                  <button key={col.id} onClick={() => setSelectedColor(col.id)}
                    aria-pressed={isChecked} title={col.label}
                    style={{
                      height: "44px", borderRadius: "6px",
                      border: isChecked ? `2px solid ${theme.lineColor}` : `1px solid ${theme.cardBorder}`,
                      background: isChecked ? theme.lineColor : theme.cardBg,
                      color: isChecked ? "#ffffff" : theme.textMain,
                      cursor: "pointer", transition: "all 0.15s ease",
                      display: "flex", flexDirection: "column",
                      alignItems: "center", justifyContent: "center", gap: "2px"
                    }}
                  >
                    {col.color ? (
                      <span style={{ width: "18px", height: "18px", borderRadius: "50%", background: col.color, border: "1px solid rgba(0,0,0,0.15)" }} />
                    ) : (
                      <span style={{ fontSize: "0.8rem" }}>✖️</span>
                    )}
                    <span style={{ fontSize: "0.6rem", fontWeight: "600" }}>{col.label}</span>
                  </button>
                );
              })}
            </div>

          </div>
        </div>
      </div>

      {/* プロンプト出力（全幅・下部） */}
      {lineEditablePrompt && (
        <div style={{
          marginTop: "24px", padding: "16px",
          background: theme.previewBg, borderRadius: "8px",
          border: `2px solid ${theme.lineColor}`
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
            <p style={{ margin: 0, fontSize: "0.85rem", color: theme.lineColor, fontWeight: "bold" }}>
              📋 出力される完成プロンプト（直接編集できます）
            </p>
            <div style={{ display: "flex", gap: "8px" }}>
              <button onClick={handleAiRefine}
                disabled={isAiLoading}
                style={{
                  padding: "6px 14px",
                  background: isAiLoading ? theme.cardBorder : "#7c3aed",
                  color: "#ffffff", border: "none", borderRadius: "4px",
                  fontWeight: "bold", cursor: isAiLoading ? "default" : "pointer",
                  transition: "all 0.2s ease", boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
                }}
              >
                {isAiLoading ? "整形中..." : "🤖 AIで整形"}
              </button>
              <button onClick={handleLineCopy}
                style={{
                  padding: "6px 14px",
                  background: lineIsCopied ? theme.successColor : theme.lineColor,
                  color: "#ffffff", border: "none", borderRadius: "4px",
                  fontWeight: "bold", cursor: "pointer",
                  transition: "all 0.2s ease", boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
                }}
              >
                {lineIsCopied ? "✓ コピーしました！" : "📄 プロンプトをコピー"}
              </button>
            </div>
          </div>

          {aiError && (
            <p style={{ margin: "0 0 8px 0", fontSize: "0.8rem", color: "#dc2626" }}>
              ⚠ {aiError}
            </p>
          )}

          <textarea
            ref={textareaRef}
            value={lineEditablePrompt}
            onChange={(e) => setLineEditablePrompt(e.target.value)}
            style={{
              width: "100%", padding: "10px",
              fontFamily: "monospace", fontSize: "0.95rem",
              color: theme.previewText, backgroundColor: theme.inputBg,
              border: `2px solid ${theme.cardBorder}`,
              borderRadius: "6px", resize: "none",
              boxSizing: "border-box", outline: "none",
              lineHeight: "1.4", overflow: "hidden"
            }}
          />
          <AiChatBox
            currentPrompt={lineEditablePrompt}
            onApplyPrompt={setLineEditablePrompt}
            theme={theme}
          />
          <PromptAnalyzer currentPrompt={lineEditablePrompt} theme={theme} />
        </div>
      )}

    </div>
  );
}
