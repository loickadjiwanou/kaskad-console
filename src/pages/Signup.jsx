import { useState } from "react";
import { Alert, App, Button, Form, Input, Result, Typography } from "antd";
import { LockOutlined, MailOutlined, ShopOutlined, UserOutlined } from "@ant-design/icons";
import { Link, Navigate } from "react-router-dom";
import { api } from "@/api";
import { useAuth } from "@/auth/AuthContext";
import AuthShell from "@/components/AuthShell";
import { useI18n } from "@/i18n";

/** Inscription : crée un compte développeur dont l'inscrit est le propriétaire, puis e-mail de confirmation. */
export default function Signup() {
    const { t } = useI18n();
    const { message } = App.useApp();
    const { isAuthenticated } = useAuth();
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const [sentTo, setSentTo] = useState(null);

    if (isAuthenticated) return <Navigate to="/" replace />;

    const submit = async ({ name, account_name, email, password }) => {
        setError(null);
        setLoading(true);
        try {
            const r = await api.signup({ name: name.trim(), account_name: account_name.trim(), email: email.trim().toLowerCase(), password });
            setSentTo(r.email);
        } catch (e) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    if (sentTo) {
        return (
            <AuthShell>
                <Result
                    status="success"
                    icon={<MailOutlined />}
                    title={t("signup.checkTitle")}
                    subTitle={t("signup.checkText", { email: sentTo })}
                    extra={[
                        <Button
                            key="resend"
                            onClick={async () => {
                                await api.resendVerification(sentTo).catch(() => {});
                                message.success(t("signup.resent"));
                            }}
                        >
                            {t("signup.resend")}
                        </Button>,
                        <Link key="login" to="/login">
                            <Button type="primary">{t("signup.toLogin")}</Button>
                        </Link>,
                    ]}
                />
            </AuthShell>
        );
    }

    return (
        <AuthShell title={t("signup.title")} subtitle={t("signup.subtitle")} width={460}>
            {error && <Alert type="error" showIcon title={error} style={{ marginBottom: 16 }} />}
            <Form layout="vertical" onFinish={submit} requiredMark={false} disabled={loading}>
                <Form.Item name="name" label={t("signup.name")} rules={[{ required: true, whitespace: true }]}>
                    <Input prefix={<UserOutlined />} size="large" autoComplete="name" autoFocus maxLength={100} />
                </Form.Item>
                <Form.Item
                    name="account_name"
                    label={t("signup.accountName")}
                    extra={t("signup.accountNameHelp")}
                    rules={[{ required: true, whitespace: true, min: 2, message: t("signup.accountNameRequired") }]}
                >
                    <Input prefix={<ShopOutlined />} size="large" autoComplete="organization" maxLength={80} />
                </Form.Item>
                <Form.Item name="email" label={t("login.email")} rules={[{ required: true, type: "email", message: t("login.emailInvalid") }]}>
                    <Input prefix={<MailOutlined />} size="large" autoComplete="email" />
                </Form.Item>
                <Form.Item name="password" label={t("login.password")} rules={[{ required: true }, { min: 8, message: t("account.passwordMin") }]}>
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
                    {t("signup.submit")}
                </Button>
            </Form>
            <Typography.Paragraph type="secondary" style={{ textAlign: "center", margin: "20px 0 0" }}>
                {t("signup.haveAccount")} <Link to="/login">{t("login.submit")}</Link>
            </Typography.Paragraph>
        </AuthShell>
    );
}
