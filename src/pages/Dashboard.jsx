import { useState } from "react";
import { Card, Col, Empty, Flex, List, Row, Segmented, Skeleton, Typography } from "antd";
import { AppstoreOutlined, CloudDownloadOutlined, RiseOutlined, SafetyCertificateOutlined } from "@ant-design/icons";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { api } from "@/api";
import AppIcon from "@/components/AppIcon";
import DownloadsChart from "@/components/DownloadsChart";
import PageHeader from "@/components/PageHeader";
import StatCard from "@/components/StatCard";
import { PlatformTag } from "@/components/Tags";
import { useAuth } from "@/auth/AuthContext";
import { useI18n } from "@/i18n";
import { formatDateTime, formatNumber, formatPercent } from "@/lib/format";
import { periodRange } from "@/lib/periods";
import { palette } from "@/theme";

export default function Dashboard() {
    const { t } = useI18n();
    const { admin, account, isFullAdmin } = useAuth();
    const navigate = useNavigate();
    const [period, setPeriod] = useState("30d");
    const range = periodRange(period);

    const { data: overview, isLoading } = useQuery({ queryKey: ["overview"], queryFn: api.overview });
    const { data: series } = useQuery({ queryKey: ["downloads", period], queryFn: () => api.downloads(range) });
    const { data: top } = useQuery({ queryKey: ["top-apps", period], queryFn: () => api.topApps({ from: range.from, to: range.to, limit: 5 }) });

    return (
        <>
            <PageHeader title={t("dashboard.title", { name: admin?.name?.split(" ")[0] ?? "" })} subtitle={isFullAdmin ? t("dashboard.subtitleAdmin") : t("dashboard.subtitle", { account: account?.name ?? "" })} />
            {isLoading ? (
                <Skeleton active />
            ) : (
                <Row gutter={[16, 16]}>
                    <Col xs={24} sm={12} xl={6}>
                        <StatCard
                            label={t("dashboard.publishedApps")}
                            value={formatNumber(overview?.apps.published)}
                            icon={<AppstoreOutlined />}
                            color={palette.primary.DEFAULT}
                            footer={
                                <Typography.Text type="secondary">
                                    {t("dashboard.draftArchived", { draft: overview?.apps.draft ?? 0, archived: overview?.apps.archived ?? 0 })}
                                </Typography.Text>
                            }
                            onClick={() => navigate("/apps")}
                        />
                    </Col>
                    <Col xs={24} sm={12} xl={6}>
                        <StatCard label={t("dashboard.totalDownloads")} value={formatNumber(overview?.total_downloads)} icon={<CloudDownloadOutlined />} color={palette.accent.dark} />
                    </Col>
                    <Col xs={24} sm={12} xl={6}>
                        <StatCard
                            label={t("dashboard.last30")}
                            value={formatNumber(overview?.downloads_last_30_days)}
                            icon={<RiseOutlined />}
                            color={palette.semantic.success}
                            footer={
                                <Typography.Text type="secondary">
                                    {t("dashboard.viewsConversion", {
                                        views: formatNumber(overview?.views_last_30_days),
                                        conversion: formatPercent(overview?.conversion_last_30_days),
                                    })}
                                </Typography.Text>
                            }
                        />
                    </Col>
                    <Col xs={24} sm={12} xl={6}>
                        <StatCard
                            label={isFullAdmin ? t("dashboard.reviewsPending") : t("dashboard.pendingReview")}
                            value={formatNumber(isFullAdmin ? overview?.reviews_pending : overview?.versions_pending_review)}
                            icon={<SafetyCertificateOutlined />}
                            color={palette.tertiary.DEFAULT}
                            footer={<Typography.Link>{isFullAdmin ? t("dashboard.openModeration") : t("dashboard.openApps")}</Typography.Link>}
                            onClick={() => navigate(isFullAdmin ? "/moderation" : "/apps")}
                        />
                    </Col>
                </Row>
            )}

            <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
                <Col xs={24} xl={16}>
                    <Card
                        title={t("dashboard.downloadsChart")}
                        extra={
                            <Segmented
                                size="small"
                                value={period}
                                onChange={setPeriod}
                                options={["7d", "30d", "90d", "12m"].map((p) => ({ value: p, label: t(`periods.${p}`) }))}
                            />
                        }
                    >
                        <DownloadsChart data={series} interval={range.interval} />
                    </Card>
                </Col>
                <Col xs={24} xl={8}>
                    <Card title={t("dashboard.topApps")} style={{ height: "100%" }}>
                        <List
                            dataSource={top ?? []}
                            locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t("stats.noData")} /> }}
                            renderItem={(a, i) => (
                                <List.Item style={{ cursor: "pointer" }} onClick={() => navigate(`/apps/${a.app_id}`)}>
                                    <Flex align="center" gap={12} style={{ width: "100%" }}>
                                        <Typography.Text type="secondary" style={{ width: 16 }}>
                                            {i + 1}
                                        </Typography.Text>
                                        <AppIcon app={{ id: a.app_id, name: a.name }} size={32} />
                                        <Typography.Text strong ellipsis style={{ flex: 1 }}>
                                            {a.name}
                                        </Typography.Text>
                                        <Typography.Text>{formatNumber(a.downloads)}</Typography.Text>
                                    </Flex>
                                </List.Item>
                            )}
                        />
                    </Card>
                </Col>
            </Row>

            <Card title={t("dashboard.recentPublications")} style={{ marginTop: 16 }}>
                <List
                    dataSource={overview?.recent_publications ?? []}
                    locale={{ emptyText: t("dashboard.noPublication") }}
                    renderItem={(p) => (
                        <List.Item style={{ cursor: "pointer" }} onClick={() => navigate(`/apps/${p.app_id}?tab=versions`)}>
                            <Flex align="center" gap={12} wrap style={{ width: "100%" }}>
                                <AppIcon app={{ id: p.app_id, name: p.app_name }} size={36} />
                                <div style={{ flex: 1, minWidth: 160 }}>
                                    <Typography.Text strong>{p.app_name}</Typography.Text>
                                    <Typography.Text type="secondary"> · v{p.version_name}</Typography.Text>
                                </div>
                                <PlatformTag platform={p.platform} format={p.file_format} />
                                <Typography.Text type="secondary">{formatDateTime(p.published_at)}</Typography.Text>
                            </Flex>
                        </List.Item>
                    )}
                />
            </Card>
        </>
    );
}
