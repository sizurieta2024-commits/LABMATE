export const colors = {
  bg: "#F7F6F2",
  card: "#FFFFFF",
  ink: "#141B2D",
  muted: "#5B6475",
  faint: "#E6E3DA",
  accent: "#1F6FEB",
  accentSoft: "#E7F0FE",
  fresh: "#0E8A4F",
  freshSoft: "#E3F6EC",
  warn: "#B45309",
  warnSoft: "#FEF3C7",
  danger: "#B42318",
};

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 };
export const radius = { sm: 8, md: 12, lg: 18, pill: 999 };

export const type = {
  title: { fontSize: 28, fontWeight: "800" as const, color: colors.ink, letterSpacing: -0.5 },
  h2: { fontSize: 20, fontWeight: "700" as const, color: colors.ink },
  h3: { fontSize: 16, fontWeight: "700" as const, color: colors.ink },
  body: { fontSize: 15, lineHeight: 22, color: colors.ink },
  small: { fontSize: 13, lineHeight: 18, color: colors.muted },
  label: { fontSize: 12, fontWeight: "700" as const, color: colors.muted, letterSpacing: 0.6, textTransform: "uppercase" as const },
};
