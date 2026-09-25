import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { theme as antdTheme } from "antd";
import { load, save } from "@/lib/storage";
import { KASKAD, SCHEMES } from "./colors";
import { ELEVATION, materialAntdTheme, materialColors } from "./material";
import palette from "./palette";
import { installRipple } from "./ripple";

export { palette };

const MODE_KEY = "kaskad.console.theme";
const MATERIAL_KEY = "kaskad.console.material";
export const MODES = ["light", "system", "dark", "black"];

/**
 * Thème Ant Design : apparence Kaskad ou Material Design 3,
 * pour le schéma « light » (clair), « dark » (bleu nuit) ou « black » (noir).
 */
export function antdThemeFor(scheme, material) {
    const algorithm = scheme === "light" ? antdTheme.defaultAlgorithm : antdTheme.darkAlgorithm;
    if (material) return materialAntdTheme(scheme, algorithm);
    const c = KASKAD[scheme];
    return {
        algorithm,
        token: {
            colorPrimary: c.primary,
            colorInfo: palette.semantic.info,
            colorSuccess: palette.semantic.success,
            colorWarning: palette.semantic.warning,
            colorError: palette.semantic.danger,
            colorLink: c.primary,
            colorBgBase: scheme === "light" ? "#ffffff" : c.layout,
            colorBgLayout: c.layout,
            colorBgContainer: c.container,
            colorBgElevated: c.elevated,
            colorBorderSecondary: c.border,
            colorTextBase: c.text,
            colorTextSecondary: c.textSecondary,
            fontFamily: "Inter, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
            borderRadius: 10,
            borderRadiusLG: 14,
            controlHeight: 38,
        },
        components: {
            Layout: { siderBg: c.chrome, headerBg: c.chrome, bodyBg: c.layout },
            Menu: {
                itemBg: "transparent",
                itemSelectedBg: c.selectedBg,
                itemSelectedColor: c.primary,
                itemBorderRadius: 10,
            },
            Card: { headerFontSize: 15 },
            Table: { headerBg: c.tableHeader },
            Modal: { contentBg: c.elevated, headerBg: c.elevated },
        },
    };
}

/** Couleur de fond de la page (avant le rendu d'Ant Design). */
function pageBackground(scheme, material) {
    return material ? materialColors(scheme).surface : KASKAD[scheme].layout;
}

const ThemeContext = createContext(null);

export function ThemeModeProvider({ children }) {
    // light | system | dark (bleu nuit) | black (noir)
    const [mode, setModeState] = useState(() => {
        const stored = load(MODE_KEY, "system");
        return MODES.includes(stored) ? stored : "system";
    });
    const [material, setMaterialState] = useState(() => load(MATERIAL_KEY, false) === true);
    const [systemDark, setSystemDark] = useState(() => window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false);

    useEffect(() => {
        const mq = window.matchMedia?.("(prefers-color-scheme: dark)");
        if (!mq) return;
        const onChange = (e) => setSystemDark(e.matches);
        mq.addEventListener("change", onChange);
        return () => mq.removeEventListener("change", onChange);
    }, []);

    const scheme = mode === "system" ? (systemDark ? "dark" : "light") : mode;
    const dark = scheme !== "light";

    useEffect(() => {
        const root = document.documentElement;
        root.style.colorScheme = dark ? "dark" : "light";
        root.dataset.scheme = scheme;
        root.dataset.material = String(material);
        document.body.style.background = pageBackground(scheme, material);
        if (!material) return;
        // Rôles de couleur exposés en variables CSS (--md-sys-color-*) pour la feuille Material
        const c = materialColors(scheme);
        for (const [role, value] of Object.entries(c)) {
            root.style.setProperty(`--md-sys-color-${role.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`)}`, value);
        }
        for (const [level, value] of Object.entries(ELEVATION)) root.style.setProperty(`--md-sys-elevation-${level}`, value);
    }, [scheme, dark, material]);

    // Effet d'onde au toucher, uniquement en Material Design
    useEffect(() => (material ? installRipple() : undefined), [material]);

    const value = useMemo(
        () => ({
            mode,
            scheme,
            dark,
            material,
            setMode: (m) => {
                save(MODE_KEY, m);
                setModeState(m);
            },
            setMaterial: (on) => {
                save(MATERIAL_KEY, on);
                setMaterialState(on);
            },
        }),
        [mode, scheme, dark, material],
    );
    return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useThemeMode() {
    return useContext(ThemeContext);
}

export { SCHEMES };
