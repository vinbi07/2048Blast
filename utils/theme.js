export const tokens = {
  colors: {
    bgBase: "#02091a",
    bgTop: "#061733",
    bgBottom: "#031022",
    panel: "rgba(7, 23, 43, 0.9)",
    panelStrong: "rgba(10, 31, 57, 0.95)",
    panelBorder: "rgba(79, 220, 255, 0.42)",
    panelInnerBorder: "rgba(120, 237, 255, 0.18)",
    boardBg: "#081b34",
    boardGrid: "rgba(107, 197, 255, 0.12)",
    boardCellBg: "rgba(132, 155, 179, 0.12)",
    accent: "#40e0ff",
    accentSoft: "#22b8d6",
    accentGlow: "rgba(64, 224, 255, 0.35)",
    success: "#3fffb1",
    danger: "#ff4f6f",
    warning: "#ffce4d",
    textPrimary: "#eff9ff",
    textSecondary: "#c8deee",
    textMuted: "#82a3ba",
    textDark: "#031022",
    overlay: "rgba(3, 10, 20, 0.62)",
  },
  spacing: {
    xxs: 4,
    xs: 8,
    sm: 12,
    md: 16,
    lg: 20,
    xl: 28,
  },
  radii: {
    sm: 10,
    md: 14,
    lg: 18,
    xl: 24,
    pill: 999,
  },
  typography: {
    display: 34,
    title: 24,
    subtitle: 15,
    body: 14,
    label: 12,
    value: 26,
    tileBase: 24,
    tileDense: 18,
  },
  fonts: {
    regular: "Orbitron_500Medium",
    semibold: "Orbitron_600SemiBold",
    bold: "Orbitron_700Bold",
    extraBold: "Orbitron_800ExtraBold",
    black: "Orbitron_900Black",
  },
  shadows: {
    soft: {
      shadowColor: "#000000",
      shadowOpacity: 0.28,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 4 },
      elevation: 4,
    },
    panel: {
      shadowColor: "#000000",
      shadowOpacity: 0.34,
      shadowRadius: 14,
      shadowOffset: { width: 0, height: 8 },
      elevation: 8,
    },
    glow: {
      shadowColor: "#40e0ff",
      shadowOpacity: 0.3,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 0 },
      elevation: 3,
    },
  },
  motion: {
    fast: 120,
    normal: 180,
    slow: 280,
  },
};

export const theme = {
  screenBg: tokens.colors.bgBase,
  panel: tokens.colors.panel,
  panelBorder: tokens.colors.panelBorder,
  boardBg: tokens.colors.boardBg,
  boardCellBg: tokens.colors.boardCellBg,
  textPrimary: tokens.colors.textPrimary,
  textMuted: tokens.colors.textMuted,
  textDark: tokens.colors.textDark,
  accent: tokens.colors.accent,
  success: tokens.colors.success,
  danger: tokens.colors.danger,
};

const tileStyles = {
  0: { bg: tokens.colors.boardCellBg, text: "transparent" },
  2: { bg: "#123255", text: tokens.colors.textPrimary },
  4: { bg: "#16406d", text: tokens.colors.textPrimary },
  8: { bg: "#066f9f", text: "#e4fcff" },
  16: { bg: "#07869f", text: "#e8ffff" },
  32: { bg: "#0b9f9f", text: "#07222a" },
  64: { bg: "#18b5a0", text: "#06211b" },
  128: { bg: "#36c8a3", text: "#08251f" },
  256: { bg: "#5ad49c", text: "#08231c" },
  512: { bg: "#84df8f", text: "#0c281c" },
  1024: { bg: "#b4e37e", text: "#1e2310" },
  2048: { bg: "#f7d96d", text: "#2d250a" },
};

const fallbackStyle = { bg: "#ffe19f", text: "#2d2207" };

export const getTileStyle = (value) => {
  if (value in tileStyles) {
    return tileStyles[value];
  }

  // Keep very high-value tiles readable while hinting "overclocked" progression.
  return fallbackStyle;
};

export const getTileBackgroundColor = (value) => getTileStyle(value).bg;

export const getTileTextColor = (value) => getTileStyle(value).text;

export const getTileFontSize = (value) => {
  if (value >= 10000) {
    return tokens.typography.tileDense - 2;
  }

  if (value >= 1000) {
    return tokens.typography.tileDense;
  }

  return tokens.typography.tileBase;
};
