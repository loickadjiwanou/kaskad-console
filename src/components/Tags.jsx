import { Space, Tag, Tooltip } from "antd";
import { CheckCircleFilled, ClockCircleOutlined, CloseCircleFilled, ExperimentOutlined, LoadingOutlined } from "@ant-design/icons";
import { useI18n } from "@/i18n";
import { formatDateTime, formatLabel, platformOf } from "@/lib/format";
import MdiIcon from "./MdiIcon";

const APP_STATUS_COLOR = { draft: "default", published: "success", archived: "warning" };

export function AppStatusTag({ status }) {
    const { t } = useI18n();
    return <Tag color={APP_STATUS_COLOR[status]}>{t(`status.app.${status}`)}</Tag>;
}

const VERSION_STATUS_COLOR = { draft: "default", published: "success", archived: "warning", scheduled: "processing" };

/** Statut d'une version ; programmée : date et heure de mise en ligne. */
export function VersionStatusTag({ status, scheduledAt }) {
    const { t } = useI18n();
    if (status === "scheduled") {
        return (
            <Tag color="processing" icon={<ClockCircleOutlined />}>
                {t("status.version.scheduledAt", { date: formatDateTime(scheduledAt) })}
            </Tag>
        );
    }
    return <Tag color={VERSION_STATUS_COLOR[status]}>{t(`status.version.${status}`)}</Tag>;
}

/** Canal de diffusion : seule la bêta est signalée (production = cas normal). */
export function ChannelTag({ channel }) {
    const { t } = useI18n();
    if (channel !== "beta") return null;
    return (
        <Tooltip title={t("release.betaHelp")}>
            <Tag color="purple" icon={<ExperimentOutlined />}>
                {t("release.beta")}
            </Tag>
        </Tooltip>
    );
}

/** Statut de l'analyse de sécurité : en cours / validé / rejeté. */
export function ScanTag({ status }) {
    const { t } = useI18n();
    const props = {
        pending: { color: "processing", icon: <ClockCircleOutlined /> },
        scanning: { color: "processing", icon: <LoadingOutlined /> },
        passed: { color: "success", icon: <CheckCircleFilled /> },
        failed: { color: "error", icon: <CloseCircleFilled /> },
    }[status] ?? { color: "default" };
    return (
        <Tag color={props.color} icon={props.icon}>
            {t(`status.scan.${status}`)}
        </Tag>
    );
}

export function PlatformTag({ platform, format }) {
    const p = platformOf(platform);
    return (
        <Tag icon={<MdiIcon name={p?.icon} size={0.62} style={{ marginRight: 4 }} />}>
            {p?.label ?? platform}
            {format ? ` · ${formatLabel(format)}` : ""}
        </Tag>
    );
}

export function PlatformIcons({ platforms = [] }) {
    return (
        <Space size={6}>
            {platforms.map((id) => (
                <Tooltip key={id} title={platformOf(id)?.label}>
                    <span style={{ opacity: 0.75 }}>
                        <MdiIcon name={platformOf(id)?.icon} size={0.7} />
                    </span>
                </Tooltip>
            ))}
        </Space>
    );
}
