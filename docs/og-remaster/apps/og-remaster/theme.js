export function readTheme() {
    const styles = getComputedStyle(document.documentElement);
    const read = (name) => styles.getPropertyValue(name).trim() || "#000";
    return {
        field: read("--og-field"),
        dirt: read("--og-dirt"),
        lines: read("--og-lines"),
        uiAccent: read("--og-ui-accent"),
        uiText: read("--og-ui-text"),
    };
}
