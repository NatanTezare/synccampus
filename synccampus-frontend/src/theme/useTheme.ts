import { useAccessibility } from '../context/AccessibilityContext';
import { lightPalette, darkPalette } from './palette';

/**
 * Drop-in replacement for a screen's local `const C = { blue: "#2B3990", ... }`.
 *
 * Conversion recipe for any screen:
 *   1. Delete the module-level `const C = {...}` literal.
 *   2. Add `const C = useTheme();` as the first line inside the component function.
 *   3. If the file also defines a module-level object that references C
 *      (e.g. `const STATUS_STYLES = { pending: { bg: '#FFF9E6', text: C.charcoal } }`),
 *      move that object inside the component too, since it now depends on a hook value.
 *   4. Replace any literal `bg-white` / `background: '#fff'` with `style={{ background: C.surface }}`
 *      so cards actually flip in dark mode instead of staying white.
 */
export function useTheme() {
  const { mode } = useAccessibility();
  return mode === 'dark' ? darkPalette : lightPalette;
}