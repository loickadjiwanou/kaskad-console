import { Avatar, Button, Flex, Rate, Tag, Tooltip, Typography } from "antd";
import { DeleteOutlined, EditOutlined, EyeInvisibleOutlined, EyeOutlined, FlagOutlined, MessageOutlined } from "@ant-design/icons";
import { Link } from "react-router-dom";
import { useAuth } from "@/auth/AuthContext";
import { useI18n } from "@/i18n";
import { formatDate, formatDateTime } from "@/lib/format";

/**
 * Avis d'un utilisateur : note, texte, réponse du développeur ; actions selon le rôle
 * (réponse : membres non lecteurs ; masquage / rétablissement : administrateur de la plateforme).
 */
export default function ReviewCard({ review, actions, showApp = false }) {
    const { t } = useI18n();
    const { isFullAdmin, canWrite } = useAuth();
    const r = review;
    const edited = r.updated_at && r.created_at && new Date(r.updated_at) - new Date(r.created_at) > 60_000;

    return (
        <div className="kaskad-review" style={{ opacity: r.hidden ? 0.7 : 1 }}>
            <Flex justify="space-between" align="flex-start" gap={12} wrap>
                <Flex gap={12} align="center" style={{ minWidth: 0 }}>
                    <Avatar style={{ background: "var(--ant-color-primary)", flexShrink: 0 }}>{(r.author_name || "?")[0].toUpperCase()}</Avatar>
                    <div style={{ minWidth: 0 }}>
                        <Flex gap={8} align="center" wrap>
                            <Typography.Text strong>{r.author_name}</Typography.Text>
                            {showApp && r.app_name && (
                                <Link to={`/apps/${r.app_id}?tab=reviews`}>
                                    <Typography.Text type="secondary">· {r.app_name}</Typography.Text>
                                </Link>
                            )}
                        </Flex>
                        <Flex gap={8} align="center" wrap>
                            <Rate disabled value={r.rating} style={{ fontSize: 12 }} />
                            <Tooltip title={formatDateTime(r.updated_at)}>
                                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                                    {formatDate(r.updated_at)}
                                    {edited && ` · ${t("ratings.edited")}`}
                                    {r.version_name && ` · v${r.version_name}`}
                                    {r.language && ` · ${r.language.toUpperCase()}`}
                                </Typography.Text>
                            </Tooltip>
                        </Flex>
                    </div>
                </Flex>
                <Flex gap={4} wrap>
                    {r.hidden && (
                        <Tooltip title={r.hidden_reason}>
                            <Tag icon={<EyeInvisibleOutlined />}>{t("ratings.hiddenTag")}</Tag>
                        </Tooltip>
                    )}
                    {r.reports_count > 0 && (
                        <Tooltip title={r.report_reasons?.map((x) => t(`ratings.reasons.${x}`)).join(", ")}>
                            <Tag color="red" icon={<FlagOutlined />}>
                                {t("ratings.reportsCount", { count: r.reports_count })}
                            </Tag>
                        </Tooltip>
                    )}
                </Flex>
            </Flex>

            {r.body ? (
                <Typography.Paragraph style={{ margin: "10px 0 0", whiteSpace: "pre-wrap" }}>{r.body}</Typography.Paragraph>
            ) : (
                <Typography.Paragraph type="secondary" italic style={{ margin: "10px 0 0" }}>
                    {t("ratings.noText")}
                </Typography.Paragraph>
            )}

            {r.reply && (
                <div className="kaskad-review-reply">
                    <Flex justify="space-between" gap={8} wrap>
                        <Typography.Text strong style={{ fontSize: 13 }}>
                            {t("ratings.developerReply", { name: r.reply.author_name })}
                        </Typography.Text>
                        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                            {formatDate(r.reply.replied_at)}
                        </Typography.Text>
                    </Flex>
                    <Typography.Paragraph style={{ margin: "4px 0 0", whiteSpace: "pre-wrap" }}>{r.reply.body}</Typography.Paragraph>
                </div>
            )}

            {actions && (canWrite || isFullAdmin) && (
                <Flex gap={4} wrap style={{ marginTop: 8, marginLeft: -8 }}>
                    {canWrite && (
                        <Button size="small" type="text" icon={r.reply ? <EditOutlined /> : <MessageOutlined />} onClick={() => actions.reply(r)}>
                            {r.reply ? t("ratings.editReply") : t("ratings.reply")}
                        </Button>
                    )}
                    {canWrite && r.reply && (
                        <Button size="small" type="text" danger icon={<DeleteOutlined />} onClick={() => actions.deleteReply(r)}>
                            {t("ratings.deleteReply")}
                        </Button>
                    )}
                    {isFullAdmin && !r.hidden && (
                        <Button size="small" type="text" danger icon={<EyeInvisibleOutlined />} onClick={() => actions.hide(r)}>
                            {t("ratings.hide")}
                        </Button>
                    )}
                    {isFullAdmin && (r.hidden || r.reports_count > 0) && (
                        <Button size="small" type="text" icon={<EyeOutlined />} onClick={() => actions.restore(r)}>
                            {r.hidden ? t("ratings.restore") : t("ratings.keep")}
                        </Button>
                    )}
                </Flex>
            )}
        </div>
    );
}
