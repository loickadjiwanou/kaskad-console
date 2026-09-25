import { useState } from "react";
import { App, Badge, Button, Card, Checkbox, Flex, Form, Input, Modal, Segmented, Select, Table, Typography } from "antd";
import { PlusOutlined, SearchOutlined } from "@ant-design/icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { api } from "@/api";
import { useAuth } from "@/auth/AuthContext";
import AppIcon from "@/components/AppIcon";
import PageHeader from "@/components/PageHeader";
import { AppStatusTag, PlatformIcons } from "@/components/Tags";
import { useI18n } from "@/i18n";
import { formatDate, formatNumber, PLATFORMS } from "@/lib/format";
import { useApiError } from "@/lib/useApiError";

export function CreateAppModal({ open, onClose }) {
    const { t } = useI18n();
    const { message } = App.useApp();
    const onError = useApiError();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [form] = Form.useForm();
    const { data: categories } = useQuery({ queryKey: ["categories"], queryFn: api.categories });
    const create = useMutation({
        mutationFn: api.createApp,
        onSuccess: (app) => {
            queryClient.invalidateQueries({ queryKey: ["apps"] });
            message.success(t("apps.created"));
            onClose();
            form.resetFields();
            navigate(`/apps/${app.id}`);
        },
        onError,
    });
    return (
        <Modal title={t("apps.new")} open={open} onCancel={onClose} onOk={() => form.submit()} okText={t("common.create")} confirmLoading={create.isPending} destroyOnHidden>
            <Form form={form} layout="vertical" onFinish={(v) => create.mutate(v)} requiredMark="optional">
                <Form.Item name="name" label={t("apps.fields.name")} rules={[{ required: true, whitespace: true }]}>
                    <Input maxLength={120} autoFocus />
                </Form.Item>
                <Form.Item name="short_description" label={t("apps.fields.short")} rules={[{ required: true, whitespace: true }]}>
                    <Input maxLength={200} showCount />
                </Form.Item>
                <Form.Item name="category_ids" label={t("apps.fields.categories")}>
                    <Select mode="multiple" options={(categories ?? []).map((c) => ({ value: c.id, label: c.name }))} />
                </Form.Item>
                <Form.Item name="target_platforms" label={t("apps.fields.platforms")}>
                    <Checkbox.Group options={PLATFORMS.map((p) => ({ value: p.id, label: p.label }))} />
                </Form.Item>
            </Form>
        </Modal>
    );
}

export default function AppsList() {
    const { t } = useI18n();
    const { canWrite, isFullAdmin } = useAuth();
    const navigate = useNavigate();
    const [status, setStatus] = useState("all");
    const [q, setQ] = useState("");
    const [category, setCategory] = useState();
    const [page, setPage] = useState(1);
    const [creating, setCreating] = useState(false);

    const params = { status: status === "all" ? undefined : status, q: q || undefined, category_id: category, page, limit: 20 };
    const { data, isLoading } = useQuery({ queryKey: ["apps", params], queryFn: () => api.apps(params), placeholderData: (prev) => prev });
    const { data: categories } = useQuery({ queryKey: ["categories"], queryFn: api.categories });
    const catName = Object.fromEntries((categories ?? []).map((c) => [c.id, c.name]));

    const columns = [
        {
            title: t("apps.columns.app"),
            key: "app",
            render: (_, a) => (
                <Flex align="center" gap={12}>
                    <AppIcon app={a} size={40} />
                    <div style={{ minWidth: 0 }}>
                        <Typography.Text strong>{a.name}</Typography.Text>
                        <Typography.Text type="secondary" ellipsis style={{ display: "block", maxWidth: 360, fontSize: 13 }}>
                            {a.short_description}
                        </Typography.Text>
                    </div>
                </Flex>
            ),
        },
        ...(isFullAdmin ? [{ title: t("apps.columns.account"), dataIndex: "account_name", render: (n) => n ?? "—" }] : []),
        { title: t("apps.columns.status"), dataIndex: "status", width: 130, render: (s) => <AppStatusTag status={s} /> },
        {
            title: t("apps.columns.platforms"),
            key: "platforms",
            width: 150,
            render: (_, a) => <PlatformIcons platforms={a.available_platforms?.length ? a.available_platforms : a.target_platforms} />,
        },
        {
            title: t("apps.columns.categories"),
            dataIndex: "category_ids",
            responsive: ["xl"],
            render: (ids) => ids.map((id) => catName[id]).filter(Boolean).join(", ") || "—",
        },
        { title: t("apps.columns.latest"), dataIndex: "latest_version_name", width: 110, render: (v) => (v ? `v${v}` : "—") },
        { title: t("apps.columns.downloads"), dataIndex: "downloads_count", width: 140, align: "right", render: formatNumber },
        {
            title: t("apps.columns.pending"),
            dataIndex: "pending_versions",
            width: 120,
            align: "center",
            render: (n) => (n ? <Badge count={n} color="var(--ant-color-primary)" /> : "—"),
        },
        { title: t("apps.columns.updated"), dataIndex: "updated_at", width: 140, responsive: ["lg"], render: formatDate },
    ];

    return (
        <>
            <PageHeader
                title={t("apps.title")}
                subtitle={t("apps.subtitle")}
                extra={
                    canWrite && (
                        <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreating(true)}>
                            {t("apps.new")}
                        </Button>
                    )
                }
            />
            <Card styles={{ body: { padding: 0 } }}>
                <Flex gap={12} wrap align="center" style={{ padding: 16 }}>
                    <Segmented
                        value={status}
                        onChange={(v) => {
                            setStatus(v);
                            setPage(1);
                        }}
                        options={["all", "published", "draft", "archived"].map((s) => ({ value: s, label: t(`apps.filters.${s}`) }))}
                    />
                    <Input
                        allowClear
                        prefix={<SearchOutlined />}
                        placeholder={t("apps.search")}
                        style={{ maxWidth: 280 }}
                        onChange={(e) => {
                            setQ(e.target.value);
                            setPage(1);
                        }}
                    />
                    <Select
                        allowClear
                        placeholder={t("apps.allCategories")}
                        style={{ minWidth: 200 }}
                        value={category}
                        onChange={(v) => {
                            setCategory(v);
                            setPage(1);
                        }}
                        options={(categories ?? []).map((c) => ({ value: c.id, label: c.name }))}
                    />
                </Flex>
                <Table
                    rowKey="id"
                    columns={columns}
                    dataSource={data?.items}
                    loading={isLoading}
                    rowClassName="kaskad-clickable-row"
                    onRow={(a) => ({ onClick: () => navigate(`/apps/${a.id}`) })}
                    scroll={{ x: 900 }}
                    pagination={{ current: page, pageSize: 20, total: data?.total, onChange: setPage, showSizeChanger: false, hideOnSinglePage: true }}
                    locale={{ emptyText: t("apps.empty") }}
                />
            </Card>
            <CreateAppModal open={creating} onClose={() => setCreating(false)} />
        </>
    );
}
