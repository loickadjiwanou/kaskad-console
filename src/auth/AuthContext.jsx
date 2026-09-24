import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { api } from "@/api";
import { getSession, onSessionChange, setSession } from "@/api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [session, setState] = useState(getSession);
    useEffect(() => onSessionChange(setState), []);

    // Au démarrage, rafraîchit le profil (rôle modifié, compte désactivé…)
    useEffect(() => {
        if (!getSession()) return;
        api.me()
            .then((admin) => setSession({ ...getSession(), admin }))
            .catch(() => {});
    }, []);

    const value = useMemo(
        () => ({
            admin: session?.admin ?? null,
            isAuthenticated: !!session?.access_token,
            isFullAdmin: session?.admin?.role === "admin",
            login: async (email, password) => setSession(await api.login(email.trim().toLowerCase(), password)),
            logout: async () => {
                const refresh = getSession()?.refresh_token;
                if (refresh) await api.logout(refresh).catch(() => {});
                setSession(null);
            },
            setAdmin: (admin) => setSession({ ...getSession(), admin }),
        }),
        [session],
    );
    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    return useContext(AuthContext);
}
