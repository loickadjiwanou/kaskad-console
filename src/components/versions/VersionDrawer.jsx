import { useEffect, useState } from "react";
import { App, Button, Descriptions, Drawer, Flex, Form, Input, Typography } from "antd";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/api";
import ScanReport from "@/components/ScanReport";
import { PlatformTag, ScanTag, VersionStatusTag } from "@/components/Tags";
import { useI18n } from "@/i18n";
import { formatBytes, formatDateTime, formatNumber, SEMVER } from "@/lib/format";
import { useApiError } from "@/lib/useApiError";
import { useAuth } from "@/auth/AuthContext";
import ReviewBanner from "@/components/review/ReviewBanner";
import VersionPrimaryAction from "./VersionPrimaryAction";
import { isScanning, useVersionActions } from "./useVersionActions";

/** Détail d'une version : métadonnées, rapport d'analyse, édition du changelog et actions. */
export default function VersionDrawer({ versionId, appName, appStatus, onClose }) {
    const { t } = useI18n();
    const { message } = App.useApp();
    const onError = useApiError();
    const queryClient = useQueryClient();
    const actions = useVersionActions();
    const { isFullAdmin } = useAuth();
    const [form] = Form.useForm();
    const [editing, setEditing] = useState(false);

    const { data: v } = useQuery({
        queryKey: ["version", versionId],
        queryFn: () => api.version(versionId),
        enabled: !!versionId,
        refetchInterval: (q) => (q.state.data && isScanning(q.state.data) ? 3000 : false),
    });

    useEffect(() => {
        if (v) form.setFieldsValue({ version_name: v.version_name, changelog: v.changelog });
    }, [v, form]);
    useEffect(() => setEditing(false), [versionId]);

    const save = useMutation({
        mutationFn: (values) => api.updateVersion(versionId, values),
        onSuccess: (next) => {
            queryClient.setQueryData(["version", versionId], next);
            queryClient.invalidateQueries({ queryKey: ["versions", next.app_id] });
            setEditing(false);
            message.success(t("common.saved"));
        },
        onError,
    });

    const ctx = { appName, appStatus };
    return (
        <Drawer
            open={!!versionId}
            onClose={onClose}
            size="large"
            title={v ? `${appName ? `${appName} · ` : ""}v${v.version_name}` : ""}
            extra={
                v && (
                    <Flex gap={8}>
                        <Button onClick={() => actions.download(v)}>{t("versions.actions.download")}</Button>
                        <VersionPrimaryAction version={v} actions={actions} ctx={ctx} size="middle" />
                    </Flex>
                )
            }
        >
            {v && (
                <Flex vertical gap={24}>
                    {v.review && (
                        <ReviewBanner
                            review={v.review}
                            title={t(`review.version.banner.${v.review.state}`)}
                            actions={
                                v.review.state === "rejected" && (
                                    <Button size="small" onClick={() => actions.withdraw(v)}>
                                        {t("review.dismiss")}
                                    </Button>
                                )
                            }
                        />
                    )}
                    <Descriptions
                        column={1}
                        size="small"
                        bordered
                        items={[
                            { label: t("versions.fields.platform"), children: <PlatformTag platform={v.platform} format={v.file_format} /> },
                            { label: t("versions.fields.versionCode"), children: v.version_code },
                            { label: t("versions.fields.status"), children: <VersionStatusTag status={v.status} /> },
                            { label: t("versions.fields.scan"), children: <ScanTag status={v.security_scan_status} /> },
                            { label: t("versions.fields.file"), children: v.file_name },
                            { label: t("versions.fields.size"), children: formatBytes(v.file_size) },
                            {
                                label: "SHA-256",
                                children: (
                                    <Typography.Text code copyable style={{ wordBreak: "break-all" }}>
                                        {v.sha256_hash}
                                    </Typography.Text>
                                ),
                            },
                            { label: t("versions.fields.uploaded"), children: formatDateTime(v.created_at) },
                            { label: t("versions.fields.published"), children: formatDateTime(v.published_at) },
                            { label: t("versions.fields.downloads"), children: formatNumber(v.downloads_count) },
                        ]}
                    />

                    <div>
                        <Flex justify="space-between" align="center" style={{ marginBottom: 8 }}>
                            <Typography.Title level={5} style={{ margin: 0 }}>
                                {t("versions.fields.changelog")}
                            </Typography.Title>
                            {!editing && (v.status !== "published" || isFullAdmin) && (
                                <Button size="small" onClick={() => setEditing(true)}>
                                    {t("common.edit")}
                                </Button>
                            )}
                        </Flex>
                        {editing ? (
                            <Form form={form} layout="vertical" onFinish={(values) => save.mutate(values)}>
                                <Form.Item
                                    name="version_name"
                                    label={t("versions.fields.versionName")}
                                    rules={[{ required: true }, { pattern: SEMVER, message: t("versions.semver") }]}
                                >
                                    <Input />
                                </Form.Item>
                                <Form.Item name="changelog">
                                    <Input.TextArea autoSize={{ minRows: 4, maxRows: 14 }} maxLength={20000} />
                                </Form.Item>
                                <Flex gap={8} justify="flex-end">
                                    <Button onClick={() => setEditing(false)}>{t("common.cancel")}</Button>
                                    <Button type="primary" htmlType="submit" loading={save.isPending}>
                                        {t("common.save")}
                                    </Button>
                                </Flex>
                            </Form>
                        ) : (
                            <Typography.Paragraph style={{ whiteSpace: "pre-line" }} type={v.changelog ? undefined : "secondary"}>
                                {v.changelog || t("versions.noChangelog")}
                            </Typography.Paragraph>
                        )}
                    </div>

                    <div>
                        <Flex justify="space-between" align="center" style={{ marginBottom: 12 }}>
                            <Typography.Title level={5} style={{ margin: 0 }}>
                                {t("versions.scanReport")}
                            </Typography.Title>
                            {!isScanning(v) && (
                                <Button size="small" onClick={() => actions.rescan(v, ctx)}>
                                    {t("versions.actions.rescan")}
                                </Button>
                            )}
                        </Flex>
                        <ScanReport version={v} />
                    </div>
                </Flex>
            )}
        </Drawer>
    );
}
