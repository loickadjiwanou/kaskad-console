// Couleurs des trois apparences de la console (mêmes que l'app mobile) : clair, bleu nuit, noir.
import palette from "./palette";

export const SCHEMES = ["light", "dark", "black"];

/** Mélange deux couleurs hexadécimales (t = part de b). */
export function mix(a, b, t) {
    const pa = parseInt(a.slice(1), 16);
    const pb = parseInt(b.slice(1), 16);
    const ch = (p, s) => (p >> s) & 255;
    const c = [16, 8, 0].map((s) => Math.round(ch(pa, s) * (1 - t) + ch(pb, s) * t));
    return `#${c.map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}

/** Couleur avec transparence (rgba). */
export function alpha(hex, a) {
    const p = parseInt(hex.slice(1), 16);
    return `rgba(${(p >> 16) & 255}, ${(p >> 8) & 255}, ${p & 255}, ${a})`;
}

// Apparence Kaskad (hors Material Design)
export const KASKAD = {
    light: {
        layout: palette.neutral[100],
        container: "#FFFFFF",
        elevated: "#FFFFFF",
        chrome: "#FFFFFF", // barre latérale et en-tête
        border: palette.light.border,
        text: palette.light.textPrimary,
        textSecondary: palette.light.textSecondary,
        primary: palette.primary.DEFAULT,
        selectedBg: "#E8F0FF",
        tableHeader: palette.neutral[50],
    },
    // « Bleu nuit »
    dark: {
        layout: palette.neutral[950],
        container: palette.dark.surface,
        elevated: palette.neutral[800],
        chrome: palette.neutral[950],
        border: palette.dark.border,
        text: palette.dark.textPrimary,
        textSecondary: palette.dark.textSecondary,
        primary: palette.primary.lighter,
        selectedBg: "#1E2F55",
        tableHeader: palette.dark.surface,
    },
    // « Noir » : fond noir pur (écrans OLED), surfaces gris très sombre, sans teinte bleue
    black: {
        layout: "#000000",
        container: "#0E0E10",
        elevated: "#1C1C1F",
        chrome: "#000000",
        border: "#26262A",
        text: "#FAFAFA",
        textSecondary: "#A1A1AA",
        primary: palette.primary.lighter,
        selectedBg: "#0F1A33",
        tableHeader: "#141417",
    },
};
