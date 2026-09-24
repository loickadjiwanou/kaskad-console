import { App } from "antd";
import { useCallback } from "react";

/** Affiche une erreur API (message déjà traduit par le backend). */
export function useApiError() {
    const { message } = App.useApp();
    return useCallback((error) => message.error(error?.message || String(error)), [message]);
}
