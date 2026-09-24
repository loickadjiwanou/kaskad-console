// Palette de couleurs — Kaskad
// Primaire : Bleu (haut du logo, forme principale)
// Accent : Cyan (milieu du dégradé, liens/interactions)
// Tertiaire : Violet (bas de la cascade, touches d'accent rares)
// Neutres : Slate (console admin, fonds, textes)

const palette = {
    primary: {
        lighter: "#5B9CFF",
        light: "#3E7BFF",
        DEFAULT: "#2F6BFF",
        dark: "#1E4FD6",
        darker: "#1739A6",
    },
    accent: {
        lighter: "#7BF0FA",
        light: "#3DE3F0",
        DEFAULT: "#22D3EE",
        dark: "#0EA5C4",
        darker: "#0B7F99",
    },
    tertiary: {
        lighter: "#B794F6",
        light: "#9F5FEE",
        DEFAULT: "#8B3CE8",
        dark: "#6D28D9",
        darker: "#5B21B6",
    },
    neutral: {
        50: "#F8FAFC",
        100: "#F1F5F9",
        200: "#E2E8F0",
        300: "#CBD5E1",
        400: "#94A3B8",
        500: "#64748B",
        600: "#475569",
        700: "#334155",
        800: "#1E293B",
        900: "#0F172A",
        950: "#020617",
    },
    semantic: {
        success: "#22C55E",
        warning: "#F59E0B",
        danger: "#EF4444",
        info: "#3B82F6",
    },
    light: {
        background: "#FFFFFF",
        surface: "#F8FAFC",
        textPrimary: "#0F172A",
        textSecondary: "#475569",
        border: "#E2E8F0",
    },
    dark: {
        background: "#0F172A",
        surface: "#1E293B",
        textPrimary: "#F8FAFC",
        textSecondary: "#94A3B8",
        border: "#334155",
    },
    gradient: {
        brand: ["#2F6BFF", "#22D3EE", "#8B3CE8"],
        brandShort: ["#2F6BFF", "#22D3EE"],
    },
};

export default palette;