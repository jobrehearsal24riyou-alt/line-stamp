import React, { useEffect, useMemo, useRef, useState } from "react";
import { ALL_LINE_POSES, LINE_POSE_CATEGORIES } from "../data/linePoseCategories";
import {
  BUBBLE_COLORS,
  BUBBLE_DECORATIONS,
  BUBBLE_SHAPES,
  BUBBLE_SIZES,
  buildBubblePrompt,
  SPEECH_BUBBLE_GRID,
} from "../data/lineBubbleOptions";

const RELATIONS = {
  holding: { prompt: "holding", label: "持つ" },
  merged: { prompt: "merged with", label: "合体する" },
  disguised: { prompt: "disguised as", label: "擬態する" },
};

const CATEGORY_LABELS = {
  cat: "cat", dog: "dog", zoo: "zoo animal", aquarium: "aquatic animal", bird: "bird", small: "small animal",
};

const getRelation = (prompt) => (prompt?.includes("disguised as") ? RELATIONS.disguised : prompt?.includes("merged with") ? RELATIONS.merged : RELATIONS.holding);

const shuffle = (items) => {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result;
};

const findById = (items, id) => items.find((item) => item.id === id);

export const createBubbleVariants = (bubbleSettings, count = 7) => {
  if (!bubbleSettings?.enabled || bubbleSettings.bubbleId === "none") return Array(count).fill(null);

  const availableColors = BUBBLE_COLORS.filter((color) => color.id !== "none" && color.id !== bubbleSettings.colorId);
  return shuffle(availableColors).slice(0, count).map((color) => ({
    colorId: color.id,
    shapeId: shuffle(BUBBLE_SHAPES)[0]?.id || "none",
    decorationId: shuffle(BUBBLE_DECORATIONS)[0]?.id || "none",
  }));
};

const createBubblePrompt = (bubbleSettings, bubbleVariant) => {
  if (!bubbleSettings?.enabled || !bubbleVariant) return "";

  const bubble = findById(SPEECH_BUBBLE_GRID, bubbleSettings.bubbleId);
  const bubbleSize = findById(BUBBLE_SIZES, bubbleSettings.sizeId);
  const bubbleShape = findById(BUBBLE_SHAPES, bubbleVariant.shapeId);
  const decoration = findById(BUBBLE_DECORATIONS, bubbleVariant.decorationId);
  const color = findById(BUBBLE_COLORS, bubbleVariant.colorId);
  const generatedBubble = buildBubblePrompt({ bubbleSize, bubbleShape, decoration, color, bubble });

  if (!bubble || bubble.id === "none" || !generatedBubble) return "";

  return [
    "Use a speech bubble with the same size and position as the uploaded base image.",
    generatedBubble,
    "speech bubble tail pointing to character's mouth",
    "empty speech bubble, no text inside, blank interior, white background inside bubble",
  ].join(" ");
};

export const createImg2ImgPrompt = ({ target, targetCategory, partnerCategory, relation, partner, pose, bubbleSettings, bubbleVariant }) => {
  if (!target || !targetCategory || !partnerCategory || !relation || !partner || !pose) return "";

  const parts = [
    "Use the uploaded image only as the visual-style reference.",
    "Preserve its linework, color palette, white outline, transparent background, quality, and overall sticker style.",
    "Do not reuse the character, prop, pose, or scene from the reference image.",
    `Draw ${target} from the ${targetCategory} category, ${relation.prompt} ${partner} from the ${partnerCategory} category. Pose: ${pose}.`,
  ];
  const bubblePrompt = createBubblePrompt(bubbleSettings, bubbleVariant);
  if (bubblePrompt) parts.push(bubblePrompt);
  return parts.join(" ");
};

const normalizeBubbleVariant = (value) => {
  if (!value || typeof value !== "object") return null;
  const color = findById(BUBBLE_COLORS, value.colorId);
  const shape = findById(BUBBLE_SHAPES, value.shapeId);
  const decoration = findById(BUBBLE_DECORATIONS, value.decorationId);
  if (!color || color.id === "none" || !shape || !decoration) return null;
  return { colorId: color.id, shapeId: shape.id, decorationId: decoration.id };
};

export default function LinePromptSet({
  basePrompt,
  lineSubjects,
  lineCombinations,
  selectedSubjectId,
  selectedAnimalType,
  selectedCombinationCategoryId,
  selectedCombinationId,
  bubbleSettings,
  theme,
}) {
  const selectedSubject = lineSubjects.find((item) => item.subject_id === selectedSubjectId);
  const selectedCombination = lineCombinations.find((item) => item.combination_id === selectedCombinationId);
  const relation = getRelation(basePrompt);
  const targetCategory = CATEGORY_LABELS[selectedAnimalType] || selectedAnimalType || "selected";
  const partnerCategory = selectedCombinationCategoryId || "selected category";
  const basePose = ALL_LINE_POSES.find((pose) => basePrompt?.includes(`Pose: ${pose.prompt}`)) || null;
  const selectedPoseCategory = LINE_POSE_CATEGORIES.find((category) => category.poses.some((pose) => pose.id === basePose?.id)) || LINE_POSE_CATEGORIES[0];

  const [shuffleVersion, setShuffleVersion] = useState(0);
  const importInputRef = useRef(null);
  const [fileStatus, setFileStatus] = useState("");

  const partnerCandidates = useMemo(() => lineCombinations.filter((item) => (
    (!selectedCombinationCategoryId || item.category_id === selectedCombinationCategoryId)
    && item.combination_id !== selectedCombinationId
  )), [lineCombinations, selectedCombinationCategoryId, selectedCombinationId]);

  const candidatePoses = useMemo(() => shuffle(selectedPoseCategory.poses.filter((pose) => pose.id !== basePose?.id)).slice(0, 7).map((pose) => pose.prompt), [basePose, selectedPoseCategory, shuffleVersion]);
  const bubbleVariants = useMemo(() => createBubbleVariants(bubbleSettings), [bubbleSettings, shuffleVersion]);

  const pairs = useMemo(() => {
    const targets = shuffle(lineSubjects.filter((item) => (
      (!selectedAnimalType || item.animal_type === selectedAnimalType) && item.subject_id !== selectedSubjectId
    )));
    const partners = shuffle(partnerCandidates);
    if (!targets.length || !partners.length) return Array(7).fill(null);

    const result = [];
    const usedPairs = new Set();
    for (let index = 0; index < 7; index += 1) {
      const target = targets[index % targets.length];
      let partnerIndex = index % partners.length;
      let partner = partners[partnerIndex];
      let key = `${target.subject_id}:${partner.combination_id}`;
      let attempts = 0;
      while (usedPairs.has(key) && attempts < partners.length) {
        partnerIndex = (partnerIndex + 1) % partners.length;
        partner = partners[partnerIndex];
        key = `${target.subject_id}:${partner.combination_id}`;
        attempts += 1;
      }
      usedPairs.add(key);
      result.push({ target, partner });
    }
    return result;
  }, [lineSubjects, selectedAnimalType, selectedSubjectId, partnerCandidates, shuffleVersion]);

  const makeRows = () => Array.from({ length: 8 }, (_, index) => {
    const pair = pairs[index - 1];
    const target = index === 0 ? selectedSubject?.name_en || "" : pair?.target?.name_en || "";
    const partner = index === 0 ? selectedCombination?.name_en || "" : pair?.partner?.name_en || "";
    const pose = index === 0 ? "" : candidatePoses[(index - 1) % candidatePoses.length];
    const bubbleVariant = index === 0 ? null : bubbleVariants[index - 1];

    return {
      target,
      partner,
      pose,
      bubbleVariant,
      prompt: index === 0 ? basePrompt || "" : createImg2ImgPrompt({
        target, targetCategory, partnerCategory, relation, partner, pose, bubbleSettings, bubbleVariant,
      }),
      copied: false,
    };
  });

  const [rows, setRows] = useState(() => makeRows());

  useEffect(() => {
    setRows(makeRows());
  }, [basePrompt, selectedSubjectId, selectedCombinationId, selectedCombinationCategoryId, pairs, candidatePoses, bubbleVariants, targetCategory, partnerCategory, relation, bubbleSettings]);

  const updateRow = (index, field, value) => {
    setRows((current) => current.map((row, rowIndex) => {
      if (rowIndex !== index) return row;
      const next = { ...row, [field]: value };
      if (index > 0) {
        const bubbleVariant = next.bubbleVariant || bubbleVariants[index - 1] || null;
        next.bubbleVariant = bubbleVariant;
        next.prompt = createImg2ImgPrompt({
          target: (field === "target" ? value : next.target).trim(),
          targetCategory,
          partnerCategory,
          relation,
          partner: (field === "partner" ? value : next.partner).trim(),
          pose: (field === "pose" ? value : next.pose).trim(),
          bubbleSettings,
          bubbleVariant,
        });
      }
      next.copied = row.copied && next.prompt === row.prompt;
      return next;
    }));
  };

  const handleCopy = async (index) => {
    const prompt = rows[index]?.prompt?.trim();
    if (!prompt) return;
    await navigator.clipboard.writeText(prompt);
    setRows((current) => current.map((row, rowIndex) => (
      rowIndex === index && row.prompt.trim() === prompt ? { ...row, copied: true } : row
    )));
  };

  const handleExport = () => {
    const payload = {
      format: "line-stamp-prompts",
      version: 2,
      exportedAt: new Date().toISOString(),
      prompts: rows.map(({ target, partner, pose, bubbleVariant, prompt }, index) => ({
        index: index + 1,
        target,
        partner,
        pose,
        bubble: bubbleVariant,
        prompt,
      })),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `line-stamp-prompts-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    setFileStatus("8件のプロンプトをエクスポートしました。");
  };

  const handleImportFile = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    try {
      const parsed = JSON.parse(await file.text());
      const importedRows = Array.isArray(parsed) ? parsed : parsed?.prompts;
      if (!Array.isArray(importedRows) || importedRows.length !== 8 || importedRows.some((item) => !item || typeof item.prompt !== "string")) {
        throw new Error("8件のプロンプトを含むJSONファイルを選択してください。");
      }
      setRows(importedRows.map((item, index) => ({
        target: typeof item.target === "string" ? item.target : "",
        partner: typeof item.partner === "string" ? item.partner : "",
        pose: typeof item.pose === "string" ? item.pose : "",
        bubbleVariant: normalizeBubbleVariant(item.bubble) || (index > 0 ? bubbleVariants[index - 1] || null : null),
        prompt: item.prompt,
        copied: false,
      })));
      setFileStatus("8件のプロンプトをインポートしました。");
    } catch (error) {
      setFileStatus(`インポートに失敗しました: ${String(error.message || error)}`);
    }
  };

  const canGenerateSet = Boolean(basePrompt && selectedSubject && selectedCombination);

  return (
    <div style={{ marginTop: "16px" }}>
      <div style={{ padding: "14px 16px", background: theme.accordionBg, border: `1px solid ${theme.lineColor}`, borderRadius: "8px", marginBottom: "16px" }}>
        <p style={{ margin: "0 0 6px", fontWeight: "700", color: theme.textMain }}>1枚目を基準画像にする img2img 8枚セット</p>
        <p style={{ margin: 0, color: theme.textMuted, fontSize: "0.85rem", lineHeight: "1.6" }}>2〜8枚目は対象物・相手要素・ポーズを抽選します。1枚目で吹き出しを設定した場合は位置とサイズを維持し、色・形状・デコレーションを抽選します。</p>
      </div>

      {!canGenerateSet && <div style={{ padding: "14px 16px", background: theme.cardBg, border: `1px solid ${theme.cardBorder}`, borderRadius: "8px", color: theme.textMuted, marginBottom: "16px" }}>まず「LINEスタンプ」タブで条件を選択してください。</div>}

      <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: "8px", flexWrap: "wrap", marginBottom: "12px" }}>
        <button onClick={() => setShuffleVersion((value) => value + 1)} disabled={!selectedCombination} style={{ padding: "7px 12px", background: theme.cardBg, color: theme.textMain, border: `1px solid ${theme.cardBorder}`, borderRadius: "5px", fontWeight: "700", opacity: selectedCombination ? 1 : 0.5 }}>🔀 2〜8枚目を再抽選</button>
        <button onClick={handleExport} disabled={!rows.length} style={{ padding: "7px 12px", background: theme.lineColor, color: "#ffffff", border: "none", borderRadius: "5px", fontWeight: "700", cursor: "pointer" }}>⬇ プロンプト一括エクスポート</button>
        <button onClick={() => importInputRef.current?.click()} style={{ padding: "7px 12px", background: theme.cardBg, color: theme.textMain, border: `1px solid ${theme.cardBorder}`, borderRadius: "5px", fontWeight: "700", cursor: "pointer" }}>⬆ プロンプト一括インポート</button>
        <input ref={importInputRef} type="file" accept=".json,application/json" onChange={handleImportFile} style={{ display: "none" }} />
      </div>

      {fileStatus && <p style={{ margin: "0 0 12px", color: theme.textMuted, fontSize: "0.85rem" }}>{fileStatus}</p>}

      <div style={{ display: "grid", gap: "12px" }}>
        {rows.map((row, index) => {
          const isBase = index === 0;
          const disabled = !row.prompt;
          return (
            <section key={index} style={{ padding: "14px", background: theme.previewBg, border: `1px solid ${isBase ? theme.lineColor : theme.cardBorder}`, borderRadius: "8px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                <p style={{ margin: 0, fontWeight: "700", color: theme.textMain }}>{index + 1}枚目 {isBase ? "（text2img・基準）" : "（img2img・差分）"}</p>
                <button onClick={() => handleCopy(index)} disabled={disabled} style={{ padding: "6px 12px", background: row.copied ? "#ea580c" : theme.lineColor, color: "#ffffff", border: "none", borderRadius: "5px", fontWeight: "700", opacity: disabled ? 0.5 : 1 }}>{row.copied ? "✓ コピーしました！" : "📋 コピー"}</button>
              </div>

              {!isBase && <>
                <input value={row.target} onChange={(event) => updateRow(index, "target", event.target.value)} placeholder="対象物（英語）例: rabbit" aria-label={`${index + 1}枚目の対象物`} style={{ width: "100%", marginBottom: "8px", padding: "8px", border: `1px solid ${theme.cardBorder}`, borderRadius: "5px", background: theme.inputBg, color: theme.previewText, boxSizing: "border-box" }} />
                <input value={row.partner} onChange={(event) => updateRow(index, "partner", event.target.value)} placeholder="相手要素（英語）例: fox" aria-label={`${index + 1}枚目の相手要素`} style={{ width: "100%", marginBottom: "8px", padding: "8px", border: `1px solid ${theme.cardBorder}`, borderRadius: "5px", background: theme.inputBg, color: theme.previewText, boxSizing: "border-box" }} />
                <input value={row.pose} onChange={(event) => updateRow(index, "pose", event.target.value)} placeholder="ポーズ（英語）例: waving enthusiastically" aria-label={`${index + 1}枚目のポーズ`} style={{ width: "100%", marginBottom: "8px", padding: "8px", border: `1px solid ${theme.cardBorder}`, borderRadius: "5px", background: theme.inputBg, color: theme.previewText, boxSizing: "border-box" }} />
              </>}

              <textarea value={row.prompt} onChange={(event) => setRows((current) => current.map((item, rowIndex) => (
                rowIndex === index ? { ...item, prompt: event.target.value, copied: item.copied && item.prompt === event.target.value } : item
              )))} placeholder="条件を選ぶと生成されます" aria-label={`${index + 1}枚目のプロンプト`} style={{ width: "100%", minHeight: "108px", padding: "10px", fontFamily: "monospace", fontSize: "0.9rem", lineHeight: "1.4", resize: "vertical", border: `1px solid ${theme.cardBorder}`, borderRadius: "5px", background: theme.inputBg, color: theme.previewText, boxSizing: "border-box" }} />
            </section>
          );
        })}
      </div>
    </div>
  );
}
