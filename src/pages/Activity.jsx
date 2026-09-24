import { useState } from "react";
import { Avatar, Card, Flex, Select, Table, Tag, Typography } from "antd";
import { RobotOutlined } from "@ant-design/icons";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { api } from "@/api";
import { useAuth } from "@/auth/AuthContext";
import PageHeader from "@/components/PageHeader";
import { useI18n } from "@/i18n";
import { formatDateTime } from "@/lib/format";

const ACTION_COLORS = { app: "blue", version: "purple", category: "cyan", admin: "gold" };
const FILTERS = ["app", "version", "category", "admin"];

/** Résumé lisible des détails d'une entrée du journal. */
function Details({ entry }) {
    const { t } = useI18n();
    const d = entry.details ?? {};
    const parts = [];
    if (d.name) parts.push(d.name);
    if (d.app) parts.push(d.app);
    if (d.version) parts.push(`v${d.version}`);
    if (d.format) parts.push(String(d.format).toUpperCase());
    if (d.email) parts.push(d.email);
    if (d.role) parts.push(t(`roles.${d.role}`));
    if (d.from) parts.push(`${t(`status.app.${d.from}`)} →`);
    if (d.status) parts.push(t(`review.status.target.${d.status}`));
    if (d.requested_by) parts.push(t("activity.requestedBy", { name: d.requested_by }));
    if (d.draft) parts.push(t("activity.inDraft"));
    if (d.reason) parts.push(`${t("review.reason")} : ${d.reason}`);
    if (Array.isArray(d.fields) && d.fields.length) parts.push(d.fields.join(", "));
    if (d.count != null) parts.push(`× ${d.count}`);
    if (d.moved != null) parts.push(t("activity.moved", { count: d.moved }));
    if (d.active === false) parts.push(t("team.deactivated"));
    if (d.active === true) parts.push(t("team.activated"));
    if (Array.isArray(d.errors) && d.errors.length) parts.push(d.errors[0]);
    const text = parts.join(" · ");
    const link = entry.target_type === "app" && entry.target_id ? `/apps/${entry.target_id}` : null;
    if (!text) return <Typography.Text type="secondary">—</Typography.Text>;
    return link ? <Link to={link}>{text}</Link> : <Typography.Text ellipsis={{ tooltip: text }} style={{ maxWidth: 420 }}>{text}</Typography.Text>;
}

/** Journal d'activité : qui a fait quoi, quand. */
export default function Activity() {
    const { t, lang } = useI18n();
    const { isFullAdmin } = useAuth();
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(50);
    const [action, setAction] = useState(null);
    const [actor, setActor] = useState(null);

    const { data, isLoading } = useQuery({
        queryKey: ["activity", page, limit, action, actor],
        queryFn: () => api.activity({ page, limit, action, actor_id: actor }),
        placeholderData: (prev) => prev,
    });
    const { data: admins } = useQuery({ queryKey: ["admins"], queryFn: api.admins, enabled: isFullAdmin });

    const label = (a) => {
        const key = `activity.actions.${a.replace(/\./g, "_")}`;
        const text = t(key);
        return text === key ? a : text;
    };

    const columns = [
        { title: t("activity.columns.date"), dataIndex: "created_at", width: 190, render: formatDateTime },
        {
            title: t("activity.columns.actor"),
            key: "actor",
            render: (_, e) => (
                <Flex align="center" gap={10}>
                    {e.actor_id ? (
                        <Avatar size={28} style={{ background: "var(--ant-color-primary)", flexShrink: 0 }}>
                            {(e.actor_name || e.actor_email || "?")[0].toUpperCase()}
                        </Avatar>
                    ) : (
                        <Avatar size={28} icon={<RobotOutlined />} style={{ flexShrink: 0 }} />
                    )}
                    <div style={{ minWidth: 0 }}>
                        <Typography.Text>{e.actor_id ? e.actor_name : t("activity.system")}</Typography.Text>
                        {e.actor_id && (
                            <Typography.Text type="secondary" style={{ display: "block", fontSize: 12 }}>
                                {e.actor_email}
                            </Typography.Text>
                        )}
                    </div>
                </Flex>
            ),
        },
        {
            title: t("activity.columns.action"),
            dataIndex: "action",
            render: (a) => <Tag color={ACTION_COLORS[a.split(".")[0]]}>{label(a)}</Tag>,
        },
        { title: t("activity.columns.details"), key: "details", render: (_, e) => <Details entry={e} /> },
    ];

    return (
        <>
            <PageHeader title={t("activity.title")} subtitle={t("activity.subtitle")} />
            <Card styles={{ body: { padding: 0 } }}>
                <Flex gap={12} wrap style={{ padding: 16 }}>
                    <Select
                        allowClear
                        placeholder={t("activity.allActions")}
                        value={action}
                        onChange={(v) => {
                            setAction(v ?? null);
                            setPage(1);
                        }}
                        style={{ minWidth: 200 }}
                        options={FILTERS.map((f) => ({ value: `${f}.`, label: t(`activity.filters.${f}`) }))}
                    />
                    {isFullAdmin && (
                        <Select
                            allowClear
                            placeholder={t("activity.allMembers")}
                            value={actor}
                            onChange={(v) => {
                                setActor(v ?? null);
                                setPage(1);
                            }}
                            style={{ minWidth: 220 }}
                            options={(admins ?? []).map((a) => ({ value: a.id, label: a.name }))}
                        />
                    )}
                </Flex>
                <Table
                    key={lang}
                    rowKey="id"
                    loading={isLoading}
                    dataSource={data?.items ?? []}
                    columns={columns}
                    scroll={{ x: "max-content" }}
                    pagination={{
                        current: page,
                        pageSize: limit,
                        total: data?.total ?? 0,
                        showSizeChanger: true,
                        pageSizeOptions: [25, 50, 100, 200],
                        onChange: (p, size) => {
                            setPage(size !== limit ? 1 : p);
                            setLimit(size);
                        },
                        showTotal: (n) => t("activity.total", { count: n }),
                    }}
                />
            </Card>
        </>
    );
}
