import PageHeader from "@/components/PageHeader";
import StatsPanel from "@/components/StatsPanel";
import { useI18n } from "@/i18n";

export default function Stats() {
    const { t } = useI18n();
    return (
        <>
            <PageHeader title={t("stats.title")} subtitle={t("stats.subtitle")} />
            <StatsPanel />
        </>
    );
}
