import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { theme as antdTheme } from "antd";
import { load, save } from "@/lib/storage";
import palette from "./palette";

export { palette };

const KEY = "kaskad.console.theme";

// Jetons Ant Design aux couleurs Kaskad
export function antdThemeFor(dark) {
    return {
        algorithm: dark ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
        token: {
            colorPrimary: dark ? palette.primary.lighter : palette.primary.DEFAULT,
            colorInfo: palette.semantic.info,
            colorSuccess: palette.semantic.success,
            colorWarning: palette.semantic.warning,
            colorError: palette.semantic.danger,
            colorLink: dark ? palette.primary.lighter : palette.primary.DEFAULT,
            colorBgBase: dark ? palette.dark.background : "#ffffff",
            colorBgLayout: dark ? palette.neutral[950] : palette.neutral[100],
            colorBgContainer: dark ? palette.dark.surface : "#ffffff",
            colorBorderSecondary: dark ? palette.dark.border : palette.light.border,
            colorTextBase: dark ? palette.dark.textPrimary : palette.light.textPrimary,
            fontFamily: "Inter, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
            borderRadius: 10,
            borderRadiusLG: 14,
            controlHeight: 38,
        },
        components: {
            Layout: {
                siderBg: dark ? palette.neutral[950] : "#ffffff",
                headerBg: dark ? palette.neutral[950] : "#ffffff",
                bodyBg: dark ? palette.neutral[950] : palette.neutral[100],
            },
            Menu: {
                itemBg: "transparent",
                itemSelectedBg: dark ? "#1E2F55" : "#E8F0FF",
                itemSelectedColor: dark ? palette.primary.lighter : palette.primary.DEFAULT,
                itemBorderRadius: 10,
            },
            Card: { headerFontSize: 15 },
            Table: { headerBg: dark ? palette.dark.surface : palette.neutral[50] },
        },
    };
}

const ThemeContext = createContext(null);

export function ThemeModeProvider({ children }) {
    const [mode, setModeState] = useState(() => load(KEY, "system")); // system | light | dark
    const [systemDark, setSystemDark] = useState(() => window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false);

    useEffect(() => {
        const mq = window.matchMedia?.("(prefers-color-scheme: dark)");
        if (!mq) return;
        const onChange = (e) => setSystemDark(e.matches);
        mq.addEventListener("change", onChange);
        return () => mq.removeEventListener("change", onChange);
    }, []);

    const dark = mode === "dark" || (mode === "system" && systemDark);
    useEffect(() => {
        document.documentElement.style.colorScheme = dark ? "dark" : "light";
        document.body.style.background = dark ? palette.neutral[950] : palette.neutral[100];
    }, [dark]);

    const value = useMemo(
        () => ({
            mode,
            dark,
            setMode: (m) => {
                save(KEY, m);
                setModeState(m);
            },
        }),
        [mode, dark],
    );
    return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useThemeMode() {
    return useContext(ThemeContext);
}
