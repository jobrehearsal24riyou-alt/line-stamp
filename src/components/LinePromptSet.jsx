import React, { useEffect, useMemo, useState } from "react";
import { ALL_LINE_POSES, LINE_POSE_CATEGORIES } from "../data/linePoseCategories";

const RELATIONS = {
  holding: { prompt: "holding", label: "持つ" },
  merged: { prompt: "merged with", label: "合体する" },
  disguised: { prompt: "disguised as", label: "擬態する" },
};
const CATEGORY_LABELS = { cat: "cat", dog: "dog", zoo: "zoo animal", aquarium: "aquatic animal", bird: "bird", small: "small animal" };
const getRelation = (prompt) => prompt?.includes("disguised as") ? RELATIONS.disguised : prompt?.includes("merged with") ? RELATIONS.merged : RELATIONS.holding;
const shuffle = (items) => { const result = [...items]; for (let i = result.length - 1; i > 0; i -= 1) { const j = Math.floor(Math.random() * (i + 1)); [result[i], result[j]] = [result[j], result[i]]; } return result; };

export const createImg2ImgPrompt = ({ target, targetCategory, partnerCategory, relation, partner, pose }) => {
  if (!target || !targetCategory || !partnerCategory || !relation || !partner || !pose) return "";
  return ["Use the uploaded image only as the visual-style reference.","Preserve its linework, color palette, white outline, transparent background, quality, and overall sticker style.","Do not reuse the character, prop, pose, or scene from the reference image.",`Draw ${target} from the ${targetCategory} category, ${relation.prompt} ${partner} from the ${partnerCategory} category. Pose: ${pose}.`].join(" ");
};
export default function LinePromptSet({ basePrompt, lineSubjects, lineCombinations, selectedSubjectId, selectedAnimalType, selectedCombinationCategoryId, selectedCombinationId, theme }) {
  const selectedSubject = lineSubjects.find((item) => item.subject_id === selectedSubjectId);
  const selectedCombination = lineCombinations.find((item) => item.combination_id === selectedCombinationId);
  const relation = getRelation(basePrompt);
  const targetCategory = CATEGORY_LABELS[selectedAnimalType] || selectedAnimalType || "selected";
  const partnerCandidates = useMemo(() => lineCombinations.filter((item) => (!selectedCombinationCategoryId || item.category_id === selectedCombinationCategoryId) && item.combination_id !== selectedCombinationId), [lineCombinations, selectedCombinationCategoryId, selectedCombinationId]);
  const partnerCategory = selectedCombinationCategoryId || "selected category";
  const basePose = ALL_LINE_POSES.find((pose) => basePrompt?.includes(`Pose: ${pose.prompt}`)) || null;
  const selectedPoseCategory = LINE_POSE_CATEGORIES.find((category) => category.poses.some((pose) => pose.id === basePose?.id)) || LINE_POSE_CATEGORIES[0];

  const [shuffleVersion, setShuffleVersion] = useState(0);
  const [referenceImage, setReferenceImage] = useState(null);
  const importInputRef = React.useRef(null);
  const [fileStatus, setFileStatus] = useState("");
  const candidatePoses = useMemo(() => shuffle(selectedPoseCategory.poses.filter((pose) => pose.id !== basePose?.id)).slice(0, 7).map((pose) => pose.prompt), [basePose, selectedPoseCategory, shuffleVersion]);
  const pairs = useMemo(() => {
    const targets = shuffle(lineSubjects.filter((item) => (!selectedAnimalType || item.animal_type === selectedAnimalType) && item.subject_id !== selectedSubjectId));
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
    return { target, partner, pose, prompt: index === 0 ? basePrompt || "" : createImg2ImgPrompt({ target, targetCategory, partnerCategory, relation, partner, pose }), copied: false };
  });
  const [rows, setRows] = useState(makeRows);
  useEffect(() => { setRows(makeRows()); }, [basePrompt, selectedSubjectId, selectedCombinationId, selectedCombinationCategoryId, pairs, candidatePoses, targetCategory, partnerCategory, relation]);
  const updateRow = (index, field, value) => setRows((current) => current.map((row, rowIndex) => {
    if (rowIndex !== index) return row;
    const next = { ...row, [field]: value };
    if (index > 0) next.prompt = createImg2ImgPrompt({ target: (field === "target" ? value : next.target).trim(), targetCategory, partnerCategory, relation, partner: (field === "partner" ? value : next.partner).trim(), pose: next.pose });
    next.copied = row.copied && next.prompt === row.prompt;
    return next;
  }));
  const handleReferenceImageChange = (event) => { const file = event.target.files?.[0]; if (!file) return; setReferenceImage(file); const reader = new FileReader(); reader.onload = () => setReferencePreview(reader.result?.toString() || ""); reader.readAsDataURL(file); };
  const handleCopy = async (index) => { const prompt = rows[index]?.prompt?.trim(); if (!prompt) return; await navigator.clipboard.writeText(prompt); setRows((current) => current.map((row, rowIndex) => rowIndex === index && row.prompt.trim() === prompt ? { ...row, copied: true } : row)); };
  const handleExport = () => {
    const payload = {
      format: "line-stamp-prompts",
      version: 1,
      exportedAt: new Date().toISOString(),
      prompts: rows.map(({ target, partner, pose, prompt }, index) => ({ index: index + 1, target, partner, pose, prompt })),
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
      setRows(importedRows.map((item) => ({
        target: typeof item.target === "string" ? item.target : "",
        partner: typeof item.partner === "string" ? item.partner : "",
        pose: typeof item.pose === "string" ? item.pose : "",
        prompt: item.prompt,
        copied: false,
      })));
      setFileStatus("8件のプロンプトをインポートしました。");
    } catch (error) {
      setFileStatus(`インポートに失敗しました: ${String(error.message || error)}`);
    }
  };
  const canGenerateSet = Boolean(basePrompt && selectedSubject && selectedCombination);
  return <div style={{ marginTop: "16px" }}>
    <div style={{ padding: "14px 16px", background: theme.accordionBg, border: `1px solid ${theme.lineColor}`, borderRadius: "8px", marginBottom: "16px" }}><p style={{ margin: "0 0 6px", fontWeight: "700", color: theme.textMain }}>1枚目を基準画像にする img2img 8枚セット</p><p style={{ margin: 0, color: theme.textMuted, fontSize: "0.85rem", lineHeight: "1.6" }}>2〜8枚目は対象物は「{targetCategory}」、相手要素は選択した掛け合わせカテゴリから抽選し、関係「{relation.label}」を固定します。参照画像は画風だけを引き継ぎます。</p></div>
    {!canGenerateSet && <div style={{ padding: "14px 16px", background: theme.cardBg, border: `1px solid ${theme.cardBorder}`, borderRadius: "8px", color: theme.textMuted, marginBottom: "16px" }}>まず「LINEスタンプ」タブで条件を選択してください。</div>}\n    <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: "8px", flexWrap: "wrap", marginBottom: "12px" }}>
      <button onClick={() => setShuffleVersion((value) => value + 1)} disabled={!selectedCombination} style={{ padding: "7px 12px", background: theme.cardBg, color: theme.textMain, border: `1px solid ${theme.cardBorder}`, borderRadius: "5px", fontWeight: "700", opacity: selectedCombination ? 1 : 0.5 }}>🔀 2〜8枚目を再抽選</button>
      <button onClick={handleExport} disabled={!rows.length} style={{ padding: "7px 12px", background: theme.lineColor, color: "#ffffff", border: "none", borderRadius: "5px", fontWeight: "700", cursor: "pointer" }}>⬇ プロンプト一括エクスポート</button>
      <button onClick={() => importInputRef.current?.click()} style={{ padding: "7px 12px", background: theme.cardBg, color: theme.textMain, border: `1px solid ${theme.cardBorder}`, borderRadius: "5px", fontWeight: "700", cursor: "pointer" }}>⬆ プロンプト一括インポート</button>
      <input ref={importInputRef} type="file" accept=".json,application/json" onChange={handleImportFile} style={{ display: "none" }} />
    </div>
    {fileStatus && <p style={{ margin: "0 0 12px", color: theme.textMuted, fontSize: "0.85rem" }}>{fileStatus}</p>}
    <div style={{ display: "grid", gap: "12px" }}>{rows.map((row, index) => { const isBase = index === 0; const disabled = !row.prompt; return <section key={index} style={{ padding: "14px", background: theme.previewBg, border: `1px solid ${isBase ? theme.lineColor : theme.cardBorder}`, borderRadius: "8px" }}><div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "10px", marginBottom: "8px" }}><p style={{ margin: 0, fontWeight: "700", color: theme.textMain }}>{index + 1}枚目 {isBase ? "（text2img・基準）" : "（img2img・差分）"}</p><button onClick={() => handleCopy(index)} disabled={disabled} style={{ padding: "6px 12px", background: row.copied ? "#ea580c" : theme.lineColor, color: "#ffffff", border: "none", borderRadius: "5px", fontWeight: "700", opacity: disabled ? 0.5 : 1 }}>{row.copied ? "✓ コピーしました！" : "📋 コピー"}</button></div>{!isBase && <><input value={row.target} onChange={(event) => updateRow(index, "target", event.target.value)} placeholder="対象物（英語）例: rabbit" aria-label={`${index + 1}枚目の対象物`} style={{ width: "100%", marginBottom: "8px", padding: "8px", border: `1px solid ${theme.cardBorder}`, borderRadius: "5px", background: theme.inputBg, color: theme.previewText, boxSizing: "border-box" }} /><input value={row.partner} onChange={(event) => updateRow(index, "partner", event.target.value)} placeholder="相手要素（英語）例: fox" aria-label={`${index + 1}枚目の相手要素`} style={{ width: "100%", marginBottom: "8px", padding: "8px", border: `1px solid ${theme.cardBorder}`, borderRadius: "5px", background: theme.inputBg, color: theme.previewText, boxSizing: "border-box" }} /><input value={row.pose} onChange={(event) => { updateRow(index, "pose", event.target.value); }} placeholder="ポーズ（英語）例: waving enthusiastically" aria-label={`${index + 1}枚目のポーズ`} style={{ width: "100%", marginBottom: "8px", padding: "8px", border: `1px solid ${theme.cardBorder}`, borderRadius: "5px", background: theme.inputBg, color: theme.previewText, boxSizing: "border-box" }} /></>}<textarea value={row.prompt} onChange={(event) => setRows((current) => current.map((item, rowIndex) => rowIndex === index ? { ...item, prompt: event.target.value, copied: item.copied && item.prompt === event.target.value } : item))} placeholder="条件を選ぶと生成されます" aria-label={`${index + 1}枚目のプロンプト`} style={{ width: "100%", minHeight: "108px", padding: "10px", fontFamily: "monospace", fontSize: "0.9rem", lineHeight: "1.4", resize: "vertical", border: `1px solid ${theme.cardBorder}`, borderRadius: "5px", background: theme.inputBg, color: theme.previewText, boxSizing: "border-box" }} /></section>; })}</div>
  </div>;
}
