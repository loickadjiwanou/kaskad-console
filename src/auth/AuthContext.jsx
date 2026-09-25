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

    const role = session?.admin?.role;
    const value = useMemo(
        () => ({
            admin: session?.admin ?? null,
            account: session?.admin?.account ?? null,
            isAuthenticated: !!session?.access_token,
            // Administrateur de la plateforme (unique) : valide et publie, gère les catégories et voit tous les comptes
            isFullAdmin: role === "admin",
            // Propriétaire / développeur : gèrent les apps ; lecteur : consultation seule
            canWrite: ["admin", "owner", "developer"].includes(role),
            canManageTeam: ["admin", "owner"].includes(role),
            login: async (email, password) => setSession(await api.login(email.trim().toLowerCase(), password)),
            // Session ouverte après confirmation d'e-mail ou acceptation d'invitation
            startSession: (next) => setSession(next),
            logout: async () => {
                const refresh = getSession()?.refresh_token;
                if (refresh) await api.logout(refresh).catch(() => {});
                setSession(null);
            },
            setAdmin: (admin) => setSession({ ...getSession(), admin }),
        }),
        [session, role],
    );
    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    return useContext(AuthContext);
}
