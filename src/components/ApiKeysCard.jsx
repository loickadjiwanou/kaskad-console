import { useState } from "react";
import { Alert, App, Button, Card, Flex, Form, Input, Modal, Popconfirm, Table, Typography } from "antd";
import { DeleteOutlined, KeyOutlined, PlusOutlined } from "@ant-design/icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/api";
import { API_BASE } from "@/api/client";
import { useI18n } from "@/i18n";
import { formatDateTime } from "@/lib/format";
import { useApiError } from "@/lib/useApiError";

/** Exemple GitHub Actions : envoi d'une version et soumission automatique après l'analyse de sécurité. */
function ciExample() {
    return `# .github/workflows/kaskad.yml
name: Publish on Kaskad
on:
  push:
    tags: ["v*"]
jobs:
  kaskad:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      # … build : dist/app.deb
      - name: Upload to Kaskad
        env:
          KASKAD_API_KEY: \${{ secrets.KASKAD_API_KEY }}
        run: |
          curl --fail-with-body -X POST "${API_BASE}/admin/apps/<APP_ID>/versions" \\
            -H "Authorization: Bearer $KASKAD_API_KEY" \\
            -F file=@dist/app.deb \\
            -F version_name=\${GITHUB_REF_NAME#v} -F version_code=\${{ github.run_number }} \\
            -F platform=linux -F file_format=deb \\
            -F changelog_fr="Nouveautés…" -F changelog_en="What's new…" \\
            -F channel=production -F submit=true`;
}

/** Clés API du compte (propriétaire) : publication depuis l'intégration continue. */
export default function ApiKeysCard() {
    const { t } = useI18n();
    const { message } = App.useApp();
    const onError = useApiError();
    const queryClient = useQueryClient();
    const [creating, setCreating] = useState(false);
    const [created, setCreated] = useState(null);
    const [form] = Form.useForm();
    const { data: keys = [], isLoading } = useQuery({ queryKey: ["api-keys"], queryFn: api.apiKeys });

    const create = useMutation({
        mutationFn: ({ name }) => api.createApiKey(name.trim()),
        onSuccess: (key) => {
            queryClient.invalidateQueries({ queryKey: ["api-keys"] });
            setCreating(false);
            form.resetFields();
            setCreated(key);
        },
        onError,
    });
    const revoke = useMutation({
        mutationFn: api.revokeApiKey,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["api-keys"] });
            message.success(t("apiKeys.revoked"));
        },
        onError,
    });

    return (
        <Card
            title={
                <Flex align="center" gap={8}>
                    <KeyOutlined />
                    {t("apiKeys.title")}
                </Flex>
            }
            extra={
                <Button icon={<PlusOutlined />} onClick={() => setCreating(true)}>
                    {t("apiKeys.create")}
                </Button>
            }
            styles={{ body: { padding: 0 } }}
            style={{ marginTop: 16 }}
        >
            <Typography.Paragraph type="secondary" style={{ padding: "16px 24px 0", fontSize: 13 }}>
                {t("apiKeys.help")}
            </Typography.Paragraph>
            <Table
                rowKey="id"
                loading={isLoading}
                dataSource={keys}
                pagination={false}
                locale={{ emptyText: t("apiKeys.empty") }}
                scroll={{ x: "max-content" }}
                columns={[
                    { title: t("apiKeys.columns.name"), dataIndex: "name", render: (n) => <Typography.Text strong>{n}</Typography.Text> },
                    { title: t("apiKeys.columns.key"), dataIndex: "prefix", render: (p) => <Typography.Text code>{p}…</Typography.Text> },
                    { title: t("apiKeys.columns.createdBy"), dataIndex: "created_by_name", responsive: ["md"] },
                    { title: t("apiKeys.columns.created"), dataIndex: "created_at", render: formatDateTime, responsive: ["lg"] },
                    { title: t("apiKeys.columns.lastUsed"), dataIndex: "last_used_at", render: (d) => (d ? formatDateTime(d) : t("apiKeys.never")) },
                    {
                        key: "actions",
                        align: "right",
                        render: (_, k) => (
                            <Popconfirm title={t("apiKeys.revokeConfirm")} description={t("apiKeys.revokeText")} okButtonProps={{ danger: true }} onConfirm={() => revoke.mutate(k.id)}>
                                <Button size="small" danger icon={<DeleteOutlined />}>
                                    {t("apiKeys.revoke")}
                                </Button>
                            </Popconfirm>
                        ),
                    },
                ]}
            />

            <Modal
                open={creating}
                onCancel={() => setCreating(false)}
                title={t("apiKeys.create")}
                okText={t("common.create")}
                onOk={() => form.submit()}
                confirmLoading={create.isPending}
                destroyOnHidden
            >
                <Form form={form} layout="vertical" onFinish={(v) => create.mutate(v)} style={{ marginTop: 16 }}>
                    <Form.Item name="name" label={t("apiKeys.columns.name")} extra={t("apiKeys.nameHelp")} rules={[{ required: true, whitespace: true }]}>
                        <Input maxLength={80} autoFocus placeholder="GitHub Actions" />
                    </Form.Item>
                </Form>
            </Modal>

            <Modal
                open={!!created}
                onCancel={() => setCreated(null)}
                title={t("apiKeys.createdTitle", { name: created?.name ?? "" })}
                footer={
                    <Button type="primary" onClick={() => setCreated(null)}>
                        {t("apiKeys.done")}
                    </Button>
                }
                width={720}
                destroyOnHidden
            >
                <Alert type="warning" showIcon title={t("apiKeys.copyNow")} style={{ margin: "16px 0" }} />
                <Typography.Paragraph copyable={{ text: created?.key }} code style={{ wordBreak: "break-all" }}>
                    {created?.key}
                </Typography.Paragraph>
                <Typography.Title level={5}>{t("apiKeys.exampleTitle")}</Typography.Title>
                <Typography.Paragraph type="secondary" style={{ fontSize: 13 }}>
                    {t("apiKeys.exampleText")}
                </Typography.Paragraph>
                <Typography.Paragraph copyable={{ text: ciExample() }}>
                    <pre style={{ margin: 0, maxHeight: 320, overflow: "auto", fontSize: 12 }}>{ciExample()}</pre>
                </Typography.Paragraph>
            </Modal>
        </Card>
    );
}
