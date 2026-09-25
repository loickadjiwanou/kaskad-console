import { useEffect, useState } from "react";
import { App, Button, Descriptions, Drawer, Flex, Form, Input, Radio, Typography } from "antd";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/api";
import ScanReport from "@/components/ScanReport";
import { ChannelTag, PlatformTag, ScanTag, VersionStatusTag } from "@/components/Tags";
import LocalizedChangelog, { changelogFromForm, changelogToForm, LANGS } from "./LocalizedChangelog";
import { useI18n } from "@/i18n";
import { formatBytes, formatDateTime, formatNumber, SEMVER } from "@/lib/format";
import { useApiError } from "@/lib/useApiError";
import { useAuth } from "@/auth/AuthContext";
import ReviewBanner from "@/components/review/ReviewBanner";
import VersionPrimaryAction from "./VersionPrimaryAction";
import { isScanning, useVersionActions } from "./useVersionActions";

/** Détail d'une version : métadonnées, rapport d'analyse, édition du changelog et actions. */
export default function VersionDrawer({ versionId, appName, appStatus, testers, minTesters, onClose }) {
    const { t } = useI18n();
    const { message } = App.useApp();
    const onError = useApiError();
    const queryClient = useQueryClient();
    const actions = useVersionActions();
    const { isFullAdmin, canWrite } = useAuth();
    const [form] = Form.useForm();
    const [editing, setEditing] = useState(false);

    const { data: v } = useQuery({
        queryKey: ["version", versionId],
        queryFn: () => api.version(versionId),
        enabled: !!versionId,
        refetchInterval: (q) => (q.state.data && isScanning(q.state.data) ? 3000 : false),
    });

    useEffect(() => {
        if (v) form.setFieldsValue({ version_name: v.version_name, channel: v.channel || "production", ...changelogToForm(v) });
    }, [v, form]);
    useEffect(() => setEditing(false), [versionId]);

    const save = useMutation({
        mutationFn: ({ version_name, channel, ...texts }) =>
            api.updateVersion(versionId, {
                version_name,
                ...(v?.status === "draft" ? { channel } : {}),
                ...changelogFromForm(texts, v?.changelog_lang || "fr"),
            }),
        onSuccess: (next) => {
            queryClient.setQueryData(["version", versionId], next);
            queryClient.invalidateQueries({ queryKey: ["versions", next.app_id] });
            setEditing(false);
            message.success(t("common.saved"));
        },
        onError,
    });

    const ctx = { appName, appStatus, testers, minTesters };
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
                                canWrite && v.review.state === "rejected" && (
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
                            { label: t("versions.fields.status"), children: <VersionStatusTag status={v.status} scheduledAt={v.scheduled_at} /> },
                            {
                                label: t("release.channel"),
                                children: v.channel === "beta" ? <ChannelTag channel="beta" /> : t("release.production"),
                            },
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
                            {canWrite && !editing && (v.status !== "published" || isFullAdmin) && (
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
                                {v.status === "draft" && (
                                    <Form.Item name="channel" label={t("release.channel")}>
                                        <Radio.Group>
                                            <Radio value="production">{t("release.production")}</Radio>
                                            <Radio value="beta">{t("release.beta")}</Radio>
                                        </Radio.Group>
                                    </Form.Item>
                                )}
                                <LocalizedChangelog baseLang={v.changelog_lang || "fr"} />
                                <Flex gap={8} justify="flex-end">
                                    <Button onClick={() => setEditing(false)}>{t("common.cancel")}</Button>
                                    <Button type="primary" htmlType="submit" loading={save.isPending}>
                                        {t("common.save")}
                                    </Button>
                                </Flex>
                            </Form>
                        ) : (
                            <Flex vertical gap={8}>
                                {LANGS.map((l) => {
                                    const text = changelogToForm(v)[`changelog_${l}`];
                                    return (
                                        <div key={l}>
                                            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                                                {t(`release.lang.${l}`)}
                                            </Typography.Text>
                                            <Typography.Paragraph style={{ whiteSpace: "pre-line", margin: 0 }} type={text ? undefined : "secondary"}>
                                                {text || t("versions.noChangelog")}
                                            </Typography.Paragraph>
                                        </div>
                                    );
                                })}
                            </Flex>
                        )}
                    </div>

                    <div>
                        <Flex justify="space-between" align="center" style={{ marginBottom: 12 }}>
                            <Typography.Title level={5} style={{ margin: 0 }}>
                                {t("versions.scanReport")}
                            </Typography.Title>
                            {canWrite && !isScanning(v) && (
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
