/**
 * Theme helper: read CSS variables from :root and expose them as a typed
 * structure. When tokens update, this function should be re-invoked to
 * capture new values.
 */
export type Theme = {
  field: string;
  dirt: string;
  lines: string;
  uiAccent: string;
  uiText: string;
};

export function readTheme(): Theme {
  const styles = getComputedStyle(document.documentElement);
  const read = (name: string) => styles.getPropertyValue(name).trim() || "#000";
  return {
    field: read("--og-field"),
    dirt: read("--og-dirt"),
    lines: read("--og-lines"),
    uiAccent: read("--og-ui-accent"),
    uiText: read("--og-ui-text"),
  };
}