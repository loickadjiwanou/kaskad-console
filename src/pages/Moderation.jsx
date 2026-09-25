import { useState } from "react";
import { Badge, Button, Card, Empty, Flex, Segmented, Table, Tabs, Tag, Typography } from "antd";
import { ReloadOutlined } from "@ant-design/icons";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { api } from "@/api";
import AppIcon from "@/components/AppIcon";
import PageHeader from "@/components/PageHeader";
import { ReviewTag } from "@/components/review/ReviewBanner";
import { useAppReview } from "@/components/review/useAppReview";
import { PlatformTag, ScanTag } from "@/components/Tags";
import VersionDrawer from "@/components/versions/VersionDrawer";
import VersionPrimaryAction from "@/components/versions/VersionPrimaryAction";
import { canPublish, isScanning, useVersionActions } from "@/components/versions/useVersionActions";
import { useI18n } from "@/i18n";
import { formatBytes, formatDateTime } from "@/lib/format";

const SCAN_GROUPS = {
    all: () => true,
    ready: (v) => canPublish(v) && !v.review,
    scanning: isScanning,
    rejected: (v) => v.security_scan_status === "failed",
};

/** Demandes de validation : versions soumises, changements de statut, modifications de fiche. */
function ReviewsTab({ reviews, loading, onOpenVersion }) {
    const { t } = useI18n();
    const navigate = useNavigate();
    const versionActions = useVersionActions();
    const appReview = useAppReview();
    const [state, setState] = useState("pending");

    const rows = [
        ...(reviews?.versions ?? []).map((v) => ({ key: `v-${v.id}`, kind: "version", review: v.review, appId: v.app_id, appName: v.app_name, item: v })),
        ...(reviews?.status_requests ?? []).map((a) => ({ key: `s-${a.id}`, kind: "status", review: a.status_request, appId: a.id, appName: a.name, item: a })),
        ...(reviews?.listings ?? []).map((a) => ({ key: `l-${a.id}`, kind: "listing", review: a.listing_review, appId: a.id, appName: a.name, item: a })),
    ].sort((x, y) => String(y.review.submitted_at).localeCompare(String(x.review.submitted_at)));
    const count = (s) => rows.filter((r) => r.review.state === s).length;
    const visible = rows.filter((r) => r.review.state === state);

    const subject = (r) => {
        if (r.kind === "version") return <PlatformTag platform={r.item.platform} format={r.item.file_format} />;
        if (r.kind === "status") return <Typography.Text>{t(`review.status.target.${r.review.status}`)}</Typography.Text>;
        return <Typography.Text>{t("review.kinds.listingText")}</Typography.Text>;
    };

    const actions = (r) => {
        const open = () => (r.kind === "version" ? onOpenVersion(r.item) : navigate(`/apps/${r.appId}?tab=${r.kind === "listing" ? "preview&draft=1" : "info"}`));
        const openBtn = (
            <Button size="small" onClick={open}>
                {t("moderation.review")}
            </Button>
        );
        if (r.review.state !== "pending") return openBtn;
        if (r.kind === "version") {
            return (
                <>
                    <VersionPrimaryAction version={r.item} actions={versionActions} ctx={{ appName: r.appName, appStatus: r.item.app_status }} />
                    {openBtn}
                </>
            );
        }
        return (
            <>
                <Button size="small" danger onClick={() => (r.kind === "status" ? appReview.rejectStatus(r.item) : appReview.rejectListing(r.item))}>
                    {t("review.reject")}
                </Button>
                <Button size="small" type="primary" onClick={() => (r.kind === "status" ? appReview.approveStatus(r.item) : appReview.publishListing(r.item))}>
                    {t("review.approve")}
                </Button>
                {openBtn}
            </>
        );
    };

    const columns = [
        {
            title: t("review.columns.request"),
            key: "request",
            render: (_, r) => (
                <Flex align="center" gap={12}>
                    <AppIcon app={{ id: r.appId, name: r.appName, icon_url: r.kind === "version" ? null : r.item.icon_url }} size={36} />
                    <div style={{ minWidth: 0 }}>
                        <Flex gap={6} align="center" wrap>
                            <Link to={`/apps/${r.appId}`}>
                                <Typography.Text strong>{r.appName}</Typography.Text>
                            </Link>
                            {r.kind === "version" && <Typography.Text type="secondary">v{r.item.version_name}</Typography.Text>}
                        </Flex>
                        <Tag style={{ marginTop: 4 }}>{t(`review.kinds.${r.kind}`)}</Tag>
                    </div>
                </Flex>
            ),
        },
        { title: t("review.columns.subject"), key: "subject", render: (_, r) => subject(r) },
        {
            title: t("review.columns.submitted"),
            key: "submitted",
            render: (_, r) => (
                <div style={{ maxWidth: 320 }}>
                    <Typography.Text>{r.review.submitted_by_name}</Typography.Text>
                    <Typography.Text type="secondary" style={{ display: "block", fontSize: 12 }}>
                        {formatDateTime(r.review.submitted_at)}
                    </Typography.Text>
                    {r.review.note && (
                        <Typography.Text type="secondary" italic ellipsis={{ tooltip: r.review.note }} style={{ display: "block", fontSize: 12 }}>
                            « {r.review.note} »
                        </Typography.Text>
                    )}
                </div>
            ),
        },
        {
            title: t("review.columns.state"),
            key: "state",
            render: (_, r) => (
                <div style={{ maxWidth: 280 }}>
                    <ReviewTag review={r.review} />
                    {r.review.state === "rejected" && (
                        <Typography.Text type="danger" ellipsis={{ tooltip: r.review.reason }} style={{ display: "block", fontSize: 12, marginTop: 4 }}>
                            {r.review.reviewed_by_name} : {r.review.reason}
                        </Typography.Text>
                    )}
                </div>
            ),
        },
        {
            key: "actions",
            align: "right",
            render: (_, r) => (
                <Flex gap={6} justify="flex-end" wrap>
                    {actions(r)}
                </Flex>
            ),
        },
    ];

    return (
        <>
            <div style={{ padding: 16 }}>
                <Segmented
                    value={state}
                    onChange={setState}
                    options={["pending", "rejected"].map((s) => ({
                        value: s,
                        label: (
                            <Flex align="center" gap={8}>
                                {t(`review.filters.${s}`)}
                                <Badge count={count(s)} showZero size="small" color={s === "pending" ? "gold" : "red"} />
                            </Flex>
                        ),
                    }))}
                />
                <Typography.Paragraph type="secondary" style={{ margin: "12px 0 0" }}>
                    {t("review.helpAdmin")}
                </Typography.Paragraph>
            </div>
            <Table
                rowKey="key"
                loading={loading}
                dataSource={visible}
                columns={columns}
                pagination={visible.length > 20 ? { pageSize: 20 } : false}
                locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t(`review.empty.${state}`)} /> }}
                scroll={{ x: "max-content" }}
            />
        </>
    );
}

/** Versions en cours d'analyse de sécurité, validées (à soumettre / publier) ou rejetées par l'analyse. */
function ScanTab({ queue, loading, onOpenVersion }) {
    const { t } = useI18n();
    const actions = useVersionActions();
    const [group, setGroup] = useState("all");
    const rows = queue.filter(SCAN_GROUPS[group]);
    const count = (g) => queue.filter(SCAN_GROUPS[g]).length;

    const columns = [
        {
            title: t("moderation.columns.app"),
            key: "app",
            render: (_, v) => (
                <div>
                    <Link to={`/apps/${v.app_id}?tab=versions`} onClick={(e) => e.stopPropagation()}>
                        <Typography.Text strong>{v.app_name}</Typography.Text>
                    </Link>
                    <Typography.Text type="secondary" style={{ display: "block", fontSize: 12 }}>
                        v{v.version_name} · {t("versions.code", { code: v.version_code })}
                    </Typography.Text>
                </div>
            ),
        },
        { title: t("versions.columns.platform"), key: "platform", render: (_, v) => <PlatformTag platform={v.platform} format={v.file_format} /> },
        { title: t("versions.columns.size"), dataIndex: "file_size", render: formatBytes, responsive: ["md"] },
        {
            title: t("versions.columns.scan"),
            key: "scan",
            render: (_, v) => (
                <div>
                    <Flex gap={4} wrap>
                        <ScanTag status={v.security_scan_status} />
                        <ReviewTag review={v.review} />
                    </Flex>
                    {v.scan_report?.errors?.length > 0 && (
                        <Typography.Text type="danger" style={{ display: "block", fontSize: 12, maxWidth: 320 }} ellipsis={{ tooltip: v.scan_report.errors[0] }}>
                            {v.scan_report.errors[0]}
                        </Typography.Text>
                    )}
                </div>
            ),
        },
        { title: t("versions.columns.uploaded"), dataIndex: "created_at", render: formatDateTime, responsive: ["lg"] },
        {
            key: "actions",
            align: "right",
            render: (_, v) => (
                <Flex gap={6} justify="flex-end" onClick={(e) => e.stopPropagation()}>
                    {canPublish(v) && <VersionPrimaryAction version={v} actions={actions} ctx={{ appName: v.app_name }} />}
                    {v.security_scan_status === "failed" && (
                        <Button size="small" onClick={() => actions.rescan(v, { appName: v.app_name })}>
                            {t("versions.actions.rescan")}
                        </Button>
                    )}
                    <Button size="small" onClick={() => onOpenVersion(v)}>
                        {t("moderation.review")}
                    </Button>
                </Flex>
            ),
        },
    ];

    return (
        <>
            <div style={{ padding: 16 }}>
                <Segmented
                    value={group}
                    onChange={setGroup}
                    options={Object.keys(SCAN_GROUPS).map((g) => ({
                        value: g,
                        label: (
                            <Flex align="center" gap={8}>
                                {t(`moderation.groups.${g}`)}
                                <Badge count={count(g)} showZero color={g === "rejected" ? "red" : g === "ready" ? "green" : "blue"} size="small" />
                            </Flex>
                        ),
                    }))}
                />
            </div>
            <Table
                rowKey="id"
                loading={loading}
                dataSource={rows}
                columns={columns}
                pagination={rows.length > 20 ? { pageSize: 20 } : false}
                rowClassName="kaskad-clickable-row"
                onRow={(v) => ({ onClick: () => onOpenVersion(v) })}
                locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t("moderation.empty")} /> }}
                scroll={{ x: "max-content" }}
            />
        </>
    );
}

/** Modération : demandes de validation (éditeurs → admins complets) et file de l'analyse de sécurité. */
export default function Moderation() {
    const { t } = useI18n();
    const [params, setParams] = useSearchParams();
    const tab = params.get("tab") || "reviews";
    const [selected, setSelected] = useState(null);

    const scan = useQuery({
        queryKey: ["moderation"],
        queryFn: api.moderationQueue,
        refetchInterval: (q) => (q.state.data?.some(isScanning) ? 3000 : 30000),
    });
    const reviews = useQuery({ queryKey: ["reviews"], queryFn: api.moderationReviews, refetchInterval: 30000 });
    const d = reviews.data;
    const pendingReviews =
        (d?.versions ?? []).filter((v) => v.review?.state === "pending").length +
        (d?.status_requests ?? []).filter((a) => a.status_request?.state === "pending").length +
        (d?.listings ?? []).filter((a) => a.listing_review?.state === "pending").length;
    const refreshing = (scan.isFetching && !scan.isLoading) || (reviews.isFetching && !reviews.isLoading);

    return (
        <>
            <PageHeader
                title={t("moderation.title")}
                subtitle={t("moderation.subtitle")}
                extra={
                    <Button
                        icon={<ReloadOutlined spin={refreshing} />}
                        onClick={() => {
                            scan.refetch();
                            reviews.refetch();
                        }}
                    >
                        {t("common.refresh")}
                    </Button>
                }
            />
            <Card styles={{ body: { padding: 0 } }}>
                <Tabs
                    activeKey={tab}
                    onChange={(key) => setParams({ tab: key })}
                    tabBarStyle={{ paddingInline: 16, marginBottom: 0 }}
                    items={[
                        {
                            key: "reviews",
                            label: (
                                <Flex align="center" gap={8}>
                                    {t("moderation.tabs.reviews")}
                                    <Badge count={pendingReviews} size="small" color="gold" />
                                </Flex>
                            ),
                            children: <ReviewsTab reviews={reviews.data} loading={reviews.isLoading} onOpenVersion={(v) => setSelected(v)} />,
                        },
                        {
                            key: "scan",
                            label: t("moderation.tabs.scan"),
                            children: <ScanTab queue={scan.data ?? []} loading={scan.isLoading} onOpenVersion={(v) => setSelected(v)} />,
                        },
                    ]}
                />
            </Card>
            <VersionDrawer versionId={selected?.id} appName={selected?.app_name} appStatus={selected?.app_status} onClose={() => setSelected(null)} />
        </>
    );
}
