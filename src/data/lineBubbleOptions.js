export const SPEECH_BUBBLE_GRID = [
  { id: "upper_left", label: "左上", icon: "↖️", prompt: "speech bubble upper left" },
  { id: "above", label: "上", icon: "⬆️", prompt: "speech bubble above" },
  { id: "upper_right", label: "右上", icon: "↗️", prompt: "speech bubble upper right" },
  { id: "left", label: "左", icon: "⬅️", prompt: "speech bubble left" },
  { id: "none", label: "なし", icon: "✖️", prompt: "" },
  { id: "right", label: "右", icon: "➡️", prompt: "speech bubble right" },
  { id: "lower_left", label: "左下", icon: "↙️", prompt: "speech bubble lower left" },
  { id: "below", label: "下", icon: "⬇️", prompt: "speech bubble below" },
  { id: "lower_right", label: "右下", icon: "↘️", prompt: "speech bubble lower right" },
];

export const BUBBLE_DECORATIONS = [
  { id: "none", label: "なし", prompt: "" },
  { id: "star", label: "★星", prompt: "star speech bubble" },
  { id: "heart", label: "♥ハート", prompt: "heart speech bubble" },
  { id: "spiky", label: "⚡ジャギー", prompt: "spiky speech bubble" },
  { id: "round", label: "○丸い", prompt: "round speech bubble" },
  { id: "cloud", label: "☁雲形", prompt: "cloud speech bubble" },
  { id: "glitter", label: "✨キラキラ", prompt: "glittery speech bubble" },
  { id: "double", label: "◎二重", prompt: "double lined speech bubble" },
  { id: "rect", label: "□四角", prompt: "rectangular speech bubble" },
  { id: "wavy", label: "〜波", prompt: "wavy speech bubble" },
];

export const BUBBLE_COLORS = [
  { id: "none", label: "なし", color: null, prompt: "" },
  { id: "white", label: "白", color: "#ffffff", prompt: "white speech bubble" },
  { id: "yellow", label: "黄", color: "#fbbf24", prompt: "yellow speech bubble" },
  { id: "pink", label: "ピンク", color: "#f472b6", prompt: "pink speech bubble" },
  { id: "cyan", label: "水色", color: "#38bdf8", prompt: "light blue speech bubble" },
  { id: "orange", label: "橙", color: "#fb923c", prompt: "orange speech bubble" },
  { id: "green", label: "緑", color: "#4ade80", prompt: "green speech bubble" },
  { id: "purple", label: "紫", color: "#c084fc", prompt: "purple speech bubble" },
  { id: "red", label: "赤", color: "#f87171", prompt: "red speech bubble" },
  { id: "black", label: "黒", color: "#1e293b", prompt: "black speech bubble" },
];

export const BUBBLE_SIZES = [
  { id: "small", label: "小", prompt: "small" },
  { id: "medium", label: "中", prompt: "medium" },
  { id: "large", label: "大", prompt: "large" },
];

export const BUBBLE_SHAPES = [
  { id: "none", label: "なし", prompt: "" },
  { id: "oval", label: "楕円", prompt: "oval" },
  { id: "rect", label: "四角形", prompt: "rectangular" },
  { id: "rounded", label: "角丸四角形", prompt: "rounded rectangle" },
  { id: "hexagon", label: "六角形", prompt: "hexagonal" },
  { id: "triangle", label: "三角形", prompt: "triangular" },
  { id: "diamond", label: "ダイヤ形", prompt: "diamond" },
];

export const buildBubblePrompt = ({ bubbleSize, bubbleShape, decoration, color, bubble }) => {
  const parts = [];

  if (bubbleSize?.prompt) parts.push(bubbleSize.prompt);
  if (bubbleShape?.prompt) parts.push(bubbleShape.prompt);
  if (decoration?.id !== "none" && decoration?.prompt) {
    parts.push(decoration.prompt.replace(/\s*speech bubble\b/gi, "").trim());
  }
  if (color?.id !== "none" && color?.prompt) {
    parts.push(color.prompt.replace(/\s*speech bubble\b/gi, "").trim());
  }

  parts.push("speech bubble");

  if (bubble?.id !== "none" && bubble?.prompt) {
    parts.push(bubble.prompt.replace(/\s*speech bubble\b/gi, "").trim());
  }

  return parts.filter(Boolean).join(" ").trim();
};
