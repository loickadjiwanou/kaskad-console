import { useState } from "react";
import { Alert, Button, Card, Dropdown, Flex, Switch, Table, Typography } from "antd";
import { CloudUploadOutlined, MoreOutlined } from "@ant-design/icons";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/api";
import { PlatformTag, ScanTag, VersionStatusTag } from "@/components/Tags";
import UploadVersionDrawer from "@/components/versions/UploadVersionDrawer";
import VersionDrawer from "@/components/versions/VersionDrawer";
import { ReviewTag } from "@/components/review/ReviewBanner";
import VersionPrimaryAction from "@/components/versions/VersionPrimaryAction";
import { canPublish, isPending, isScanning, useVersionActions } from "@/components/versions/useVersionActions";
import { useAuth } from "@/auth/AuthContext";
import { useI18n } from "@/i18n";
import { formatBytes, formatDateTime, formatNumber } from "@/lib/format";

/** Versions d'une app : upload, suivi de l'analyse de sécurité, publication manuelle après validation. */
export default function AppVersions({ app }) {
    const { t } = useI18n();
    const actions = useVersionActions();
    const { isFullAdmin } = useAuth();
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
    const ctx = { appName: app.name, appStatus: app.status };

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
                    <VersionStatusTag status={v.status} />
                    {v.status === "draft" && <ReviewTag review={v.review} />}
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
                                { key: "rescan", label: t("versions.actions.rescan"), disabled: isScanning(v) },
                                { type: "divider" },
                                {
                                    key: "archive",
                                    label: t("versions.actions.archive"),
                                    danger: true,
                                    disabled: v.status === "archived" || (v.status === "published" && !isFullAdmin),
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
            {ready.length > 0 && (
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
                        <Button type="primary" icon={<CloudUploadOutlined />} onClick={() => setUploadOpen(true)}>
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
            <VersionDrawer versionId={selected} appName={app.name} appStatus={app.status} onClose={() => setSelected(null)} />
        </>
    );
}
