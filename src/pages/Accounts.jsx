import { useState } from "react";
import { App, Avatar, Button, Card, Flex, Input, Switch, Table, Tag, Tooltip, Typography } from "antd";
import { SearchOutlined, StopOutlined, UndoOutlined } from "@ant-design/icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/api";
import PageHeader from "@/components/PageHeader";
import { usePrompt } from "@/components/review/usePrompt";
import { useI18n } from "@/i18n";
import { formatDate, formatDateTime, formatNumber } from "@/lib/format";
import { useApiError } from "@/lib/useApiError";

/** Membres d'un compte (ligne dépliée) : l'administrateur peut suspendre l'accès d'un membre. */
function AccountMembers({ account }) {
    const { t } = useI18n();
    const { message } = App.useApp();
    const onError = useApiError();
    const queryClient = useQueryClient();
    const { data = [], isLoading } = useQuery({ queryKey: ["members", account.id], queryFn: () => api.members(account.id) });
    const update = useMutation({
        mutationFn: ({ id, active }) => api.updateMember(id, { active }),
        onSuccess: (m) => {
            queryClient.invalidateQueries({ queryKey: ["members", account.id] });
            message.success(m.active ? t("team.activatedMsg", { name: m.name }) : t("team.deactivatedMsg", { name: m.name }));
        },
        onError,
    });
    return (
        <Table
            rowKey="id"
            size="small"
            loading={isLoading}
            dataSource={data}
            pagination={false}
            columns={[
                {
                    title: t("team.columns.member"),
                    key: "m",
                    render: (_, m) => (
                        <span>
                            <Typography.Text strong>{m.name}</Typography.Text> <Typography.Text type="secondary">{m.email}</Typography.Text>
                            {!m.email_verified && (
                                <Tag color="warning" style={{ marginLeft: 8 }}>
                                    {t("accounts.unverified")}
                                </Tag>
                            )}
                        </span>
                    ),
                },
                { title: t("team.columns.role"), dataIndex: "role", render: (r) => <Tag>{t(`roles.${r}`)}</Tag> },
                { title: t("team.columns.lastLogin"), dataIndex: "last_login_at", render: formatDateTime },
                {
                    title: t("accounts.access"),
                    key: "active",
                    render: (_, m) =>
                        m.role === "admin" ? "—" : <Switch size="small" checked={m.active} onChange={(active) => update.mutate({ id: m.id, active })} />,
                },
            ]}
        />
    );
}

/** Administrateur de la plateforme : tous les comptes développeurs inscrits. */
export default function Accounts() {
    const { t } = useI18n();
    const { message, modal } = App.useApp();
    const onError = useApiError();
    const prompt = usePrompt();
    const queryClient = useQueryClient();
    const [q, setQ] = useState("");

    // Suspension d'un compte entier : apps retirées du store, membres déconnectés, propriétaire prévenu par e-mail
    const setSuspended = (account, suspended, reason) =>
        api
            .suspendAccount(account.id, suspended, reason)
            .then(() => {
                queryClient.invalidateQueries({ queryKey: ["accounts"] });
                queryClient.invalidateQueries({ queryKey: ["apps"] });
                message.success(t(suspended ? "accounts.suspended" : "accounts.reactivated", { name: account.name }));
            })
            .catch(onError);
    const suspend = (account) =>
        prompt({
            title: t("accounts.suspendTitle", { name: account.name }),
            text: t("accounts.suspendText"),
            label: t("review.reason"),
            placeholder: t("accounts.reasonPlaceholder"),
            okText: t("accounts.suspend"),
            danger: true,
            onOk: (reason) => setSuspended(account, true, reason),
        });
    const reactivate = (account) =>
        modal.confirm({
            title: t("accounts.reactivateTitle", { name: account.name }),
            content: t("accounts.reactivateText"),
            okText: t("accounts.reactivate"),
            onOk: () => setSuspended(account, false),
        });
    const { data = [], isLoading } = useQuery({ queryKey: ["accounts"], queryFn: api.accounts });
    const rows = data.filter((a) => !q || `${a.name} ${a.owner?.name} ${a.owner?.email}`.toLowerCase().includes(q.toLowerCase()));

    return (
        <>
            <PageHeader title={t("accounts.title")} subtitle={t("accounts.subtitle", { count: data.length })} />
            <Card styles={{ body: { padding: 0 } }}>
                <div style={{ padding: 16 }}>
                    <Input allowClear prefix={<SearchOutlined />} placeholder={t("accounts.search")} style={{ maxWidth: 320 }} onChange={(e) => setQ(e.target.value)} />
                </div>
                <Table
                    rowKey="id"
                    loading={isLoading}
                    dataSource={rows}
                    expandable={{ expandedRowRender: (a) => <AccountMembers account={a} /> }}
                    scroll={{ x: "max-content" }}
                    columns={[
                        {
                            title: t("accounts.columns.account"),
                            key: "account",
                            render: (_, a) => (
                                <Flex align="center" gap={12}>
                                    <Avatar shape="square" style={{ background: a.platform ? "var(--ant-color-primary)" : "#8B3CE8" }}>
                                        {a.name[0]?.toUpperCase()}
                                    </Avatar>
                                    <Typography.Text strong>{a.name}</Typography.Text>
                                    {a.platform && <Tag color="blue">{t("accounts.platform")}</Tag>}
                                </Flex>
                            ),
                        },
                        {
                            title: t("accounts.columns.owner"),
                            key: "owner",
                            render: (_, a) => (
                                <div>
                                    <Typography.Text>{a.owner?.name ?? "—"}</Typography.Text>
                                    <Typography.Text type="secondary" style={{ display: "block", fontSize: 12 }}>
                                        {a.owner?.email}
                                        {!a.owner_verified && (
                                            <Tag color="warning" style={{ marginLeft: 6 }}>
                                                {t("accounts.unverified")}
                                            </Tag>
                                        )}
                                    </Typography.Text>
                                </div>
                            ),
                        },
                        { title: t("accounts.columns.members"), dataIndex: "members_count", align: "right", render: formatNumber },
                        { title: t("accounts.columns.apps"), dataIndex: "apps_count", align: "right", render: formatNumber },
                        { title: t("accounts.columns.created"), dataIndex: "created_at", render: formatDate, responsive: ["lg"] },
                        {
                            title: t("accounts.columns.state"),
                            key: "state",
                            render: (_, a) =>
                                a.suspended ? (
                                    <Tooltip title={a.suspension_reason ? `${t("review.reason")} : ${a.suspension_reason}` : undefined}>
                                        <Tag color="error" icon={<StopOutlined />}>
                                            {t("accounts.stateSuspended")}
                                        </Tag>
                                    </Tooltip>
                                ) : (
                                    <Tag color="success">{t("accounts.stateActive")}</Tag>
                                ),
                        },
                        {
                            key: "actions",
                            align: "right",
                            render: (_, a) =>
                                a.platform ? null : a.suspended ? (
                                    <Button size="small" icon={<UndoOutlined />} onClick={() => reactivate(a)}>
                                        {t("accounts.reactivate")}
                                    </Button>
                                ) : (
                                    <Button size="small" danger icon={<StopOutlined />} onClick={() => suspend(a)}>
                                        {t("accounts.suspend")}
                                    </Button>
                                ),
                        },
                    ]}
                />
            </Card>
        </>
    );
}
