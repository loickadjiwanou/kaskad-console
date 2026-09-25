import { useState } from "react";
import { Alert, App, Button, Descriptions, Form, Input, Result, Skeleton, Tag } from "antd";
import { LockOutlined, UserOutlined } from "@ant-design/icons";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "@/api";
import { useAuth } from "@/auth/AuthContext";
import AuthShell from "@/components/AuthShell";
import { useI18n } from "@/i18n";

/** Lien d'invitation : la personne invitée crée son accès et rejoint le compte développeur. */
export default function AcceptInvite() {
    const { token } = useParams();
    const { t } = useI18n();
    const { message } = App.useApp();
    const { isAuthenticated, admin, logout, startSession } = useAuth();
    const navigate = useNavigate();
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const { data: inv, isLoading, error: lookupError } = useQuery({
        queryKey: ["invitation", token],
        queryFn: () => api.lookupInvitation(token),
        retry: false,
    });

    if (isLoading) {
        return (
            <AuthShell>
                <Skeleton active />
            </AuthShell>
        );
    }
    if (lookupError) {
        return (
            <AuthShell>
                <Result
                    status="warning"
                    title={t("invite.invalidTitle")}
                    subTitle={lookupError.message}
                    extra={
                        <Link to="/login">
                            <Button type="primary">{t("signup.toLogin")}</Button>
                        </Link>
                    }
                />
            </AuthShell>
        );
    }

    const submit = async ({ name, password }) => {
        setError(null);
        setLoading(true);
        try {
            const session = await api.acceptInvitation({ token, name: name.trim(), password });
            startSession(session);
            message.success(t("invite.welcome", { account: inv.account_name }));
            navigate("/", { replace: true });
        } catch (e) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthShell title={t("invite.title", { account: inv.account_name })} subtitle={t("invite.subtitle", { name: inv.invited_by_name ?? "—" })} width={460}>
            <Descriptions
                column={1}
                size="small"
                bordered
                style={{ marginBottom: 20 }}
                items={[
                    { label: t("team.fields.email"), children: inv.email },
                    { label: t("team.fields.role"), children: <Tag color="blue">{t(`roles.${inv.role}`)}</Tag> },
                    { label: t("invite.permissions"), children: t(`team.roleHelp.${inv.role}`) },
                ]}
            />
            {isAuthenticated ? (
                <Alert
                    type="info"
                    showIcon
                    title={t("invite.signedInAs", { email: admin?.email })}
                    action={
                        <Button size="small" onClick={() => logout()}>
                            {t("nav.logout")}
                        </Button>
                    }
                />
            ) : inv.already_registered ? (
                <Alert type="warning" showIcon title={t("invite.alreadyRegistered")} />
            ) : (
                <>
                    {error && <Alert type="error" showIcon title={error} style={{ marginBottom: 16 }} />}
                    <Form layout="vertical" onFinish={submit} requiredMark={false} disabled={loading}>
                        <Form.Item name="name" label={t("signup.name")} rules={[{ required: true, whitespace: true }]}>
                            <Input prefix={<UserOutlined />} size="large" autoComplete="name" autoFocus maxLength={100} />
                        </Form.Item>
                        <Form.Item name="password" label={t("invite.password")} rules={[{ required: true }, { min: 8, message: t("account.passwordMin") }]}>
                            <Input.Password prefix={<LockOutlined />} size="large" autoComplete="new-password" />
                        </Form.Item>
                        <Form.Item
                            name="confirm"
                            label={t("account.confirmPassword")}
                            dependencies={["password"]}
                            rules={[
                                { required: true },
                                ({ getFieldValue }) => ({
                                    validator: (_, v) => (!v || v === getFieldValue("password") ? Promise.resolve() : Promise.reject(t("account.mismatch"))),
                                }),
                            ]}
                        >
                            <Input.Password prefix={<LockOutlined />} size="large" autoComplete="new-password" />
                        </Form.Item>
                        <Button type="primary" htmlType="submit" size="large" block loading={loading}>
                            {t("invite.accept")}
                        </Button>
                    </Form>
                </>
            )}
        </AuthShell>
    );
}
