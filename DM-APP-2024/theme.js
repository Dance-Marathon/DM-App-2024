export const colors = {
  navy: "#1B4F8C",
  orange: "#E87722",
  pageBackground: "#f0f4f9",
  cardBackground: "#ffffff",
  cardBorder: "#dce6f0",
  lightBlue: "#e8f0f9",
  lightOrange: "#fff3e8",
  text: "#1a1a1a",
  textSecondary: "#6b7a8d",
  textMuted: "#9aabb8",
  white: "#ffffff",
  danger: "#c0392b",
  gold: "#d4af37",
  silver: "#a7a7ad",
  bronze: "#b08d57",
};

export const radii = {
  card: 12,
};

export const card = {
  backgroundColor: colors.cardBackground,
  borderWidth: 0.5,
  borderColor: colors.cardBorder,
  borderRadius: radii.card,
};

const theme = { colors, radii, card };

export default theme;
