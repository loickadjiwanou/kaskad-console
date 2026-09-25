// Client de l'API admin : jetons JWT, rafraîchissement automatique (jeton à usage unique), langue des erreurs.
import { getLanguage } from "@/i18n";
import { load, save } from "@/lib/storage";

export const API_BASE = `${(import.meta.env.VITE_API_URL || "http://localhost:8000").replace(/\/+$/, "")}/api/v1`;
const SESSION_KEY = "kaskad.console.session";

export class ApiError extends Error {
    constructor(status, message, code, data) {
        super(message);
        this.status = status;
        this.code = code;
        this.data = data;
    }
}

// ------------------------------------------------------------------ session

let session = load(SESSION_KEY);
const listeners = new Set();

export const getSession = () => session;

export function setSession(next) {
    session = next;
    save(SESSION_KEY, next);
    listeners.forEach((l) => l(next));
}

export function onSessionChange(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
}

let refreshing = null;
async function refreshSession() {
    if (!session?.refresh_token) return false;
    refreshing ??= fetch(`${API_BASE}/admin/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: session.refresh_token }),
    })
        .then(async (r) => {
            if (!r.ok) throw new Error("refresh failed");
            const tokens = await r.json();
            setSession({ ...session, ...tokens });
            return true;
        })
        .catch(() => {
            setSession(null); // session expirée : retour à l'écran de connexion
            return false;
        })
        .finally(() => {
            refreshing = null;
        });
    return refreshing;
}

// ------------------------------------------------------------------ requêtes

export function buildUrl(path, params) {
    const url = new URL(`${API_BASE}${path}`);
    Object.entries(params ?? {}).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== "") url.searchParams.set(k, v);
    });
    return url.toString();
}

function headers(extra = {}) {
    const h = { Accept: "application/json", "Accept-Language": getLanguage(), ...extra };
    if (session?.access_token) h.Authorization = `Bearer ${session.access_token}`;
    return h;
}

async function toError(res) {
    const data = await res.json().catch(() => null);
    // Double authentification devenue obligatoire (exigée par le propriétaire) : la console affiche la configuration
    if (data?.code === "mfa_setup_required" && session?.admin && !session.admin.mfa_setup_required) {
        setSession({ ...session, admin: { ...session.admin, mfa_setup_required: true, mfa_required: true } });
    }
    return new ApiError(res.status, data?.detail || `HTTP ${res.status}`, data?.code, data);
}

/** Requête JSON (ou FormData via `form`). Rejoue une fois après rafraîchissement de la session. */
export async function request(path, { method = "GET", params, body, form, blob = false, retry = true } = {}) {
    let res;
    try {
        res = await fetch(buildUrl(path, params), {
            method,
            headers: headers(body !== undefined ? { "Content-Type": "application/json" } : {}),
            body: form ?? (body !== undefined ? JSON.stringify(body) : undefined),
        });
    } catch {
        throw new ApiError(0, getLanguage() === "fr" ? "Impossible de joindre le serveur." : "Unable to reach the server.", "network");
    }
    if (res.status === 401 && retry && session?.refresh_token && !path.startsWith("/admin/auth/login")) {
        if (await refreshSession()) return request(path, { method, params, body, form, blob, retry: false });
    }
    if (!res.ok) throw await toError(res);
    if (blob) return res.blob();
    if (res.status === 204) return null;
    const text = await res.text();
    return text ? JSON.parse(text) : null;
}

/** Upload avec progression (XMLHttpRequest : fetch ne fournit pas la progression d'envoi). */
export function upload(path, form, { onProgress, retry = true } = {}) {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", buildUrl(path));
        Object.entries(headers()).forEach(([k, v]) => xhr.setRequestHeader(k, v));
        xhr.upload.onprogress = (e) => e.lengthComputable && onProgress?.(e.loaded / e.total);
        xhr.onerror = () => reject(new ApiError(0, getLanguage() === "fr" ? "Envoi interrompu." : "Upload interrupted.", "network"));
        xhr.onload = async () => {
            if (xhr.status === 401 && retry && (await refreshSession())) {
                upload(path, form, { onProgress, retry: false }).then(resolve, reject);
                return;
            }
            let data = null;
            try {
                data = xhr.responseText ? JSON.parse(xhr.responseText) : null;
            } catch {
                /* réponse non JSON */
            }
            if (xhr.status >= 200 && xhr.status < 300) resolve(data);
            else reject(new ApiError(xhr.status, data?.detail || `HTTP ${xhr.status}`, data?.code, data));
        };
        xhr.send(form);
    });
}

/** Télécharge un fichier renvoyé par l'API (export CSV) avec l'authentification. */
export async function downloadFile(path, params, filename) {
    const blob = await request(path, { params, blob: true });
    const url = URL.createObjectURL(blob);
    const a = Object.assign(document.createElement("a"), { href: url, download: filename });
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
