import PageHeader from "@/components/PageHeader";
import StatsPanel from "@/components/StatsPanel";
import { useAuth } from "@/auth/AuthContext";
import { useI18n } from "@/i18n";

export default function Stats() {
    const { t } = useI18n();
    const { isFullAdmin, account } = useAuth();
    return (
        <>
            <PageHeader title={t("stats.title")} subtitle={isFullAdmin ? t("stats.subtitleAdmin") : t("stats.subtitle", { account: account?.name ?? "" })} />
            <StatsPanel />
        </>
    );
}
