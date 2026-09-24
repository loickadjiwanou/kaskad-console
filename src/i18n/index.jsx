import { createContext, useCallback, useContext, useMemo, useState } from "react";
import dayjs from "dayjs";
import "dayjs/locale/fr";
import { load, save } from "@/lib/storage";
import en from "./en";
import fr from "./fr";

const dictionaries = { fr, en };
const KEY = "kaskad.console.language";

export function detectLanguage() {
    const stored = load(KEY);
    if (stored === "fr" || stored === "en") return stored;
    return (navigator.language || "fr").toLowerCase().startsWith("fr") ? "fr" : "en";
}

const lookup = (dict, key) => key.split(".").reduce((node, k) => node?.[k], dict);

export function translate(lang, key, params) {
    let value;
    if (typeof params?.count === "number") {
        const form = lang === "fr" ? (params.count < 2 ? "one" : "other") : params.count === 1 ? "one" : "other";
        value = lookup(dictionaries[lang], `${key}_${form}`);
    }
    value ??= lookup(dictionaries[lang], key) ?? lookup(dictionaries.fr, key) ?? key;
    if (typeof value === "string" && params) value = value.replace(/\{\{(\w+)\}\}/g, (_, k) => params[k] ?? "");
    return value;
}

// Langue courante, lue par le client API (en-tête Accept-Language) hors composants
let currentLanguage = detectLanguage();
export const getLanguage = () => currentLanguage;

const I18nContext = createContext(null);

export function I18nProvider({ children }) {
    const [lang, setLangState] = useState(currentLanguage);
    dayjs.locale(lang);

    const setLang = useCallback((next) => {
        currentLanguage = next;
        save(KEY, next);
        dayjs.locale(next);
        setLangState(next);
    }, []);

    const value = useMemo(() => ({ lang, setLang, t: (key, params) => translate(lang, key, params) }), [lang, setLang]);
    return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
    return useContext(I18nContext);
}
