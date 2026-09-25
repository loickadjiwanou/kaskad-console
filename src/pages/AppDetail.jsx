import { Alert, Badge, Button, Dropdown, Flex, Popover, Result, Skeleton, Tabs, Typography } from "antd";
import { ArrowLeftOutlined, DownOutlined, EyeOutlined, ShareAltOutlined } from "@ant-design/icons";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { api } from "@/api";
import { useAuth } from "@/auth/AuthContext";
import AppIcon from "@/components/AppIcon";
import PublicLinkCard from "@/components/ratings/PublicLinkCard";
import PageHeader from "@/components/PageHeader";
import ReviewBanner from "@/components/review/ReviewBanner";
import { useAppReview } from "@/components/review/useAppReview";
import { AppStatusTag } from "@/components/Tags";
import { useI18n } from "@/i18n";
import { formatDateTime } from "@/lib/format";
import AppInfoForm from "./app/AppInfoForm";
import AppMedia from "./app/AppMedia";
import AppPreview from "./app/AppPreview";
import AppReviews from "./app/AppReviews";
import AppStats from "./app/AppStats";
import AppVersions from "./app/AppVersions";

// Transitions de statut proposées selon le statut courant (brouillon / publié / dépublié)
const TRANSITIONS = { draft: ["published"], published: ["archived", "draft"], archived: ["published", "draft"] };

/** Demande de changement de statut en cours (éditeur → admin complet). */
function StatusRequestBanner({ app, review }) {
    const { t } = useI18n();
    const { admin, isFullAdmin, canWrite } = useAuth();
    const r = app.status_request;
    if (!r) return null;
    const mine = r.submitted_by === admin?.id;
    let actions = null;
    if (r.state === "pending" && isFullAdmin) {
        actions = (
            <>
                <Button size="small" type="primary" onClick={() => review.approveStatus(app)}>
                    {t("review.approve")}
                </Button>
                <Button size="small" danger onClick={() => review.rejectStatus(app)}>
                    {t("review.reject")}
                </Button>
            </>
        );
    } else if (!canWrite) {
        actions = null;
    } else if (r.state === "pending" && mine) {
        actions = (
            <Button size="small" onClick={() => review.withdrawStatus(app)}>
                {t("review.withdraw")}
            </Button>
        );
    } else if (r.state === "rejected" && (mine || isFullAdmin)) {
        actions = (
            <Button size="small" onClick={() => review.withdrawStatus(app)}>
                {t("review.dismiss")}
            </Button>
        );
    }
    return (
        <ReviewBanner
            review={r}
            title={t(`review.status.banner.${r.state}`, { status: t(`apps.actions.${r.status}`).toLowerCase() })}
            actions={actions}
            style={{ marginBottom: 16 }}
        />
    );
}

/** Modifications de fiche non publiées (app visible) : brouillon, soumission, validation. */
function ListingDraftBanner({ app, review, onPreview }) {
    const { t } = useI18n();
    const { admin, isFullAdmin, canWrite } = useAuth();
    if (!app.draft) return null;
    const r = app.listing_review;
    const mine = r?.submitted_by === admin?.id;
    const preview = (
        <Button size="small" onClick={onPreview}>
            {t("review.listing.preview")}
        </Button>
    );
    const discard = canWrite && (
        <Button size="small" danger type="text" onClick={() => review.discardListing(app)}>
            {t("review.listing.discard")}
        </Button>
    );

    if (r?.state === "pending") {
        return (
            <ReviewBanner
                review={r}
                title={t("review.listing.banner.pending")}
                style={{ marginBottom: 16 }}
                actions={
                    isFullAdmin ? (
                        <>
                            <Button size="small" type="primary" onClick={() => review.publishListing(app)}>
                                {t("review.approveAndPublish")}
                            </Button>
                            <Button size="small" danger onClick={() => review.rejectListing(app)}>
                                {t("review.reject")}
                            </Button>
                            {preview}
                        </>
                    ) : (
                        <>
                            {preview}
                            {mine && canWrite && (
                                <Button size="small" onClick={() => review.withdrawListing(app)}>
                                    {t("review.withdraw")}
                                </Button>
                            )}
                        </>
                    )
                }
            />
        );
    }

    const primary = !canWrite ? null : isFullAdmin ? (
        <Button size="small" type="primary" onClick={() => review.publishListing(app)}>
            {t("review.listing.publish")}
        </Button>
    ) : (
        <Button size="small" type="primary" onClick={() => review.submitListing(app)}>
            {r?.state === "rejected" ? t("review.resubmit") : t("review.submit")}
        </Button>
    );

    if (r?.state === "rejected") {
        return (
            <ReviewBanner
                review={r}
                title={t("review.listing.banner.rejected")}
                style={{ marginBottom: 16 }}
                actions={
                    <>
                        {primary}
                        {preview}
                        {discard}
                    </>
                }
            />
        );
    }
    return (
        <Alert
            type="warning"
            showIcon
            style={{ marginBottom: 16 }}
            title={t("review.listing.banner.draft")}
            description={
                <Typography.Text type="secondary">
                    {t("review.listing.draftText", { name: app.draft.updated_by_name ?? "—", date: formatDateTime(app.draft.updated_at) })}
                </Typography.Text>
            }
            action={
                <Flex vertical gap={6}>
                    {primary}
                    {preview}
                    {discard}
                </Flex>
            }
        />
    );
}

export default function AppDetail() {
    const { id } = useParams();
    const { t } = useI18n();
    const { isFullAdmin, canWrite } = useAuth();
    const review = useAppReview();
    const navigate = useNavigate();
    const [params, setParams] = useSearchParams();
    const tab = params.get("tab") || "info";

    const { data: app, isLoading, error } = useQuery({ queryKey: ["app", id], queryFn: () => api.app(id) });

    if (isLoading) return <Skeleton active avatar paragraph={{ rows: 8 }} />;
    if (error) return <Result status="404" title={error.message} extra={<Button onClick={() => navigate("/apps")}>{t("apps.back")}</Button>} />;

    // Un éditeur ne peut pas faire de nouvelle demande de statut tant qu'une demande est en attente
    const requestPending = app.status_request?.state === "pending";
    const [primary, ...others] = TRANSITIONS[app.status];
    const label = (s) => (isFullAdmin ? t(`apps.actions.${s}`) : t(`review.status.request.${s}`));
    const statusButton =
        !canWrite || (!isFullAdmin && requestPending) ? null : others.length ? (
            <Dropdown.Button
                type={primary === "published" ? "primary" : "default"}
                icon={<DownOutlined />}
                loading={review.pending}
                onClick={() => review.changeStatus(app, primary)}
                menu={{ items: others.map((s) => ({ key: s, label: label(s) })), onClick: ({ key }) => review.changeStatus(app, key) }}
            >
                {label(primary)}
            </Dropdown.Button>
        ) : (
            <Button type="primary" loading={review.pending} onClick={() => review.changeStatus(app, primary)}>
                {label(primary)}
            </Button>
        );

    return (
        <>
            <Button type="link" icon={<ArrowLeftOutlined />} onClick={() => navigate("/apps")} style={{ paddingInline: 0, marginBottom: 8 }}>
                {t("apps.back")}
            </Button>
            <PageHeader
                icon={<AppIcon app={app} size={56} />}
                title={
                    <Flex align="center" gap={10}>
                        {app.name} <AppStatusTag status={app.status} />
                    </Flex>
                }
                subtitle={app.short_description}
                extra={
                    <>
                        <Popover trigger="click" placement="bottomRight" title={t("share.title")} content={<PublicLinkCard app={app} bordered={false} />}>
                            <Button icon={<ShareAltOutlined />}>{t("share.button")}</Button>
                        </Popover>
                        <Button icon={<EyeOutlined />} onClick={() => setParams({ tab: "preview" })}>
                            {t("apps.tabs.preview")}
                        </Button>
                        {statusButton}
                    </>
                }
            />
            <StatusRequestBanner app={app} review={review} />
            <ListingDraftBanner app={app} review={review} onPreview={() => setParams({ tab: "preview", draft: "1" })} />
            <Tabs
                activeKey={tab}
                onChange={(key) => setParams({ tab: key })}
                destroyOnHidden
                items={[
                    { key: "info", label: t("apps.tabs.info"), children: <AppInfoForm app={app} /> },
                    { key: "media", label: t("apps.tabs.media"), children: <AppMedia app={app} /> },
                    { key: "versions", label: t("apps.tabs.versions"), children: <AppVersions app={app} /> },
                    {
                        key: "reviews",
                        label: (
                            <Flex align="center" gap={6}>
                                {t("apps.tabs.reviews")}
                                {app.rating_count > 0 && <Badge count={app.rating_count} overflowCount={999} size="small" color="var(--ant-color-text-quaternary)" />}
                            </Flex>
                        ),
                        children: <AppReviews app={app} />,
                    },
                    { key: "stats", label: t("apps.tabs.stats"), children: <AppStats app={app} /> },
                    { key: "preview", label: t("apps.tabs.preview"), children: <AppPreview app={app} initialDraft={params.get("draft") === "1"} /> },
                ]}
            />
        </>
    );
}
