export const theme = {
  screenBg: "#060f1f",
  panel: "rgba(13, 27, 42, 0.92)",
  panelBorder: "rgba(56, 189, 248, 0.42)",
  boardBg: "#0b152c",
  boardCellBg: "rgba(148, 163, 184, 0.16)",
  textPrimary: "#e2e8f0",
  textMuted: "#94a3b8",
  textDark: "#0f172a",
  accent: "#38bdf8",
  success: "#22c55e",
  danger: "#f43f5e",
};

const tileColorMap = {
  0: "rgba(148, 163, 184, 0.14)",
  2: "#1e293b",
  4: "#1d4ed8",
  8: "#0ea5e9",
  16: "#14b8a6",
  32: "#22c55e",
  64: "#84cc16",
  128: "#eab308",
  256: "#f59e0b",
  512: "#f97316",
  1024: "#ef4444",
  2048: "#f43f5e",
};

export const getTileBackgroundColor = (value) => {
  if (!value) return tileColorMap[0];
  if (value in tileColorMap) return tileColorMap[value];
  return "#a855f7";
};

export const getTileTextColor = (value) => {
  if (value <= 4) return theme.textPrimary;
  if (value <= 64) return "#ecfeff";
  if (value <= 512) return theme.textDark;
  return "#fff7ed";
};
