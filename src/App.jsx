import { App as AntApp, ConfigProvider } from "antd";
import enUS from "antd/locale/en_US";
import frFR from "antd/locale/fr_FR";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "@/auth/AuthContext";
import { I18nProvider, useI18n } from "@/i18n";
import AppLayout from "@/layout/AppLayout";
import Account from "@/pages/Account";
import Activity from "@/pages/Activity";
import AppDetail from "@/pages/AppDetail";
import AppsList from "@/pages/AppsList";
import Categories from "@/pages/Categories";
import Dashboard from "@/pages/Dashboard";
import Login from "@/pages/Login";
import Moderation from "@/pages/Moderation";
import NotFound from "@/pages/NotFound";
import Stats from "@/pages/Stats";
import Team from "@/pages/Team";
import { antdThemeFor, ThemeModeProvider, useThemeMode } from "@/theme";

const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false, staleTime: 15_000 } },
});

function RequireAuth({ children }) {
    const { isAuthenticated } = useAuth();
    const location = useLocation();
    if (!isAuthenticated) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
    return children;
}

function RequireFullAdmin({ children }) {
    const { isFullAdmin } = useAuth();
    return isFullAdmin ? children : <Navigate to="/" replace />;
}

function Themed({ children }) {
    const { dark } = useThemeMode();
    const { lang } = useI18n();
    return (
        <ConfigProvider theme={antdThemeFor(dark)} locale={lang === "fr" ? frFR : enUS}>
            <AntApp>{children}</AntApp>
        </ConfigProvider>
    );
}

export default function App() {
    return (
        <QueryClientProvider client={queryClient}>
            <I18nProvider>
                <ThemeModeProvider>
                    <Themed>
                        <AuthProvider>
                            <BrowserRouter>
                                <Routes>
                                    <Route path="/login" element={<Login />} />
                                    <Route
                                        element={
                                            <RequireAuth>
                                                <AppLayout />
                                            </RequireAuth>
                                        }
                                    >
                                        <Route index element={<Dashboard />} />
                                        <Route path="apps" element={<AppsList />} />
                                        <Route path="apps/:id" element={<AppDetail />} />
                                        <Route path="moderation" element={<Moderation />} />
                                        <Route path="categories" element={<Categories />} />
                                        <Route path="stats" element={<Stats />} />
                                        <Route path="activity" element={<Activity />} />
                                        <Route
                                            path="team"
                                            element={
                                                <RequireFullAdmin>
                                                    <Team />
                                                </RequireFullAdmin>
                                            }
                                        />
                                        <Route path="account" element={<Account />} />
                                        <Route path="*" element={<NotFound />} />
                                    </Route>
                                </Routes>
                            </BrowserRouter>
                        </AuthProvider>
                    </Themed>
                </ThemeModeProvider>
            </I18nProvider>
        </QueryClientProvider>
    );
}
