export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 36,
  xxl: 48,
};

export const radius = {
  sm: 10,
  md: 16,
  lg: 22,
  xl: 30,
  full: 999,
};

export const typography = {
  displayLg: { fontSize: 34, fontWeight: "900" as const, letterSpacing: -0.5 },
  displayMd: { fontSize: 26, fontWeight: "900" as const, letterSpacing: -0.3 },
  displaySm: { fontSize: 20, fontWeight: "800" as const },
  titleLg: { fontSize: 18, fontWeight: "800" as const },
  titleMd: { fontSize: 16, fontWeight: "700" as const },
  titleSm: { fontSize: 14, fontWeight: "700" as const },
  body: { fontSize: 15, fontWeight: "400" as const, lineHeight: 22 },
  bodyMd: { fontSize: 14, fontWeight: "400" as const, lineHeight: 20 },
  caption: { fontSize: 12, fontWeight: "500" as const },
  mono: { fontSize: 13, fontWeight: "600" as const, letterSpacing: 0.5 },
};
