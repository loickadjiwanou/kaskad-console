import { useState } from "react";
import { Alert, App, Button, Card, Dropdown, Flex, Select, Switch, Table, Typography } from "antd";
import { CloudUploadOutlined, ExperimentOutlined, MoreOutlined } from "@ant-design/icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/api";
import { ChannelTag, PlatformTag, ScanTag, VersionStatusTag } from "@/components/Tags";
import UploadVersionDrawer from "@/components/versions/UploadVersionDrawer";
import VersionDrawer from "@/components/versions/VersionDrawer";
import { ReviewTag } from "@/components/review/ReviewBanner";
import VersionPrimaryAction from "@/components/versions/VersionPrimaryAction";
import { canPublish, isPending, isScanning, useVersionActions } from "@/components/versions/useVersionActions";
import { useAuth } from "@/auth/AuthContext";
import { useAppReview } from "@/components/review/useAppReview";
import { useI18n } from "@/i18n";
import { formatBytes, formatDateTime, formatNumber } from "@/lib/format";
import { useApiError } from "@/lib/useApiError";

/** Testeurs du canal bêta : adresses e-mail des comptes de l'app client autorisés à voir les versions bêta. */
function TestersCard({ app }) {
    const { t } = useI18n();
    const { message } = App.useApp();
    const onError = useApiError();
    const queryClient = useQueryClient();
    const { canWrite } = useAuth();
    const [emails, setEmails] = useState(app.testers ?? []);
    const dirty = JSON.stringify([...emails].sort()) !== JSON.stringify([...(app.testers ?? [])].sort());
    const save = useMutation({
        mutationFn: () => api.setTesters(app.id, emails),
        onSuccess: (next) => {
            const added = next.testers.filter((e) => !(app.testers ?? []).includes(e)).length;
            queryClient.setQueryData(["app", app.id], next);
            message.success(
                added
                    ? `${t("release.testersSaved", { count: next.testers.length })} · ${t("release.invitesSent", { count: added })}`
                    : t("release.testersSaved", { count: next.testers.length }),
            );
        },
        onError,
    });
    const minTesters = app.min_beta_testers ?? 3;
    const invalid = emails.filter((e) => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e));
    return (
        <Card
            size="small"
            style={{ marginBottom: 16 }}
            title={
                <Flex align="center" gap={8}>
                    <ExperimentOutlined />
                    {t("release.testers", { count: (app.testers ?? []).length })}
                </Flex>
            }
            extra={
                canWrite && (
                    <Button size="small" type="primary" disabled={!dirty || invalid.length > 0} loading={save.isPending} onClick={() => save.mutate()}>
                        {t("common.save")}
                    </Button>
                )
            }
        >
            <Typography.Paragraph type="secondary" style={{ marginBottom: 8, fontSize: 13 }}>
                {t("release.testersHelp")}
            </Typography.Paragraph>
            {(app.testers ?? []).length < minTesters && (
                <Alert
                    type="warning"
                    showIcon
                    style={{ marginBottom: 12 }}
                    title={t("release.minTesters", { min: minTesters, count: (app.testers ?? []).length })}
                />
            )}
            <Select
                mode="tags"
                style={{ width: "100%" }}
                value={emails}
                onChange={(list) => setEmails([...new Set(list.map((e) => e.trim().toLowerCase()).filter(Boolean))])}
                tokenSeparators={[",", ";", " "]}
                placeholder={t("release.testersPlaceholder")}
                open={false}
                suffixIcon={null}
                disabled={!canWrite}
                status={invalid.length ? "error" : undefined}
            />
            {invalid.length > 0 && (
                <Typography.Text type="danger" style={{ fontSize: 12 }}>
                    {t("release.invalidEmails", { emails: invalid.join(", ") })}
                </Typography.Text>
            )}
        </Card>
    );
}

/** Versions d'une app : upload, suivi de l'analyse de sécurité, publication manuelle après validation. */
/**
 * App pas encore publiée (ou dépubliée) : les versions validées ne sont pas téléchargeables dans le store.
 * Indique la prochaine étape : demander la publication (membre), la publier (administrateur) ou attendre la décision.
 */
function AppHiddenBanner({ app, versions }) {
    const { t } = useI18n();
    const { isFullAdmin, canWrite } = useAuth();
    const review = useAppReview();
    if (app.status === "published") return null;
    const approved = versions.filter((v) => v.status === "published" || v.status === "scheduled").length;
    const pending = app.status_request?.state === "pending" && app.status_request.status === "published";
    const action = !canWrite ? null : isFullAdmin ? (
        <Button size="small" type="primary" onClick={() => review.changeStatus(app, "published")}>
            {t("apps.actions.published")}
        </Button>
    ) : pending ? null : (
        <Button size="small" type="primary" onClick={() => review.changeStatus(app, "published")}>
            {t("review.status.request.published")}
        </Button>
    );
    return (
        <Alert
            type={approved ? "warning" : "info"}
            showIcon
            style={{ marginBottom: 16 }}
            title={t(app.status === "archived" ? "versions.hidden.archivedTitle" : "versions.hidden.title")}
            description={
                pending
                    ? t("versions.hidden.pending")
                    : approved
                      ? t("versions.hidden.approved", { count: approved })
                      : t("versions.hidden.steps")
            }
            action={action}
        />
    );
}

export default function AppVersions({ app }) {
    const { t } = useI18n();
    const actions = useVersionActions();
    const { isFullAdmin, canWrite } = useAuth();
    const [uploadOpen, setUploadOpen] = useState(false);
    const [selected, setSelected] = useState(null);
    const [showArchived, setShowArchived] = useState(false);

    const { data: versions = [], isLoading } = useQuery({
        queryKey: ["versions", app.id],
        queryFn: () => api.versions(app.id),
        // Suivi en direct de l'analyse
        refetchInterval: (q) => (q.state.data?.some(isScanning) ? 3000 : false),
    });

    const rows = showArchived ? versions : versions.filter((v) => v.status !== "archived");
    // Admin complet : versions à publier (dont soumises) ; éditeur : versions validées par l'analyse à soumettre
    const ready = versions.filter((v) => canPublish(v) && !v.review);
    const submitted = versions.filter(isPending);
    // Bêta : le nombre de testeurs conditionne la soumission et la publication
    const ctx = { appName: app.name, appStatus: app.status, testers: (app.testers ?? []).length, minTesters: app.min_beta_testers ?? 3 };

    const columns = [
        {
            title: t("versions.columns.version"),
            key: "version",
            render: (_, v) => (
                <div>
                    <Typography.Text strong>v{v.version_name}</Typography.Text>
                    <Typography.Text type="secondary" style={{ display: "block", fontSize: 12 }}>
                        {t("versions.code", { code: v.version_code })}
                    </Typography.Text>
                </div>
            ),
        },
        { title: t("versions.columns.platform"), key: "platform", render: (_, v) => <PlatformTag platform={v.platform} format={v.file_format} /> },
        { title: t("versions.columns.size"), dataIndex: "file_size", render: formatBytes, responsive: ["md"] },
        { title: t("versions.columns.scan"), dataIndex: "security_scan_status", render: (s) => <ScanTag status={s} /> },
        {
            title: t("versions.columns.status"),
            key: "status",
            render: (_, v) => (
                <Flex gap={4} wrap>
                    <VersionStatusTag status={v.status} scheduledAt={v.scheduled_at} appHidden={app.status !== "published"} />
                    <ChannelTag channel={v.channel} />
                    {(v.status === "draft" || isPending(v) || v.review?.state === "rejected") && <ReviewTag review={v.review} />}
                </Flex>
            ),
        },
        { title: t("versions.columns.downloads"), dataIndex: "downloads_count", align: "right", render: formatNumber, responsive: ["lg"] },
        { title: t("versions.columns.uploaded"), dataIndex: "created_at", render: formatDateTime, responsive: ["xl"] },
        {
            key: "actions",
            align: "right",
            render: (_, v) => (
                <Flex gap={4} justify="flex-end" onClick={(e) => e.stopPropagation()}>
                    <VersionPrimaryAction version={v} actions={actions} ctx={ctx} />
                    <Dropdown
                        trigger={["click"]}
                        menu={{
                            items: [
                                { key: "details", label: t("versions.actions.details") },
                                { key: "download", label: t("versions.actions.download") },
                                { key: "rescan", label: t("versions.actions.rescan"), disabled: isScanning(v) || !canWrite },
                                { type: "divider" },
                                {
                                    key: "archive",
                                    label: t("versions.actions.archive"),
                                    danger: true,
                                    disabled: !canWrite || v.status === "archived" || (v.status === "published" && !isFullAdmin),
                                },
                            ],
                            onClick: ({ key }) => (key === "details" ? setSelected(v.id) : actions[key](v, ctx)),
                        }}
                    >
                        <Button size="small" type="text" icon={<MoreOutlined />} aria-label={t("common.more")} />
                    </Dropdown>
                </Flex>
            ),
        },
    ];

    return (
        <>
            <AppHiddenBanner app={app} versions={versions} />
            <TestersCard app={app} key={(app.testers ?? []).join(",")} />
            {canWrite && ready.length > 0 && (
                <Alert
                    type="success"
                    showIcon
                    style={{ marginBottom: 16 }}
                    title={isFullAdmin ? t("versions.readyToPublish", { count: ready.length }) : t("review.version.readyToSubmit", { count: ready.length })}
                />
            )}
            {isFullAdmin && submitted.length > 0 && (
                <Alert type="warning" showIcon style={{ marginBottom: 16 }} title={t("review.version.awaiting", { count: submitted.length })} />
            )}
            <Card
                title={t("versions.title")}
                extra={
                    <Flex gap={16} align="center">
                        <Flex gap={8} align="center">
                            <Switch size="small" checked={showArchived} onChange={setShowArchived} />
                            <Typography.Text type="secondary">{t("versions.showArchived")}</Typography.Text>
                        </Flex>
                        <Button type="primary" icon={<CloudUploadOutlined />} onClick={() => setUploadOpen(true)} style={{ display: canWrite ? undefined : "none" }}>
                            {t("versions.upload.button")}
                        </Button>
                    </Flex>
                }
                styles={{ body: { padding: 0 } }}
            >
                <Table
                    rowKey="id"
                    loading={isLoading}
                    dataSource={rows}
                    columns={columns}
                    pagination={rows.length > 20 ? { pageSize: 20 } : false}
                    rowClassName="kaskad-clickable-row"
                    onRow={(v) => ({ onClick: () => setSelected(v.id) })}
                    locale={{ emptyText: t("versions.empty") }}
                    scroll={{ x: "max-content" }}
                />
            </Card>
            <UploadVersionDrawer
                app={app}
                versions={versions}
                open={uploadOpen}
                onClose={() => setUploadOpen(false)}
                onUploaded={(v) => {
                    setUploadOpen(false);
                    setSelected(v.id);
                }}
            />
            <VersionDrawer
                versionId={selected}
                appName={app.name}
                appStatus={app.status}
                testers={ctx.testers}
                minTesters={ctx.minTesters}
                onClose={() => setSelected(null)}
            />
        </>
    );
}
