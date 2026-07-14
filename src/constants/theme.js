// アプリ全体で使うカラー定数とテーマ生成関数
// 色を変えたいときはここだけ修正すればOK

const COLORS = {
  active: "#3b82f6",      // 選択時のボーダー・アクセント色
  success: "#10b981",     // コピー完了時のボタン色
  line: "#06C755",        // LINEタブ：ライム色（ライトモード）
  lineDark: "#049A41",    // LINEタブ：暗めライム色（ダークモード）
};

export const createTheme = (isDarkMode) => ({
  textMain: isDarkMode ? "#f8fafc" : "#334155",
  textMuted: isDarkMode ? "#94a3b8" : "#64748b",
  cardBg: isDarkMode ? "rgba(255, 255, 255, 0.03)" : "#ffffff",
  cardBorder: isDarkMode ? "#475569" : "#cbd5e1",
  activeBg: isDarkMode ? "#1e3a8a" : "#3b82f6",
  activeText: "#ffffff",
  panelBg: isDarkMode ? "#1e293b" : "#f8fafc",
  // アコーディオン内部の背景（全体背景より少し違う色）
  accordionBg: isDarkMode ? "#162032" : "#f0f4f8",
  previewBg: isDarkMode ? "#0f172a" : "#f1f5f9",
  previewText: isDarkMode ? "#e2e8f0" : "#1e293b",
  inputBg: isDarkMode ? "#1e293b" : "#ffffff",
  activeColor: COLORS.active,
  successColor: COLORS.success,
  lineColor: isDarkMode ? COLORS.lineDark : COLORS.line,
});
