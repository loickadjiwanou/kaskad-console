import { Alert, Flex, Tag, Typography } from "antd";
import { CheckCircleOutlined, ClockCircleOutlined, CloseCircleOutlined } from "@ant-design/icons";
import { useI18n } from "@/i18n";
import { formatDateTime } from "@/lib/format";

/** État d'une demande de validation : en revue / validée / refusée. */
export function ReviewTag({ review }) {
    const { t } = useI18n();
    if (!review) return null;
    const props = {
        pending: { color: "gold", icon: <ClockCircleOutlined /> },
        approved: { color: "success", icon: <CheckCircleOutlined /> },
        rejected: { color: "error", icon: <CloseCircleOutlined /> },
    }[review.state];
    return (
        <Tag color={props?.color} icon={props?.icon}>
            {t(`review.state.${review.state}`)}
        </Tag>
    );
}

/**
 * Bandeau d'une demande de validation : qui a soumis, quand, avec quelle note, et la décision (motif du refus).
 * `title` décrit l'objet de la demande ; `actions` : boutons selon le rôle.
 */
export default function ReviewBanner({ review, title, actions, style }) {
    const { t } = useI18n();
    if (!review) return null;
    const type = { pending: "warning", rejected: "error", approved: "success" }[review.state];
    return (
        <Alert
            type={type}
            showIcon
            style={style}
            title={title ?? t(`review.state.${review.state}`)}
            description={
                <Flex vertical gap={4}>
                    <Typography.Text type="secondary">
                        {t("review.submittedBy", { name: review.submitted_by_name ?? "—", date: formatDateTime(review.submitted_at) })}
                    </Typography.Text>
                    {review.note && (
                        <Typography.Text>
                            <Typography.Text strong>{t("review.note")} : </Typography.Text>
                            {review.note}
                        </Typography.Text>
                    )}
                    {review.state === "rejected" && (
                        <Typography.Text>
                            <Typography.Text strong>
                                {t("review.rejectedBy", { name: review.reviewed_by_name ?? "—", date: formatDateTime(review.reviewed_at) })} :{" "}
                            </Typography.Text>
                            {review.reason}
                        </Typography.Text>
                    )}
                    {review.state === "approved" && (
                        <Typography.Text type="secondary">
                            {t("review.approvedBy", { name: review.reviewed_by_name ?? "—", date: formatDateTime(review.reviewed_at) })}
                        </Typography.Text>
                    )}
                </Flex>
            }
            action={actions && <Flex vertical gap={6}>{actions}</Flex>}
        />
    );
}
