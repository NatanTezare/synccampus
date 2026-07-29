/**
 * A translucent version of any theme color, for tinted backgrounds
 * (status badges, banners) that need to look right in both light and
 * dark mode without a separate hardcoded hex for each.
 *
 * Example: tint(C.success, 15) — a 15%-strength green wash.
 */
export function tint(hex: string, percent: number) {
  return `color-mix(in srgb, ${hex} ${percent}%, transparent)`;
}