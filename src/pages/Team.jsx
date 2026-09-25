import { useState } from "react";
import { Alert, App, Avatar, Button, Card, Flex, Form, Input, Modal, Popconfirm, Radio, Select, Switch, Table, Tag, Tooltip, Typography } from "antd";
import { DeleteOutlined, EditOutlined, MailOutlined, SendOutlined, UserAddOutlined } from "@ant-design/icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/api";
import { useAuth } from "@/auth/AuthContext";
import ApiKeysCard from "@/components/ApiKeysCard";
import PageHeader from "@/components/PageHeader";
import { useI18n } from "@/i18n";
import { formatDate, formatDateTime } from "@/lib/format";
import { useApiError } from "@/lib/useApiError";

const INVITABLE = ["developer", "viewer"];

/** Choix du rôle (contrôlé par Form.Item : value / onChange). */
function RolePicker({ value, onChange }) {
    const { t } = useI18n();
    return (
        <Radio.Group style={{ width: "100%" }} value={value} onChange={onChange}>
            <Flex vertical gap={10}>
                {INVITABLE.map((r) => (
                    <Radio key={r} value={r}>
                        <Typography.Text strong>{t(`roles.${r}`)}</Typography.Text>
                        <Typography.Text type="secondary" style={{ display: "block", fontSize: 12 }}>
                            {t(`team.roleHelp.${r}`)}
                        </Typography.Text>
                    </Radio>
                ))}
            </Flex>
        </Radio.Group>
    );
}

/** Invitation d'un membre : un e-mail lui est envoyé dans la langue actuelle de la console. */
function InviteModal({ open, onClose }) {
    const { t, lang } = useI18n();
    const { message } = App.useApp();
    const onError = useApiError();
    const queryClient = useQueryClient();
    const [form] = Form.useForm();
    const send = useMutation({
        mutationFn: ({ email, role }) => api.invite(email.trim().toLowerCase(), role),
        onSuccess: (inv) => {
            queryClient.invalidateQueries({ queryKey: ["invitations"] });
            message.success(t("team.invited", { email: inv.email }));
            form.resetFields();
            onClose();
        },
        onError,
    });
    return (
        <Modal
            open={open}
            onCancel={onClose}
            title={t("team.invite")}
            okText={t("team.sendInvite")}
            okButtonProps={{ icon: <SendOutlined /> }}
            onOk={() => form.submit()}
            confirmLoading={send.isPending}
            destroyOnHidden
        >
            <Typography.Paragraph type="secondary" style={{ marginTop: 8 }}>
                {t("team.inviteText", { language: lang === "fr" ? "français" : "English" })}
            </Typography.Paragraph>
            <Form form={form} layout="vertical" initialValues={{ role: "developer" }} onFinish={(v) => send.mutate(v)} requiredMark={false}>
                <Form.Item name="email" label={t("team.fields.email")} rules={[{ required: true, type: "email", message: t("login.emailInvalid") }]}>
                    <Input prefix={<MailOutlined />} autoFocus autoComplete="off" />
                </Form.Item>
                <Form.Item name="role" label={t("team.fields.role")}>
                    <RolePicker />
                </Form.Item>
            </Form>
        </Modal>
    );
}

function RenameModal({ open, account, onClose }) {
    const { t } = useI18n();
    const { message } = App.useApp();
    const onError = useApiError();
    const { admin, setAdmin } = useAuth();
    const save = useMutation({
        mutationFn: ({ name }) => api.renameAccount(name.trim()),
        onSuccess: (acc) => {
            setAdmin({ ...admin, account: acc });
            message.success(t("common.saved"));
            onClose();
        },
        onError,
    });
    return (
        <Modal open={open} onCancel={onClose} title={t("team.renameAccount")} footer={null} destroyOnHidden>
            <Form layout="vertical" initialValues={{ name: account?.name }} onFinish={(v) => save.mutate(v)} style={{ marginTop: 16 }}>
                <Form.Item name="name" label={t("signup.accountName")} rules={[{ required: true, whitespace: true, min: 2 }]}>
                    <Input maxLength={80} autoFocus />
                </Form.Item>
                <Flex justify="flex-end" gap={8}>
                    <Button onClick={onClose}>{t("common.cancel")}</Button>
                    <Button type="primary" htmlType="submit" loading={save.isPending}>
                        {t("common.save")}
                    </Button>
                </Flex>
            </Form>
        </Modal>
    );
}

/** Équipe du compte développeur : membres (rôles, accès) et invitations en attente. Réservé au propriétaire. */
export default function Team() {
    const { t } = useI18n();
    const { admin: me, account, isFullAdmin, setAdmin } = useAuth();
    const { message, modal } = App.useApp();
    const onError = useApiError();
    const queryClient = useQueryClient();
    const [inviting, setInviting] = useState(false);
    const [renaming, setRenaming] = useState(false);

    const { data: members = [], isLoading } = useQuery({ queryKey: ["members"], queryFn: () => api.members() });
    const { data: invitations = [], isLoading: loadingInv } = useQuery({ queryKey: ["invitations"], queryFn: api.invitations });

    const update = useMutation({
        mutationFn: ({ id, body }) => api.updateMember(id, body),
        onSuccess: (m, { body }) => {
            queryClient.invalidateQueries({ queryKey: ["members"] });
            if (body.role) message.success(t("team.roleChanged", { name: m.name, role: t(`roles.${m.role}`) }));
            else message.success(m.active ? t("team.activatedMsg", { name: m.name }) : t("team.deactivatedMsg", { name: m.name }));
        },
        onError,
    });
    const resend = useMutation({
        mutationFn: api.resendInvitation,
        onSuccess: (inv) => {
            queryClient.invalidateQueries({ queryKey: ["invitations"] });
            message.success(t("team.invited", { email: inv.email }));
        },
        onError,
    });
    const revoke = useMutation({
        mutationFn: api.revokeInvitation,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["invitations"] });
            message.success(t("team.revoked"));
        },
        onError,
    });

    // Double authentification : réinitialisation (appareil perdu) et obligation pour tout le compte
    const resetMfa = useMutation({
        mutationFn: api.resetMemberMfa,
        onSuccess: (m) => {
            queryClient.invalidateQueries({ queryKey: ["members"] });
            message.success(t("mfa.resetDone", { name: m.name }));
        },
        onError,
    });
    const require2fa = useMutation({
        mutationFn: api.setRequire2fa,
        onSuccess: (acc) => {
            setAdmin({ ...me, account: acc });
            message.success(acc.require_2fa ? t("mfa.requireOn") : t("mfa.requireOff"));
        },
        onError,
    });
    const canResetMfa = (m) => m.mfa_enabled && m.id !== me?.id && m.role !== "admin" && (m.role !== "owner" || isFullAdmin);
    const withoutMfa = members.filter((m) => m.active && !m.mfa_enabled).length;

    const editable = (m) => INVITABLE.includes(m.role) && m.id !== me?.id;
    const setActive = (m, active) =>
        active
            ? update.mutate({ id: m.id, body: { active } })
            : modal.confirm({
                  title: t("team.deactivateTitle", { name: m.name }),
                  content: t("team.deactivateText"),
                  okText: t("team.deactivate"),
                  okButtonProps: { danger: true },
                  onOk: () => update.mutateAsync({ id: m.id, body: { active } }).catch(() => {}),
              });

    const memberColumns = [
        {
            title: t("team.columns.member"),
            key: "member",
            render: (_, m) => (
                <Flex align="center" gap={12}>
                    <Avatar style={{ background: m.active ? "var(--ant-color-primary)" : undefined }}>{m.name?.[0]?.toUpperCase()}</Avatar>
                    <div>
                        <Typography.Text strong>
                            {m.name} {m.id === me?.id && <Tag style={{ marginLeft: 4 }}>{t("team.you")}</Tag>}
                        </Typography.Text>
                        <Typography.Text type="secondary" style={{ display: "block", fontSize: 12 }}>
                            {m.email}
                        </Typography.Text>
                    </div>
                </Flex>
            ),
        },
        {
            title: t("team.columns.role"),
            key: "role",
            render: (_, m) =>
                editable(m) ? (
                    <Select
                        size="small"
                        value={m.role}
                        style={{ width: 150 }}
                        onChange={(role) => update.mutate({ id: m.id, body: { role } })}
                        options={INVITABLE.map((r) => ({ value: r, label: t(`roles.${r}`) }))}
                    />
                ) : (
                    <Tag color={m.role === "admin" ? "purple" : "blue"}>{t(`roles.${m.role}`)}</Tag>
                ),
        },
        {
            title: t("team.columns.active"),
            key: "active",
            render: (_, m) =>
                editable(m) ? <Switch checked={m.active} onChange={(v) => setActive(m, v)} /> : <Typography.Text type="secondary">—</Typography.Text>,
        },
        {
            title: t("mfa.column"),
            key: "mfa",
            render: (_, m) => (
                <Flex gap={6} align="center">
                    {m.mfa_enabled ? <Tag color="green">{t("mfa.on")}</Tag> : <Tag>{t("mfa.off")}</Tag>}
                    {canResetMfa(m) && (
                        <Popconfirm
                            title={t("mfa.resetTitle", { name: m.name })}
                            description={<div style={{ maxWidth: 300 }}>{t("mfa.resetText")}</div>}
                            okText={t("mfa.reset")}
                            okButtonProps={{ danger: true }}
                            onConfirm={() => resetMfa.mutate(m.id)}
                        >
                            <Button size="small" type="link" danger>
                                {t("mfa.reset")}
                            </Button>
                        </Popconfirm>
                    )}
                </Flex>
            ),
        },
        { title: t("team.columns.lastLogin"), dataIndex: "last_login_at", render: formatDateTime, responsive: ["lg"] },
        { title: t("team.columns.since"), dataIndex: "created_at", render: formatDate, responsive: ["md"] },
    ];

    const invitationColumns = [
        { title: t("team.fields.email"), dataIndex: "email", render: (e) => <Typography.Text strong>{e}</Typography.Text> },
        { title: t("team.columns.role"), dataIndex: "role", render: (r) => <Tag>{t(`roles.${r}`)}</Tag> },
        { title: t("team.columns.invitedBy"), dataIndex: "invited_by_name", responsive: ["md"] },
        {
            title: t("team.columns.expires"),
            key: "expires",
            render: (_, i) => (i.expired ? <Tag color="error">{t("team.expired")}</Tag> : formatDateTime(i.expires_at)),
        },
        {
            key: "actions",
            align: "right",
            render: (_, i) => (
                <Flex gap={6} justify="flex-end">
                    <Button size="small" icon={<SendOutlined />} loading={resend.isPending && resend.variables === i.id} onClick={() => resend.mutate(i.id)}>
                        {t("team.resend")}
                    </Button>
                    <Popconfirm title={t("team.revokeConfirm")} okButtonProps={{ danger: true }} onConfirm={() => revoke.mutate(i.id)}>
                        <Button size="small" danger icon={<DeleteOutlined />} aria-label={t("team.revoke")} />
                    </Popconfirm>
                </Flex>
            ),
        },
    ];

    return (
        <>
            <PageHeader
                title={t("team.title")}
                subtitle={t("team.subtitle", { account: account?.name ?? "" })}
                extra={
                    <>
                        <Button icon={<EditOutlined />} onClick={() => setRenaming(true)}>
                            {t("team.renameAccount")}
                        </Button>
                        <Button type="primary" icon={<UserAddOutlined />} onClick={() => setInviting(true)}>
                            {t("team.invite")}
                        </Button>
                    </>
                }
            />
            <Card title={t("mfa.teamTitle")} style={{ marginBottom: 16 }}>
                <Flex justify="space-between" align="flex-start" gap={16}>
                    <div>
                        <Typography.Text strong>{t("mfa.requireLabel")}</Typography.Text>
                        <Typography.Paragraph type="secondary" style={{ margin: "4px 0 0" }}>
                            {t("mfa.requireHelp")}
                        </Typography.Paragraph>
                    </div>
                    <Tooltip title={!me?.mfa_enabled && !account?.require_2fa ? t("mfa.requireFirst") : undefined}>
                        <Switch
                            checked={!!account?.require_2fa}
                            loading={require2fa.isPending}
                            disabled={!me?.mfa_enabled && !account?.require_2fa}
                            onChange={(v) => require2fa.mutate(v)}
                            aria-label={t("mfa.requireLabel")}
                        />
                    </Tooltip>
                </Flex>
                {account?.require_2fa && withoutMfa > 0 && (
                    <Alert type="info" showIcon style={{ marginTop: 12 }} title={t("mfa.pendingMembers", { count: withoutMfa })} />
                )}
            </Card>
            <Card title={t("team.members", { count: members.length })} styles={{ body: { padding: 0 } }} style={{ marginBottom: 16 }}>
                <Table rowKey="id" loading={isLoading} dataSource={members} columns={memberColumns} pagination={false} scroll={{ x: "max-content" }} />
            </Card>
            <Card title={t("team.pendingInvitations", { count: invitations.length })} styles={{ body: { padding: 0 } }}>
                <Table
                    rowKey="id"
                    loading={loadingInv}
                    dataSource={invitations}
                    columns={invitationColumns}
                    pagination={false}
                    locale={{ emptyText: t("team.noInvitations") }}
                    scroll={{ x: "max-content" }}
                />
            </Card>
            <ApiKeysCard />
            <InviteModal open={inviting} onClose={() => setInviting(false)} />
            <RenameModal open={renaming} account={account} onClose={() => setRenaming(false)} />
        </>
    );
}
