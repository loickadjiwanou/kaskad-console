import dayjs from "dayjs";
import { getLanguage } from "@/i18n";

export function formatBytes(bytes) {
    if (bytes == null) return "—";
    const fr = getLanguage() === "fr";
    if (bytes < 1024) return `${bytes} ${fr ? "o" : "B"}`;
    const units = fr ? ["Ko", "Mo", "Go", "To"] : ["KB", "MB", "GB", "TB"];
    let v = bytes / 1024;
    let i = 0;
    while (v >= 1024 && i < units.length - 1) {
        v /= 1024;
        i++;
    }
    return `${new Intl.NumberFormat(getLanguage(), { maximumFractionDigits: v < 10 ? 1 : 0 }).format(v)} ${units[i]}`;
}

export const formatNumber = (n) => new Intl.NumberFormat(getLanguage()).format(n ?? 0);
export const formatDate = (d) => (d ? dayjs(d).format(getLanguage() === "fr" ? "D MMM YYYY" : "MMM D, YYYY") : "—");
export const formatDateTime = (d) => (d ? dayjs(d).format(getLanguage() === "fr" ? "D MMM YYYY, HH:mm" : "MMM D, YYYY, h:mm A") : "—");

export const PLATFORMS = [
    { id: "android", label: "Android", icon: "android", formats: ["apk"] },
    { id: "windows", label: "Windows", icon: "microsoft-windows", formats: ["exe", "msi"] },
    { id: "macos", label: "macOS", icon: "apple", formats: ["dmg", "pkg"] },
    { id: "linux", label: "Linux", icon: "linux", formats: ["appimage", "deb", "rpm"] },
];
export const platformOf = (id) => PLATFORMS.find((p) => p.id === id);
export const formatLabel = (f) => (f === "appimage" ? "AppImage" : String(f || "").toUpperCase());
export const EXTENSION = { apk: ".apk", exe: ".exe", msi: ".msi", dmg: ".dmg", pkg: ".pkg", appimage: ".AppImage", deb: ".deb", rpm: ".rpm" };

// Même règle que le backend (numéro de version sémantique)
export const SEMVER = /^\d+\.\d+(\.\d+){0,2}([-+][0-9A-Za-z.-]+)?$/;
