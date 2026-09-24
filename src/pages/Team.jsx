import { useEffect, useState } from "react";
import { App, Avatar, Button, Card, Flex, Form, Input, Modal, Radio, Switch, Table, Tag, Typography } from "antd";
import { KeyOutlined, PlusOutlined, UserOutlined } from "@ant-design/icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/api";
import { useAuth } from "@/auth/AuthContext";
import PageHeader from "@/components/PageHeader";
import { useI18n } from "@/i18n";
import { formatDate } from "@/lib/format";
import { useApiError } from "@/lib/useApiError";

function RoleField() {
    const { t } = useI18n();
    return (
        <Form.Item name="role" label={t("team.fields.role")} rules={[{ required: true }]}>
            <Radio.Group style={{ width: "100%" }}>
                <Flex vertical gap={8}>
                    {["admin", "editor"].map((r) => (
                        <Radio key={r} value={r}>
                            <Typography.Text strong>{t(`roles.${r}`)}</Typography.Text>
                            <Typography.Text type="secondary" style={{ display: "block", fontSize: 12 }}>
                                {t(`team.roleHelp.${r}`)}
                            </Typography.Text>
                        </Radio>
                    ))}
                </Flex>
            </Radio.Group>
        </Form.Item>
    );
}

/** Création d'un membre ou modification (nom, rôle, mot de passe). */
function MemberModal({ member, open, onClose }) {
    const { t } = useI18n();
    const { message } = App.useApp();
    const onError = useApiError();
    const queryClient = useQueryClient();
    const [form] = Form.useForm();
    const creating = !member;

    useEffect(() => {
        if (open) form.setFieldsValue(member ? { name: member.name, role: member.role, password: "" } : { role: "editor" });
    }, [open, member, form]);

    const save = useMutation({
        mutationFn: ({ password, ...values }) =>
            creating ? api.createAdmin({ ...values, password }) : api.updateAdmin(member.id, { name: values.name, role: values.role, password: password || undefined }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admins"] });
            message.success(creating ? t("team.created") : t("common.saved"));
            onClose();
        },
        onError,
    });

    return (
        <Modal
            open={open}
            onCancel={onClose}
            title={creating ? t("team.new") : t("team.edit", { name: member.name })}
            okText={creating ? t("common.create") : t("common.save")}
            onOk={() => form.submit()}
            confirmLoading={save.isPending}
            destroyOnHidden
        >
            <Form form={form} layout="vertical" onFinish={(v) => save.mutate(v)} style={{ marginTop: 16 }} autoComplete="off">
                <Form.Item name="name" label={t("team.fields.name")} rules={[{ required: true, whitespace: true }]}>
                    <Input maxLength={100} />
                </Form.Item>
                {creating && (
                    <Form.Item name="email" label={t("team.fields.email")} rules={[{ required: true, type: "email", message: t("login.emailInvalid") }]}>
                        <Input autoComplete="off" />
                    </Form.Item>
                )}
                <Form.Item
                    name="password"
                    label={creating ? t("team.fields.password") : t("team.fields.newPassword")}
                    extra={creating ? t("team.passwordHelp") : t("team.resetHelp")}
                    rules={[{ required: creating }, { min: 8, message: t("account.passwordMin") }]}
                >
                    <Input.Password autoComplete="new-password" />
                </Form.Item>
                <RoleField />
            </Form>
        </Modal>
    );
}

/** Équipe : comptes administrateurs (admin complet / éditeur de contenu), réservé aux admins complets. */
export default function Team() {
    const { t } = useI18n();
    const { admin: me } = useAuth();
    const { message, modal } = App.useApp();
    const onError = useApiError();
    const queryClient = useQueryClient();
    const [editing, setEditing] = useState(null); // null fermé, {} nouveau, membre sinon
    const { data: admins = [], isLoading } = useQuery({ queryKey: ["admins"], queryFn: api.admins });

    const toggle = useMutation({
        mutationFn: ({ id, active }) => api.updateAdmin(id, { active }),
        onSuccess: (a) => {
            queryClient.invalidateQueries({ queryKey: ["admins"] });
            message.success(a.active ? t("team.activatedMsg", { name: a.name }) : t("team.deactivatedMsg", { name: a.name }));
        },
        onError,
    });

    const setActive = (a, active) =>
        active
            ? toggle.mutate({ id: a.id, active })
            : modal.confirm({
                  title: t("team.deactivateTitle", { name: a.name }),
                  content: t("team.deactivateText"),
                  okText: t("team.deactivate"),
                  okButtonProps: { danger: true },
                  onOk: () => toggle.mutateAsync({ id: a.id, active }),
              });

    const columns = [
        {
            title: t("team.columns.member"),
            key: "member",
            render: (_, a) => (
                <Flex align="center" gap={12}>
                    <Avatar style={{ background: a.active ? "var(--ant-color-primary)" : undefined }} icon={!a.name && <UserOutlined />}>
                        {a.name?.[0]?.toUpperCase()}
                    </Avatar>
                    <div>
                        <Typography.Text strong>
                            {a.name} {a.id === me?.id && <Tag style={{ marginLeft: 4 }}>{t("team.you")}</Tag>}
                        </Typography.Text>
                        <Typography.Text type="secondary" style={{ display: "block", fontSize: 12 }}>
                            {a.email}
                        </Typography.Text>
                    </div>
                </Flex>
            ),
        },
        { title: t("team.columns.role"), dataIndex: "role", render: (r) => <Tag color={r === "admin" ? "blue" : "default"}>{t(`roles.${r}`)}</Tag> },
        {
            title: t("team.columns.active"),
            key: "active",
            render: (_, a) => (
                <Switch
                    checked={a.active}
                    disabled={a.id === me?.id}
                    loading={toggle.isPending && toggle.variables?.id === a.id}
                    onChange={(v) => setActive(a, v)}
                />
            ),
        },
        { title: t("team.columns.since"), dataIndex: "created_at", render: formatDate, responsive: ["md"] },
        {
            key: "edit",
            align: "right",
            render: (_, a) => (
                <Button size="small" icon={<KeyOutlined />} onClick={() => setEditing(a)}>
                    {t("common.edit")}
                </Button>
            ),
        },
    ];

    return (
        <>
            <PageHeader
                title={t("team.title")}
                subtitle={t("team.subtitle")}
                extra={
                    <Button type="primary" icon={<PlusOutlined />} onClick={() => setEditing({})}>
                        {t("team.new")}
                    </Button>
                }
            />
            <Card styles={{ body: { padding: 0 } }}>
                <Table rowKey="id" loading={isLoading} dataSource={admins} columns={columns} pagination={false} scroll={{ x: "max-content" }} />
            </Card>
            <MemberModal open={!!editing} member={editing?.id ? editing : null} onClose={() => setEditing(null)} />
        </>
    );
}
