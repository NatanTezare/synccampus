// Both palettes share the exact same keys every screen already uses via `C.xxx`.
// Converting a screen to dark mode is just swapping its local `const C = {...}`
// literal for `const C = useTheme();` — see useTheme.ts.

export const lightPalette = {
  blue: "#2B3990",
  amber: "#FFCB05",
  alice: "#E8F4FF",
  aliceLight: "#F3F9FF",
  charcoal: "#54566A",
  dark: "#1a1c2e",
  success: "#10B21B",
  danger: "#E31818",
  surface: "#FFFFFF",
  surfaceAlt: "#F3F9FF",
  border: "rgba(43,57,144,0.08)",
  headerBg: "rgba(255,255,255,0.9)",
};

export const darkPalette = {
  blue: "#7C93FF",       // lifted for contrast against a dark background
  amber: "#FFCB05",      // unchanged — already reads well on dark
  alice: "#212A52",      // dark-surface analog of the light "alice" tint
  aliceLight: "#161B33", // page background
  charcoal: "#A8B0CC",   // muted text on dark
  dark: "#F3F6FF",       // primary text on dark (inverted from near-black)
  success: "#34D399",
  danger: "#F87171",
  surface: "#1E2547",
  surfaceAlt: "#161B33",
  border: "rgba(140,160,255,0.16)",
  headerBg: "rgba(22,27,51,0.9)",
};

export type Palette = typeof lightPalette;